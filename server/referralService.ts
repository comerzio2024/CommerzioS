/**
 * Referral Service
 * 
 * Core referral system logic including:
 * - Referral code generation and validation
 * - Multi-level referral chain tracking
 * - Commission calculation and distribution
 * - Anti-abuse measures (rate limiting, circular reference prevention)
 * 
 * Security features:
 * - Hashed referral codes for URLs
 * - Circular referral prevention
 * - Self-referral blocking
 * - Rate limiting on referral actions
 * - Maximum level caps
 */

import crypto from "crypto";
import { db } from "./db";
import { 
  users, 
  referralConfig, 
  referralTransactions, 
  referralStats,
  pointsLog,
} from "@shared/schema";
import { eq, and, sql, desc, gte, count } from "drizzle-orm";

// ===========================================
// CONFIGURATION
// ===========================================

// Default config values (used if no config in database)
const DEFAULT_CONFIG = {
  maxLevels: 3,
  level1CommissionRate: 0.10, // 10%
  level2CommissionRate: 0.04, // 4%
  level3CommissionRate: 0.01, // 1%
  pointsPerReferral: 100,
  pointsPerFirstPurchase: 50,
  pointsPerServiceCreation: 25,
  pointsPerReview: 10,
  pointsToDiscountRate: 0.01, // 1 point = 0.01 CHF
  minPointsToRedeem: 100,
  referralCodeLength: 8,
  maxReferralsPerDay: 50,
  minTimeBetweenReferrals: 60, // seconds
};

// ===========================================
// REFERRAL CODE GENERATION
// ===========================================

/**
 * Generate a unique referral code
 * Uses a combination of random characters for uniqueness
 */
export function generateReferralCode(length: number = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded confusing chars (I, O, 0, 1)
  let code = '';
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    code += chars[randomBytes[i] % chars.length];
  }
  return code;
}

/**
 * Hash a referral code for use in URLs (shorter, URL-safe)
 */
export function hashReferralCode(code: string): string {
  return crypto
    .createHash('sha256')
    .update(code + process.env.SESSION_SECRET)
    .digest('base64url')
    .substring(0, 12);
}

/**
 * Generate a unique referral code for a user
 * Ensures no duplicates exist in the database
 */
export async function generateUniqueReferralCode(): Promise<string> {
  const config = await getReferralConfig();
  const length = config.referralCodeLength || DEFAULT_CONFIG.referralCodeLength;
  
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const code = generateReferralCode(length);
    
    // Check if code already exists
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.referralCode, code))
      .limit(1);
    
    if (existing.length === 0) {
      return code;
    }
    
    attempts++;
  }
  
  // Fallback: append timestamp for uniqueness
  return generateReferralCode(length) + Date.now().toString(36).slice(-3).toUpperCase();
}

/**
 * Get or create a referral code for a user
 */
export async function getOrCreateReferralCode(userId: string): Promise<string> {
  const [user] = await db
    .select({ referralCode: users.referralCode })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  if (user?.referralCode) {
    return user.referralCode;
  }
  
  // Generate new code
  const code = await generateUniqueReferralCode();
  
  await db
    .update(users)
    .set({ referralCode: code, updatedAt: new Date() })
    .where(eq(users.id, userId));
  
  return code;
}

// ===========================================
// REFERRAL VALIDATION
// ===========================================

/**
 * Validate a referral code and get the referrer
 */
export async function validateReferralCode(code: string): Promise<{
  valid: boolean;
  referrerId?: string;
  referrerName?: string;
  message?: string;
}> {
  if (!code || code.length < 4) {
    return { valid: false, message: "Invalid referral code" };
  }
  
  const normalizedCode = code.toUpperCase().trim();
  
  const [referrer] = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      status: users.status,
    })
    .from(users)
    .where(eq(users.referralCode, normalizedCode))
    .limit(1);
  
  if (!referrer) {
    return { valid: false, message: "Referral code not found" };
  }
  
  // Check if referrer account is active
  if (referrer.status !== "active") {
    return { valid: false, message: "Referral code is no longer valid" };
  }
  
  return {
    valid: true,
    referrerId: referrer.id,
    referrerName: [referrer.firstName, referrer.lastName].filter(Boolean).join(" ") || "A friend",
  };
}

