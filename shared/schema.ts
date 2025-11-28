import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Platform settings table (non-sensitive settings only - API keys stored as env vars)
export const platformSettings = pgTable("platform_settings", {
  id: varchar("id").primaryKey().default('default'),
  requireEmailVerification: boolean("require_email_verification").default(false).notNull(),
  requirePhoneVerification: boolean("require_phone_verification").default(false).notNull(),
  enableSwissAddressValidation: boolean("enable_swiss_address_validation").default(true).notNull(),
  enableAiCategoryValidation: boolean("enable_ai_category_validation").default(true).notNull(),
  googleMapsApiKey: text("google_maps_api_key"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Plans table
export const plans = pgTable("plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  description: text("description"),
  priceMonthly: decimal("price_monthly", { precision: 10, scale: 2 }).notNull(),
  priceYearly: decimal("price_yearly", { precision: 10, scale: 2 }).notNull(),
  maxImages: integer("max_images").default(4).notNull(),
  listingDurationDays: integer("listing_duration_days").default(14).notNull(),
  canRenew: boolean("can_renew").default(true).notNull(),
  featuredListing: boolean("featured_listing").default(false).notNull(),
  prioritySupport: boolean("priority_support").default(false).notNull(),
  analyticsAccess: boolean("analytics_access").default(false).notNull(),
  customBranding: boolean("custom_branding").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const plansRelations = relations(plans, ({ many }) => ({
  users: many(users),
}));

// Users table (extended for marketplace with local auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  phone: varchar("phone", { length: 50 }),
  phoneNumber: varchar("phone_number", { length: 50 }),
  
  // Authentication fields
  passwordHash: varchar("password_hash", { length: 255 }),
  authProvider: varchar("auth_provider", { enum: ["local", "google", "twitter", "facebook"] }).default("local").notNull(),
  oauthProviderId: varchar("oauth_provider_id", { length: 255 }),
  
  // Email verification
  emailVerificationToken: varchar("email_verification_token", { length: 255 }),
  emailVerificationExpires: timestamp("email_verification_expires"),
  
  // Password reset
  passwordResetToken: varchar("password_reset_token", { length: 255 }),
  passwordResetExpires: timestamp("password_reset_expires"),
  
  // Login security
  lastLoginAt: timestamp("last_login_at"),
  failedLoginAttempts: integer("failed_login_attempts").default(0).notNull(),
  lockedUntil: timestamp("locked_until"),
  
  // Existing verification flags
  isVerified: boolean("is_verified").default(false).notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  phoneVerified: boolean("phone_verified").default(false).notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  status: varchar("status", { enum: ["active", "warned", "suspended", "banned", "kicked"] }).default("active").notNull(),
  statusReason: text("status_reason"),
  planId: varchar("plan_id").references(() => plans.id),
  marketingPackage: varchar("marketing_package", { enum: ["basic", "pro", "premium", "enterprise"] }).default("basic"),
  locationLat: decimal("location_lat", { precision: 10, scale: 7 }),
  locationLng: decimal("location_lng", { precision: 10, scale: 7 }),
  preferredLocationName: varchar("preferred_location_name", { length: 200 }),
  preferredSearchRadiusKm: integer("preferred_search_radius_km").default(10),
  lastHomeVisitAt: timestamp("last_home_visit_at"),
  
  // Referral system fields
  referralCode: varchar("referral_code", { length: 20 }).unique(),
  referredBy: varchar("referred_by").references(() => users.id, { onDelete: "set null" }),
  points: integer("points").default(0).notNull(),
  totalEarnedPoints: integer("total_earned_points").default(0).notNull(),
  totalEarnedCommission: decimal("total_earned_commission", { precision: 12, scale: 2 }).default("0").notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_users_email").on(table.email),
  index("idx_users_auth_provider").on(table.authProvider),
  index("idx_users_referral_code").on(table.referralCode),
  index("idx_users_referred_by").on(table.referredBy),
]);

export const usersRelations = relations(users, ({ one, many }) => ({
  plan: one(plans, {
    fields: [users.planId],
    references: [plans.id],
  }),
  referrer: one(users, {
    fields: [users.referredBy],
    references: [users.id],
    relationName: "referrer",
  }),
  referrals: many(users, { relationName: "referrer" }),
  services: many(services),
  reviews: many(reviews),
  favorites: many(favorites),
  submittedCategories: many(submittedCategories),
  aiConversations: many(aiConversations),
  addresses: many(addresses),
  moderationActions: many(userModerationActions),
  oauthTokens: many(oauthTokens),
  pointsLog: many(pointsLog),
  referralTransactionsFrom: many(referralTransactions, { relationName: "fromUser" }),
  referralTransactionsTo: many(referralTransactions, { relationName: "toUser" }),
}));

// OAuth tokens table (for storing social login tokens)
export const oauthTokens = pgTable("oauth_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: varchar("provider", { enum: ["google", "twitter", "facebook"] }).notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_oauth_tokens_user").on(table.userId),
  index("idx_oauth_tokens_provider").on(table.provider),
]);

