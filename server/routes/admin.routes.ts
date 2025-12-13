/**
 * Admin Routes
 * 
 * Modular endpoints for admin panel:
 * - Authentication
 * - User management and moderation
 * - Service management
 * - Category management
 * - Plan management
 * - Settings and API keys
 * - Database operations
 * - Referral admin
 * - Escrow and dispute admin
 * - Review moderation
 */

import { Router, Response, RequestHandler } from "express";
import { isAdmin, adminLogin, adminLogout, getAdminSession } from "../adminAuth";
import { storage } from "../storage";
import { db } from "../db";
import { eq, desc, sql } from "drizzle-orm";
import {
    users,
    services,
    reviews,
    referralTransactions,
    referralConfig,
    disputes,
    escrowTransactions,
    bannedIdentifiers
} from "@shared/schema";

const router = Router();

// ===========================================
// AUTHENTICATION
// ===========================================

router.post("/login", adminLogin as RequestHandler);
router.post("/logout", adminLogout as RequestHandler);
router.get("/session", getAdminSession as RequestHandler);

// ===========================================
// USER MANAGEMENT
// ===========================================

/**
 * GET /api/admin/users
 * Get all users
 */
router.get("/users", isAdmin, async (_req: any, res: Response) => {
    try {
        const allUsers = await db.select().from(users);
        res.json(allUsers);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Failed to fetch users" });
    }
});

/**
 * PATCH /api/admin/users/:id
 * Update user (admin, plan, verification)
 */
router.patch("/users/:id", isAdmin, async (req: any, res: Response) => {
    try {
        const { isAdmin: adminFlag, planId, isVerified, emailVerified } = req.body;

        if (adminFlag !== undefined) {
            await storage.updateUserAdmin(req.params.id, adminFlag);
        }
        if (planId !== undefined) {
            await storage.updateUserPlan(req.params.id, planId);
        }
        if (isVerified !== undefined) {
            await storage.updateUserVerification(req.params.id, isVerified);
        }
        if (emailVerified !== undefined) {
            await db.update(users)
                .set({ emailVerified, updatedAt: new Date() })
                .where(eq(users.id, req.params.id));
        }

        const user = await storage.getUser(req.params.id);
        res.json(user);
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "Failed to update user" });
    }
});

/**
 * POST /api/admin/users/:id/moderate
 * Moderate user (warn, suspend, ban, kick, reactivate)
 */
router.post("/users/:id/moderate", isAdmin, async (req: any, res: Response) => {
    try {
        const { action, reason, ipAddress } = req.body;
        const adminId = req.user?.id || "admin";

        if (!["warn", "suspend", "ban", "kick", "reactivate"].includes(action)) {
            return res.status(400).json({ message: "Invalid moderation action" });
        }

        const user = await storage.moderateUser(
            req.params.id,
            action,
            adminId,
            reason,
            ipAddress
        );

        res.json(user);
    } catch (error: any) {
        console.error("Error moderating user:", error);
        res.status(500).json({ message: error.message || "Failed to moderate user" });
    }
});

/**
 * POST /api/admin/users/:id/deactivate
 * Deactivate user account
 */
router.post("/users/:id/deactivate", isAdmin, async (req: any, res: Response) => {
    try {
        const { deactivateUser } = await import("../authService");
        const result = await deactivateUser(req.params.id);
        res.json(result);
    } catch (error: any) {
        console.error("Error deactivating user:", error);
        res.status(500).json({ message: error.message || "Failed to deactivate user" });
    }
});

/**
 * POST /api/admin/users/:id/activate
 * Activate user account
 */
router.post("/users/:id/activate", isAdmin, async (req: any, res: Response) => {
    try {
        const { reactivateUser } = await import("../authService");
        const result = await reactivateUser(req.params.id);
        res.json(result);
    } catch (error: any) {
        console.error("Error activating user:", error);
        res.status(500).json({ message: error.message || "Failed to activate user" });
    }
});

// ===========================================
// BANNED IDENTIFIERS
// ===========================================