/**
 * Check if a referral would create a circular reference
 * Prevents A -> B -> A or A -> B -> C -> A chains
 */
export async function wouldCreateCircularReference(
  referrerId: string,
  potentialRefereeId: string
): Promise<boolean> {
  const config = await getReferralConfig();
  const maxLevels = config.maxLevels || DEFAULT_CONFIG.maxLevels;
  
  // Check if the potential referee is already in the referrer's upline
  let currentId: string | null = referrerId;
  let level = 0;
  
  while (currentId && level < maxLevels + 1) {
    if (currentId === potentialRefereeId) {
      return true; // Circular reference detected
    }
    
    const [user] = await db
      .select({ referredBy: users.referredBy })
      .from(users)
      .where(eq(users.id, currentId))
      .limit(1);
    
    currentId = user?.referredBy || null;
    level++;
  }
  
  return false;
}

/**
 * Check rate limiting for referral actions
 */
export async function checkReferralRateLimit(referrerId: string): Promise<{
  allowed: boolean;
  message?: string;
  remainingToday?: number;
}> {
  const config = await getReferralConfig();
  const maxPerDay = config.maxReferralsPerDay || DEFAULT_CONFIG.maxReferralsPerDay;
  
  // Count referrals in the last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const [result] = await db
    .select({ count: count() })
    .from(users)
    .where(
      and(
        eq(users.referredBy, referrerId),
        gte(users.createdAt, oneDayAgo)
      )
    );
  
  const todayCount = result?.count || 0;
  
  if (todayCount >= maxPerDay) {
    return {
      allowed: false,
      message: `Daily referral limit reached (${maxPerDay}/day)`,
      remainingToday: 0,
    };
  }
  
  return {
    allowed: true,
    remainingToday: maxPerDay - todayCount,
  };
}

// ===========================================
// REFERRAL CHAIN PROCESSING
// ===========================================

/**
 * Get the complete referral chain for a user (upline)
 * Returns an array of referrers from L1 to maxLevels
 */
export async function getReferralChain(userId: string): Promise<Array<{
  userId: string;
  level: number;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
}>> {
  const config = await getReferralConfig();
  const maxLevels = config.maxLevels || DEFAULT_CONFIG.maxLevels;
  
  const chain: Array<{
    userId: string;
    level: number;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
  }> = [];
  
  let currentId: string | null = userId;
  let level = 0;
  
  // First, get the referredBy of the starting user
  const [startUser] = await db
    .select({ referredBy: users.referredBy })
    .from(users)
    .where(eq(users.id, currentId))
    .limit(1);
  
  currentId = startUser?.referredBy || null;
  
  while (currentId && level < maxLevels) {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        referredBy: users.referredBy,
      })
      .from(users)
      .where(eq(users.id, currentId))
      .limit(1);
    
    if (!user) break;
    
    level++;
    chain.push({
      userId: user.id,
      level,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });
    
    currentId = user.referredBy;
  }
  
  return chain;
}

/**
 * Get all direct referrals for a user
 */
export async function getDirectReferrals(userId: string, limit: number = 50): Promise<Array<{
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  createdAt: Date;
  status: string;
}>> {
  const referrals = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      createdAt: users.createdAt,
      status: users.status,
    })
    .from(users)
    .where(eq(users.referredBy, userId))
    .orderBy(desc(users.createdAt))
    .limit(limit);
  
  return referrals;
}

/**
 * Get the total network size (all levels of referrals)
 */
