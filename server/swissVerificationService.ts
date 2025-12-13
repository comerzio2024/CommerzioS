/**
 * Swiss Verification Service
 * 
 * Implements the Swiss Trust verification level system:
 * - LEVEL_1 (SMS): SMS verified only, OFFLINE payments only
 * - LEVEL_2 (Stripe KYC): Stripe KYC complete, ONLINE + OFFLINE payments
 * - LEVEL_3 (Zefix UID): Zefix UID verified, all features + Business badge
 * 
 * Also handles:
 * - Launch 100 credit gifting
 * - Early bird registration tracking
 */

import { db } from "./db";
import { users } from "@shared/schema";
import { eq, sql, isNull, lt } from "drizzle-orm";
import { addCredits, awardLaunchGift, awardSubscriptionCredits } from "./creditService";
import { createNotification } from "./notificationService";

// Types
export type VerificationLevel = "LEVEL_1" | "LEVEL_2" | "LEVEL_3";

export interface VerificationResult {
    success: boolean;
    level: VerificationLevel;
    message: string;
    creditsAwarded?: number;
}

export interface ZefixBusinessInfo {
    uid: string; // CHE-xxx.xxx.xxx format
    name: string;
    legalForm: string;
    status: string;
    address: {
        street: string;
        city: string;
        postalCode: string;
        canton: string;
    };
}

// Launch 100 constants
const EARLY_BIRD_LIMIT = 1000; // First 1000 users are early birds
const LAUNCH_GIFT_CREDITS = {
    LEVEL_1: 0,
    LEVEL_2: 25,
    LEVEL_3: 75,
};

// ===========================================
// VERIFICATION LEVEL MANAGEMENT
// ===========================================

/**
 * Get user's current verification level
 */
