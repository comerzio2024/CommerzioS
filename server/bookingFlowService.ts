/**
 * Booking Flow Service
 * 
 * Determines the booking tier based on:
 * - Tier 1 (Instant): All items priced + slot available + instant booking enabled
 * - Tier 2 (Request): All items priced but needs vendor review
 * - Tier 3 (Inquiry): Has "inquire" priced items → triggers Proposal Builder
 * 
 * Also handles vendor risk model logic (Growth vs Secure)
 */

import { db } from "./db";
import { services, users, priceInquiries } from "@shared/schema";
import { eq } from "drizzle-orm";
import { checkServiceAvailability, getServiceSchedulingInfo } from "./bookingAvailabilityService";

// Types
export type BookingTier = "INSTANT" | "REQUEST" | "INQUIRY";
export type VendorRiskModel = "growth" | "secure";
export type PricingMode = "fixed" | "hourly" | "inquire";

export interface PriceListItem {
    description: string;
    price: string;
    unit?: string;
    billingType?: "once" | "per_duration";
    pricingMode?: PricingMode;
    estimatedMinutes?: number;
}

export interface BookingFlowResult {
    tier: BookingTier;
    canProceed: boolean;
    reason?: string;

    // Payment info
    riskModel: VendorRiskModel;
    depositPercentage: number; // 10% for growth, 100% for secure
    depositAmount?: number;
    totalAmount?: number;

    // For inquiry tier
    inquireItems?: string[];

    // Availability info
    isAvailable?: boolean;
    remainingSlots?: number;

    // Flow requirements
    requiresVendorApproval: boolean;
    instantBookingEnabled: boolean;
}

export interface DetermineFlowParams {
    serviceId: string;
    selectedItems: PriceListItem[];
    startTime?: Date;
    endTime?: Date;
    estimatedHours?: number;
}

// ===========================================
// BOOKING TIER DETERMINATION
// ===========================================

/**
 * Analyze selected items to determine if any require inquiry
 */
function analyzeSelectedItems(items: PriceListItem[]): {
    hasInquireItems: boolean;
    inquireItems: string[];
    allPriced: boolean;
    totalFixedPrice: number;
    hourlyItems: PriceListItem[];
} {
    const inquireItems: string[] = [];
    const hourlyItems: PriceListItem[] = [];
    let totalFixedPrice = 0;

    for (const item of items) {
        const mode = item.pricingMode || "fixed";

        if (mode === "inquire") {
            inquireItems.push(item.description);
        } else if (mode === "hourly") {
            hourlyItems.push(item);
        } else {
            // Fixed price
            const price = parseFloat(item.price) || 0;
            totalFixedPrice += price;
        }
    }

    return {
        hasInquireItems: inquireItems.length > 0,
        inquireItems,
        allPriced: inquireItems.length === 0,
        totalFixedPrice,
        hourlyItems,
    };
}

/**
 * Calculate total price for a booking
 */
function calculateTotalPrice(
    items: PriceListItem[],
    estimatedHours?: number
): number {
    let total = 0;

    for (const item of items) {
        const mode = item.pricingMode || "fixed";
        const price = parseFloat(item.price) || 0;

        if (mode === "fixed" || mode === "hourly") {
            if (item.billingType === "per_duration" && estimatedHours) {
                total += price * estimatedHours;
            } else {
                total += price;
            }
        }
        // "inquire" items don't contribute to the total - they trigger inquiry flow
    }

    return total;
}

/**
 * Determine booking tier and flow requirements for a service
 */
export async function determineBookingFlow(
    params: DetermineFlowParams
): Promise<BookingFlowResult> {
    const { serviceId, selectedItems, startTime, endTime, estimatedHours } = params;

    // Get service details
    const [service] = await db
        .select({
            ownerId: services.ownerId,
            vendorRiskModel: services.vendorRiskModel,
            instantBookingEnabled: services.instantBookingEnabled,
            schedulingType: services.schedulingType,
        })
        .from(services)
        .where(eq(services.id, serviceId))
        .limit(1);

    if (!service) {
        return {
            tier: "REQUEST",
            canProceed: false,
            reason: "Service not found",
            riskModel: "growth",
            depositPercentage: 10,
            requiresVendorApproval: true,
            instantBookingEnabled: false,
        };
    }

    // Get vendor approval settings
    const [vendor] = await db
        .select({ requireBookingApproval: users.requireBookingApproval })
        .from(users)
        .where(eq(users.id, service.ownerId))
        .limit(1);

    const riskModel = (service.vendorRiskModel as VendorRiskModel) || "growth";
    const depositPercentage = riskModel === "secure" ? 100 : 10;
    const requiresVendorApproval = vendor?.requireBookingApproval ?? false;

    // Analyze selected items
    const itemAnalysis = analyzeSelectedItems(selectedItems);

    // TIER 3: Has inquire items → Inquiry Flow
    if (itemAnalysis.hasInquireItems) {
        return {
            tier: "INQUIRY",
            canProceed: true,
            riskModel,
            depositPercentage,
            inquireItems: itemAnalysis.inquireItems,
            requiresVendorApproval: true, // Always requires vendor for inquiry
            instantBookingEnabled: false,
        };
    }

    // Calculate total price
    const totalAmount = calculateTotalPrice(selectedItems, estimatedHours);
    const depositAmount = Math.ceil(totalAmount * (depositPercentage / 100));

    // Check availability for TIME_BOUND services
    let isAvailable = true;
    let remainingSlots: number | undefined;
    let availabilityReason: string | undefined;

    if (startTime && endTime) {
        const availability = await checkServiceAvailability(
            serviceId,
            service.ownerId,
            startTime,
            endTime
        );
        isAvailable = availability.available;
        remainingSlots = availability.remainingSlots;
        availabilityReason = availability.reason;
    }

    // TIER 2: Needs vendor review
    // - Calendar not available
    // - Vendor requires approval
    // - Instant booking disabled
    if (!isAvailable || requiresVendorApproval || !service.instantBookingEnabled) {
        return {
            tier: "REQUEST",
            canProceed: !requiresVendorApproval || isAvailable, // Can proceed if just approval needed
            reason: !isAvailable
                ? availabilityReason
                : requiresVendorApproval
                    ? "Vendor requires approval for all bookings"
                    : "Instant booking not enabled for this service",
            riskModel,
            depositPercentage,
            depositAmount,
            totalAmount,
            isAvailable,
            remainingSlots,
            requiresVendorApproval,
            instantBookingEnabled: service.instantBookingEnabled,
        };
    }

    // TIER 1: Instant Booking
    return {
        tier: "INSTANT",
        canProceed: true,
        riskModel,
        depositPercentage,
        depositAmount,
        totalAmount,
        isAvailable: true,
        remainingSlots,
        requiresVendorApproval: false,
        instantBookingEnabled: true,
    };
}

