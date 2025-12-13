/**
 * Route Module Index
 * Aggregates all route modules and registers them with the Express app.
 * 
 * All 17 route modules are now fully migrated from routes.ts.
 */

import { Express } from "express";

// Core route modules
import { registerHealthRoutes } from "./health.routes";
import { registerCreditsRoutes } from "./credits.routes";
import { registerBookingAvailabilityRoutes } from "./bookingAvailability.routes";
import { registerBookingFlowRoutes } from "./bookingFlow.routes";
import { registerComPointsRoutes } from "./comPoints.routes";
import { registerDisputesRoutes } from "./disputes.routes";
import { registerAiRoutes } from "./ai.routes";

// Entity route modules
import { registerUsersRoutes } from "./users.routes";
import { registerServicesRoutes } from "./services.routes";
import { registerBookingsRoutes } from "./bookings.routes";
import { registerPaymentsRoutes } from "./payments.routes";
import { registerAdminRoutes } from "./admin.routes";
import { registerChatRoutes } from "./chat.routes";
import { registerCategoriesRoutes } from "./categories.routes";
import { registerNotificationsRoutes } from "./notifications.routes";
import { registerReviewsRoutes } from "./reviews.routes";
import { registerReferralsRoutes } from "./referrals.routes";
import { registerSmsRoutes } from "./sms.routes";

/**
 * Register all modular routes with the Express app
 * Call this function from your main app setup after routes.ts
 */
export function registerModularRoutes(app: Express): void {
    // === CORE MODULES ===
    registerHealthRoutes(app);
    registerCreditsRoutes(app);
    registerBookingAvailabilityRoutes(app);
    registerBookingFlowRoutes(app);
    registerComPointsRoutes(app);
    registerDisputesRoutes(app);
    registerAiRoutes(app);

    // === ENTITY MODULES ===
    registerUsersRoutes(app);
    registerServicesRoutes(app);
    registerBookingsRoutes(app);
    registerPaymentsRoutes(app);
    registerAdminRoutes(app);
    registerChatRoutes(app);
    registerCategoriesRoutes(app);
    registerNotificationsRoutes(app);
    registerReviewsRoutes(app);
    registerReferralsRoutes(app);
    registerSmsRoutes(app);

    console.log("✓ All modular routes registered (18/18 complete)");
}

// Re-export for backward compatibility
export { registerModularRoutes as registerRoutes };