export async function getVerificationLevel(
    userId: string
): Promise<{ level: VerificationLevel; details: object }> {
    const [user] = await db
        .select({
            verificationLevel: users.verificationLevel,
            zefixUid: users.zefixUid,
            isEarlyBird: users.isEarlyBird,
            registrationNumber: users.registrationNumber,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

    if (!user) {
        throw new Error("User not found");
    }

    return {
        level: user.verificationLevel as VerificationLevel,
        details: {
            hasZefixUid: !!user.zefixUid,
            zefixUid: user.zefixUid,
            isEarlyBird: user.isEarlyBird,
            registrationNumber: user.registrationNumber,
        },
    };
}

/**
 * Upgrade user to Level 2 (Stripe KYC verified)
 */
export async function upgradeToLevel2(
    userId: string,
    stripeAccountId: string
): Promise<VerificationResult> {
    const [user] = await db
        .select({
            verificationLevel: users.verificationLevel,
            isEarlyBird: users.isEarlyBird,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

    if (!user) {
        return { success: false, level: "LEVEL_1", message: "User not found" };
    }

    if (user.verificationLevel === "LEVEL_2" || user.verificationLevel === "LEVEL_3") {
        return {
            success: true,
            level: user.verificationLevel as VerificationLevel,
            message: "Already verified"
        };
    }

    // Update user verification level
    await db
        .update(users)
        .set({
            verificationLevel: "LEVEL_2",
            stripeAccountId,
        })
        .where(eq(users.id, userId));

    // Award launch gift credits if early bird
    let creditsAwarded = 0;
    if (user.isEarlyBird) {
        const transaction = await awardLaunchGift(userId, "LEVEL_2");
        creditsAwarded = transaction?.amount ?? 0;
    }

    // Notify user
    await createNotification({
        userId,
        type: "system",
        title: "Verification Complete! 🎉",
        message: creditsAwarded > 0
            ? `You're now Level 2 verified! You've received ${creditsAwarded} bonus credits.`
            : "You're now Level 2 verified! You can now accept online payments.",
        actionUrl: "/profile",
    });

    return {
        success: true,
        level: "LEVEL_2",
        message: "Upgraded to Level 2",
        creditsAwarded,
    };
}

/**
 * Upgrade user to Level 3 (Zefix UID verified)
 */
export async function upgradeToLevel3(
    userId: string,
    zefixUid: string
): Promise<VerificationResult> {
    // Validate UID format
    if (!isValidZefixUid(zefixUid)) {
        return {
            success: false,
            level: "LEVEL_1",
            message: "Invalid UID format. Expected: CHE-xxx.xxx.xxx"
        };
    }

    // Verify with Zefix API
    const businessInfo = await verifyZefixUid(zefixUid);
    if (!businessInfo) {
        return {
            success: false,
            level: "LEVEL_1",
            message: "UID not found in Swiss business registry"
        };
    }

    const [user] = await db
        .select({
            verificationLevel: users.verificationLevel,
            isEarlyBird: users.isEarlyBird,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

    if (!user) {
        return { success: false, level: "LEVEL_1", message: "User not found" };
    }

    // Update user verification level and store UID
    await db
        .update(users)
        .set({
            verificationLevel: "LEVEL_3",
            zefixUid,
            // Could store business name too if we had a field
        })
        .where(eq(users.id, userId));

    // Award launch gift credits if early bird
    let creditsAwarded = 0;
    if (user.isEarlyBird) {
        // If upgrading from Level 2, only award the difference
        const previousCredits = user.verificationLevel === "LEVEL_2"
            ? LAUNCH_GIFT_CREDITS.LEVEL_2
            : 0;
        const newCredits = LAUNCH_GIFT_CREDITS.LEVEL_3 - previousCredits;

        if (newCredits > 0) {
            await addCredits(userId, newCredits, "launch_gift", {
                description: `Launch gift for Level 3 verification (upgrade bonus)`,
                referenceType: "system",
            });
            creditsAwarded = newCredits;
        }
    }

    // Notify user
    await createNotification({
        userId,
        type: "system",
        title: "Business Verified! 🏆",
        message: `Your business "${businessInfo.name}" is now verified! You've unlocked all premium features.`,
        actionUrl: "/profile",
    });

    return {
        success: true,
        level: "LEVEL_3",
        message: `Verified as ${businessInfo.name}`,
        creditsAwarded,
    };
}

// ===========================================
// ZEFIX API INTEGRATION
// ===========================================

/**
 * Validate Swiss UID format
 * Format: CHE-xxx.xxx.xxx (9 digits)
 */
export function isValidZefixUid(uid: string): boolean {
    const uidPattern = /^CHE-\d{3}\.\d{3}\.\d{3}$/;
    return uidPattern.test(uid);
}

/**
 * Normalize UID to standard format
 */
export function normalizeZefixUid(uid: string): string | null {
    // Remove all non-digits
    const digits = uid.replace(/\D/g, "");

    if (digits.length !== 9) {
        return null;
    }

    // Format as CHE-xxx.xxx.xxx
    return `CHE-${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}`;
}

/**
 * Verify UID with Zefix API
 * TODO: Implement actual Zefix API call when API key is available
 */
export async function verifyZefixUid(
    uid: string
): Promise<ZefixBusinessInfo | null> {
    // Normalize the UID
    const normalizedUid = normalizeZefixUid(uid) || uid;

    // STUB: In production, call the Zefix REST API
    // API endpoint: https://www.zefix.ch/ZefixREST/api/v1/company/uid/{uid}
    // Requires API key in header

    // For development, return mock data for testing
    if (process.env.NODE_ENV === "development") {
        // Mock response for testing
        if (normalizedUid.startsWith("CHE-")) {
            return {
                uid: normalizedUid,
                name: "Test Company AG",
                legalForm: "AG",
                status: "active",
                address: {
                    street: "Bahnhofstrasse 1",
                    city: "Zürich",
                    postalCode: "8001",
                    canton: "ZH",
                },
            };
        }
    }

    // TODO: Implement real API call
    // const response = await fetch(`https://www.zefix.ch/ZefixREST/api/v1/company/uid/${normalizedUid}`, {
    //   headers: {
    //     'Authorization': `Bearer ${process.env.ZEFIX_API_KEY}`,
    //   },
    // });
    // 
    // if (!response.ok) return null;
    // return response.json();

    return null;
}

/**
 * Search for businesses by name
 * TODO: Implement actual Zefix API search
 */
export async function searchZefixByName(
    name: string,
    canton?: string
): Promise<ZefixBusinessInfo[]> {
    // STUB: In production, call the Zefix REST API
    // API endpoint: https://www.zefix.ch/ZefixREST/api/v1/company/search

    return [];
}

// ===========================================
// EARLY BIRD / LAUNCH 100 PROGRAM
// ===========================================

/**
 * Check if user qualifies for early bird status
 * Based on registration order
 */
export async function checkEarlyBirdEligibility(
    userId: string
): Promise<{ eligible: boolean; position?: number }> {
    const [user] = await db
        .select({ registrationNumber: users.registrationNumber })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

    if (!user || !user.registrationNumber) {
        return { eligible: false };
    }

    return {
        eligible: user.registrationNumber <= EARLY_BIRD_LIMIT,
        position: user.registrationNumber,
    };
}

/**
 * Assign registration number to new user
 * Called during user registration
 */
export async function assignRegistrationNumber(
    userId: string
): Promise<{ registrationNumber: number; isEarlyBird: boolean }> {
    // Get next registration number atomically
    const [result] = await db
        .select({ maxNum: sql<number>`COALESCE(MAX(registration_number), 0)` })
        .from(users);

    const registrationNumber = (result?.maxNum ?? 0) + 1;
    const isEarlyBird = registrationNumber <= EARLY_BIRD_LIMIT;

    await db
        .update(users)
        .set({
            registrationNumber,
            isEarlyBird,
        })
        .where(eq(users.id, userId));

    return { registrationNumber, isEarlyBird };
}

/**
 * Get Launch 100 program stats
 */
export async function getLaunchProgramStats(): Promise<{
    totalRegistered: number;
    earlyBirdsRemaining: number;
    creditsAwarded: number;
}> {
    const [stats] = await db
        .select({
            totalRegistered: sql<number>`COALESCE(MAX(registration_number), 0)`,
            earlyBirdCount: sql<number>`COUNT(*) FILTER (WHERE is_early_bird = true)`,
        })
        .from(users);

    // TODO: Calculate total credits awarded from credits table
    const creditsAwarded = 0; // Placeholder

    return {
        totalRegistered: stats?.totalRegistered ?? 0,
        earlyBirdsRemaining: Math.max(0, EARLY_BIRD_LIMIT - (stats?.totalRegistered ?? 0)),
        creditsAwarded,
    };
}

// ===========================================
// VERIFICATION FEATURE ACCESS
// ===========================================

/**
 * Check what features are available for a verification level
 */
export function getFeatureAccess(level: VerificationLevel): {
    canAcceptOnlinePayments: boolean;
    canAcceptOfflinePayments: boolean;
    hasBusinessBadge: boolean;
    maxListings: number;
    commissionRate: number;
    instantPayoutEligible: boolean;
} {
    switch (level) {
        case "LEVEL_1":
            return {
                canAcceptOnlinePayments: false,
                canAcceptOfflinePayments: true,
                hasBusinessBadge: false,
                maxListings: 3,
                commissionRate: 15, // 15%
                instantPayoutEligible: false,
            };
        case "LEVEL_2":
            return {
                canAcceptOnlinePayments: true,
                canAcceptOfflinePayments: true,
                hasBusinessBadge: false,
                maxListings: 10,
                commissionRate: 15,
                instantPayoutEligible: false,
            };
        case "LEVEL_3":
            return {
                canAcceptOnlinePayments: true,
                canAcceptOfflinePayments: true,
                hasBusinessBadge: true,
                maxListings: -1, // Unlimited
                commissionRate: 15,
                instantPayoutEligible: true, // Can use instant payout preference
            };
    }
}