export const oauthTokensRelations = relations(oauthTokens, ({ one }) => ({
  user: one(users, {
    fields: [oauthTokens.userId],
    references: [users.id],
  }),
}));

// ===========================================
// REFERRAL SYSTEM TABLES
// ===========================================

/**
 * Referral Configuration Table
 * Stores configurable referral settings (commission rates, max levels, etc.)
 */
export const referralConfig = pgTable("referral_config", {
  id: varchar("id").primaryKey().default("default"),
  maxLevels: integer("max_levels").default(3).notNull(),
  
  // Commission rates per level (as decimal, e.g., 0.10 = 10%)
  level1CommissionRate: decimal("level1_commission_rate", { precision: 5, scale: 4 }).default("0.10").notNull(),
  level2CommissionRate: decimal("level2_commission_rate", { precision: 5, scale: 4 }).default("0.04").notNull(),
  level3CommissionRate: decimal("level3_commission_rate", { precision: 5, scale: 4 }).default("0.01").notNull(),
  
  // Points configuration
  pointsPerReferral: integer("points_per_referral").default(100).notNull(),
  pointsPerFirstPurchase: integer("points_per_first_purchase").default(50).notNull(),
  pointsPerServiceCreation: integer("points_per_service_creation").default(25).notNull(),
  pointsPerReview: integer("points_per_review").default(10).notNull(),
  
  // Point redemption rates
  pointsToDiscountRate: decimal("points_to_discount_rate", { precision: 10, scale: 4 }).default("0.01").notNull(), // 1 point = 0.01 CHF
  minPointsToRedeem: integer("min_points_to_redeem").default(100).notNull(),
  
  // Referral system settings
  referralCodeLength: integer("referral_code_length").default(8).notNull(),
  referralLinkExpiryDays: integer("referral_link_expiry_days").default(30).notNull(),
  cookieExpiryDays: integer("cookie_expiry_days").default(30).notNull(),
  
  // Anti-abuse settings
  maxReferralsPerDay: integer("max_referrals_per_day").default(50).notNull(),
  minTimeBetweenReferrals: integer("min_time_between_referrals").default(60).notNull(), // seconds
  
  isActive: boolean("is_active").default(true).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Points Log Table
 * Tracks all point transactions (earned, spent, expired, etc.)
 */
export const pointsLog = pgTable("points_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  points: integer("points").notNull(), // Positive for earned, negative for spent
  balanceAfter: integer("balance_after").notNull(),
  
  action: varchar("action", { 
    enum: ["referral_signup", "referral_first_purchase", "referral_service_created", 
           "service_created", "review_posted", "purchase_made", 
           "redemption", "admin_adjustment", "expired", "bonus"] 
  }).notNull(),
  
  description: text("description"),
  
  // Reference to what triggered this point change
  referenceType: varchar("reference_type", { enum: ["user", "service", "review", "order", "admin"] }),
  referenceId: varchar("reference_id"),
  
  // For referral-related points, track the referral transaction
  referralTransactionId: varchar("referral_transaction_id").references(() => referralTransactions.id, { onDelete: "set null" }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_points_log_user").on(table.userId),
  index("idx_points_log_action").on(table.action),
  index("idx_points_log_created").on(table.createdAt),
]);

export const pointsLogRelations = relations(pointsLog, ({ one }) => ({
  user: one(users, {
    fields: [pointsLog.userId],
    references: [users.id],
  }),
  referralTransaction: one(referralTransactions, {
    fields: [pointsLog.referralTransactionId],
    references: [referralTransactions.id],
  }),
}));

/**
 * Referral Transactions Table
 * Tracks commission and points earned from referral chain
 */
export const referralTransactions = pgTable("referral_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // The user who earned the commission/points (the referrer)
  toUserId: varchar("to_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // The user whose action triggered the reward (the referee, or downstream referral)
  fromUserId: varchar("from_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Referral level (1 = direct, 2 = second level, 3 = third level)
  level: integer("level").notNull(),
  
  // Points earned by toUserId from this transaction
  pointsEarned: integer("points_earned").default(0).notNull(),
  
  // Commission earned (monetary value in CHF)
  commissionEarned: decimal("commission_earned", { precision: 12, scale: 2 }).default("0").notNull(),
  
  // Commission rate used for this transaction
  commissionRate: decimal("commission_rate", { precision: 5, scale: 4 }),
  
  // What triggered this transaction
  triggerType: varchar("trigger_type", { 
    enum: ["signup", "first_purchase", "service_created", "order_completed", "subscription_renewed"] 
  }).notNull(),
  
  // Reference to the triggering entity (e.g., service ID, order ID)
  triggerId: varchar("trigger_id"),
  triggerAmount: decimal("trigger_amount", { precision: 12, scale: 2 }), // The base amount for commission calculation
  
  // Status of the transaction
  status: varchar("status", { 
    enum: ["pending", "confirmed", "paid", "cancelled", "expired"] 
  }).default("pending").notNull(),
  
  // Payout tracking
  paidAt: timestamp("paid_at"),
  payoutId: varchar("payout_id"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_referral_tx_to_user").on(table.toUserId),
  index("idx_referral_tx_from_user").on(table.fromUserId),
  index("idx_referral_tx_level").on(table.level),
  index("idx_referral_tx_status").on(table.status),
  index("idx_referral_tx_trigger").on(table.triggerType),
  index("idx_referral_tx_created").on(table.createdAt),
]);

export const referralTransactionsRelations = relations(referralTransactions, ({ one, many }) => ({
  toUser: one(users, {
    fields: [referralTransactions.toUserId],
    references: [users.id],
    relationName: "toUser",
  }),
  fromUser: one(users, {
    fields: [referralTransactions.fromUserId],
    references: [users.id],
    relationName: "fromUser",
  }),
  pointsLogs: many(pointsLog),
}));

/**
 * Referral Stats Cache Table
 * Cached aggregated stats for dashboard performance
 */
export const referralStats = pgTable("referral_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  
  // Direct referral counts
  totalDirectReferrals: integer("total_direct_referrals").default(0).notNull(),
  activeDirectReferrals: integer("active_direct_referrals").default(0).notNull(),
  
  // Network stats (all levels)
  totalNetworkSize: integer("total_network_size").default(0).notNull(),
  
  // Earnings
  totalPointsEarned: integer("total_points_earned").default(0).notNull(),
  totalCommissionEarned: decimal("total_commission_earned", { precision: 12, scale: 2 }).default("0").notNull(),
  pendingCommission: decimal("pending_commission", { precision: 12, scale: 2 }).default("0").notNull(),
  
  // Rankings
  referralRank: integer("referral_rank"),
  
  // Last activity
  lastReferralAt: timestamp("last_referral_at"),
  
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_referral_stats_user").on(table.userId),
  index("idx_referral_stats_rank").on(table.referralRank),
]);

export const referralStatsRelations = relations(referralStats, ({ one }) => ({
  user: one(users, {
    fields: [referralStats.userId],
    references: [users.id],
  }),
}));

// ===========================================
// END REFERRAL SYSTEM TABLES
// ===========================================

// Addresses table
export const addresses = pgTable("addresses", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 100 }),
  street: varchar("street", { length: 255 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  postalCode: varchar("postal_code", { length: 20 }).notNull(),
  canton: varchar("canton", { length: 100 }),
  country: varchar("country", { length: 100 }).notNull().default("Switzerland"),
  isPrimary: boolean("is_primary").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_addresses_user").on(table.userId),
]);

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(users, {
    fields: [addresses.userId],
    references: [users.id],
  }),
}));

