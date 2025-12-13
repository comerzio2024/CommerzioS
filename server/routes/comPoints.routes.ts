/**
 * COM Points Routes
 * API endpoints for the Gamified Rewards System
 */

import { Router } from "express";
import { isAuthenticated } from "../auth";
import { isAdmin } from "../adminAuth";
import { z } from "zod";
import {
    getComPointsBalance,
    getComPointsHistory,
    getAvailableMissions,
    startMission,
    claimMissionReward,
    getRedemptionItems,
    redeemItem,
    getUserRedemptions,
} from "../comPointsService";

const router = Router();

// ===========================================
// USER POINTS ENDPOINTS
// ===========================================

/**
 * GET /api/com-points/balance
 * Get current user's COM Points balance
 */
router.get("/balance", isAuthenticated, async (req: any, res) => {
    try {
        const userId = req.user!.id;
        const balance = await getComPointsBalance(userId);
        res.json({ balance });
    } catch (error: any) {
        console.error("Error fetching balance:", error);
        res.status(500).json({ message: "Failed to fetch balance" });
    }
});

/**
 * GET /api/com-points/history
 * Get user's COM Points transaction history
 */
router.get("/history", isAuthenticated, async (req: any, res) => {
    try {
        const userId = req.user!.id;
        const { limit = "20", offset = "0", sourceType } = req.query;

        const history = await getComPointsHistory(userId, {
            limit: parseInt(limit as string),
            offset: parseInt(offset as string),
            sourceType: sourceType as string | undefined,
        });

        res.json({ history });
    } catch (error: any) {
        console.error("Error fetching history:", error);
        res.status(500).json({ message: "Failed to fetch history" });
    }
});

// ===========================================
// MISSIONS ENDPOINTS
// ===========================================

/**
 * GET /api/com-points/missions
 * Get available missions for the user
 */
router.get("/missions", isAuthenticated, async (req: any, res) => {
    try {
        const userId = req.user!.id;
        const missions = await getAvailableMissions(userId);
        res.json({ missions });
    } catch (error: any) {
        console.error("Error fetching missions:", error);
        res.status(500).json({ message: "Failed to fetch missions" });
    }
});

/**
 * POST /api/com-points/missions/:missionId/start
 * Start a mission
 */
router.post("/missions/:missionId/start", isAuthenticated, async (req: any, res) => {
    try {
        const userId = req.user!.id;
        const { missionId } = req.params;

        const userMission = await startMission(userId, missionId);
        res.json({ success: true, userMission });
    } catch (error: any) {
        console.error("Error starting mission:", error);
        res.status(400).json({ message: error.message || "Failed to start mission" });
    }
});

/**
 * POST /api/com-points/missions/:missionId/claim
 * Claim reward for a completed mission
 */
router.post("/missions/:missionId/claim", isAuthenticated, async (req: any, res) => {
    try {
        const userId = req.user!.id;
        const { missionId } = req.params;

        const result = await claimMissionReward(userId, missionId);
        res.json({
            success: true,
            pointsAwarded: result.pointsAwarded,
            newBalance: result.newBalance,
        });
    } catch (error: any) {
        console.error("Error claiming reward:", error);
        res.status(400).json({ message: error.message || "Failed to claim reward" });
    }
});

/**
 * POST /api/com-points/missions/:missionId/verify
 * Verify a social mission (OAuth-based)
 */
router.post("/missions/:missionId/verify", isAuthenticated, async (req: any, res) => {
    try {
        const userId = req.user!.id;
        const { missionId } = req.params;
        const { missionType, params } = req.body;

        // Import verification service
        const { verifyMission } = await import("../socialMissionVerificationService");

        const result = await verifyMission(userId, missionType, params);

        res.json({
            success: result.verified,
            message: result.message,
            details: result.details,
        });
    } catch (error: any) {
        console.error("Error verifying mission:", error);
        res.status(400).json({ message: error.message || "Failed to verify mission" });
    }
});

/**
 * GET /api/com-points/social-connections
 * Check which social accounts are connected
 */
router.get("/social-connections", isAuthenticated, async (req: any, res) => {
    try {
        const userId = req.user!.id;

        // Import verification service
        const { hasSocialConnection } = await import("../socialMissionVerificationService");

        const connections = {
            twitter: await hasSocialConnection(userId, "twitter"),
            instagram: false, // Instagram requires Graph API business account
            facebook: await hasSocialConnection(userId, "facebook"),
            tiktok: false, // TikTok has limited API access
        };

        res.json({ connections });
    } catch (error: any) {
        console.error("Error checking social connections:", error);
        res.status(500).json({ message: "Failed to check social connections" });
    }
});

// ===========================================
// REDEMPTION SHOP ENDPOINTS
// ===========================================

/**
 * GET /api/com-points/shop
 * Get available redemption items
 */
router.get("/shop", async (req, res) => {
    try {
        const items = await getRedemptionItems();
        res.json({ items });
    } catch (error: any) {
        console.error("Error fetching shop items:", error);
        res.status(500).json({ message: "Failed to fetch shop items" });
    }
});

/**
 * POST /api/com-points/redeem/:itemId
 * Redeem an item from the shop
 */
router.post("/redeem/:itemId", isAuthenticated, async (req: any, res) => {
    try {
        const userId = req.user!.id;
        const { itemId } = req.params;

        const result = await redeemItem(userId, itemId);
        res.json({
            success: true,
            redemptionId: result.redemptionId,
            remainingBalance: result.remainingBalance,
        });
    } catch (error: any) {
        console.error("Error redeeming item:", error);
        res.status(400).json({ message: error.message || "Failed to redeem item" });
    }
});

/**
 * GET /api/com-points/redemptions
 * Get user's redemption history
 */
router.get("/redemptions", isAuthenticated, async (req: any, res) => {
    try {
        const userId = req.user!.id;
        const { status } = req.query;

        const redemptions = await getUserRedemptions(userId, status as string | undefined);
        res.json({ redemptions });
    } catch (error: any) {
        console.error("Error fetching redemptions:", error);
        res.status(500).json({ message: "Failed to fetch redemptions" });
    }
});

export { router as comPointsRouter };

/**
 * Register COM Points routes with Express app
 */
export function registerComPointsRoutes(app: any): void {
    app.use("/api/com-points", router);
}