// ===========================================
// VENDOR RISK MODEL HELPERS
// ===========================================

/**
 * Get deposit amount based on vendor risk model
 * Growth Model: 10% deposit (platform keeps as commission)
 * Secure Model: 100% upfront (escrowed)
 */
export function calculateDeposit(
    totalAmount: number,
    riskModel: VendorRiskModel
): { depositAmount: number; remainingAmount: number } {
    const depositPercentage = riskModel === "secure" ? 100 : 10;
    const depositAmount = Math.ceil(totalAmount * (depositPercentage / 100));
    const remainingAmount = totalAmount - depositAmount;

    return { depositAmount, remainingAmount };
}

/**
 * Get payment badge text for UI
 */
export function getPaymentBadgeText(
    riskModel: VendorRiskModel,
    depositAmount: number
): string {
    if (riskModel === "secure") {
        return "Full Payment Required";
    }
    return `Reserve for CHF ${(depositAmount / 100).toFixed(2)}`;
}

// ===========================================
// INQUIRY FLOW HELPERS
// ===========================================

/**
 * Create a price inquiry for items that need quotes
 */
export async function createPriceInquiry(data: {
    customerId: string;
    vendorId: string;
    serviceId: string;
    selectedItems: PriceListItem[];
    description: string;
    attachments?: string[];
    preferredDateStart?: Date;
    preferredDateEnd?: Date;
    flexibleDates?: boolean;
}): Promise<{ id: string; expiresAt: Date }> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const [inquiry] = await db
        .insert(priceInquiries)
        .values({
            customerId: data.customerId,
            vendorId: data.vendorId,
            serviceId: data.serviceId,
            selectedItems: data.selectedItems,
            description: data.description,
            attachments: data.attachments || [],
            preferredDateStart: data.preferredDateStart,
            preferredDateEnd: data.preferredDateEnd,
            flexibleDates: data.flexibleDates ?? true,
            expiresAt,
        })
        .returning({ id: priceInquiries.id, expiresAt: priceInquiries.expiresAt });

    return {
        id: inquiry.id,
        expiresAt: inquiry.expiresAt!
    };
}

// ===========================================
// BOOKING FLOW STATE MACHINE
// ===========================================

export type BookingFlowState =
    | "IDLE"
    | "SELECTING_ITEMS"
    | "SELECTING_TIME"
    | "REVIEWING"
    | "PAYING_DEPOSIT"
    | "AWAITING_VENDOR"
    | "PROPOSAL_RECEIVED"
    | "CONFIRMED"
    | "CANCELLED";

/**
 * Get next valid states for a booking
 */
export function getNextBookingFlowStates(
    currentState: BookingFlowState,
    tier: BookingTier
): BookingFlowState[] {
    const transitions: Record<BookingFlowState, BookingFlowState[]> = {
        IDLE: ["SELECTING_ITEMS"],
        SELECTING_ITEMS: ["SELECTING_TIME", "CANCELLED"],
        SELECTING_TIME: tier === "INQUIRY"
            ? ["AWAITING_VENDOR", "CANCELLED"]
            : ["REVIEWING", "CANCELLED"],
        REVIEWING: tier === "INSTANT"
            ? ["PAYING_DEPOSIT", "CANCELLED"]
            : ["AWAITING_VENDOR", "CANCELLED"],
        PAYING_DEPOSIT: ["CONFIRMED", "CANCELLED"],
        AWAITING_VENDOR: ["PROPOSAL_RECEIVED", "CONFIRMED", "CANCELLED"],
        PROPOSAL_RECEIVED: ["PAYING_DEPOSIT", "CANCELLED"],
        CONFIRMED: [],
        CANCELLED: [],
    };

    return transitions[currentState] || [];
}
