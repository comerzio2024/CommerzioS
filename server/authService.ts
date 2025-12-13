/**
 * Authentication Service
 * 
 * Handles all authentication operations including:
 * - User registration with email/password
 * - User login with rate limiting
 * - Email verification
 * - Password reset
 * - Session management
 * 
 * Security features:
 * - bcrypt password hashing (cost factor 12)
 * - Rate limiting on failed logins (5 attempts = 15 min lockout)
 * - Secure random tokens for verification/reset
 * - Token expiration enforcement
 */

import bcrypt from "bcrypt";
import crypto from "crypto";
import { db } from "./db";
import { users, oauthTokens, services, notifications } from "@shared/schema";
import { eq, and, gt } from "drizzle-orm";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendPasswordChangedEmail,
  sendReactivationEmail,
} from "./emailService";
import {
  validateReferralCode,
  wouldCreateCircularReference,
  checkReferralRateLimit,
  generateUniqueReferralCode,
  processReferralReward,
} from "./referralService";

// Security constants
const BCRYPT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const EMAIL_VERIFICATION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const PASSWORD_RESET_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

// Result type for auth operations
type Result = { success: boolean; message: string };

/**
 * Compare password with hash
 */
async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a secure random token
 */
function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Register a new user with email and password
 * Supports optional referral code for referral tracking
 */
export async function registerUser(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  referralCode?: string;
}): Promise<{ success: boolean; message: string; userId?: string; referrerName?: string }> {
  const { email, password, firstName, lastName, referralCode } = data;

  // Check if email already exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (existingUser.length > 0) {
    return { success: false, message: "An account with this email already exists" };
  }

  // Validate referral code if provided
  let referredBy: string | null = null;
  let referrerName: string | undefined;

  if (referralCode) {
    const referralValidation = await validateReferralCode(referralCode);

    if (referralValidation.valid && referralValidation.referrerId) {
      // Check rate limiting on the referrer
      const rateLimit = await checkReferralRateLimit(referralValidation.referrerId);

      if (rateLimit.allowed) {
        referredBy = referralValidation.referrerId;
        referrerName = referralValidation.referrerName;
      }
      // If rate limited, just don't apply the referral (don't block registration)
    }
    // If invalid code, just ignore it (don't block registration)
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Generate email verification token
  const emailVerificationToken = generateToken();
  const emailVerificationExpires = new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY_MS);

  // Generate unique referral code for the new user
  const newUserReferralCode = await generateUniqueReferralCode();

  // Create user
  const insertResult = await db
    .insert(users)
    .values({
      email: email.toLowerCase(),
      passwordHash,
      firstName,
      lastName,
      authProvider: "local",
      emailVerificationToken,
      emailVerificationExpires,
      emailVerified: false,
      referralCode: newUserReferralCode,
      referredBy,
    })
    .returning();
  const [newUser] = insertResult as any[];

  // Process referral reward if this user was referred
  if (referredBy) {
    await processReferralReward({
      triggeredByUserId: newUser.id,
      triggerType: "signup",
    });
  }

  // Send verification email
  await sendVerificationEmail(email, firstName, emailVerificationToken);

  return {
    success: true,
    message: referrerName
      ? `Account created! You were referred by ${referrerName}. Please check your email to verify your account.`
      : "Account created! Please check your email to verify your account.",
    userId: newUser.id,
    referrerName,
  };
}

/**
 * Login a user with email and password
 */