router.get("/banned-identifiers", isAdmin, async (_req: any, res: Response) => {
    try {
        const banned = await db.select().from(bannedIdentifiers).orderBy(desc(bannedIdentifiers.createdAt));
        res.json(banned);
    } catch (error) {
        console.error("Error fetching banned identifiers:", error);
        res.status(500).json({ message: "Failed to fetch banned identifiers" });
    }
});

router.post("/banned-identifiers", isAdmin, async (req: any, res: Response) => {
    try {
        const { identifierType, identifierValue, reason } = req.body;
        const [banned] = await db.insert(bannedIdentifiers).values({
            identifierType,
            identifierValue,
            reason,
            bannedBy: req.user?.id || "admin",
        }).returning();
        res.status(201).json(banned);
    } catch (error) {
        console.error("Error adding banned identifier:", error);
        res.status(500).json({ message: "Failed to add banned identifier" });
    }
});

router.delete("/banned-identifiers/:id", isAdmin, async (req: any, res: Response) => {
    try {
        await db.delete(bannedIdentifiers).where(eq(bannedIdentifiers.id, req.params.id));
        res.json({ success: true });
    } catch (error) {
        console.error("Error removing banned identifier:", error);
        res.status(500).json({ message: "Failed to remove banned identifier" });
    }
});

// ===========================================
// SERVICE MANAGEMENT
// ===========================================

router.get("/services", isAdmin, async (_req: any, res: Response) => {
    try {
        const allServices = await db.select().from(services);
        res.json(allServices);
    } catch (error) {
        console.error("Error fetching services:", error);
        res.status(500).json({ message: "Failed to fetch services" });
    }
});

router.patch("/services/:id", isAdmin, async (req: any, res: Response) => {
    try {
        const updated = await storage.updateService(req.params.id, req.body);
        res.json(updated);
    } catch (error) {
        console.error("Error updating service:", error);
        res.status(500).json({ message: "Failed to update service" });
    }
});

