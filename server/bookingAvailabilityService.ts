/**
 * Booking Availability Service
 * 
 * Extends the existing booking service with scheduling type awareness:
 * - TIME_BOUND: Calendar-based with concurrent capacity support
 * - CAPACITY_BOUND: Order-based with max concurrent orders
 * 
 * Implements the algorithm:
 * Slot Available = (Active_Bookings < concurrent_capacity) AND (Slot_Not_Blocked)
 */

import { db } from "./db";
import { services, bookings, blockedSlots } from "@shared/schema";
import { eq, and, or, sql, lte, gte, ne, between, count } from "drizzle-orm";

// Types
export type SchedulingType = "TIME_BOUND" | "CAPACITY_BOUND";

export interface AvailabilityCheckResult {
    available: boolean;
    reason?: string;
    currentBookings?: number;
    maxCapacity?: number;
    remainingSlots?: number;
}

export interface ServiceAvailabilityInfo {
    schedulingType: SchedulingType;
    concurrentCapacity: number;
    maxConcurrentOrders: number;
    instantBookingEnabled: boolean;
    turnaroundTimeHours: number | null;
    minLeadTimeHours: number;
}

// ===========================================
// SERVICE SCHEDULING INFO
// ===========================================

/**
 * Get scheduling information for a service
 */
export async function getServiceSchedulingInfo(
    serviceId: string
): Promise<ServiceAvailabilityInfo | null> {
    const [service] = await db
        .select({
            schedulingType: services.schedulingType,
            concurrentCapacity: services.concurrentCapacity,
            maxConcurrentOrders: services.maxConcurrentOrders,
            instantBookingEnabled: services.instantBookingEnabled,
            turnaroundTimeHours: services.turnaroundTimeHours,
            minLeadTimeHours: services.minLeadTimeHours,
        })
        .from(services)
        .where(eq(services.id, serviceId))
        .limit(1);

    if (!service) return null;

    return {
        schedulingType: service.schedulingType as SchedulingType,
        concurrentCapacity: service.concurrentCapacity,
        maxConcurrentOrders: service.maxConcurrentOrders,
        instantBookingEnabled: service.instantBookingEnabled,
        turnaroundTimeHours: service.turnaroundTimeHours,
        minLeadTimeHours: service.minLeadTimeHours,
    };
}

// ===========================================
// TIME_BOUND AVAILABILITY
// ===========================================

/**
 * Check TIME_BOUND service availability for a specific time slot
 * Implements concurrent capacity logic
 */
