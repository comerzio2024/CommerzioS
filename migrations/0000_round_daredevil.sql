CREATE TYPE "public"."notification_type" AS ENUM('message', 'booking', 'referral', 'service', 'payment', 'system', 'review', 'promotion', 'tip');--> statement-breakpoint
CREATE TYPE "public"."dispute_phase" AS ENUM('phase_1', 'phase_2', 'phase_3_pending', 'phase_3_ai', 'phase_3_external', 'resolved', 'closed');--> statement-breakpoint
CREATE TYPE "public"."dispute_response_type" AS ENUM('accept_option', 'counter_propose', 'escalate', 'external', 'no_response');--> statement-breakpoint
CREATE TYPE "public"."external_resolution_initiator" AS ENUM('customer', 'vendor', 'both');--> statement-breakpoint
CREATE TYPE "public"."moderation_status" AS ENUM('pending_review', 'approved', 'rejected', 'flagged');--> statement-breakpoint
CREATE TYPE "public"."proposal_payment_method" AS ENUM('card', 'twint', 'cash');--> statement-breakpoint
CREATE TYPE "public"."proposal_payment_timing" AS ENUM('upfront', 'on_completion');--> statement-breakpoint
CREATE TYPE "public"."proposal_status" AS ENUM('pending', 'viewed', 'accepted', 'rejected', 'withdrawn', 'expired');--> statement-breakpoint
CREATE TYPE "public"."service_request_status" AS ENUM('draft', 'open', 'booked', 'suspended', 'cancelled', 'expired');--> statement-breakpoint
CREATE TYPE "public"."account_status" AS ENUM('active', 'restricted_payment_failed', 'restricted_debt', 'suspended', 'banned');--> statement-breakpoint
CREATE TYPE "public"."performance_tier" AS ENUM('standard', 'pro', 'elite');--> statement-breakpoint
CREATE TABLE "addresses" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"label" varchar(100),
	"street" varchar(255) NOT NULL,
	"city" varchar(100) NOT NULL,
	"postal_code" varchar(20) NOT NULL,
	"canton" varchar(100),
	"country" varchar(100) DEFAULT 'Switzerland' NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_conversations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"conversation_type" varchar NOT NULL,
	"messages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" varchar DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "banned_identifiers" (
	"id" varchar PRIMARY KEY NOT NULL,
	"identifier_type" varchar NOT NULL,
	"identifier_value" varchar(255) NOT NULL,
	"user_id" varchar,
	"banned_by" varchar,
	"reason" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "booking_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"session_token" varchar(255),
	"service_id" varchar NOT NULL,
	"pricing_option_id" varchar,
	"locked_pricing" jsonb NOT NULL,
	"requested_start_time" timestamp,
	"requested_end_time" timestamp,
	"status" varchar DEFAULT 'active' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_number" varchar(20) NOT NULL,
	"customer_id" varchar NOT NULL,
	"vendor_id" varchar NOT NULL,
	"service_id" varchar NOT NULL,
	"pricing_option_id" varchar,
	"payment_method" varchar DEFAULT 'card' NOT NULL,
	"stripe_payment_intent_id" varchar(255),
	"twint_transaction_id" varchar(255),
	"twint_refund_id" varchar(255),
	"requested_start_time" timestamp NOT NULL,
	"requested_end_time" timestamp NOT NULL,
	"confirmed_start_time" timestamp,
	"confirmed_end_time" timestamp,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"confirmed_by_customer" boolean DEFAULT false,
	"customer_confirmed_at" timestamp,
	"alternative_start_time" timestamp,
	"alternative_end_time" timestamp,
	"alternative_message" text,
	"alternative_expires_at" timestamp,
	"queue_position" integer,
	"customer_message" text,
	"customer_phone" varchar(50),
	"customer_address" text,
	"vendor_message" text,
	"rejection_reason" text,
	"cancelled_by" varchar,
	"cancellation_reason" text,
	"cancelled_at" timestamp,
	"reminder_sent_at" timestamp,
	"review_request_sent_at" timestamp,
	"vendor_review_request_count" integer DEFAULT 0,
	"last_vendor_review_request_at" timestamp,
	"accepted_at" timestamp,
	"confirmed_at" timestamp,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_booking_number_unique" UNIQUE("booking_number")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"icon" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "chat_conversations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" varchar NOT NULL,
	"vendor_id" varchar NOT NULL,
	"booking_id" varchar,
	"order_id" varchar,
	"service_id" varchar,
	"status" varchar DEFAULT 'active' NOT NULL,
	"last_message_at" timestamp,
	"last_message_preview" varchar(100),
	"customer_unread_count" integer DEFAULT 0 NOT NULL,
	"vendor_unread_count" integer DEFAULT 0 NOT NULL,
	"flagged_for_review" boolean DEFAULT false NOT NULL,
	"flag_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_active_conversation" UNIQUE NULLS NOT DISTINCT("customer_id","vendor_id","service_id")
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"sender_id" varchar NOT NULL,
	"sender_role" varchar NOT NULL,
	"content" text NOT NULL,
	"original_content" text,
	"message_type" varchar DEFAULT 'text' NOT NULL,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"was_filtered" boolean DEFAULT false NOT NULL,
	"filter_reason" varchar,
	"blocked_content" text,
	"read_at" timestamp,
	"is_edited" boolean DEFAULT false NOT NULL,
	"edited_at" timestamp,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_reviews" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"customer_id" varchar NOT NULL,
	"booking_id" varchar NOT NULL,
	"rating" integer NOT NULL,
	"communication_rating" integer,
	"punctuality_rating" integer,
	"respect_rating" integer,
	"comment" text NOT NULL,
	"edit_count" integer DEFAULT 0 NOT NULL,
	"last_edited_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customer_reviews_booking_id_unique" UNIQUE("booking_id")
);
--> statement-breakpoint
CREATE TABLE "e2e_bug_reports" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"test_file" varchar(255) NOT NULL,
	"test_name" varchar(500) NOT NULL,
	"test_suite" varchar(255),
	"error_type" varchar(100) NOT NULL,
	"error_message" text NOT NULL,
	"stack_trace" text,
	"screenshot_url" varchar(500),
	"page_url" varchar(500),
	"user_agent" varchar(500),
	"test_user_id" varchar(100),
	"test_user_role" varchar(50),
	"llm_prompt" text,
	"steps_to_reproduce" jsonb DEFAULT '[]'::jsonb,
	"api_endpoint" varchar(255),
	"api_response" jsonb,
	"request_payload" jsonb,
	"status" varchar DEFAULT 'new' NOT NULL,
	"priority" varchar DEFAULT 'medium' NOT NULL,
	"assigned_to" varchar(100),
	"resolved_at" timestamp,
	"resolution" text,
	"browser_name" varchar(50),
	"browser_version" varchar(50),
	"run_id" varchar(100),
	"retry_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "escrow_disputes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"escrow_transaction_id" varchar NOT NULL,
	"booking_id" varchar NOT NULL,
	"raised_by" varchar NOT NULL,
	"raised_by_user_id" varchar NOT NULL,
	"reason" varchar NOT NULL,
	"description" text NOT NULL,
	"evidence_urls" jsonb,
	"status" varchar DEFAULT 'open' NOT NULL,
	"resolved_by" varchar,
	"resolution" text,
	"refund_amount" numeric(10, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "escrow_transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" varchar NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'CHF' NOT NULL,
	"platform_fee" numeric(10, 2) NOT NULL,
	"vendor_amount" numeric(10, 2) NOT NULL,
	"payment_method" varchar NOT NULL,
	"stripe_payment_intent_id" varchar(255),
	"stripe_checkout_session_id" varchar(255),
	"stripe_charge_id" varchar(255),
	"stripe_transfer_id" varchar(255),
	"twint_transaction_id" varchar(255),
	"twint_refund_id" varchar(255),
	"status" varchar DEFAULT 'pending' NOT NULL,
	"refund_requested_at" timestamp,
	"refund_reason" text,
	"refunded_at" timestamp,
	"refund_amount" numeric(10, 2),
	"auto_release_at" timestamp,
	"auto_release_warning_sent_at" timestamp,
	"paid_at" timestamp,
	"held_at" timestamp,
	"released_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "escrow_transactions_booking_id_unique" UNIQUE("booking_id")
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"service_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"notifications_enabled" boolean DEFAULT true NOT NULL,
	"in_app_enabled" boolean DEFAULT true NOT NULL,
	"email_enabled" boolean DEFAULT true NOT NULL,
	"push_enabled" boolean DEFAULT false NOT NULL,
	"type_settings" jsonb DEFAULT '{"message":{"in_app":true,"email":true,"push":true},"booking":{"in_app":true,"email":true,"push":true},"referral":{"in_app":true,"email":false,"push":false},"service":{"in_app":true,"email":false,"push":false},"payment":{"in_app":true,"email":true,"push":true},"system":{"in_app":true,"email":false,"push":false},"review":{"in_app":true,"email":true,"push":false},"promotion":{"in_app":true,"email":false,"push":false}}'::jsonb NOT NULL,
	"quiet_hours_enabled" boolean DEFAULT false NOT NULL,
	"quiet_hours_start" varchar(5),
	"quiet_hours_end" varchar(5),
	"quiet_hours_timezone" varchar(50) DEFAULT 'UTC',
	"sound_enabled" boolean DEFAULT true NOT NULL,
	"vibration_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notification_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" varchar(200) NOT NULL,
	"message" text NOT NULL,
	"icon" varchar(50),
	"related_entity_type" varchar(50),
	"related_entity_id" varchar,
	"action_url" varchar(500),
	"priority" integer DEFAULT 5 NOT NULL,
	"ai_relevance_score" numeric(4, 3),
	"ai_reasoning" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"is_dismissed" boolean DEFAULT false NOT NULL,
	"delivered_via" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"email_sent_at" timestamp,
	"push_sent_at" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "oauth_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"provider" varchar NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" varchar(20) NOT NULL,
	"customer_id" varchar NOT NULL,
	"vendor_id" varchar NOT NULL,
	"service_id" varchar NOT NULL,
	"pricing_option_id" varchar,
	"price_label" varchar(100),
	"unit_price" numeric(10, 2) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"platform_fee" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'CHF' NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"stripe_payment_intent_id" varchar(255),
	"stripe_checkout_session_id" varchar(255),
	"payment_status" varchar DEFAULT 'pending' NOT NULL,
	"paid_at" timestamp,
	"vendor_payout_amount" numeric(10, 2),
	"vendor_payout_status" varchar DEFAULT 'pending' NOT NULL,
	"vendor_paid_at" timestamp,
	"stripe_transfer_id" varchar(255),
	"booking_id" varchar,
	"customer_notes" text,
	"vendor_notes" text,
	"admin_notes" text,
	"referral_processed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"price_monthly" numeric(10, 2) NOT NULL,
	"price_yearly" numeric(10, 2) NOT NULL,
	"max_images" integer DEFAULT 4 NOT NULL,
	"listing_duration_days" integer DEFAULT 14 NOT NULL,
	"can_renew" boolean DEFAULT true NOT NULL,
	"featured_listing" boolean DEFAULT false NOT NULL,
	"priority_support" boolean DEFAULT false NOT NULL,
	"analytics_access" boolean DEFAULT false NOT NULL,
	"custom_branding" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "plans_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "platform_settings" (
	"id" varchar PRIMARY KEY DEFAULT 'default' NOT NULL,
	"require_email_verification" boolean DEFAULT false NOT NULL,
	"require_phone_verification" boolean DEFAULT false NOT NULL,
	"enable_swiss_address_validation" boolean DEFAULT true NOT NULL,
	"enable_ai_category_validation" boolean DEFAULT true NOT NULL,
	"enable_service_contacts" boolean DEFAULT true NOT NULL,
	"require_service_contacts" boolean DEFAULT false NOT NULL,
	"platform_commission_percent" numeric(5, 2) DEFAULT '8.00' NOT NULL,
	"card_processing_fee_percent" numeric(5, 2) DEFAULT '2.90' NOT NULL,
	"card_processing_fee_fixed" numeric(10, 2) DEFAULT '0.30' NOT NULL,
	"twint_processing_fee_percent" numeric(5, 2) DEFAULT '1.30' NOT NULL,
	"google_maps_api_key" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "points_log" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"points" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"action" varchar NOT NULL,
	"description" text,
	"reference_type" varchar,
	"reference_id" varchar,
	"referral_transaction_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pricing_audit_log" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"entity_type" varchar NOT NULL,
	"entity_id" varchar NOT NULL,
	"action" varchar NOT NULL,
	"previous_value" jsonb,
	"new_value" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh_key" text NOT NULL,
	"auth_key" text NOT NULL,
	"user_agent" varchar(500),
	"device_name" varchar(100),
	"device_type" varchar(20),
	"is_active" boolean DEFAULT true NOT NULL,
	"failed_attempts" integer DEFAULT 0 NOT NULL,
	"last_failure_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_used_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "referral_config" (
	"id" varchar PRIMARY KEY DEFAULT 'default' NOT NULL,
	"max_levels" integer DEFAULT 3 NOT NULL,
	"level1_commission_rate" numeric(5, 4) DEFAULT '0.10' NOT NULL,
	"level2_commission_rate" numeric(5, 4) DEFAULT '0.04' NOT NULL,
	"level3_commission_rate" numeric(5, 4) DEFAULT '0.01' NOT NULL,
	"points_per_referral" integer DEFAULT 100 NOT NULL,
	"points_per_first_purchase" integer DEFAULT 50 NOT NULL,
	"points_per_service_creation" integer DEFAULT 25 NOT NULL,
	"points_per_review" integer DEFAULT 10 NOT NULL,
	"points_to_discount_rate" numeric(10, 4) DEFAULT '0.01' NOT NULL,
	"min_points_to_redeem" integer DEFAULT 100 NOT NULL,
	"referral_code_length" integer DEFAULT 8 NOT NULL,
	"referral_link_expiry_days" integer DEFAULT 30 NOT NULL,
	"cookie_expiry_days" integer DEFAULT 30 NOT NULL,
	"max_referrals_per_day" integer DEFAULT 50 NOT NULL,
	"min_time_between_referrals" integer DEFAULT 60 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referral_stats" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"total_direct_referrals" integer DEFAULT 0 NOT NULL,
	"active_direct_referrals" integer DEFAULT 0 NOT NULL,
	"total_network_size" integer DEFAULT 0 NOT NULL,
	"total_points_earned" integer DEFAULT 0 NOT NULL,
	"total_commission_earned" numeric(12, 2) DEFAULT '0' NOT NULL,
	"pending_commission" numeric(12, 2) DEFAULT '0' NOT NULL,
	"referral_rank" integer,
	"last_referral_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "referral_stats_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "referral_transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"to_user_id" varchar NOT NULL,
	"from_user_id" varchar NOT NULL,
	"level" integer NOT NULL,
	"points_earned" integer DEFAULT 0 NOT NULL,
	"commission_earned" numeric(12, 2) DEFAULT '0' NOT NULL,
	"commission_rate" numeric(5, 4),
	"trigger_type" varchar NOT NULL,
	"trigger_id" varchar,
	"trigger_amount" numeric(12, 2),
	"status" varchar DEFAULT 'pending' NOT NULL,
	"paid_at" timestamp,
	"payout_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_removal_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" varchar NOT NULL,
	"requester_id" varchar NOT NULL,
	"reason" varchar NOT NULL,
	"details" text NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"reviewed_by" varchar,
	"reviewed_at" timestamp,
	"admin_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"booking_id" varchar,
	"rating" integer NOT NULL,
	"quality_rating" integer,
	"communication_rating" integer,
	"punctuality_rating" integer,
	"value_rating" integer,
	"comment" text NOT NULL,
	"edit_count" integer DEFAULT 0 NOT NULL,
	"last_edited_at" timestamp,
	"previous_rating" integer,
	"rating_direction" varchar,
	"vendor_response" text,
	"vendor_responded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_availability_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" varchar NOT NULL,
	"working_hours" jsonb DEFAULT '{}'::jsonb,
	"default_slot_duration_minutes" integer DEFAULT 60 NOT NULL,
	"buffer_between_bookings_minutes" integer DEFAULT 15 NOT NULL,
	"instant_booking" boolean DEFAULT false NOT NULL,
	"min_booking_notice_hours" integer DEFAULT 24,
	"max_booking_advance_days" integer DEFAULT 90,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "service_availability_settings_service_id_unique" UNIQUE("service_id")
);
--> statement-breakpoint
CREATE TABLE "service_contacts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" varchar NOT NULL,
	"contact_type" varchar NOT NULL,
	"value" varchar(200) NOT NULL,
	"name" varchar(100),
	"role" varchar(100),
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verification_code" varchar(10),
	"verification_expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_pricing_options" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" varchar NOT NULL,
	"label" varchar(100) NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'CHF' NOT NULL,
	"billing_interval" varchar DEFAULT 'one_time' NOT NULL,
	"duration_minutes" integer,
	"stripe_price_id" varchar(255),
	"included_units" jsonb DEFAULT '[]'::jsonb,
	"tiers" jsonb DEFAULT '[]'::jsonb,
	"modifiers" jsonb DEFAULT '{}'::jsonb,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" varchar NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"category_id" varchar NOT NULL,
	"subcategory_id" varchar,
	"price_type" varchar DEFAULT 'fixed' NOT NULL,
	"price" numeric(10, 2),
	"price_text" text,
	"price_list" jsonb DEFAULT '[]'::jsonb,
	"price_unit" varchar NOT NULL,
	"locations" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"location_lat" numeric(10, 7),
	"location_lng" numeric(10, 7),
	"preferred_location_name" varchar(200),
	"images" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"image_metadata" jsonb DEFAULT '[]'::jsonb,
	"main_image_index" integer DEFAULT 0 NOT NULL,
	"status" varchar DEFAULT 'draft' NOT NULL,
	"tags" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"hashtags" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"contact_phone" varchar(50) NOT NULL,
	"contact_email" varchar(200) NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"accepted_payment_methods" text[] DEFAULT ARRAY['card', 'twint', 'cash']::text[] NOT NULL,
	"cancellation_policy" varchar DEFAULT 'flexible' NOT NULL,
	"custom_no_show_fee_percent" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subcategories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" varchar NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submitted_categories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"user_id" varchar NOT NULL,
	"status" varchar DEFAULT 'pending',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "temporary_categories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"icon" varchar(50),
	"ai_suggested" boolean DEFAULT true NOT NULL,
	"user_id" varchar,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "temporary_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "tips" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" varchar NOT NULL,
	"escrow_transaction_id" varchar,
	"customer_id" varchar NOT NULL,
	"vendor_id" varchar NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'CHF' NOT NULL,
	"message" text,
	"payment_method" varchar NOT NULL,
	"stripe_payment_intent_id" varchar(255),
	"status" varchar DEFAULT 'pending' NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_blocks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"blocker_id" varchar NOT NULL,
	"blocked_user_id" varchar NOT NULL,
	"reason" text,
	"block_type" varchar DEFAULT 'chat_only' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_user_block" UNIQUE("blocker_id","blocked_user_id")
);
--> statement-breakpoint
CREATE TABLE "user_moderation_actions" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"admin_id" varchar,
	"action" varchar NOT NULL,
	"previous_status" varchar,
	"new_status" varchar NOT NULL,
	"reason" text,
	"ip_address" varchar(45),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_reports" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_id" varchar NOT NULL,
	"reported_user_id" varchar NOT NULL,
	"conversation_id" varchar,
	"message_id" varchar,
	"report_type" varchar NOT NULL,
	"description" text NOT NULL,
	"ai_severity" varchar,
	"ai_analysis" text,
	"ai_recommendation" text,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"admin_decision" varchar,
	"admin_notes" text,
	"resolved_by" varchar,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"phone" varchar(50),
	"phone_number" varchar(50),
	"password_hash" varchar(255),
	"auth_provider" varchar DEFAULT 'local' NOT NULL,
	"oauth_provider_id" varchar(255),
	"email_verification_token" varchar(255),
	"email_verification_expires" timestamp,
	"password_reset_token" varchar(255),
	"password_reset_expires" timestamp,
	"last_login_at" timestamp,
	"failed_login_attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp,
	"is_verified" boolean DEFAULT false NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"phone_verified" boolean DEFAULT false NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"status" varchar DEFAULT 'active' NOT NULL,
	"status_reason" text,
	"plan_id" varchar,
	"marketing_package" varchar DEFAULT 'basic',
	"location_lat" numeric(10, 7),
	"location_lng" numeric(10, 7),
	"preferred_location_name" varchar(200),
	"preferred_search_radius_km" integer DEFAULT 10,
	"last_home_visit_at" timestamp,
	"referral_code" varchar(20),
	"referred_by" varchar,
	"points" integer DEFAULT 0 NOT NULL,
	"total_earned_points" integer DEFAULT 0 NOT NULL,
	"total_earned_commission" numeric(12, 2) DEFAULT '0' NOT NULL,
	"stripe_customer_id" varchar(255),
	"stripe_connect_account_id" varchar(255),
	"stripe_connect_onboarded" boolean DEFAULT false NOT NULL,
	"default_payment_method_id" varchar(255),
	"payment_method_last4" varchar(4),
	"payment_method_brand" varchar(50),
	"account_status" varchar DEFAULT 'active' NOT NULL,
	"account_status_reason" text,
	"account_status_changed_at" timestamp,
	"accept_card_payments" boolean DEFAULT true NOT NULL,
	"accept_twint_payments" boolean DEFAULT true NOT NULL,
	"accept_cash_payments" boolean DEFAULT true NOT NULL,
	"require_booking_approval" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE "vendor_availability_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"default_working_hours" jsonb DEFAULT '{}'::jsonb,
	"timezone" varchar(50) DEFAULT 'Europe/Zurich' NOT NULL,
	"min_booking_notice_hours" integer DEFAULT 24 NOT NULL,
	"max_booking_advance_days" integer DEFAULT 90 NOT NULL,
	"default_slot_duration_minutes" integer DEFAULT 60 NOT NULL,
	"buffer_between_bookings_minutes" integer DEFAULT 15 NOT NULL,
	"auto_accept_bookings" boolean DEFAULT false NOT NULL,
	"require_deposit" boolean DEFAULT false NOT NULL,
	"deposit_percentage" integer DEFAULT 20,
	"email_notifications" boolean DEFAULT true NOT NULL,
	"sms_notifications" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vendor_availability_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "vendor_calendar_blocks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"block_type" varchar DEFAULT 'manual' NOT NULL,
	"recurrence" varchar,
	"recurrence_end_date" timestamp,
	"title" varchar(100),
	"notes" text,
	"service_id" varchar,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dispute_ai_analysis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dispute_id" varchar NOT NULL,
	"evidence_analysis" jsonb,
	"description_analysis" jsonb,
	"behavior_analysis" jsonb,
	"overall_assessment" jsonb,
	"raw_ai_response" jsonb,
	"ai_model" text,
	"ai_prompt_tokens" integer,
	"ai_completion_tokens" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dispute_ai_decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dispute_id" varchar NOT NULL,
	"customer_refund_percent" integer NOT NULL,
	"vendor_payment_percent" integer NOT NULL,
	"customer_refund_amount" numeric(10, 2) NOT NULL,
	"vendor_payment_amount" numeric(10, 2) NOT NULL,
	"decision_summary" text NOT NULL,
	"full_reasoning" text NOT NULL,
	"key_factors" jsonb DEFAULT '[]'::jsonb,
	"status" text DEFAULT 'pending' NOT NULL,
	"executed_at" timestamp,
	"overridden_by" "external_resolution_initiator",
	"overridden_at" timestamp,
	"customer_refund_stripe_id" text,
	"vendor_payment_stripe_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dispute_ai_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dispute_id" varchar NOT NULL,
	"analysis_id" uuid,
	"option_label" text NOT NULL,
	"option_title" text NOT NULL,
	"customer_refund_percent" integer NOT NULL,
	"vendor_payment_percent" integer NOT NULL,
	"customer_refund_amount" numeric(10, 2),
	"vendor_payment_amount" numeric(10, 2),
	"reasoning" text NOT NULL,
	"key_factors" jsonb DEFAULT '[]'::jsonb,
	"based_on" jsonb DEFAULT '[]'::jsonb,
	"is_recommended" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dispute_fee_charges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dispute_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'CHF' NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"stripe_charge_id" text,
	"stripe_payment_intent_id" text,
	"charge_attempts" integer DEFAULT 0,
	"last_attempt_at" timestamp,
	"last_attempt_error" text,
	"waived_at" timestamp,
	"waived_by" varchar,
	"waive_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dispute_phases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dispute_id" varchar NOT NULL,
	"current_phase" "dispute_phase" DEFAULT 'phase_1' NOT NULL,
	"phase_1_started_at" timestamp,
	"phase_1_deadline" timestamp,
	"phase_1_counter_offers_customer" integer DEFAULT 0,
	"phase_1_counter_offers_vendor" integer DEFAULT 0,
	"phase_1_resolved_at" timestamp,
	"phase_2_started_at" timestamp,
	"phase_2_deadline" timestamp,
	"phase_2_counter_offers_customer" integer DEFAULT 0,
	"phase_2_counter_offers_vendor" integer DEFAULT 0,
	"phase_2_resolved_at" timestamp,
	"phase_3_started_at" timestamp,
	"phase_3_review_deadline" timestamp,
	"phase_3_executed_at" timestamp,
	"external_resolution_chosen_by" "external_resolution_initiator",
	"external_resolution_chosen_at" timestamp,
	"external_resolution_fee_charged" boolean DEFAULT false,
	"external_resolution_fee_charge_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dispute_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dispute_id" varchar NOT NULL,
	"report_data" jsonb NOT NULL,
	"pdf_url" text,
	"pdf_generated_at" timestamp,
	"downloaded_by_customer" boolean DEFAULT false,
	"downloaded_by_customer_at" timestamp,
	"downloaded_by_vendor" boolean DEFAULT false,
	"downloaded_by_vendor_at" timestamp,
	"generated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dispute_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dispute_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"phase" "dispute_phase" NOT NULL,
	"response_type" "dispute_response_type" NOT NULL,
	"selected_option_id" uuid,
	"selected_option_label" text,
	"counter_proposal_percent" integer,
	"counter_proposal_message" text,
	"message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_debts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"debt_type" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'CHF' NOT NULL,
	"description" text,
	"proposal_id" uuid,
	"dispute_id" uuid,
	"booking_id" uuid,
	"status" text DEFAULT 'pending' NOT NULL,
	"charge_attempts" integer DEFAULT 0,
	"last_attempt_at" timestamp,
	"last_attempt_error" text,
	"next_attempt_at" timestamp,
	"resolved_at" timestamp,
	"resolved_by" text,
	"stripe_charge_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_request_id" uuid NOT NULL,
	"vendor_id" varchar NOT NULL,
	"service_id" varchar,
	"price" numeric(10, 2) NOT NULL,
	"price_breakdown" jsonb,
	"payment_method" "proposal_payment_method" NOT NULL,
	"payment_timing" "proposal_payment_timing" NOT NULL,
	"cover_letter" text NOT NULL,
	"estimated_duration" text,
	"proposed_date" timestamp,
	"proposed_date_end" timestamp,
	"attachment_urls" jsonb DEFAULT '[]'::jsonb,
	"status" "proposal_status" DEFAULT 'pending' NOT NULL,
	"viewed_at" timestamp,
	"responded_at" timestamp,
	"rejection_reason" text,
	"commission_amount" numeric(10, 2),
	"commission_charged" boolean DEFAULT false,
	"commission_charge_id" text,
	"commission_charge_failed_at" timestamp,
	"commission_charge_error" text,
	"expires_at" timestamp NOT NULL,
	"edit_count" integer DEFAULT 0 NOT NULL,
	"last_edited_at" timestamp,
	"edit_history" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "proposals_vendor_request_unique" UNIQUE("vendor_id","service_request_id")
);
--> statement-breakpoint
CREATE TABLE "saved_service_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"service_request_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "saved_service_requests_unique" UNIQUE("user_id","service_request_id")
);
--> statement-breakpoint
CREATE TABLE "service_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category_id" text,
	"subcategory_id" text,
	"budget_min" numeric(10, 2),
	"budget_max" numeric(10, 2),
	"budget_flexible" boolean DEFAULT false,
	"preferred_date_start" timestamp,
	"preferred_date_end" timestamp,
	"flexible_dates" boolean DEFAULT false,
	"urgency" text,
	"location_city" text,
	"location_canton" text,
	"location_postal_code" text,
	"location_address" text,
	"location_lat" numeric(10, 7),
	"location_lng" numeric(10, 7),
	"location_radius_km" integer DEFAULT 5,
	"service_at_customer_location" boolean DEFAULT true,
	"attachment_urls" jsonb DEFAULT '[]'::jsonb,
	"moderation_status" "moderation_status" DEFAULT 'pending_review' NOT NULL,
	"moderation_reason" text,
	"moderated_at" timestamp,
	"status" "service_request_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp,
	"expires_at" timestamp,
	"view_count" integer DEFAULT 0,
	"proposal_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_payment_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"stripe_customer_id" text NOT NULL,
	"default_payment_method_id" text,
	"payment_method_last4" text,
	"payment_method_brand" text,
	"payment_method_exp_month" integer,
	"payment_method_exp_year" integer,
	"is_valid" boolean DEFAULT true,
	"last_validated_at" timestamp,
	"validation_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commission_tiers" (
	"id" text PRIMARY KEY NOT NULL,
	"commission_percent" numeric(5, 2) NOT NULL,
	"min_completed_bookings" integer DEFAULT 0 NOT NULL,
	"min_average_rating" numeric(3, 2),
	"min_lifetime_earnings" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"badge_color" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"transaction_type" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"balance_after" numeric(10, 2) NOT NULL,
	"reference_type" text,
	"reference_id" text,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kickstarter_program" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"max_vendors" integer DEFAULT 1000 NOT NULL,
	"max_credits_per_vendor" numeric(10, 2) DEFAULT '50.00' NOT NULL,
	"credit_per_qualifying_review" numeric(10, 2) DEFAULT '10.00' NOT NULL,
	"min_rating_for_credit" numeric(3, 2) DEFAULT '4.00' NOT NULL,
	"vendors_enrolled" integer DEFAULT 0 NOT NULL,
	"vendors_maxed_out" integer DEFAULT 0 NOT NULL,
	"total_credits_awarded" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"program_ended_at" timestamp,
	"program_ended_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_stats" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"total_bookings" integer DEFAULT 0 NOT NULL,
	"completed_bookings" integer DEFAULT 0 NOT NULL,
	"cancelled_bookings" integer DEFAULT 0 NOT NULL,
	"disputed_bookings" integer DEFAULT 0 NOT NULL,
	"lifetime_earnings" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"last_30_days_earnings" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"average_rating" numeric(3, 2),
	"total_reviews" integer DEFAULT 0 NOT NULL,
	"five_star_reviews" integer DEFAULT 0 NOT NULL,
	"four_star_reviews" integer DEFAULT 0 NOT NULL,
	"average_response_time_minutes" integer,
	"response_rate" numeric(5, 2),
	"performance_tier" "performance_tier" DEFAULT 'standard' NOT NULL,
	"tier_evaluated_at" timestamp,
	"tier_changed_at" timestamp,
	"tier_history" jsonb DEFAULT '[]'::jsonb,
	"commission_credits" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"credits_earned_count" integer DEFAULT 0 NOT NULL,
	"kickstarter_eligible" boolean DEFAULT true NOT NULL,
	"last_credit_earned_at" timestamp,
	"total_cash_bookings" integer DEFAULT 0 NOT NULL,
	"cash_dispute_count" integer DEFAULT 0 NOT NULL,
	"last_30_days_cash_bookings" integer DEFAULT 0 NOT NULL,
	"last_30_days_cash_disputes" integer DEFAULT 0 NOT NULL,
	"cash_privileges_suspended" boolean DEFAULT false NOT NULL,
	"cash_privileges_suspended_at" timestamp,
	"cash_privileges_suspended_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"stats_recalculated_at" timestamp,
	CONSTRAINT "vendor_stats_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banned_identifiers" ADD CONSTRAINT "banned_identifiers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banned_identifiers" ADD CONSTRAINT "banned_identifiers_banned_by_users_id_fk" FOREIGN KEY ("banned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_sessions" ADD CONSTRAINT "booking_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_sessions" ADD CONSTRAINT "booking_sessions_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_sessions" ADD CONSTRAINT "booking_sessions_pricing_option_id_service_pricing_options_id_fk" FOREIGN KEY ("pricing_option_id") REFERENCES "public"."service_pricing_options"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_vendor_id_users_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_pricing_option_id_service_pricing_options_id_fk" FOREIGN KEY ("pricing_option_id") REFERENCES "public"."service_pricing_options"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_vendor_id_users_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversation_id_chat_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."chat_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_reviews" ADD CONSTRAINT "customer_reviews_vendor_id_users_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_reviews" ADD CONSTRAINT "customer_reviews_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_reviews" ADD CONSTRAINT "customer_reviews_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrow_disputes" ADD CONSTRAINT "escrow_disputes_escrow_transaction_id_escrow_transactions_id_fk" FOREIGN KEY ("escrow_transaction_id") REFERENCES "public"."escrow_transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrow_disputes" ADD CONSTRAINT "escrow_disputes_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrow_disputes" ADD CONSTRAINT "escrow_disputes_raised_by_user_id_users_id_fk" FOREIGN KEY ("raised_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrow_disputes" ADD CONSTRAINT "escrow_disputes_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrow_transactions" ADD CONSTRAINT "escrow_transactions_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_tokens" ADD CONSTRAINT "oauth_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_vendor_id_users_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_pricing_option_id_service_pricing_options_id_fk" FOREIGN KEY ("pricing_option_id") REFERENCES "public"."service_pricing_options"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_log" ADD CONSTRAINT "points_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_log" ADD CONSTRAINT "points_log_referral_transaction_id_referral_transactions_id_fk" FOREIGN KEY ("referral_transaction_id") REFERENCES "public"."referral_transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_audit_log" ADD CONSTRAINT "pricing_audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_stats" ADD CONSTRAINT "referral_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_transactions" ADD CONSTRAINT "referral_transactions_to_user_id_users_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_transactions" ADD CONSTRAINT "referral_transactions_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_removal_requests" ADD CONSTRAINT "review_removal_requests_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_removal_requests" ADD CONSTRAINT "review_removal_requests_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_removal_requests" ADD CONSTRAINT "review_removal_requests_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_availability_settings" ADD CONSTRAINT "service_availability_settings_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_contacts" ADD CONSTRAINT "service_contacts_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_pricing_options" ADD CONSTRAINT "service_pricing_options_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_subcategory_id_subcategories_id_fk" FOREIGN KEY ("subcategory_id") REFERENCES "public"."subcategories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subcategories" ADD CONSTRAINT "subcategories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submitted_categories" ADD CONSTRAINT "submitted_categories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "temporary_categories" ADD CONSTRAINT "temporary_categories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tips" ADD CONSTRAINT "tips_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tips" ADD CONSTRAINT "tips_escrow_transaction_id_escrow_transactions_id_fk" FOREIGN KEY ("escrow_transaction_id") REFERENCES "public"."escrow_transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tips" ADD CONSTRAINT "tips_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tips" ADD CONSTRAINT "tips_vendor_id_users_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocker_id_users_id_fk" FOREIGN KEY ("blocker_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocked_user_id_users_id_fk" FOREIGN KEY ("blocked_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_moderation_actions" ADD CONSTRAINT "user_moderation_actions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_moderation_actions" ADD CONSTRAINT "user_moderation_actions_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_reported_user_id_users_id_fk" FOREIGN KEY ("reported_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_conversation_id_chat_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."chat_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_message_id_chat_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."chat_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_referred_by_users_id_fk" FOREIGN KEY ("referred_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_availability_settings" ADD CONSTRAINT "vendor_availability_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_calendar_blocks" ADD CONSTRAINT "vendor_calendar_blocks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_calendar_blocks" ADD CONSTRAINT "vendor_calendar_blocks_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute_ai_analysis" ADD CONSTRAINT "dispute_ai_analysis_dispute_id_escrow_disputes_id_fk" FOREIGN KEY ("dispute_id") REFERENCES "public"."escrow_disputes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute_ai_decisions" ADD CONSTRAINT "dispute_ai_decisions_dispute_id_escrow_disputes_id_fk" FOREIGN KEY ("dispute_id") REFERENCES "public"."escrow_disputes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute_ai_options" ADD CONSTRAINT "dispute_ai_options_dispute_id_escrow_disputes_id_fk" FOREIGN KEY ("dispute_id") REFERENCES "public"."escrow_disputes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute_ai_options" ADD CONSTRAINT "dispute_ai_options_analysis_id_dispute_ai_analysis_id_fk" FOREIGN KEY ("analysis_id") REFERENCES "public"."dispute_ai_analysis"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute_fee_charges" ADD CONSTRAINT "dispute_fee_charges_dispute_id_escrow_disputes_id_fk" FOREIGN KEY ("dispute_id") REFERENCES "public"."escrow_disputes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute_fee_charges" ADD CONSTRAINT "dispute_fee_charges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute_fee_charges" ADD CONSTRAINT "dispute_fee_charges_waived_by_users_id_fk" FOREIGN KEY ("waived_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute_phases" ADD CONSTRAINT "dispute_phases_dispute_id_escrow_disputes_id_fk" FOREIGN KEY ("dispute_id") REFERENCES "public"."escrow_disputes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute_reports" ADD CONSTRAINT "dispute_reports_dispute_id_escrow_disputes_id_fk" FOREIGN KEY ("dispute_id") REFERENCES "public"."escrow_disputes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute_responses" ADD CONSTRAINT "dispute_responses_dispute_id_escrow_disputes_id_fk" FOREIGN KEY ("dispute_id") REFERENCES "public"."escrow_disputes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute_responses" ADD CONSTRAINT "dispute_responses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute_responses" ADD CONSTRAINT "dispute_responses_selected_option_id_dispute_ai_options_id_fk" FOREIGN KEY ("selected_option_id") REFERENCES "public"."dispute_ai_options"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_debts" ADD CONSTRAINT "platform_debts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_debts" ADD CONSTRAINT "platform_debts_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_service_request_id_service_requests_id_fk" FOREIGN KEY ("service_request_id") REFERENCES "public"."service_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_vendor_id_users_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_service_requests" ADD CONSTRAINT "saved_service_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_service_requests" ADD CONSTRAINT "saved_service_requests_service_request_id_service_requests_id_fk" FOREIGN KEY ("service_request_id") REFERENCES "public"."service_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_payment_methods" ADD CONSTRAINT "vendor_payment_methods_vendor_id_users_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_stats" ADD CONSTRAINT "vendor_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_addresses_user" ON "addresses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_ai_conversations_user" ON "ai_conversations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_ai_conversations_type" ON "ai_conversations" USING btree ("conversation_type");--> statement-breakpoint
CREATE INDEX "idx_banned_type_value" ON "banned_identifiers" USING btree ("identifier_type","identifier_value");--> statement-breakpoint
CREATE INDEX "idx_banned_user" ON "banned_identifiers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_booking_sessions_user" ON "booking_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_booking_sessions_token" ON "booking_sessions" USING btree ("session_token");--> statement-breakpoint
CREATE INDEX "idx_booking_sessions_service" ON "booking_sessions" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "idx_booking_sessions_status" ON "booking_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_booking_sessions_expires" ON "booking_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_bookings_customer" ON "bookings" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_bookings_vendor" ON "bookings" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "idx_bookings_service" ON "bookings" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "idx_bookings_status" ON "bookings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_bookings_requested_time" ON "bookings" USING btree ("requested_start_time");--> statement-breakpoint
CREATE INDEX "idx_bookings_confirmed_time" ON "bookings" USING btree ("confirmed_start_time");--> statement-breakpoint
CREATE INDEX "idx_bookings_payment_method" ON "bookings" USING btree ("payment_method");--> statement-breakpoint
CREATE INDEX "idx_chat_conversations_customer" ON "chat_conversations" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_chat_conversations_vendor" ON "chat_conversations" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "idx_chat_conversations_booking" ON "chat_conversations" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "idx_chat_conversations_order" ON "chat_conversations" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_chat_conversations_last_message" ON "chat_conversations" USING btree ("last_message_at");--> statement-breakpoint
CREATE INDEX "idx_chat_messages_conversation" ON "chat_messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "idx_chat_messages_sender" ON "chat_messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "idx_chat_messages_created" ON "chat_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_customer_reviews_vendor" ON "customer_reviews" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "idx_customer_reviews_customer" ON "customer_reviews" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_customer_reviews_booking" ON "customer_reviews" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "idx_bug_reports_status" ON "e2e_bug_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_bug_reports_priority" ON "e2e_bug_reports" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_bug_reports_created" ON "e2e_bug_reports" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_bug_reports_test" ON "e2e_bug_reports" USING btree ("test_file","test_name");--> statement-breakpoint
CREATE INDEX "idx_escrow_disputes_escrow" ON "escrow_disputes" USING btree ("escrow_transaction_id");--> statement-breakpoint
CREATE INDEX "idx_escrow_disputes_booking" ON "escrow_disputes" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "idx_escrow_disputes_status" ON "escrow_disputes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_escrow_disputes_raised_by" ON "escrow_disputes" USING btree ("raised_by_user_id");--> statement-breakpoint
CREATE INDEX "idx_escrow_booking" ON "escrow_transactions" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "idx_escrow_status" ON "escrow_transactions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_escrow_payment_method" ON "escrow_transactions" USING btree ("payment_method");--> statement-breakpoint
CREATE INDEX "idx_escrow_auto_release" ON "escrow_transactions" USING btree ("auto_release_at");--> statement-breakpoint
CREATE INDEX "idx_favorites_user" ON "favorites" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_favorites_service" ON "favorites" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_user" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_user_unread" ON "notifications" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE INDEX "idx_notifications_type" ON "notifications" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_notifications_created" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_notifications_priority" ON "notifications" USING btree ("user_id","priority");--> statement-breakpoint
CREATE INDEX "idx_oauth_tokens_user" ON "oauth_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_oauth_tokens_provider" ON "oauth_tokens" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "idx_orders_customer" ON "orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_orders_vendor" ON "orders" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "idx_orders_service" ON "orders" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "idx_orders_status" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_orders_payment_status" ON "orders" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX "idx_orders_created" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_points_log_user" ON "points_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_points_log_action" ON "points_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_points_log_created" ON "points_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_pricing_audit_user" ON "pricing_audit_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_pricing_audit_entity" ON "pricing_audit_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_pricing_audit_created" ON "pricing_audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_push_subscriptions_user" ON "push_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_push_subscriptions_active" ON "push_subscriptions" USING btree ("user_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_push_subscriptions_endpoint" ON "push_subscriptions" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "idx_referral_stats_user" ON "referral_stats" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_referral_stats_rank" ON "referral_stats" USING btree ("referral_rank");--> statement-breakpoint
CREATE INDEX "idx_referral_tx_to_user" ON "referral_transactions" USING btree ("to_user_id");--> statement-breakpoint
CREATE INDEX "idx_referral_tx_from_user" ON "referral_transactions" USING btree ("from_user_id");--> statement-breakpoint
CREATE INDEX "idx_referral_tx_level" ON "referral_transactions" USING btree ("level");--> statement-breakpoint
CREATE INDEX "idx_referral_tx_status" ON "referral_transactions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_referral_tx_trigger" ON "referral_transactions" USING btree ("trigger_type");--> statement-breakpoint
CREATE INDEX "idx_referral_tx_created" ON "referral_transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_removal_requests_review" ON "review_removal_requests" USING btree ("review_id");--> statement-breakpoint
CREATE INDEX "idx_removal_requests_requester" ON "review_removal_requests" USING btree ("requester_id");--> statement-breakpoint
CREATE INDEX "idx_removal_requests_status" ON "review_removal_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_reviews_service" ON "reviews" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "idx_reviews_user" ON "reviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_reviews_booking" ON "reviews" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "idx_service_availability_service" ON "service_availability_settings" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "idx_service_contacts_service" ON "service_contacts" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "idx_pricing_options_service" ON "service_pricing_options" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "idx_pricing_options_active" ON "service_pricing_options" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_services_owner" ON "services" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_services_category" ON "services" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_services_status" ON "services" USING btree ("status");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
CREATE INDEX "idx_subcategories_category" ON "subcategories" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_tips_booking" ON "tips" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "idx_tips_customer" ON "tips" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_tips_vendor" ON "tips" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "idx_tips_status" ON "tips" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_user_blocks_blocker" ON "user_blocks" USING btree ("blocker_id");--> statement-breakpoint
CREATE INDEX "idx_user_blocks_blocked" ON "user_blocks" USING btree ("blocked_user_id");--> statement-breakpoint
CREATE INDEX "idx_moderation_user" ON "user_moderation_actions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_moderation_admin" ON "user_moderation_actions" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "idx_moderation_action" ON "user_moderation_actions" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_user_reports_reporter" ON "user_reports" USING btree ("reporter_id");--> statement-breakpoint
CREATE INDEX "idx_user_reports_reported" ON "user_reports" USING btree ("reported_user_id");--> statement-breakpoint
CREATE INDEX "idx_user_reports_conversation" ON "user_reports" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "idx_user_reports_status" ON "user_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_user_reports_severity" ON "user_reports" USING btree ("ai_severity");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_auth_provider" ON "users" USING btree ("auth_provider");--> statement-breakpoint
CREATE INDEX "idx_users_referral_code" ON "users" USING btree ("referral_code");--> statement-breakpoint
CREATE INDEX "idx_users_referred_by" ON "users" USING btree ("referred_by");--> statement-breakpoint
CREATE INDEX "idx_vendor_availability_user" ON "vendor_availability_settings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_calendar_blocks_user" ON "vendor_calendar_blocks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_calendar_blocks_time" ON "vendor_calendar_blocks" USING btree ("start_time","end_time");--> statement-breakpoint
CREATE INDEX "idx_calendar_blocks_service" ON "vendor_calendar_blocks" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "dispute_ai_analysis_dispute_idx" ON "dispute_ai_analysis" USING btree ("dispute_id");--> statement-breakpoint
CREATE INDEX "dispute_ai_decisions_dispute_idx" ON "dispute_ai_decisions" USING btree ("dispute_id");--> statement-breakpoint
CREATE INDEX "dispute_ai_options_dispute_idx" ON "dispute_ai_options" USING btree ("dispute_id");--> statement-breakpoint
CREATE INDEX "dispute_fee_charges_dispute_idx" ON "dispute_fee_charges" USING btree ("dispute_id");--> statement-breakpoint
CREATE INDEX "dispute_fee_charges_user_idx" ON "dispute_fee_charges" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "dispute_phases_dispute_idx" ON "dispute_phases" USING btree ("dispute_id");--> statement-breakpoint
CREATE INDEX "dispute_phases_phase_idx" ON "dispute_phases" USING btree ("current_phase");--> statement-breakpoint
CREATE INDEX "dispute_reports_dispute_idx" ON "dispute_reports" USING btree ("dispute_id");--> statement-breakpoint
CREATE INDEX "dispute_responses_dispute_idx" ON "dispute_responses" USING btree ("dispute_id");--> statement-breakpoint
CREATE INDEX "dispute_responses_user_idx" ON "dispute_responses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "platform_debts_user_idx" ON "platform_debts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "platform_debts_status_idx" ON "platform_debts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "proposals_request_idx" ON "proposals" USING btree ("service_request_id");--> statement-breakpoint
CREATE INDEX "proposals_vendor_idx" ON "proposals" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "proposals_status_idx" ON "proposals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "proposals_expires_idx" ON "proposals" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "saved_service_requests_user_idx" ON "saved_service_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "saved_service_requests_request_idx" ON "saved_service_requests" USING btree ("service_request_id");--> statement-breakpoint
CREATE INDEX "service_requests_customer_idx" ON "service_requests" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "service_requests_status_idx" ON "service_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "service_requests_moderation_idx" ON "service_requests" USING btree ("moderation_status");--> statement-breakpoint
CREATE INDEX "service_requests_category_idx" ON "service_requests" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "service_requests_location_idx" ON "service_requests" USING btree ("location_canton","location_postal_code");--> statement-breakpoint
CREATE INDEX "vendor_payment_methods_vendor_idx" ON "vendor_payment_methods" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "credit_transactions_user_idx" ON "credit_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "credit_transactions_type_idx" ON "credit_transactions" USING btree ("transaction_type");--> statement-breakpoint
CREATE INDEX "credit_transactions_created_idx" ON "credit_transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "vendor_stats_user_idx" ON "vendor_stats" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "vendor_stats_tier_idx" ON "vendor_stats" USING btree ("performance_tier");--> statement-breakpoint
CREATE INDEX "vendor_stats_earnings_idx" ON "vendor_stats" USING btree ("lifetime_earnings");--> statement-breakpoint
CREATE INDEX "vendor_stats_rating_idx" ON "vendor_stats" USING btree ("average_rating");