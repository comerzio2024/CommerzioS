/**
 * COM Points Service
 * 
 * Core service for the Gamified Rewards System:
 * - Points earning (missions, referrals, engagement)
 * - Points spending (redemption shop)
 * - Balance management with ledger
 */

import { db } from "./db";
import {
    comPointsLedger,
    users,
    userMissions,
    missions,
    redemptions,
    redemptionItems
} from "@shared/schema";
import { eq, and, sql, desc, gte } from "drizzle-orm";
import { createNotification } from "./notificationService";

// ===========================================
// POINTS BALANCE MANAGEMENT
// ===========================================

/**
 * Get user's current COM Points balance
 */
export async function getComPointsBalance(userId: string): Promise<number> {
    const [user] = await db
        .select({ comPointsBalance: users.comPointsBalance })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

    return user?.comPointsBalance ?? 0;
}

/**
 * Add COM Points to a user's balance
 */
export async function addComPoints(
    userId: string,
    amount: number,
    sourceType: "mission" | "referral" | "admin" | "system",
    options?: {
        sourceId?: string;
        description?: string;
    }
): Promise<{ newBalance: number; transactionId: string }> {
    if (amount <= 0) {
        throw new Error("Amount must be positive");
    }

    // Get current balance
    const currentBalance = await getComPointsBalance(userId);
    const newBalance = currentBalance + amount;

    // Use transaction for atomicity
    const [transaction] = await db.transaction(async (tx) => {
        // Update user balance
        await tx
            .update(users)
            .set({
                comPointsBalance: newBalance,
                updatedAt: new Date(),
            })
            .where(eq(users.id, userId));

        // Create ledger entry
        return tx
            .insert(comPointsLedger)
            .values({
                userId,
                amount,
                balanceAfter: newBalance,
                sourceType,
                sourceId: options?.sourceId,
                description: options?.description,
            })
            .returning({ id: comPointsLedger.id });
    });

    return { newBalance, transactionId: transaction.id };
}

/**
 * Spend COM Points from a user's balance
 */
export async function spendComPoints(
    userId: string,
    amount: number,
    sourceType: "redemption",
    options?: {
        sourceId?: string;
        description?: string;
    }
): Promise<{ newBalance: number; transactionId: string }> {
    if (amount <= 0) {
        throw new Error("Amount must be positive");
    }

    // Get current balance
    const currentBalance = await getComPointsBalance(userId);

    if (currentBalance < amount) {
        throw new Error("Insufficient COM Points balance");
    }

    const newBalance = currentBalance - amount;

    // Use transaction for atomicity
    const [transaction] = await db.transaction(async (tx) => {
        // Update user balance
        await tx
            .update(users)
            .set({
                comPointsBalance: newBalance,
                updatedAt: new Date(),
            })
            .where(eq(users.id, userId));

        // Create ledger entry (negative amount for spending)
        return tx
            .insert(comPointsLedger)
            .values({
                userId,
                amount: -amount,
                balanceAfter: newBalance,
                sourceType,
                sourceId: options?.sourceId,
                description: options?.description,
            })
            .returning({ id: comPointsLedger.id });
    });

    return { newBalance, transactionId: transaction.id };
}

/**
 * Check if user has enough COM Points
 */
export async function hasEnoughComPoints(
    userId: string,
    amount: number
): Promise<boolean> {
    const balance = await getComPointsBalance(userId);
    return balance >= amount;
}

/**
 * Get COM Points transaction history for a user
 */
export async function getComPointsHistory(
    userId: string,
    options?: {
        limit?: number;
        offset?: number;
        sourceType?: string;
    }
): Promise<typeof comPointsLedger.$inferSelect[]> {
    const limit = options?.limit ?? 20;
    const offset = options?.offset ?? 0;

    const conditions = [eq(comPointsLedger.userId, userId)];

    if (options?.sourceType) {
        conditions.push(eq(comPointsLedger.sourceType, options.sourceType as any));
    }

    return db
        .select()
        .from(comPointsLedger)
        .where(and(...conditions))
        .orderBy(desc(comPointsLedger.createdAt))
        .limit(limit)
        .offset(offset);
}

// ===========================================
// MISSION MANAGEMENT
// ===========================================