// User moderation actions table (audit log)
export const userModerationActions = pgTable("user_moderation_actions", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  adminId: varchar("admin_id").references(() => users.id),
  action: varchar("action", { enum: ["warn", "suspend", "ban", "kick", "reactivate"] }).notNull(),
  previousStatus: varchar("previous_status", { enum: ["active", "warned", "suspended", "banned", "kicked"] }),
  newStatus: varchar("new_status", { enum: ["active", "warned", "suspended", "banned", "kicked"] }).notNull(),
  reason: text("reason"),
  ipAddress: varchar("ip_address", { length: 45 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_moderation_user").on(table.userId),
  index("idx_moderation_admin").on(table.adminId),
  index("idx_moderation_action").on(table.action),
]);

export const userModerationActionsRelations = relations(userModerationActions, ({ one }) => ({
  user: one(users, {
    fields: [userModerationActions.userId],
    references: [users.id],
  }),
  admin: one(users, {
    fields: [userModerationActions.adminId],
    references: [users.id],
  }),
}));

// Banned identifiers table (IP, email, phone tracking)
export const bannedIdentifiers = pgTable("banned_identifiers", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  identifierType: varchar("identifier_type", { enum: ["ip", "email", "phone"] }).notNull(),
  identifierValue: varchar("identifier_value", { length: 255 }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  bannedBy: varchar("banned_by").references(() => users.id),
  reason: text("reason"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
}, (table) => [
  index("idx_banned_type_value").on(table.identifierType, table.identifierValue),
  index("idx_banned_user").on(table.userId),
]);

export const bannedIdentifiersRelations = relations(bannedIdentifiers, ({ one }) => ({
  user: one(users, {
    fields: [bannedIdentifiers.userId],
    references: [users.id],
  }),
  bannedByUser: one(users, {
    fields: [bannedIdentifiers.bannedBy],
    references: [users.id],
  }),
}));

// Categories table
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  icon: varchar("icon", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  services: many(services),
  subcategories: many(subcategories),
}));