export async function getNetworkSize(userId: string): Promise<number> {
  const config = await getReferralConfig();
  const maxLevels = config.maxLevels || DEFAULT_CONFIG.maxLevels;
  
  // Use recursive CTE to count all downstream referrals
  const result = await db.execute(sql`
    WITH RECURSIVE referral_tree AS (
      -- Base case: direct referrals
      SELECT id, 1 as level
      FROM users
      WHERE referred_by = ${userId}
      
      UNION ALL
      
      -- Recursive case: referrals of referrals
      SELECT u.id, rt.level + 1
      FROM users u
      INNER JOIN referral_tree rt ON u.referred_by = rt.id
      WHERE rt.level < ${maxLevels}
    )
    SELECT COUNT(*) as total FROM referral_tree
  `);
  
  return Number((result.rows[0] as any)?.total || 0);
}

// ===========================================
// COMMISSION CALCULATION
// ===========================================

/**
 * Get commission rate for a specific level
 */
export async function getCommissionRate(level: number): Promise<number> {
  const config = await getReferralConfig();
  
  switch (level) {
    case 1:
      return Number(config.level1CommissionRate) || DEFAULT_CONFIG.level1CommissionRate;
    case 2:
      return Number(config.level2CommissionRate) || DEFAULT_CONFIG.level2CommissionRate;
    case 3:
      return Number(config.level3CommissionRate) || DEFAULT_CONFIG.level3CommissionRate;
    default:
      return 0;
  }
}

/**
 * Process referral rewards when a triggering event occurs
 * (e.g., signup, purchase, service creation)
 */
export async function processReferralReward(params: {
  triggeredByUserId: string;
  triggerType: "signup" | "first_purchase" | "service_created" | "order_completed" | "subscription_renewed";
  triggerId?: string;
  triggerAmount?: number; // For commission calculation (e.g., order amount)
}): Promise<{
  success: boolean;
  transactionsCreated: number;
  totalPointsAwarded: number;
  totalCommissionAwarded: number;
}> {
  const { triggeredByUserId, triggerType, triggerId, triggerAmount } = params;
  const config = await getReferralConfig();
  
  if (!config.isActive) {
    return { success: false, transactionsCreated: 0, totalPointsAwarded: 0, totalCommissionAwarded: 0 };
  }
  
  // Get the referral chain (upline)
  const chain = await getReferralChain(triggeredByUserId);
  
  if (chain.length === 0) {
    return { success: true, transactionsCreated: 0, totalPointsAwarded: 0, totalCommissionAwarded: 0 };
  }
  
  let transactionsCreated = 0;
  let totalPointsAwarded = 0;
  let totalCommissionAwarded = 0;
  
  // Determine points to award based on trigger type
  let basePoints = 0;
  switch (triggerType) {
    case "signup":
      basePoints = config.pointsPerReferral || DEFAULT_CONFIG.pointsPerReferral;
      break;
    case "first_purchase":
      basePoints = config.pointsPerFirstPurchase || DEFAULT_CONFIG.pointsPerFirstPurchase;
      break;
    case "service_created":
      basePoints = config.pointsPerServiceCreation || DEFAULT_CONFIG.pointsPerServiceCreation;
      break;
    default:
      basePoints = 0;
  }
  
  // Process rewards for each level in the chain
  for (const referrer of chain) {
    const commissionRate = await getCommissionRate(referrer.level);
    
    // Calculate commission (only if there's a trigger amount)
    const commission = triggerAmount ? Number((triggerAmount * commissionRate).toFixed(2)) : 0;
    
    // Calculate points (decreasing by level: L1=100%, L2=50%, L3=25%)
    const levelMultiplier = 1 / Math.pow(2, referrer.level - 1);
    const points = Math.floor(basePoints * levelMultiplier);
    
    // Only create transaction if there's something to award
    if (points > 0 || commission > 0) {
      // Create referral transaction
      const [transaction] = await db
        .insert(referralTransactions)
        .values({
          toUserId: referrer.userId,
          fromUserId: triggeredByUserId,
          level: referrer.level,
          pointsEarned: points,
          commissionEarned: commission.toString(),
          commissionRate: commissionRate.toString(),
          triggerType,
          triggerId,
          triggerAmount: triggerAmount?.toString(),
          status: commission > 0 ? "pending" : "confirmed",
        })
        .returning();
      
      // Update user's points
      if (points > 0) {
        await db
          .update(users)
          .set({
            points: sql`${users.points} + ${points}`,
            totalEarnedPoints: sql`${users.totalEarnedPoints} + ${points}`,
            updatedAt: new Date(),
          })
          .where(eq(users.id, referrer.userId));
        
        // Log points
        await db.insert(pointsLog).values({
          userId: referrer.userId,
          points,
          balanceAfter: sql`(SELECT points FROM users WHERE id = ${referrer.userId})`,
          action: `referral_${triggerType}` as any,
          description: `Level ${referrer.level} referral reward`,
          referenceType: "user",
          referenceId: triggeredByUserId,
          referralTransactionId: transaction.id,
        });
        
        totalPointsAwarded += points;
      }
      
      // Update user's commission
      if (commission > 0) {
        await db
          .update(users)
          .set({
            totalEarnedCommission: sql`${users.totalEarnedCommission} + ${commission}`,
            updatedAt: new Date(),
          })
          .where(eq(users.id, referrer.userId));
        
        totalCommissionAwarded += commission;
      }
      
      transactionsCreated++;
    }
  }
  
  // Update referral stats for the direct referrer
  if (chain.length > 0) {
    await updateReferralStats(chain[0].userId);
  }
  
  return {
    success: true,
    transactionsCreated,
    totalPointsAwarded,
    totalCommissionAwarded,
  };
}