export async function loginUser(data: {
  email: string;
  password: string;
  ipAddress?: string;
}): Promise<{
  success: boolean;
  message: string;
  isDeactivated?: boolean;
  user?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
    isAdmin: boolean;
    emailVerified: boolean;
  };
}> {
  const { email, password } = data;

  console.log(`[Auth] Login attempt for: ${email}`);

  // Find user by email
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (!user) {
    console.log(`[Auth] User not found: ${email}`);
    return { success: false, message: "Invalid email or password" };
  }

  console.log(`[Auth] Found user: ${user.email}, hasPasswordHash: ${!!user.passwordHash}`);

  // Check if user is using OAuth (no password)
  if (!user.passwordHash) {
    const provider = user.authProvider || "social login";
    return {
      success: false,
      message: `This account uses ${provider}. Please sign in with ${provider}.`,
    };
  }

  // Check if account is locked
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const remainingMinutes = Math.ceil(
      (user.lockedUntil.getTime() - Date.now()) / 60000
    );
    return {
      success: false,
      message: `Account is locked. Try again in ${remainingMinutes} minutes.`,
    };
  }

  // Check if user is inactive
  if (user.status === "inactive") {
    // Return specific error for frontend to handle reactivation
    return {
      success: false,
      message: "Account is deactivated",
      isDeactivated: true,
      user: { // Return minimal user info for reactivation prompt
        id: user.id,
        email: user.email!,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        isAdmin: user.isAdmin,
        emailVerified: user.emailVerified,
      }
    };
  }

  // Check if account is banned/suspended/kicked
  if (user.status === "banned" || user.status === "suspended" || user.status === "kicked") {
    return {
      success: false,
      message: `Account is ${user.status}. ${user.statusReason || "Please contact support."}`,
    };
  }

  // Verify password
  const isValidPassword = await verifyPassword(password, user.passwordHash);

  if (!isValidPassword) {
    // Increment failed login attempts
    const newAttempts = (user.failedLoginAttempts || 0) + 1;
    const updateData: any = { failedLoginAttempts: newAttempts };

    // Lock account if too many attempts
    if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
      updateData.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
      updateData.failedLoginAttempts = 0;
    }

    await db.update(users).set(updateData).where(eq(users.id, user.id));

    if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
      return {
        success: false,
        message: "Too many failed attempts. Account locked for 15 minutes.",
      };
    }

    return { success: false, message: "Invalid email or password" };
  }

  // Reset failed login attempts and update last login
  await db
    .update(users)
    .set({
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    })
    .where(eq(users.id, user.id));

  return {
    success: true,
    message: "Login successful",
    user: {
      id: user.id,
      email: user.email!,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
      isAdmin: user.isAdmin,
      emailVerified: user.emailVerified,
    },
  };
}

/**
 * Verify email address using token
 */
export async function verifyEmail(token: string): Promise<{
  success: boolean;
  message: string;
}> {
  // Find user with this token
  const [user] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.emailVerificationToken, token),
        gt(users.emailVerificationExpires, new Date())
      )
    )
    .limit(1);

  if (!user) {
    return {
      success: false,
      message: "Invalid or expired verification link. Please request a new one.",
    };
  }

  // Update user as verified
  await db
    .update(users)
    .set({
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  // Send welcome email
  await sendWelcomeEmail(user.email!, user.firstName || "User");

  return {
    success: true,
    message: "Email verified successfully! You can now sign in.",
  };
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(email: string): Promise<{
  success: boolean;
  message: string;
}> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (!user) {
    // Don't reveal if user exists
    return {
      success: true,
      message: "If an account exists with this email, a verification link has been sent.",
    };
  }

  if (user.emailVerified) {
    return {
      success: false,
      message: "This email is already verified.",
    };
  }

  // Generate new token
  const emailVerificationToken = generateToken();
  const emailVerificationExpires = new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY_MS);

  await db
    .update(users)
    .set({
      emailVerificationToken,
      emailVerificationExpires,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  await sendVerificationEmail(user.email!, user.firstName || "User", emailVerificationToken);

  return {
    success: true,
    message: "If an account exists with this email, a verification link has been sent.",
  };
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email: string): Promise<{
  success: boolean;
  message: string;
}> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  // Always return success to prevent email enumeration
  const successMessage = "If an account exists with this email, a password reset link has been sent.";

  if (!user) {
    return { success: true, message: successMessage };
  }

  // Check if user uses OAuth (no password to reset)
  if (!user.passwordHash && user.authProvider !== "local") {
    return { success: true, message: successMessage };
  }

  // Generate reset token
  const passwordResetToken = generateToken();
  const passwordResetExpires = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS);

  await db
    .update(users)
    .set({
      passwordResetToken,
      passwordResetExpires,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  await sendPasswordResetEmail(user.email!, user.firstName || "User", passwordResetToken);

  return { success: true, message: successMessage };
}

/**
 * Reset password with token
 */
export async function resetPassword(data: {
  token: string;
  newPassword: string;
}): Promise<{
  success: boolean;
  message: string;
}> {
  const { token, newPassword } = data;

  // Find user with valid token
  const [user] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.passwordResetToken, token),
        gt(users.passwordResetExpires, new Date())
      )
    )
    .limit(1);

  if (!user) {
    return {
      success: false,
      message: "Invalid or expired reset link. Please request a new one.",
    };
  }

  // Hash new password
  const passwordHash = await hashPassword(newPassword);

  // Update user
  await db
    .update(users)
    .set({
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  // Send confirmation email
  await sendPasswordChangedEmail(user.email!, user.firstName || "User");

  return {
    success: true,
    message: "Password reset successfully! You can now sign in with your new password.",
  };
}

/**
 * Change password (for authenticated users)
 */
export async function changePassword(data: {
  userId: string;
  currentPassword?: string;
  newPassword: string;
}): Promise<{
  success: boolean;
  message: string;
}> {
  const { userId, currentPassword, newPassword } = data;

  // Get user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return {
      success: false,
      message: "Unable to change password. Please contact support.",
    };
  }

  // If user has a password, verify it
  if (user.passwordHash) {
    if (!currentPassword) {
      return {
        success: false,
        message: "Current password is required.",
      };
    }

    const isValidPassword = await verifyPassword(currentPassword, user.passwordHash);

    if (!isValidPassword) {
      return {
        success: false,
        message: "Current password is incorrect.",
      };
    }
  }

  // Hash new password
  const passwordHash = await hashPassword(newPassword);

  // Update user
  await db
    .update(users)
    .set({
      passwordHash,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  // Send confirmation email
  await sendPasswordChangedEmail(user.email!, user.firstName || "User");

  return {
    success: true,
    message: user.passwordHash ? "Password changed successfully!" : "Password set successfully!",
  };
}

/**
 * Delete a user account and all associated data
 * (Soft delete or hard delete depending on requirements - here we assume hard delete cascade)
 */
export async function deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
  // Check if user exists
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return { success: false, message: "User not found" };
  }

  // Delete user (Cascading deletes handles related data like bookings, messages etc if API configured correctly, 
  // but explicitly deleting sessions/tokens is good practice)

  // Note: Database schema should have ON DELETE CASCADE for foreign keys
  // We just need to delete the user record
  await db.delete(users).where(eq(users.id, userId));

  // Delete user session
  // This is handled by the caller (route handler) for the current session

  return { success: true, message: "Account deleted successfully" };
}

