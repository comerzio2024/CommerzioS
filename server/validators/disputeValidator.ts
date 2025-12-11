/**
 * Dispute Validators
 * 
 * Zod schemas for validating dispute-related API inputs
 * to ensure data integrity and prevent injection attacks.
 */

import { z } from "zod";

// ============================================
// DISPUTE REASONS ENUM
// ============================================

export const disputeReasonSchema = z.enum([
  "service_not_provided",
  "poor_quality",
  "wrong_service",
  "overcharged",
  "no_show",
  "other"
]);

// ============================================
// OPEN DISPUTE
// ============================================

export const openDisputeSchema = z.object({
  bookingId: z.string().uuid("Invalid booking ID format"),
  reason: disputeReasonSchema,
  description: z.string()
    .min(20, "Description must be at least 20 characters")
    .max(5000, "Description cannot exceed 5000 characters")
    .transform(val => val.trim())
    // Sanitize: remove potential HTML/script tags
    .transform(val => val.replace(/<[^>]*>/g, '')),
  evidenceUrls: z.array(z.string().url()).optional().default([]),
});

export type OpenDisputeInput = z.infer<typeof openDisputeSchema>;

// ============================================
// COUNTER OFFER
// ============================================

export const counterOfferSchema = z.object({
  refundPercentage: z.number()
    .min(0, "Refund percentage must be at least 0")
    .max(100, "Refund percentage cannot exceed 100")
    .int("Refund percentage must be a whole number"),
  message: z.string()
    .max(2000, "Message cannot exceed 2000 characters")
    .optional()
    .transform(val => val?.trim().replace(/<[^>]*>/g, '')),
});

export type CounterOfferInput = z.infer<typeof counterOfferSchema>;

// ============================================
// ACCEPT OFFER
// ============================================

export const acceptOfferSchema = z.object({
  responseId: z.string().uuid("Invalid response ID format"),
});

export type AcceptOfferInput = z.infer<typeof acceptOfferSchema>;

// ============================================
// SELECT AI OPTION
// ============================================

export const selectOptionSchema = z.object({
  optionId: z.string().uuid("Invalid option ID format"),
});

export type SelectOptionInput = z.infer<typeof selectOptionSchema>;

// ============================================
// EVIDENCE UPLOAD
// ============================================

export const evidenceUploadSchema = z.object({
  evidenceUrls: z.array(
    z.string().url("Invalid URL format")
      // Only allow trusted domains
      .refine(
        url => {
          const allowedDomains = [
            'cloudinary.com',
            'res.cloudinary.com',
            's3.amazonaws.com',
            'storage.googleapis.com'
          ];
          try {
            const parsed = new URL(url);
            return allowedDomains.some(domain => parsed.hostname.endsWith(domain));
          } catch {
            return false;
          }
        },
        { message: "Evidence URLs must be from allowed storage providers" }
      )
  ).min(1, "At least one evidence URL is required"),
});

export type EvidenceUploadInput = z.infer<typeof evidenceUploadSchema>;

// ============================================
// ADMIN SEED DISPUTES (Dev only)
// ============================================

export const seedDisputesSchema = z.object({
  email: z.string().email("Invalid email format"),
  count: z.number().int().min(1).max(20).optional().default(10),
});

export type SeedDisputesInput = z.infer<typeof seedDisputesSchema>;

// ============================================
// VALIDATION HELPER
// ============================================

/**
 * Validate input against a Zod schema
 * Returns { success: true, data } or { success: false, error }
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  input: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(input);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  // Get first error message
  const firstError = result.error.errors[0];
  const path = firstError.path.join('.');
  const message = path ? `${path}: ${firstError.message}` : firstError.message;
  
  return { success: false, error: message };
}