// ===========================================
// REFERRAL STATS
// ===========================================

/**
 * Update or create referral stats for a user
 */
export async function updateReferralStats(userId: string): Promise<void> {
  // Get direct referrals count
  const [directCount] = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.referredBy, userId));
  
  const [activeDirectCount] = await db
    .select({ count: count() })
    .from(users)
    .where(
      and(
        eq(users.referredBy, userId),
        eq(users.status, "active")
      )
    );
  
  // Get network size
  const networkSize = await getNetworkSize(userId);
  
  // Get earnings totals
  const [earnings] = await db
    .select({
      totalPoints: sql<number>`COALESCE(SUM(points_earned), 0)`,
      totalCommission: sql<string>`COALESCE(SUM(commission_earned), '0')`,
      pendingCommission: sql<string>`COALESCE(SUM(CASE WHEN status = 'pending' THEN commission_earned ELSE 0 END), '0')`,
    })
    .from(referralTransactions)
    .where(eq(referralTransactions.toUserId, userId));
  
  // Get last referral date
  const [lastReferral] = await db
    .select({ createdAt: users.createdAt })
    .from(users)
    .where(eq(users.referredBy, userId))
    .orderBy(desc(users.createdAt))
    .limit(1);
  
  // Upsert stats
  await db
    .insert(referralStats)
    .values({
      userId,
      totalDirectReferrals: directCount?.count || 0,
      activeDirectReferrals: activeDirectCount?.count || 0,
      totalNetworkSize: networkSize,
      totalPointsEarned: Number(earnings?.totalPoints) || 0,
      totalCommissionEarned: earnings?.totalCommission || "0",
      pendingCommission: earnings?.pendingCommission || "0",
      lastReferralAt: lastReferral?.createdAt,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: referralStats.userId,
      set: {
        totalDirectReferrals: directCount?.count || 0,
        activeDirectReferrals: activeDirectCount?.count || 0,
        totalNetworkSize: networkSize,
        totalPointsEarned: Number(earnings?.totalPoints) || 0,
        totalCommissionEarned: earnings?.totalCommission || "0",
        pendingCommission: earnings?.pendingCommission || "0",
        lastReferralAt: lastReferral?.createdAt,
        updatedAt: new Date(),
      },
    });
}

/**
 * Get referral stats for a user
 */
