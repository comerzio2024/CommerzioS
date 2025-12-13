/**
 * Referrals Routes
 * 
 * Modular endpoints for referral system:
 * - Referral code validation
 * - User referral stats
 * - Direct referrals list
 * - Multi-level network
 * - Commission history
 */

import { Router, Response } from "express";
import { isAuthenticated } from "../auth";
import { db } from "../db";
import { eq, desc } from "drizzle-orm";
import { users, referralTransactions } from "@shared/schema";
import {
    validateReferralCode,
    getReferralStatsForUser,
    getDirectReferrals,
    getReferralConfig,
    generateReferralLink,
} from "../referralService";

const router = Router();

// ===========================================
// REFERRAL VALIDATION
// ===========================================

/**
 * GET /api/referral/validate/:code
 * Validate a referral code
 */
router.get("/validate/:code", async (req: any, res: Response) => {
    try {
        const { code } = req.params;
        const result = await validateReferralCode(code);
        res.json(result);
    } catch (error) {
        console.error("Error validating referral code:", error);
        res.status(500).json({ message: "Failed to validate referral code" });
    }
});

// ===========================================
// USER REFERRAL INFO
// ===========================================

/**
 * GET /api/referral/my-stats
 * Get current user's referral stats
 */
router.get("/my-stats", isAuthenticated, async (req: any, res: Response) => {
    try {
        const userId = req.user!.id;
        const stats = await getReferralStatsForUser(userId);
        const baseUrl = `${req.protocol}://${req.get("host")}`;
        const referralLink = generateReferralLink(baseUrl, stats.referralCode);

        res.json({
            ...stats,
            referralLink,
        });
    } catch (error) {
        console.error("Error fetching referral stats:", error);
        res.status(500).json({ message: "Failed to fetch referral stats" });
    }
});

/**
 * GET /api/referral/my-referrals
 * Get user's direct referrals
 */
router.get("/my-referrals", isAuthenticated, async (req: any, res: Response) => {
    try {
        const userId = req.user!.id;
        const limit = parseInt(req.query.limit as string) || 50;
        const referrals = await getDirectReferrals(userId, limit);

        // Hide email addresses for privacy
        const sanitizedReferrals = referrals.map(r => ({
            id: r.id,
            firstName: r.firstName,
            lastName: r.lastName ? r.lastName.charAt(0) + "." : null,
            createdAt: r.createdAt,
            status: r.status,
        }));

        res.json(sanitizedReferrals);
    } catch (error) {
        console.error("Error fetching referrals:", error);
        res.status(500).json({ message: "Failed to fetch referrals" });
    }
});

/**
 * GET /api/referral/my-referrer
 * Get who referred the current user
 */
router.get("/my-referrer", isAuthenticated, async (req: any, res: Response) => {
    try {
        const userId = req.user!.id;

        const [user] = await db
            .select({
                referredBy: users.referredBy,
            })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        if (!user?.referredBy) {
            return res.json({ hasReferrer: false, referrer: null });
        }

        const [referrer] = await db
            .select({
                id: users.id,
                firstName: users.firstName,
                lastName: users.lastName,
                profileImageUrl: users.profileImageUrl,
                referralCode: users.referralCode,
            })
            .from(users)
            .where(eq(users.id, user.referredBy))
            .limit(1);

        res.json({
            hasReferrer: true,
            referrer: referrer ? {
                id: referrer.id,
                firstName: referrer.firstName,
                lastName: referrer.lastName ? referrer.lastName.charAt(0) + "." : null,
                profileImageUrl: referrer.profileImageUrl,
                referralCode: referrer.referralCode,
            } : null,
        });
    } catch (error) {
        console.error("Error fetching referrer:", error);
        res.status(500).json({ message: "Failed to fetch referrer" });
    }
});

/**
 * GET /api/referral/my-network
 * Get multi-level referrals (L1, L2, L3)
 */
