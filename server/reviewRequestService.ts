/**
 * Review Request Service
 * 
 * Handles automatic review request notifications:
 * - Send review requests after booking completion
 * - Track review request status
 * - Manual review requests by vendors (max 2, 3-day cooldown)
 */

import { db } from './db';
import { bookings, users, services, customerReviews } from '../shared/schema';
import { eq, and, lt, isNull, ne, gt, sql } from 'drizzle-orm';
import { createNotification } from './notificationService';

// Constants
const MAX_VENDOR_REVIEW_REQUESTS = 2;
const REVIEW_REQUEST_COOLDOWN_DAYS = 3;

/**
 * Send pending review requests for completed bookings
 * Finds bookings completed 24+ hours ago without review request sent
 * @returns Number of review requests sent
 */
export async function sendPendingReviewRequests(): Promise<number> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  // Find completed bookings from 24+ hours ago without review request sent
  const eligibleBookings = await db.select()
    .from(bookings)
    .where(
      and(
        eq(bookings.status, 'completed'),
        lt(bookings.completedAt, twentyFourHoursAgo),
        isNull(bookings.reviewRequestSentAt)
      )
    )
    .limit(50);

  let sent = 0;
  for (const booking of eligibleBookings) {
    try {
      await createNotification({
        userId: booking.customerId,
        type: 'review',
        title: 'How was your experience?',
        message: 'Please take a moment to leave a review for the service you received.',
        actionUrl: `/bookings?booking=${booking.id}&review=true`,
        relatedEntityId: booking.id,
        relatedEntityType: 'booking',
      });

      await db.update(bookings)
        .set({ reviewRequestSentAt: new Date() })
        .where(eq(bookings.id, booking.id));

      sent++;
    } catch (error) {
      console.error(`Failed to send review request for booking ${booking.id}:`, error);
    }
  }

  return sent;
}

/**
 * Check if vendor can request a review for a booking
 */
export async function canVendorRequestReview(
  vendorId: string,
  bookingId: string
): Promise<{ 
  canRequest: boolean; 
  reason?: string;
  remainingRequests?: number;
  cooldownEndsAt?: Date;
}> {
  // Get booking with service details
  const [booking] = await db
    .select({
      booking: bookings,
      service: services,
    })
    .from(bookings)
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!booking) {
    return { canRequest: false, reason: "Booking not found" };
  }

  // Check if vendor owns this booking
  if (booking.booking.vendorId !== vendorId) {
    return { canRequest: false, reason: "You can only request reviews for your own bookings" };
  }

  // Check if booking is completed
  if (booking.booking.status !== 'completed') {
    return { canRequest: false, reason: "Can only request reviews for completed bookings" };
  }

  // Check if a review already exists
  const [existingReview] = await db
    .select()
    .from(customerReviews)
    .where(eq(customerReviews.bookingId, bookingId))
    .limit(1);

  if (existingReview) {
    return { canRequest: false, reason: "Customer has already left a review for this booking" };
  }

  // Check request count
  const requestCount = booking.booking.vendorReviewRequestCount || 0;
  if (requestCount >= MAX_VENDOR_REVIEW_REQUESTS) {
    return { 
      canRequest: false, 
      reason: `Maximum of ${MAX_VENDOR_REVIEW_REQUESTS} review requests per booking reached`,
      remainingRequests: 0
    };
  }

  // Check cooldown period
  const lastRequestAt = booking.booking.lastVendorReviewRequestAt;
  if (lastRequestAt) {
    const cooldownEnds = new Date(lastRequestAt.getTime() + REVIEW_REQUEST_COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
    if (new Date() < cooldownEnds) {
      return { 
        canRequest: false, 
        reason: `Please wait ${REVIEW_REQUEST_COOLDOWN_DAYS} days between review requests`,
        remainingRequests: MAX_VENDOR_REVIEW_REQUESTS - requestCount,
        cooldownEndsAt: cooldownEnds
      };
    }
  }

  return { 
    canRequest: true,
    remainingRequests: MAX_VENDOR_REVIEW_REQUESTS - requestCount
  };
}

/**
 * Send a review request from vendor to customer
 */