// Subcategories table
export const subcategories = pgTable("subcategories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_subcategories_category").on(table.categoryId),
]);

export const subcategoriesRelations = relations(subcategories, ({ one, many }) => ({
  category: one(categories, {
    fields: [subcategories.categoryId],
    references: [categories.id],
  }),
  services: many(services),
}));

// Temporary categories (AI-suggested, auto-expire after 24 hours)
export const temporaryCategories = pgTable("temporary_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  icon: varchar("icon", { length: 50 }),
  aiSuggested: boolean("ai_suggested").default(true).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const temporaryCategoriesRelations = relations(temporaryCategories, ({ one }) => ({
  user: one(users, {
    fields: [temporaryCategories.userId],
    references: [users.id],
  }),
}));

// User-submitted categories (pending approval)
export const submittedCategories = pgTable("submitted_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: varchar("status", { enum: ["pending", "approved", "rejected"] }).default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const submittedCategoriesRelations = relations(submittedCategories, ({ one }) => ({
  user: one(users, {
    fields: [submittedCategories.userId],
    references: [users.id],
  }),
}));

// Price list item type
export const priceListSchema = z.object({
  description: z.string(),
  price: z.string(),
  unit: z.string().optional(),
});

// Image metadata type
const cropAreaSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

export const imageMetadataSchema = z.object({
  crop: cropAreaSchema.optional(), // Percentages (0-100)
  cropPixels: cropAreaSchema.optional(), // Pixel coordinates
  rotation: z.number().default(0),
  zoom: z.number().default(1).optional(),
});