export async function checkTimeBoundAvailability(
    serviceId: string,
    vendorId: string,
    startTime: Date,
    endTime: Date,
    excludeBookingId?: string
): Promise<AvailabilityCheckResult> {
    // Get service scheduling info
    const schedInfo = await getServiceSchedulingInfo(serviceId);
    if (!schedInfo) {
        return { available: false, reason: "Service not found" };
    }

    if (schedInfo.schedulingType !== "TIME_BOUND") {
        return { available: false, reason: "Service is not time-bound" };
    }

    // Check minimum lead time
    const now = new Date();
    const hoursUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntilStart < schedInfo.minLeadTimeHours) {
        return {
            available: false,
            reason: `Bookings require at least ${schedInfo.minLeadTimeHours} hours notice`,
        };
    }

    // Check for manual blocks (blockedSlots table)
    const manualBlocks = await db
        .select()
        .from(blockedSlots)
        .where(
            and(
                eq(blockedSlots.vendorId, vendorId),
                or(
                    eq(blockedSlots.allServices, true),
                    eq(blockedSlots.serviceId, serviceId)
                ),
                // Block overlaps with requested time
                lte(blockedSlots.startTime, endTime),
                gte(blockedSlots.endTime, startTime)
            )
        );

    if (manualBlocks.length > 0) {
        const block = manualBlocks[0];
        return {
            available: false,
            reason: block.note || `Time blocked: ${block.reason}`,
        };
    }

    // Count overlapping bookings for this service
    const overlappingBookings = await db
        .select({ count: count() })
        .from(bookings)
        .where(
            and(
                eq(bookings.serviceId, serviceId),
                // Only count active bookings
                sql`${bookings.status} IN ('pending', 'accepted', 'confirmed', 'in_progress')`,
                // Time overlap check: new booking overlaps with existing
                or(
                    // Existing booking contains start of new
                    and(
                        lte(bookings.confirmedStartTime ?? bookings.requestedStartTime, startTime),
                        gte(bookings.confirmedEndTime ?? bookings.requestedEndTime, startTime)
                    ),
                    // Existing booking contains end of new
                    and(
                        lte(bookings.confirmedStartTime ?? bookings.requestedStartTime, endTime),
                        gte(bookings.confirmedEndTime ?? bookings.requestedEndTime, endTime)
                    ),
                    // New booking contains existing
                    and(
                        gte(bookings.confirmedStartTime ?? bookings.requestedStartTime, startTime),
                        lte(bookings.confirmedEndTime ?? bookings.requestedEndTime, endTime)
                    )
                ),
                // Exclude current booking if updating
                excludeBookingId ? ne(bookings.id, excludeBookingId) : sql`1=1`
            )
        );

    const currentBookings = Number(overlappingBookings[0]?.count ?? 0);
    const maxCapacity = schedInfo.concurrentCapacity;
    const remainingSlots = maxCapacity - currentBookings;

    if (currentBookings >= maxCapacity) {
        return {
            available: false,
            reason: remainingSlots <= 0
                ? "This time slot is fully booked"
                : `Only ${remainingSlots} slot(s) remaining`,
            currentBookings,
            maxCapacity,
            remainingSlots: 0,
        };
    }

    return {
        available: true,
        currentBookings,
        maxCapacity,
        remainingSlots,
    };
}

// ===========================================
// CAPACITY_BOUND AVAILABILITY
// ===========================================

/**
 * Check CAPACITY_BOUND service availability
 * Based on concurrent order count, not calendar
 */
export async function checkCapacityBoundAvailability(
    serviceId: string
): Promise<AvailabilityCheckResult> {
    // Get service scheduling info
    const schedInfo = await getServiceSchedulingInfo(serviceId);
    if (!schedInfo) {
        return { available: false, reason: "Service not found" };
    }

    if (schedInfo.schedulingType !== "CAPACITY_BOUND") {
        return { available: false, reason: "Service is not capacity-bound" };
    }

    // Count active orders for this service
    const activeOrders = await db
        .select({ count: count() })
        .from(bookings)
        .where(
            and(
                eq(bookings.serviceId, serviceId),
                // Only count in-progress orders (not completed/cancelled)
                sql`${bookings.status} IN ('pending', 'accepted', 'confirmed', 'in_progress')`
            )
        );

    const currentOrders = Number(activeOrders[0]?.count ?? 0);
    const maxOrders = schedInfo.maxConcurrentOrders;
    const remainingSlots = maxOrders - currentOrders;

    if (currentOrders >= maxOrders) {
        return {
            available: false,
            reason: "Vendor has reached maximum concurrent orders. Please check back later.",
            currentBookings: currentOrders,
            maxCapacity: maxOrders,
            remainingSlots: 0,
        };
    }

    return {
        available: true,
        currentBookings: currentOrders,
        maxCapacity: maxOrders,
        remainingSlots,
    };
}

// ===========================================
// UNIFIED AVAILABILITY CHECK
// ===========================================

/**
 * Check service availability based on scheduling type
 * Automatically routes to correct availability check
 */