/**
 * Get available missions for a user
 */
export async function getAvailableMissions(userId: string): Promise<{
    mission: typeof missions.$inferSelect;
    userProgress?: typeof userMissions.$inferSelect;
}[]> {
    // Get all active missions
    const activeMissions = await db
        .select()
        .from(missions)
        .where(eq(missions.isActive, true));

    // Get user's mission progress
    const userMissionProgress = await db
        .select()
        .from(userMissions)
        .where(eq(userMissions.userId, userId));

    const progressMap = new Map(
        userMissionProgress.map(um => [um.missionId, um])
    );

    return activeMissions.map(mission => ({
        mission,
        userProgress: progressMap.get(mission.id),
    }));
}

/**
 * Start a mission for a user
 */
export async function startMission(
    userId: string,
    missionId: string
): Promise<typeof userMissions.$inferSelect> {
    // Get mission details
    const [mission] = await db
        .select()
        .from(missions)
        .where(eq(missions.id, missionId))
        .limit(1);

    if (!mission) {
        throw new Error("Mission not found");
    }

    // Check if already started
    const [existing] = await db
        .select()
        .from(userMissions)
        .where(
            and(
                eq(userMissions.userId, userId),
                eq(userMissions.missionId, missionId)
            )
        )
        .limit(1);

    if (existing) {
        return existing;
    }

    // Create user mission
    const [userMission] = await db
        .insert(userMissions)
        .values({
            userId,
            missionId,
            status: "in_progress",
            progress: 0,
            targetCount: mission.targetCount ?? 1,
        })
        .returning();

    return userMission;
}

/**
 * Update mission progress
 */
export async function updateMissionProgress(
    userId: string,
    missionId: string,
    incrementBy: number = 1
): Promise<{ completed: boolean; progress: number }> {
    const [userMission] = await db
        .select()
        .from(userMissions)
        .where(
            and(
                eq(userMissions.userId, userId),
                eq(userMissions.missionId, missionId)
            )
        )
        .limit(1);

    if (!userMission) {
        throw new Error("User mission not found");
    }

    const newProgress = userMission.progress + incrementBy;
    const completed = newProgress >= userMission.targetCount;

    await db
        .update(userMissions)
        .set({
            progress: newProgress,
            status: completed ? "completed" : "in_progress",
            completedAt: completed ? new Date() : null,
            updatedAt: new Date(),
        })
        .where(eq(userMissions.id, userMission.id));

    return { completed, progress: newProgress };
}

/**
 * Claim mission reward
 */
export async function claimMissionReward(
    userId: string,
    missionId: string
): Promise<{ pointsAwarded: number; newBalance: number }> {
    const [userMission] = await db
        .select()
        .from(userMissions)
        .where(
            and(
                eq(userMissions.userId, userId),
                eq(userMissions.missionId, missionId),
                eq(userMissions.status, "completed")
            )
        )
        .limit(1);

    if (!userMission) {
        throw new Error("No completed mission found to claim");
    }

    // Get mission reward
    const [mission] = await db
        .select()
        .from(missions)
        .where(eq(missions.id, missionId))
        .limit(1);

    if (!mission) {
        throw new Error("Mission not found");
    }

    // Award points
    const { newBalance } = await addComPoints(
        userId,
        mission.rewardPoints,
        "mission",
        {
            sourceId: missionId,
            description: `Completed mission: ${mission.name}`,
        }
    );

    // Update mission status to claimed
    await db
        .update(userMissions)
        .set({
            status: "completed",
            claimedAt: new Date(),
            updatedAt: new Date(),
        })
        .where(eq(userMissions.id, userMission.id));

    // Notify user
    await createNotification({
        userId,
        type: "system",
        title: "Mission Completed! 🎉",
        message: `You earned ${mission.rewardPoints} COM Points for completing "${mission.name}"`,
        actionUrl: "/rewards/history",
    });

    return { pointsAwarded: mission.rewardPoints, newBalance };
}

// ===========================================
// REDEMPTION MANAGEMENT
// ===========================================

/**
 * Get available redemption items
 */
export async function getRedemptionItems(): Promise<typeof redemptionItems.$inferSelect[]> {
    return db
        .select()
        .from(redemptionItems)
        .where(eq(redemptionItems.isActive, true));
}