router.get("/my-network", isAuthenticated, async (req: any, res: Response) => {
    try {
        const userId = req.user!.id;
        const config = await getReferralConfig();
        const maxLevels = config.maxLevels || 3;

        // Get L1 referrals (direct)
        const l1Referrals = await getDirectReferrals(userId, 100);

        // Get L2 referrals (referrals of L1)
        const l2Referrals: any[] = [];
        const l3Referrals: any[] = [];

        if (maxLevels >= 2) {
            for (const l1 of l1Referrals.slice(0, 50)) {
                const l2 = await getDirectReferrals(l1.id, 20);
                l2Referrals.push(...l2.map(r => ({
                    ...r,
                    lastName: r.lastName ? r.lastName.charAt(0) + "." : null,
                    referredByName: `${l1.firstName || ""} ${(l1.lastName || "").charAt(0)}.`.trim(),
                })));
            }
        }

        // Get L3 referrals (optional, only first few)
        if (maxLevels >= 3 && l2Referrals.length < 100) {
            for (const l2 of l2Referrals.slice(0, 20)) {
                const l3 = await getDirectReferrals(l2.id, 10);
                l3Referrals.push(...l3.map(r => ({
                    ...r,
                    lastName: r.lastName ? r.lastName.charAt(0) + "." : null,
                    referredByName: `${l2.firstName || ""} ${(l2.lastName || "").charAt(0) || ""}.`.trim(),
                })));
            }
        }

        res.json({
            maxLevels,
            level1: {
                count: l1Referrals.length,
                referrals: l1Referrals.map(r => ({
                    id: r.id,
                    firstName: r.firstName,
                    lastName: r.lastName ? r.lastName.charAt(0) + "." : null,
                    createdAt: r.createdAt,
                    status: r.status,
                })),
            },
            level2: {
                count: l2Referrals.length,
                referrals: l2Referrals.slice(0, 50),
            },
            level3: {
                count: l3Referrals.length,
                referrals: l3Referrals.slice(0, 30),
            },
        });
    } catch (error) {
        console.error("Error fetching network:", error);
        res.status(500).json({ message: "Failed to fetch network" });
    }
});

/**
 * GET /api/referral/my-commissions
 * Get user's commission events
 */
router.get("/my-commissions", isAuthenticated, async (req: any, res: Response) => {
    try {
        const userId = req.user!.id;
        const limit = parseInt(req.query.limit as string) || 50;

        const commissions = await db
            .select({
                id: referralTransactions.id,
                fromUserId: referralTransactions.fromUserId,
                level: referralTransactions.level,
                pointsEarned: referralTransactions.pointsEarned,
                commissionEarned: referralTransactions.commissionEarned,
                triggerType: referralTransactions.triggerType,
                triggerId: referralTransactions.triggerId,
                triggerAmount: referralTransactions.triggerAmount,
                createdAt: referralTransactions.createdAt,
            })
            .from(referralTransactions)
            .where(eq(referralTransactions.toUserId, userId))
            .orderBy(desc(referralTransactions.createdAt))
            .limit(limit);

        // Get user info for each commission
        const commissionsWithUsers = await Promise.all(
            commissions.map(async (c) => {
                const [fromUser] = await db
                    .select({
                        firstName: users.firstName,
                        lastName: users.lastName,
                    })
                    .from(users)
                    .where(eq(users.id, c.fromUserId))
                    .limit(1);

                return {
                    ...c,
                    fromUserName: fromUser
                        ? `${fromUser.firstName || ""} ${(fromUser.lastName || "").charAt(0)}.`.trim()
                        : "Unknown",
                };
            })
        );

        res.json(commissionsWithUsers);
    } catch (error) {
        console.error("Error fetching commissions:", error);
        res.status(500).json({ message: "Failed to fetch commissions" });
    }
});

// ===========================================
// EXPORTS
// ===========================================

export { router as referralsRouter };

export function registerReferralsRoutes(app: any): void {
    app.use("/api/referral", router);
}