// Services table
export const services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  categoryId: varchar("category_id").notNull().references(() => categories.id),
  subcategoryId: varchar("subcategory_id").references(() => subcategories.id),
  priceType: varchar("price_type", { enum: ["fixed", "list", "text"] }).default("fixed").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }),
  priceText: text("price_text"),
  priceList: jsonb("price_list").default(sql`'[]'::jsonb`),
  priceUnit: varchar("price_unit", { enum: ["hour", "job", "consultation", "day", "month"] }).notNull(),
  locations: text("locations").array().default(sql`ARRAY[]::text[]`).notNull(),
  locationLat: decimal("location_lat", { precision: 10, scale: 7 }),
  locationLng: decimal("location_lng", { precision: 10, scale: 7 }),
  preferredLocationName: varchar("preferred_location_name", { length: 200 }),
  images: text("images").array().default(sql`ARRAY[]::text[]`).notNull(),
  imageMetadata: jsonb("image_metadata").default(sql`'[]'::jsonb`),
  mainImageIndex: integer("main_image_index").default(0).notNull(),
  status: varchar("status", { enum: ["draft", "active", "paused", "expired"] }).default("draft").notNull(),
  tags: text("tags").array().default(sql`ARRAY[]::text[]`).notNull(),
  hashtags: text("hashtags").array().default(sql`ARRAY[]::text[]`).notNull(),
  contactPhone: varchar("contact_phone", { length: 50 }).notNull(),
  contactEmail: varchar("contact_email", { length: 200 }).notNull(),
  viewCount: integer("view_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_services_owner").on(table.ownerId),
  index("idx_services_category").on(table.categoryId),
  index("idx_services_status").on(table.status),
]);

export const servicesRelations = relations(services, ({ one, many }) => ({
  owner: one(users, {
    fields: [services.ownerId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [services.categoryId],
    references: [categories.id],
  }),
  subcategory: one(subcategories, {
    fields: [services.subcategoryId],
    references: [subcategories.id],
  }),
  reviews: many(reviews),
  favorites: many(favorites),
  serviceContacts: many(serviceContacts),
}));

// Service contacts table (support multiple phone/email with verification)
export const serviceContacts = pgTable("service_contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceId: varchar("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  contactType: varchar("contact_type", { enum: ["phone", "email"] }).notNull(),
  value: varchar("value", { length: 200 }).notNull(),
  name: varchar("name", { length: 100 }),
  role: varchar("role", { length: 100 }),
  isPrimary: boolean("is_primary").default(false).notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  verificationCode: varchar("verification_code", { length: 10 }),
  verificationExpiresAt: timestamp("verification_expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_service_contacts_service").on(table.serviceId),
]);

export const serviceContactsRelations = relations(serviceContacts, ({ one }) => ({
  service: one(services, {
    fields: [serviceContacts.serviceId],
    references: [services.id],
  }),
}));