export async function getReferralStatsForUser(userId: string): Promise<{
  referralCode: string;
  totalDirectReferrals: number;
  activeDirectReferrals: number;
  totalNetworkSize: number;
  totalPointsEarned: number;
  currentPoints: number;
  totalCommissionEarned: number;
  pendingCommission: number;
  referralRank: number | null;
  lastReferralAt: Date | null;
}> {
  // Ensure user has a referral code
  const referralCode = await getOrCreateReferralCode(userId);
  
  // Get user's current points
  const [user] = await db
    .select({ points: users.points })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  // Get or update stats
  await updateReferralStats(userId);
  
  const [stats] = await db
    .select()
    .from(referralStats)
    .where(eq(referralStats.userId, userId))
    .limit(1);
  
  return {
    referralCode,
    totalDirectReferrals: stats?.totalDirectReferrals || 0,
    activeDirectReferrals: stats?.activeDirectReferrals || 0,
    totalNetworkSize: stats?.totalNetworkSize || 0,
    totalPointsEarned: stats?.totalPointsEarned || 0,
    currentPoints: user?.points || 0,
    totalCommissionEarned: Number(stats?.totalCommissionEarned) || 0,
    pendingCommission: Number(stats?.pendingCommission) || 0,
    referralRank: stats?.referralRank || null,
    lastReferralAt: stats?.lastReferralAt || null,
  };
}

// ===========================================
// CONFIGURATION MANAGEMENT
// ===========================================

/**
 * Get referral configuration
 */
export async function getReferralConfig(): Promise<{
  maxLevels: number;
  level1CommissionRate: number;
  level2CommissionRate: number;
  level3CommissionRate: number;
  pointsPerReferral: number;
  pointsPerFirstPurchase: number;
  pointsPerServiceCreation: number;
  pointsPerReview: number;
  pointsToDiscountRate: number;
  minPointsToRedeem: number;
  referralCodeLength: number;
  maxReferralsPerDay: number;
  minTimeBetweenReferrals: number;
  isActive: boolean;
}> {
  const [config] = await db
    .select()
    .from(referralConfig)
    .where(eq(referralConfig.id, "default"))
    .limit(1);
  
  if (!config) {
    // Return defaults
    return {
      ...DEFAULT_CONFIG,
      isActive: true,
    };
  }
  
  return {
    maxLevels: config.maxLevels,
    level1CommissionRate: Number(config.level1CommissionRate),
    level2CommissionRate: Number(config.level2CommissionRate),
    level3CommissionRate: Number(config.level3CommissionRate),
    pointsPerReferral: config.pointsPerReferral,
    pointsPerFirstPurchase: config.pointsPerFirstPurchase,
    pointsPerServiceCreation: config.pointsPerServiceCreation,
    pointsPerReview: config.pointsPerReview,
    pointsToDiscountRate: Number(config.pointsToDiscountRate),
    minPointsToRedeem: config.minPointsToRedeem,
    referralCodeLength: config.referralCodeLength,
    maxReferralsPerDay: config.maxReferralsPerDay,
    minTimeBetweenReferrals: config.minTimeBetweenReferrals,
    isActive: config.isActive,
  };
}

/**
 * Initialize referral config if it doesn't exist
 */
export async function initializeReferralConfig(): Promise<void> {
  const [existing] = await db
    .select({ id: referralConfig.id })
    .from(referralConfig)
    .where(eq(referralConfig.id, "default"))
    .limit(1);
  
  if (!existing) {
    await db.insert(referralConfig).values({
      id: "default",
    });
    console.log("Referral config initialized with default values");
  }
}

/**
 * Update referral configuration
 */
export async function updateReferralConfig(updates: {
  maxLevels?: number;
  level1CommissionRate?: string;
  level2CommissionRate?: string;
  level3CommissionRate?: string;
  pointsPerReferral?: number;
  pointsPerFirstPurchase?: number;
  pointsPerServiceCreation?: number;
  pointsPerReview?: number;
  pointsToDiscountRate?: string;
  minPointsToRedeem?: number;
  maxReferralsPerDay?: number;
  isActive?: boolean;
}): Promise<void> {
  await db
    .update(referralConfig)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(referralConfig.id, "default"));
}

