/**
 * Booking Flow Routes
 * API endpoints for the booking tier system
 */

import { Router } from "express";
import { isAuthenticated } from "../auth";
import { z } from "zod";
import {
    determineBookingFlow,
    calculateDeposit,
    getPaymentBadgeText,
    createPriceInquiry,
    type PriceListItem,
} from "../bookingFlowService";
import { db } from "../db";
import { services, priceInquiries, vendorQuotes } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

// ===========================================
// FLOW DETERMINATION
// ===========================================

// Schema for determining booking flow
const determineFlowSchema = z.object({
    serviceId: z.string().min(1),
    selectedItems: z.array(z.object({
        description: z.string(),
        price: z.string(),
        unit: z.string().optional(),
        billingType: z.enum(["once", "per_duration"]).optional(),
        pricingMode: z.enum(["fixed", "hourly", "inquire"]).optional(),
        estimatedMinutes: z.number().optional(),
    })),
    startTime: z.string().datetime().optional(),
    endTime: z.string().datetime().optional(),
    estimatedHours: z.number().optional(),
});

/**
 * POST /api/booking-flow/determine
 * Determine the booking tier for a service with selected items
 */
router.post("/determine", async (req, res) => {
    try {
        const validated = determineFlowSchema.parse(req.body);

        const result = await determineBookingFlow({
            serviceId: validated.serviceId,
            selectedItems: validated.selectedItems as PriceListItem[],
            startTime: validated.startTime ? new Date(validated.startTime) : undefined,
            endTime: validated.endTime ? new Date(validated.endTime) : undefined,
            estimatedHours: validated.estimatedHours,
        });

        // Add UI helpers
        const uiHelpers = {
            paymentBadge: result.totalAmount
                ? getPaymentBadgeText(result.riskModel, result.depositAmount ?? 0)
                : null,
            tierLabel: {
                INSTANT: "Instant Booking",
                REQUEST: "Request Booking",
                INQUIRY: "Request Quote",
            }[result.tier],
            tierDescription: {
                INSTANT: "Book immediately and receive instant confirmation",
                REQUEST: "Send a booking request for vendor approval",
                INQUIRY: "Request a custom quote for your requirements",
            }[result.tier],
        };

        res.json({ ...result, uiHelpers });
    } catch (error: any) {
        if (error.name === "ZodError") {
            return res.status(400).json({ message: error.errors[0].message });
        }
        console.error("Error determining flow:", error);
        res.status(500).json({ message: "Failed to determine booking flow" });
    }
});

// ===========================================
// PRICE INQUIRY (Tier 3)
// ===========================================

// Schema for creating price inquiry
const createInquirySchema = z.object({
    serviceId: z.string().min(1),
    selectedItems: z.array(z.object({
        description: z.string(),
        price: z.string(),
        unit: z.string().optional(),
        pricingMode: z.enum(["fixed", "hourly", "inquire"]).optional(),
    })),
    description: z.string().min(10, "Please provide at least 10 characters describing your needs"),
    attachments: z.array(z.string()).optional(),
    preferredDateStart: z.string().datetime().optional(),
    preferredDateEnd: z.string().datetime().optional(),
    flexibleDates: z.boolean().optional(),
});

/**
 * POST /api/booking-flow/inquiry
 * Create a price inquiry for services with "inquire" items
 */