// AI conversations table (track AI interactions)
export const aiConversations = pgTable("ai_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  conversationType: varchar("conversation_type", { enum: ["admin_assist", "user_support", "category_validation"] }).notNull(),
  messages: jsonb("messages").default(sql`'[]'::jsonb`).notNull(),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`).notNull(),
  status: varchar("status", { enum: ["active", "completed", "archived"] }).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_ai_conversations_user").on(table.userId),
  index("idx_ai_conversations_type").on(table.conversationType),
]);

export const aiConversationsRelations = relations(aiConversations, ({ one }) => ({
  user: one(users, {
    fields: [aiConversations.userId],
    references: [users.id],
  }),
}));

// Reviews table
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceId: varchar("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull(),
  editCount: integer("edit_count").default(0).notNull(),
  lastEditedAt: timestamp("last_edited_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_reviews_service").on(table.serviceId),
  index("idx_reviews_user").on(table.userId),
]);

export const reviewsRelations = relations(reviews, ({ one }) => ({
  service: one(services, {
    fields: [reviews.serviceId],
    references: [services.id],
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
}));

// Favorites table (bonus feature)
export const favorites = pgTable("favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  serviceId: varchar("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_favorites_user").on(table.userId),
  index("idx_favorites_service").on(table.serviceId),
]);

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
  service: one(services, {
    fields: [favorites.serviceId],
    references: [services.id],
  }),
}));

// Types
export type Plan = typeof plans.$inferSelect;
export type InsertPlan = typeof plans.$inferInsert;

export type PlatformSettings = typeof platformSettings.$inferSelect;
export type InsertPlatformSettings = typeof platformSettings.$inferInsert;

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type UserWithPlan = User & { plan?: Plan };

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

export type Subcategory = typeof subcategories.$inferSelect;
export type InsertSubcategory = typeof subcategories.$inferInsert;

export type TemporaryCategory = typeof temporaryCategories.$inferSelect;
export type InsertTemporaryCategory = typeof temporaryCategories.$inferInsert;

export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;

export type ServiceContact = typeof serviceContacts.$inferSelect;
export type InsertServiceContact = typeof serviceContacts.$inferInsert;

export type AiConversation = typeof aiConversations.$inferSelect;
export type InsertAiConversation = typeof aiConversations.$inferInsert;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;

export type SubmittedCategory = typeof submittedCategories.$inferSelect;
export type InsertSubmittedCategory = typeof submittedCategories.$inferInsert;

export type SelectAddress = typeof addresses.$inferSelect;

export type UserModerationAction = typeof userModerationActions.$inferSelect;
export type InsertUserModerationAction = typeof userModerationActions.$inferInsert;

export type BannedIdentifier = typeof bannedIdentifiers.$inferSelect;
export type InsertBannedIdentifier = typeof bannedIdentifiers.$inferInsert;

// Zod schemas for validation
export const insertServiceSchema = createInsertSchema(services, {
  title: z.string().min(5, "Title must be at least 5 characters").max(200),
  description: z.string().min(20, "Description must be at least 20 characters"),
  contactPhone: z.string().min(10, "Valid phone number required"),
  contactEmail: z.string().email("Valid email required"),
  locations: z.array(z.string()).min(1, "At least one location required"),
  priceType: z.enum(["fixed", "list", "text"]),
  price: z.string().optional(),
  priceText: z.string().optional(),
  priceList: z.any().optional(),
  hashtags: z.array(z.string().min(1, "Hashtag must have at least 1 character")).max(3, "Maximum 3 hashtags allowed").optional(),
  subcategoryId: z.string().optional().nullable(),
}).omit({
  id: true,
  ownerId: true,
  expiresAt: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true,
  status: true,
}).superRefine((val, ctx) => {
  if (val.priceType === "fixed" && (!val.price || isNaN(Number(val.price)))) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["price"],
      message: "Price is required for fixed pricing",
    });
  }
  if (val.priceType === "text" && !val.priceText) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["priceText"],
      message: "Price text is required",
    });
  }
});

export const insertReviewSchema = createInsertSchema(reviews, {
  rating: z.number().min(1).max(5),
  comment: z.string().min(10, "Review must be at least 10 characters"),
}).omit({
  id: true,
  createdAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertSubmittedCategorySchema = createInsertSchema(submittedCategories, {
  name: z.string().min(3, "Category name must be at least 3 characters").max(100),
  description: z.string().min(10, "Description must be at least 10 characters").max(500),
}).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertPlanSchema = createInsertSchema(plans, {
  name: z.string().min(3, "Plan name must be at least 3 characters").max(100),
  slug: z.string().min(3, "Slug must be at least 3 characters").max(100),
  maxImages: z.number().min(1).max(100),
  listingDurationDays: z.number().min(1).max(365),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServiceContactSchema = createInsertSchema(serviceContacts, {
  value: z.string().min(1, "Contact value is required"),
  contactType: z.enum(["phone", "email"]),
  name: z.string().optional(),
  role: z.string().optional(),
}).omit({
  id: true,
  createdAt: true,
  isVerified: true,
  verificationCode: true,
  verificationExpiresAt: true,
});

export const insertTemporaryCategorySchema = createInsertSchema(temporaryCategories, {
  name: z.string().min(3, "Category name must be at least 3 characters").max(100),
  slug: z.string().min(3, "Slug must be at least 3 characters").max(100),
}).omit({
  id: true,
  createdAt: true,
});

export const insertAiConversationSchema = createInsertSchema(aiConversations, {
  conversationType: z.enum(["admin_assist", "user_support", "category_validation"]),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAddressSchema = createInsertSchema(addresses, {
  street: z.string().min(1, "Street is required").max(255),
  city: z.string().min(1, "City is required").max(100),
  postalCode: z.string().min(1, "Postal code is required").max(20),
  canton: z.string().optional(),
  label: z.string().optional(),
}).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAddress = z.infer<typeof insertAddressSchema>;

export const insertUserModerationActionSchema = createInsertSchema(userModerationActions, {
  action: z.enum(["warn", "suspend", "ban", "kick", "reactivate"]),
  reason: z.string().optional(),
}).omit({
  id: true,
  createdAt: true,
});

export const insertBannedIdentifierSchema = createInsertSchema(bannedIdentifiers, {
  identifierType: z.enum(["ip", "email", "phone"]),
  identifierValue: z.string().min(1, "Identifier value is required"),
  reason: z.string().optional(),
}).omit({
  id: true,
  createdAt: true,
});

// OAuth tokens types
export type OAuthToken = typeof oauthTokens.$inferSelect;
export type InsertOAuthToken = typeof oauthTokens.$inferInsert;

// Auth validation schemas
export const registerSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
});

export const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Valid email is required"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

// ===========================================
// REFERRAL SYSTEM TYPES AND SCHEMAS
// ===========================================

// Referral Config types
export type ReferralConfig = typeof referralConfig.$inferSelect;
export type InsertReferralConfig = typeof referralConfig.$inferInsert;

// Points Log types
export type PointsLog = typeof pointsLog.$inferSelect;
export type InsertPointsLog = typeof pointsLog.$inferInsert;

// Referral Transaction types
export type ReferralTransaction = typeof referralTransactions.$inferSelect;
export type InsertReferralTransaction = typeof referralTransactions.$inferInsert;

// Referral Stats types
export type ReferralStats = typeof referralStats.$inferSelect;
export type InsertReferralStats = typeof referralStats.$inferInsert;

// Extended register schema with referral code
export const registerWithReferralSchema = registerSchema.extend({
  referralCode: z.string().min(4).max(20).optional(),
});

// Referral code validation schema
export const referralCodeSchema = z.object({
  referralCode: z.string().min(4, "Referral code must be at least 4 characters").max(20),
});

// Points redemption schema
export const redeemPointsSchema = z.object({
  points: z.number().min(1, "Must redeem at least 1 point"),
  redemptionType: z.enum(["discount", "promo_package", "visibility_boost"]),
  targetId: z.string().optional(), // e.g., service ID for visibility boost
});

// Admin referral adjustment schema
export const adminReferralAdjustmentSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  points: z.number(),
  reason: z.string().min(1, "Reason is required"),
});

// Referral config update schema
export const updateReferralConfigSchema = z.object({
  maxLevels: z.number().min(1).max(10).optional(),
  level1CommissionRate: z.string().optional(),
  level2CommissionRate: z.string().optional(),
  level3CommissionRate: z.string().optional(),
  pointsPerReferral: z.number().min(0).optional(),
  pointsPerFirstPurchase: z.number().min(0).optional(),
  pointsPerServiceCreation: z.number().min(0).optional(),
  pointsPerReview: z.number().min(0).optional(),
  pointsToDiscountRate: z.string().optional(),
  minPointsToRedeem: z.number().min(0).optional(),
  maxReferralsPerDay: z.number().min(1).optional(),
  isActive: z.boolean().optional(),
});