/**
 * Deactivate user account
 * Sets status to 'inactive' but keeps data
 */
export async function deactivateUser(userId: string): Promise<{ success: boolean; message: string }> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return { success: false, message: "User not found" };
  }

  if (user.status === "inactive") {
    return { success: true, message: "User is already inactive." };
  }

  // Archive all active services for this user
  await db
    .update(services)
    .set({
      status: "archived",
      updatedAt: new Date(),
    })
    .where(and(eq(services.ownerId, userId), eq(services.status, "active")));

  // Update user status to inactive
  await db
    .update(users)
    .set({
      status: "inactive",
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  return { success: true, message: "User account deactivated successfully." };
}

/**
 * Reactivate user account
 * Sets status back to 'active'
 */
export async function reactivateUser(userId: string): Promise<{ success: boolean; message: string }> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return { success: false, message: "User not found" };
  }

  if (user.status === "active") {
    return { success: true, message: "User is already active." };
  }

  await db
    .update(users)
    .set({
      status: "active",
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  // Handle chat reactivation - unlock conversations and get missed contacts
  try {
    const { handleUserReactivation } = await import("./chatService");
    const chatResult = await handleUserReactivation(userId);

    // Create notifications for missed contact attempts
    for (const contact of chatResult.missedContacts) {
      await db.insert(notifications).values({
        userId: userId,
        type: "message",
        title: "Missed Message While Away",
        message: `${contact.senderName} tried to contact you on ${new Date(contact.attemptedAt).toLocaleDateString()}`,
        isRead: false,
        actionUrl: contact.serviceId ? `/messages?service=${contact.serviceId}` : '/messages',
        createdAt: new Date(),
      });
    }

    console.log(`[reactivateUser] Unlocked ${chatResult.unlockedConversations} conversations, created ${chatResult.missedContacts.length} missed contact notifications`);
  } catch (chatError) {
    console.error("[reactivateUser] Error handling chat reactivation:", chatError);
    // Don't fail the reactivation if chat handling fails
  }

  // Create welcome back notification
  await db.insert(notifications).values({
    userId: userId,
    type: "system",
    title: "Welcome Back!",
    message: "Your account has been successfully reactivated. We're glad to have you back!",
    isRead: false,
    createdAt: new Date(),
  });

  // Send welcome back email
  try {
    const { sendReactivationEmail } = await import("./emailService");
    await sendReactivationEmail(user.email || "", user.firstName || "User");
  } catch (emailError) {
    console.error("[reactivateUser] Error sending reactivation email:", emailError);
  }

  return { success: true, message: "User account reactivated successfully." };
}

/**
 * Reactivate user with credentials check
 * Verifies password first, then reactivates
 */
export async function reactivateUserWithCredentials(email: string, password: string): Promise<Result & { user?: any }> {
  // Find user by email
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (!user) {
    return { success: false, message: "Invalid email or password" };
  }

  // Verify password
  if (!user.passwordHash) {
    return { success: false, message: "Please log in using your social provider." };
  }

  const isValid = await comparePassword(password, user.passwordHash);
  if (!isValid) {
    return { success: false, message: "Invalid email or password" };
  }

  // Reactivate
  const activationResult = await reactivateUser(user.id);
  if (!activationResult.success) {
    return activationResult;
  }

  // Send welcome back email
  sendReactivationEmail(user.email!, user.firstName || "there").catch(console.error);

  // Return user object for session creation
  // Need to mimic what getUserById returns or what passport expects
  const authUser = {
    id: user.id,
    email: user.email!,
    firstName: user.firstName,
    lastName: user.lastName,
    profileImageUrl: user.profileImageUrl,
    isAdmin: user.isAdmin,
    emailVerified: user.emailVerified,
  };

  return { success: true, message: "Account reactivated!", user: authUser };
}

/**
 * Get user by ID (for session management)
 */
export async function getUserById(userId: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user || null;
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  return user || null;
}

/**
 * Create or update user from OAuth provider
 * Supports optional referral code for referral tracking (for new users)
 */
export async function upsertOAuthUser(data: {
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  authProvider: "google" | "twitter" | "facebook";
  oauthProviderId: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  referralCode?: string; // Optional referral code from session/cookie
}): Promise<{
  success: boolean;
  user?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
    isAdmin: boolean;
    emailVerified: boolean;
  };
  isNewUser: boolean;
  message?: string;
}> {
  const { email, firstName, lastName, profileImageUrl, authProvider, oauthProviderId, accessToken, refreshToken, tokenExpiresAt, referralCode } = data;

  // Check if user exists
  let [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  let isNewUser = false;

  if (existingUser) {
    // Check if account is banned
    if (existingUser.status === "banned" || existingUser.status === "suspended" || existingUser.status === "kicked") {
      return {
        success: false,
        isNewUser: false,
        message: `Account is ${existingUser.status}. ${existingUser.statusReason || "Please contact support."}`,
      };
    }

    // Update existing user's OAuth info if they're linking a new provider
    // or if this is the same provider they registered with
    await db
      .update(users)
      .set({
        authProvider,
        oauthProviderId,
        profileImageUrl: profileImageUrl || existingUser.profileImageUrl,
        firstName: firstName || existingUser.firstName,
        lastName: lastName || existingUser.lastName,
        emailVerified: true, // OAuth emails are verified
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, existingUser.id));
  } else {
    // Validate referral code if provided (for new users only)
    let referredBy: string | null = null;

    if (referralCode) {
      const referralValidation = await validateReferralCode(referralCode);

      if (referralValidation.valid && referralValidation.referrerId) {
        const rateLimit = await checkReferralRateLimit(referralValidation.referrerId);

        if (rateLimit.allowed) {
          referredBy = referralValidation.referrerId;
        }
      }
    }

    // Generate unique referral code for the new user
    const newUserReferralCode = await generateUniqueReferralCode();

    // Create new user
    const oauthInsertResult = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        firstName,
        lastName,
        profileImageUrl,
        authProvider,
        oauthProviderId,
        emailVerified: true, // OAuth emails are verified
        lastLoginAt: new Date(),
        referralCode: newUserReferralCode,
        referredBy,
      })
      .returning();

    const [insertedUser] = oauthInsertResult as any[];
    existingUser = insertedUser;
    isNewUser = true;

    // Process referral reward if this user was referred
    if (referredBy) {
      await processReferralReward({
        triggeredByUserId: existingUser.id,
        triggerType: "signup",
      });
    }
  }

  // Store OAuth tokens if provided
  if (accessToken) {
    // Remove old tokens for this provider
    await db
      .delete(oauthTokens)
      .where(
        and(
          eq(oauthTokens.userId, existingUser.id),
          eq(oauthTokens.provider, authProvider)
        )
      );

    // Insert new tokens
    await db.insert(oauthTokens).values({
      userId: existingUser.id,
      provider: authProvider,
      accessToken,
      refreshToken,
      expiresAt: tokenExpiresAt,
    });
  }

  return {
    success: true,
    user: {
      id: existingUser.id,
      email: existingUser.email!,
      firstName: existingUser.firstName,
      lastName: existingUser.lastName,
      profileImageUrl: existingUser.profileImageUrl,
      isAdmin: existingUser.isAdmin,
      emailVerified: existingUser.emailVerified,
    },
    isNewUser,
  };
}

