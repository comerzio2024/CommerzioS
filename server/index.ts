import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import cron from "node-cron";
import { runEscrowAutoReleaseTasks } from "./services/escrowAutoReleaseService";
import { sendBookingReminders, sendVendorBookingReminders } from "./bookingReminderService";
import { autoArchiveExpiredListings } from "./services/autoArchiveService";

const app = express();

// CORS configuration for split architecture (frontend on Vercel, backend on Railway)
const allowedOrigins = [
  'https://services.commerzio.online',
  'https://commerzio.online',
  // Local development
  'http://localhost:5173',
  'http://localhost:5000',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5000',
  'http://127.0.0.1:3000',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true, // Allow cookies for session auth
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Set-Cookie'],
}));

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  limit: '50mb',
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // GLOBAL DEBUG LOGGING
  if (path.startsWith('/api/chat')) {
    try {
      const fs = require('fs');
      fs.appendFileSync('chat-debug.log', `\n[${new Date().toISOString()}] GLOBAL HIT: ${req.method} ${path}\n`);
    } catch (e) { /* ignore */ }
  }

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Seed database with initial data
  const { seedDatabase } = await import("./seed");
  await seedDatabase();

  // Seed admin user if needed
  const { seedAdminIfNeeded } = await import("./adminAuth");
  await seedAdminIfNeeded();

  // Verify email service connection
  const { verifyEmailConnection } = await import("./emailService");
  await verifyEmailConnection();

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  // 
  // API_ONLY mode: Set API_ONLY=true for split architecture (Railway API + Vercel frontend)
  // In API_ONLY mode, we don't serve any frontend files - just the API
  const isApiOnly = process.env.API_ONLY === 'true';

  if (isApiOnly) {
    log('Running in API_ONLY mode - not serving frontend');
    // Add a simple health check / info endpoint at root
    app.get('/', (_req, res) => {
      res.json({
        status: 'ok',
        service: 'Commerzio API',
        mode: 'api-only',
        timestamp: new Date().toISOString()
      });
    });
  } else if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  // On some platforms (like Windows), reusePort is not supported and causes ENOTSUP.
  // Bind using a simple host/port configuration for maximum compatibility.
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);

    // Register escrow auto-release cron job (runs every hour)
    cron.schedule('0 * * * *', async () => {
      log('[Cron] Running escrow auto-release tasks...');
      await runEscrowAutoReleaseTasks();
    });
    log('✓ Escrow auto-release cron job registered (hourly)');

    // Register booking reminder cron job (runs every 5 minutes)
    cron.schedule('*/5 * * * *', async () => {
      try {
        const customerReminders = await sendBookingReminders();
        const vendorReminders = await sendVendorBookingReminders();
        if (customerReminders > 0 || vendorReminders > 0) {
          log(`[Cron] Sent ${customerReminders} customer reminders, ${vendorReminders} vendor reminders`);
        }
      } catch (error) {
        console.error('[Cron] Booking reminder error:', error);
      }
    });
    log('✓ Booking reminder cron job registered (every 5 minutes)');

    // Register auto-archive cron job (runs daily at 2:00 AM)
    cron.schedule('0 2 * * *', async () => {
      try {
        log('[Cron] Running auto-archive for expired listings...');
        const archivedCount = await autoArchiveExpiredListings();
        if (archivedCount > 0) {
          log(`[Cron] Auto-archived ${archivedCount} expired listings`);
        }
      } catch (error) {
        console.error('[Cron] Auto-archive error:', error);
      }
    });
    log('✓ Auto-archive cron job registered (daily at 2:00 AM)');
  });
})();