export async function checkServiceAvailability(
    serviceId: string,
    vendorId: string,
    startTime?: Date,
    endTime?: Date,
    excludeBookingId?: string
): Promise<AvailabilityCheckResult> {
    const schedInfo = await getServiceSchedulingInfo(serviceId);
    if (!schedInfo) {
        return { available: false, reason: "Service not found" };
    }

    if (schedInfo.schedulingType === "TIME_BOUND") {
        if (!startTime || !endTime) {
            return { available: false, reason: "Start and end time required for time-bound services" };
        }
        return checkTimeBoundAvailability(serviceId, vendorId, startTime, endTime, excludeBookingId);
    } else {
        // CAPACITY_BOUND - doesn't need time
        return checkCapacityBoundAvailability(serviceId);
    }
}

// ===========================================
// SCARCITY NOTIFICATIONS
// ===========================================

/**
 * Check if scarcity notification should be triggered
 * Triggered when only 1 slot remaining
 */
export async function shouldTriggerScarcityNotification(
    serviceId: string,
    startTime?: Date,
    endTime?: Date
): Promise<{ trigger: boolean; slotsRemaining: number }> {
    const schedInfo = await getServiceSchedulingInfo(serviceId);
    if (!schedInfo) {
        return { trigger: false, slotsRemaining: 0 };
    }

    let result: AvailabilityCheckResult;

    // Get service vendor
    const [service] = await db
        .select({ ownerId: services.ownerId })
        .from(services)
        .where(eq(services.id, serviceId))
        .limit(1);

    if (!service) {
        return { trigger: false, slotsRemaining: 0 };
    }

    if (schedInfo.schedulingType === "TIME_BOUND" && startTime && endTime) {
        result = await checkTimeBoundAvailability(serviceId, service.ownerId, startTime, endTime);
    } else {
        result = await checkCapacityBoundAvailability(serviceId);
    }

    return {
        trigger: result.remainingSlots === 1,
        slotsRemaining: result.remainingSlots ?? 0,
    };
}

// ===========================================
// WAITLIST UTILITIES
// ===========================================

/**
 * Check if a service has a waitlist (at capacity)
 */
export async function isServiceAtCapacity(serviceId: string): Promise<boolean> {
    const result = await checkCapacityBoundAvailability(serviceId);
    return !result.available;
}

/**
 * Get queue position for capacity-bound services
 * Returns the number of orders ahead of this one
 */
export async function getQueuePositionForCapacityService(
    serviceId: string,
    bookingId: string
): Promise<number> {
    // Get all in-progress bookings ordered by creation date
    const queuedBookings = await db
        .select({ id: bookings.id, createdAt: bookings.createdAt })
        .from(bookings)
        .where(
            and(
                eq(bookings.serviceId, serviceId),
                sql`${bookings.status} IN ('pending', 'accepted', 'confirmed')`
            )
        )
        .orderBy(bookings.createdAt);

    const position = queuedBookings.findIndex(b => b.id === bookingId);
    return position >= 0 ? position : queuedBookings.length;
}

/**
 * Get estimated turnaround for capacity-bound service
 */
export async function getEstimatedTurnaround(
    serviceId: string
): Promise<{ hours: number | null; ordersBefore: number }> {
    const schedInfo = await getServiceSchedulingInfo(serviceId);
    if (!schedInfo || schedInfo.schedulingType !== "CAPACITY_BOUND") {
        return { hours: null, ordersBefore: 0 };
    }

    const activeOrders = await db
        .select({ count: count() })
        .from(bookings)
        .where(
            and(
                eq(bookings.serviceId, serviceId),
                sql`${bookings.status} IN ('pending', 'accepted', 'confirmed', 'in_progress')`
            )
        );

    const ordersBefore = Number(activeOrders[0]?.count ?? 0);
    const baseHours = schedInfo.turnaroundTimeHours ?? 24;

    // Estimate based on concurrent capacity and turnaround time
    const batchesRequired = Math.ceil(ordersBefore / schedInfo.maxConcurrentOrders);
    const estimatedHours = batchesRequired * baseHours;

    return { hours: estimatedHours, ordersBefore };
}