/**
 * Redeem an item from the shop
 */
export async function redeemItem(
    userId: string,
    itemId: string
): Promise<{ redemptionId: string; remainingBalance: number }> {
    // Get item details
    const [item] = await db
        .select()
        .from(redemptionItems)
        .where(eq(redemptionItems.id, itemId))
        .limit(1);

    if (!item) {
        throw new Error("Redemption item not found");
    }

    if (!item.isActive) {
        throw new Error("Item is no longer available");
    }

    // Check stock if limited
    if (item.stock !== null && item.stock <= 0) {
        throw new Error("Item is out of stock");
    }

    // Check max per user
    if (item.maxPerUser !== null) {
        const userRedemptions = await db
            .select({ count: sql<number>`count(*)` })
            .from(redemptions)
            .where(
                and(
                    eq(redemptions.userId, userId),
                    eq(redemptions.itemId, itemId)
                )
            );

        if (userRedemptions[0].count >= item.maxPerUser) {
            throw new Error("You have reached the maximum redemptions for this item");
        }
    }

    // Spend points
    const { newBalance, transactionId } = await spendComPoints(
        userId,
        item.costPoints,
        "redemption",
        {
            sourceId: itemId,
            description: `Redeemed: ${item.name}`,
        }
    );

    // Create redemption record
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 3); // 3 month expiry

    const [redemption] = await db
        .insert(redemptions)
        .values({
            userId,
            itemId,
            pointsSpent: item.costPoints,
            status: "pending",
            expiresAt,
        })
        .returning();

    // Decrease stock if limited
    if (item.stock !== null) {
        await db
            .update(redemptionItems)
            .set({ stock: item.stock - 1 })
            .where(eq(redemptionItems.id, itemId));
    }

    // Notify user
    await createNotification({
        userId,
        type: "system",
        title: "Redemption Successful! 🎁",
        message: `You redeemed "${item.name}" for ${item.costPoints} COM Points`,
        actionUrl: "/rewards/redemptions",
    });

    return { redemptionId: redemption.id, remainingBalance: newBalance };
}

/**
 * Get user's redemptions
 */
export async function getUserRedemptions(
    userId: string,
    status?: string
): Promise<(typeof redemptions.$inferSelect & { item: typeof redemptionItems.$inferSelect })[]> {
    const conditions = [eq(redemptions.userId, userId)];

    if (status) {
        conditions.push(eq(redemptions.status, status as any));
    }

    const result = await db
        .select()
        .from(redemptions)
        .innerJoin(redemptionItems, eq(redemptions.itemId, redemptionItems.id))
        .where(and(...conditions))
        .orderBy(desc(redemptions.createdAt));

    return result.map(r => ({
        ...r.redemptions,
        item: r.redemption_items,
    }));
}

// ===========================================
// REFERRAL MISSIONS
// ===========================================

/**
 * Award referral points when a user refers someone
 * Called when referred user completes signup + first booking
 */
export async function processReferralMission(
    referrerId: string,
    referredUserId: string
): Promise<void> {
    // Find active referral missions
    const referralMissions = await db
        .select()
        .from(missions)
        .where(
            and(
                eq(missions.category, "referral"),
                eq(missions.isActive, true)
            )
        )
        .orderBy(missions.tier);

    for (const mission of referralMissions) {
        // Get or create user mission
        let [userMission] = await db
            .select()
            .from(userMissions)
            .where(
                and(
                    eq(userMissions.userId, referrerId),
                    eq(userMissions.missionId, mission.id)
                )
            )
            .limit(1);

        if (!userMission) {
            [userMission] = await db
                .insert(userMissions)
                .values({
                    userId: referrerId,
                    missionId: mission.id,
                    status: "in_progress",
                    progress: 0,
                    targetCount: mission.targetCount ?? 1,
                })
                .returning();
        }

        // Update progress
        if (userMission.status !== "completed") {
            const { completed } = await updateMissionProgress(
                referrerId,
                mission.id,
                1
            );

            // Auto-claim if completed - status is already 'completed'
            if (completed) {
                await claimMissionReward(referrerId, mission.id);
            }
        }
    }
}