// ===========================================
// REFERRAL LINK HELPERS
// ===========================================

/**
 * Generate a referral link for a user
 */
export function generateReferralLink(baseUrl: string, referralCode: string): string {
  return `${baseUrl}/register?ref=${encodeURIComponent(referralCode)}`;
}

/**
 * Parse referral code from various sources (URL param, cookie, etc.)
 */
export function parseReferralCode(input: string | null | undefined): string | null {
  if (!input) return null;
  
  const trimmed = input.trim().toUpperCase();
  if (trimmed.length < 4 || trimmed.length > 20) return null;
  
  // Only allow alphanumeric characters
  if (!/^[A-Z0-9]+$/.test(trimmed)) return null;
  
  return trimmed;
}

// ===========================================
// ADMIN FUNCTIONS
// ===========================================

/**
 * Get top referrers for admin dashboard
 */
export async function getTopReferrers(limit: number = 10): Promise<Array<{
  userId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  totalReferrals: number;
  totalEarnings: number;
}>> {
  const results = await db
    .select({
      userId: referralStats.userId,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      totalReferrals: referralStats.totalDirectReferrals,
      totalEarnings: referralStats.totalCommissionEarned,
    })
    .from(referralStats)
    .innerJoin(users, eq(referralStats.userId, users.id))
    .orderBy(desc(referralStats.totalDirectReferrals))
    .limit(limit);
  
  return results.map(r => ({
    ...r,
    totalEarnings: Number(r.totalEarnings) || 0,
  }));
}

/**
 * Get referral system overview stats for admin
 */
export async function getReferralSystemStats(): Promise<{
  totalReferrals: number;
  totalPointsAwarded: number;
  totalCommissionAwarded: number;
  pendingCommission: number;
  activeReferrers: number;
}> {
  // Total users who were referred
  const [totalReferred] = await db
    .select({ count: count() })
    .from(users)
    .where(sql`${users.referredBy} IS NOT NULL`);
  
  // Total points and commission from transactions
  const [totals] = await db
    .select({
      totalPoints: sql<number>`COALESCE(SUM(points_earned), 0)`,
      totalCommission: sql<string>`COALESCE(SUM(commission_earned), '0')`,
      pendingCommission: sql<string>`COALESCE(SUM(CASE WHEN status = 'pending' THEN commission_earned ELSE 0 END), '0')`,
    })
    .from(referralTransactions);
  
  // Active referrers (users who have at least one referral)
  const [activeReferrers] = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${users.referredBy})` })
    .from(users)
    .where(sql`${users.referredBy} IS NOT NULL`);
  
  return {
    totalReferrals: totalReferred?.count || 0,
    totalPointsAwarded: Number(totals?.totalPoints) || 0,
    totalCommissionAwarded: Number(totals?.totalCommission) || 0,
    pendingCommission: Number(totals?.pendingCommission) || 0,
    activeReferrers: Number(activeReferrers?.count) || 0,
  };
}

/**
 * Admin: Adjust user points
 */
export async function adminAdjustPoints(params: {
  userId: string;
  points: number;
  reason: string;
  adminId: string;
}): Promise<{ success: boolean; newBalance: number }> {
  const { userId, points, reason, adminId } = params;
  
  // Update user points
  await db
    .update(users)
    .set({
      points: sql`GREATEST(0, ${users.points} + ${points})`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
  
  // Get new balance
  const [user] = await db
    .select({ points: users.points })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  const newBalance = user?.points || 0;
  
  // Log the adjustment
  await db.insert(pointsLog).values({
    userId,
    points,
    balanceAfter: newBalance,
    action: "admin_adjustment",
    description: `Admin adjustment: ${reason}`,
    referenceType: "admin",
    referenceId: adminId,
  });
  
  return { success: true, newBalance };
}