export async function sendVendorReviewRequest(
  vendorId: string,
  bookingId: string,
  customMessage?: string
): Promise<{ success: boolean; remainingRequests: number }> {
  // First check if request is allowed
  const check = await canVendorRequestReview(vendorId, bookingId);
  if (!check.canRequest) {
    throw new Error(check.reason);
  }

  // Get booking and vendor details
  const [bookingData] = await db
    .select({
      booking: bookings,
      vendor: users,
      service: services,
    })
    .from(bookings)
    .innerJoin(users, eq(bookings.vendorId, users.id))
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!bookingData) {
    throw new Error("Booking not found");
  }

  const currentCount = bookingData.booking.vendorReviewRequestCount || 0;

  // Update booking with new request count and timestamp
  await db
    .update(bookings)
    .set({
      vendorReviewRequestCount: currentCount + 1,
      lastVendorReviewRequestAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, bookingId));

  // Create notification for customer
  const vendorName = bookingData.vendor.firstName 
    ? `${bookingData.vendor.firstName}` 
    : 'The vendor';
  
  const message = customMessage 
    ? `${vendorName} kindly requests your feedback: "${customMessage}"`
    : `${vendorName} would appreciate your feedback on "${bookingData.service.title}"`;

  await createNotification({
    userId: bookingData.booking.customerId,
    type: 'review',
    title: 'Review Request',
    message,
    actionUrl: `/my-bookings?booking=${bookingId}&review=true`,
    relatedEntityId: bookingId,
    relatedEntityType: 'booking',
    metadata: {
      type: 'vendor_review_request',
      vendorId,
      serviceTitle: bookingData.service.title,
      customMessage,
    },
  });

  console.log(`[ReviewRequest] Vendor ${vendorId} requested review for booking ${bookingId} (${currentCount + 1}/${MAX_VENDOR_REVIEW_REQUESTS})`);

  return { 
    success: true, 
    remainingRequests: MAX_VENDOR_REVIEW_REQUESTS - (currentCount + 1)
  };
}

/**
 * Get bookings pending review for a vendor (completed without review)
 */
export async function getVendorPendingReviewBookings(
  vendorId: string
): Promise<Array<{
  booking: typeof bookings.$inferSelect;
  customer: { id: string; firstName: string | null; lastName: string | null; profileImageUrl: string | null };
  service: { id: string; title: string; images: string[] | null };
  canRequestReview: boolean;
  requestCount: number;
  cooldownEndsAt: Date | null;
}>> {
  // Get completed bookings without reviews
  const completedBookings = await db
    .select({
      booking: bookings,
      customer: users,
      service: services,
    })
    .from(bookings)
    .innerJoin(users, eq(bookings.customerId, users.id))
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .where(
      and(
        eq(bookings.vendorId, vendorId),
        eq(bookings.status, 'completed')
      )
    )
    .orderBy(sql`${bookings.completedAt} DESC`);

  // Filter out bookings that already have reviews
  const results = [];
  for (const row of completedBookings) {
    const [existingReview] = await db
      .select()
      .from(customerReviews)
      .where(eq(customerReviews.bookingId, row.booking.id))
      .limit(1);

    if (!existingReview) {
      // Check if vendor can request review
      const requestCount = row.booking.vendorReviewRequestCount || 0;
      const lastRequestAt = row.booking.lastVendorReviewRequestAt;
      
      let canRequestReview = requestCount < MAX_VENDOR_REVIEW_REQUESTS;
      let cooldownEndsAt: Date | null = null;

      if (lastRequestAt && canRequestReview) {
        cooldownEndsAt = new Date(lastRequestAt.getTime() + REVIEW_REQUEST_COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
        if (new Date() < cooldownEndsAt) {
          canRequestReview = false;
        } else {
          cooldownEndsAt = null;
        }
      }

      results.push({
        booking: row.booking,
        customer: {
          id: row.customer.id,
          firstName: row.customer.firstName,
          lastName: row.customer.lastName,
          profileImageUrl: row.customer.profileImageUrl,
        },
        service: {
          id: row.service.id,
          title: row.service.title,
          images: row.service.images,
        },
        canRequestReview,
        requestCount,
        cooldownEndsAt,
      });
    }
  }

  return results;
}