router.post("/inquiry", isAuthenticated, async (req: any, res) => {
    try {
        const validated = createInquirySchema.parse(req.body);
        const customerId = req.user!.id;

        // Get service vendor
        const [service] = await db
            .select({ ownerId: services.ownerId })
            .from(services)
            .where(eq(services.id, validated.serviceId))
            .limit(1);

        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }

        const inquiry = await createPriceInquiry({
            customerId,
            vendorId: service.ownerId,
            serviceId: validated.serviceId,
            selectedItems: validated.selectedItems as PriceListItem[],
            description: validated.description,
            attachments: validated.attachments,
            preferredDateStart: validated.preferredDateStart
                ? new Date(validated.preferredDateStart)
                : undefined,
            preferredDateEnd: validated.preferredDateEnd
                ? new Date(validated.preferredDateEnd)
                : undefined,
            flexibleDates: validated.flexibleDates,
        });

        res.status(201).json({
            success: true,
            message: "Inquiry sent! You'll receive a quote within 2-3 business days.",
            inquiry,
        });
    } catch (error: any) {
        if (error.name === "ZodError") {
            return res.status(400).json({ message: error.errors[0].message });
        }
        console.error("Error creating inquiry:", error);
        res.status(500).json({ message: "Failed to create inquiry" });
    }
});

/**
 * GET /api/booking-flow/inquiries
 * Get customer's price inquiries
 */
router.get("/inquiries", isAuthenticated, async (req: any, res) => {
    try {
        const customerId = req.user!.id;
        const { status, limit = "20", offset = "0" } = req.query;

        const conditions = [eq(priceInquiries.customerId, customerId)];
        if (status) {
            conditions.push(eq(priceInquiries.status, status as any));
        }

        const inquiries = await db
            .select()
            .from(priceInquiries)
            .where(and(...conditions))
            .orderBy(desc(priceInquiries.createdAt))
            .limit(parseInt(limit))
            .offset(parseInt(offset));

        res.json({ inquiries });
    } catch (error: any) {
        console.error("Error fetching inquiries:", error);
        res.status(500).json({ message: "Failed to fetch inquiries" });
    }
});

/**
 * GET /api/booking-flow/inquiries/:id/quotes
 * Get quotes for a specific inquiry
 */
router.get("/inquiries/:id/quotes", isAuthenticated, async (req: any, res) => {
    try {
        const customerId = req.user!.id;
        const { id } = req.params;

        // Verify inquiry belongs to customer
        const [inquiry] = await db
            .select()
            .from(priceInquiries)
            .where(and(
                eq(priceInquiries.id, id),
                eq(priceInquiries.customerId, customerId)
            ))
            .limit(1);

        if (!inquiry) {
            return res.status(404).json({ message: "Inquiry not found" });
        }

        const quotes = await db
            .select()
            .from(vendorQuotes)
            .where(eq(vendorQuotes.inquiryId, id))
            .orderBy(desc(vendorQuotes.createdAt));

        res.json({ inquiry, quotes });
    } catch (error: any) {
        console.error("Error fetching quotes:", error);
        res.status(500).json({ message: "Failed to fetch quotes" });
    }
});

// ===========================================
// DEPOSIT CALCULATION
// ===========================================

/**
 * GET /api/booking-flow/deposit-preview
 * Preview deposit amount for a total
 */
router.get("/deposit-preview", async (req, res) => {
    try {
        const { serviceId, totalAmount } = req.query;

        if (!serviceId || !totalAmount) {
            return res.status(400).json({ message: "serviceId and totalAmount required" });
        }

        // Get service risk model
        const [service] = await db
            .select({ vendorRiskModel: services.vendorRiskModel })
            .from(services)
            .where(eq(services.id, serviceId as string))
            .limit(1);

        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }

        const riskModel = (service.vendorRiskModel as "growth" | "secure") || "growth";
        const total = parseFloat(totalAmount as string);
        const { depositAmount, remainingAmount } = calculateDeposit(total, riskModel);

        res.json({
            riskModel,
            totalAmount: total,
            depositAmount,
            remainingAmount,
            depositPercentage: riskModel === "secure" ? 100 : 10,
            badge: getPaymentBadgeText(riskModel, depositAmount),
        });
    } catch (error: any) {
        console.error("Error calculating deposit:", error);
        res.status(500).json({ message: "Failed to calculate deposit" });
    }
});

export { router as bookingFlowRouter };

/**
 * Register booking flow routes with Express app
 */
export function registerBookingFlowRoutes(app: any): void {
    app.use("/api/booking-flow", router);
}