router.delete("/services/:id", isAdmin, async (req: any, res: Response) => {
    try {
        await storage.deleteService(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting service:", error);
        res.status(500).json({ message: "Failed to delete service" });
    }
});

// ===========================================
// SETTINGS & API KEYS
// ===========================================

router.patch("/settings", isAdmin, async (req: any, res: Response) => {
    try {
        // Settings are managed via platformSettings table - implement as needed
        res.json({ success: true, message: "Settings endpoint - implement via platformSettings table" });
    } catch (error) {
        console.error("Error updating settings:", error);
        res.status(500).json({ message: "Failed to update settings" });
    }
});

router.patch("/api-keys", isAdmin, async (req: any, res: Response) => {
    try {
        // API keys are managed via environment variables
        res.json({ success: true, message: "API keys should be configured via environment variables" });
    } catch (error) {
        console.error("Error updating API keys:", error);
        res.status(500).json({ message: "Failed to update API keys" });
    }
});

router.get("/env-status", isAdmin, async (_req: any, res: Response) => {
    try {
        res.json({
            stripeConfigured: !!process.env.STRIPE_SECRET_KEY,
            googleMapsConfigured: !!process.env.GOOGLE_MAPS_API_KEY,
            emailConfigured: !!process.env.RESEND_API_KEY,
            openaiConfigured: !!process.env.OPENAI_API_KEY,
            databaseUrl: !!process.env.DATABASE_URL,
        });
    } catch (error) {
        console.error("Error fetching env status:", error);
        res.status(500).json({ message: "Failed to fetch env status" });
    }
});

// ===========================================
// DATABASE OPERATIONS
// ===========================================

router.post("/database/reseed", isAdmin, async (req: any, res: Response) => {
    try {
        const { seedDatabase } = await import("../seed");
        await seedDatabase();
        res.json({ success: true, message: "Database reseeded" });
    } catch (error: any) {
        console.error("Error reseeding database:", error);
        res.status(500).json({ message: error.message || "Failed to reseed database" });
    }
});

// ===========================================
// REFERRAL ADMIN
// ===========================================

router.get("/referral/stats", isAdmin, async (_req: any, res: Response) => {
    try {
        const [stats] = await db.select({
            totalUsers: sql<number>`COUNT(DISTINCT ${users.id})`,
            usersWithReferrals: sql<number>`COUNT(DISTINCT ${users.referredBy})`,
            totalTransactions: sql<number>`COUNT(${referralTransactions.id})`,
        }).from(users).leftJoin(referralTransactions, eq(users.id, referralTransactions.toUserId));
        res.json(stats);
    } catch (error) {
        console.error("Error fetching referral stats:", error);
        res.status(500).json({ message: "Failed to fetch referral stats" });
    }
});

router.get("/referral/config", isAdmin, async (_req: any, res: Response) => {
    try {
        const [config] = await db.select().from(referralConfig).limit(1);
        res.json(config);
    } catch (error) {
        console.error("Error fetching referral config:", error);
        res.status(500).json({ message: "Failed to fetch referral config" });
    }
});

router.patch("/referral/config", isAdmin, async (req: any, res: Response) => {
    try {
        const [config] = await db.update(referralConfig).set(req.body).returning();
        res.json(config);
    } catch (error) {
        console.error("Error updating referral config:", error);
        res.status(500).json({ message: "Failed to update referral config" });
    }
});

// ===========================================
// ESCROW & DISPUTES
// ===========================================

router.get("/escrow", isAdmin, async (_req: any, res: Response) => {
    try {
        const transactions = await db.select()
            .from(escrowTransactions)
            .orderBy(desc(escrowTransactions.createdAt))
            .limit(100);
        res.json(transactions);
    } catch (error) {
        console.error("Error fetching escrow:", error);
        res.status(500).json({ message: "Failed to fetch escrow transactions" });
    }
});

router.get("/disputes", isAdmin, async (_req: any, res: Response) => {
    try {
        const allDisputes = await db.select()
            .from(disputes)
            .orderBy(desc(disputes.createdAt))
            .limit(100);
        res.json(allDisputes);
    } catch (error) {
        console.error("Error fetching disputes:", error);
        res.status(500).json({ message: "Failed to fetch disputes" });
    }
});

router.get("/disputes/:id", isAdmin, async (req: any, res: Response) => {
    try {
        const [dispute] = await db.select().from(disputes).where(eq(disputes.id, req.params.id));
        if (!dispute) {
            return res.status(404).json({ message: "Dispute not found" });
        }
        res.json(dispute);
    } catch (error) {
        console.error("Error fetching dispute:", error);
        res.status(500).json({ message: "Failed to fetch dispute" });
    }
});

router.post("/disputes/:id/resolve", isAdmin, async (req: any, res: Response) => {
    try {
        const { refundAmount, notes } = req.body;
        const [updated] = await db.update(disputes).set({
            status: "resolved" as any, // Using status instead of disputeStatus
            resolvedRefundAmount: refundAmount ? String(refundAmount) : null,
            adminNotes: notes,
            resolvedAt: new Date(),
        } as any).where(eq(disputes.id, req.params.id)).returning();
        res.json(updated);
    } catch (error) {
        console.error("Error resolving dispute:", error);
        res.status(500).json({ message: "Failed to resolve dispute" });
    }
});

// ===========================================
// REVIEW MODERATION
// ===========================================

router.get("/reviews", isAdmin, async (req: any, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 50;
        const allReviews = await db.select()
            .from(reviews)
            .orderBy(desc(reviews.createdAt))
            .limit(limit);
        res.json(allReviews);
    } catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).json({ message: "Failed to fetch reviews" });
    }
});

router.delete("/reviews/:reviewId", isAdmin, async (req: any, res: Response) => {
    try {
        await db.delete(reviews).where(eq(reviews.id, req.params.reviewId));
        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting review:", error);
        res.status(500).json({ message: "Failed to delete review" });
    }
});

// ===========================================
// EXPORTS
// ===========================================

export { router as adminRouter };

export function registerAdminRoutes(app: any): void {
    app.use("/api/admin", router);
}
