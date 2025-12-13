/**
 * Booking Availability Routes
 * API endpoints for the redesigned booking availability system
 */

import { Router } from "express";
import { isAuthenticated } from "../auth";
import { z } from "zod";
import {
    checkServiceAvailability,
    getServiceSchedulingInfo,
    shouldTriggerScarcityNotification,
    getEstimatedTurnaround,
    type SchedulingType,
} from "../bookingAvailabilityService";
import { db } from "../db";
import { services } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

// ===========================================
// PUBLIC ENDPOINTS
// ===========================================

/**
 * GET /api/bookings/availability/:serviceId
 * Check if a service is available for booking
 * For TIME_BOUND: requires startTime and endTime query params
 * For CAPACITY_BOUND: returns current capacity status
 */
router.get("/availability/:serviceId", async (req, res) => {
    try {
        const { serviceId } = req.params;
        const { startTime, endTime } = req.query;

        // Get service info
        const [service] = await db
            .select({ ownerId: services.ownerId })
            .from(services)
            .where(eq(services.id, serviceId))
            .limit(1);

        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }

        const result = await checkServiceAvailability(
            serviceId,
            service.ownerId,
            startTime ? new Date(startTime as string) : undefined,
            endTime ? new Date(endTime as string) : undefined
        );

        res.json(result);
    } catch (error: any) {
        console.error("Error checking availability:", error);
        res.status(500).json({ message: "Failed to check availability" });
    }
});

/**
 * GET /api/bookings/scheduling-info/:serviceId
 * Get scheduling type and capacity info for a service
 */
router.get("/scheduling-info/:serviceId", async (req, res) => {
    try {
        const { serviceId } = req.params;
        const info = await getServiceSchedulingInfo(serviceId);

        if (!info) {
            return res.status(404).json({ message: "Service not found" });
        }

        res.json(info);
    } catch (error: any) {
        console.error("Error getting scheduling info:", error);
        res.status(500).json({ message: "Failed to get scheduling info" });
    }
});

/**
 * GET /api/bookings/turnaround/:serviceId
 * Get estimated turnaround time for capacity-bound services
 */
router.get("/turnaround/:serviceId", async (req, res) => {
    try {
        const { serviceId } = req.params;
        const estimate = await getEstimatedTurnaround(serviceId);
        res.json(estimate);
    } catch (error: any) {
        console.error("Error getting turnaround estimate:", error);
        res.status(500).json({ message: "Failed to get turnaround estimate" });
    }
});

// ===========================================
// SCARCITY INFO ENDPOINT
// ===========================================

/**
 * GET /api/bookings/scarcity/:serviceId
 * Get scarcity information for a slot (for "Hurry!" notifications)
 */
router.get("/scarcity/:serviceId", async (req, res) => {
    try {
        const { serviceId } = req.params;
        const { startTime, endTime } = req.query;

        const result = await shouldTriggerScarcityNotification(
            serviceId,
            startTime ? new Date(startTime as string) : undefined,
            endTime ? new Date(endTime as string) : undefined
        );

        res.json({
            showScarcityWarning: result.trigger,
            slotsRemaining: result.slotsRemaining,
            message: result.trigger ? `Only ${result.slotsRemaining} slot left!` : null,
        });
    } catch (error: any) {
        console.error("Error checking scarcity:", error);
        res.status(500).json({ message: "Failed to check scarcity" });
    }
});

// ===========================================
// BULK AVAILABILITY CHECK
// ===========================================

// Schema for bulk availability check
const bulkAvailabilitySchema = z.object({
    serviceId: z.string(),
    slots: z.array(z.object({
        startTime: z.string().datetime(),
        endTime: z.string().datetime(),
    })),
});

/**
 * POST /api/bookings/availability/bulk
 * Check multiple time slots at once (useful for calendar views)
 */
router.post("/availability/bulk", async (req, res) => {
    try {
        const validated = bulkAvailabilitySchema.parse(req.body);
        const { serviceId, slots } = validated;

        // Get service info
        const [service] = await db
            .select({ ownerId: services.ownerId })
            .from(services)
            .where(eq(services.id, serviceId))
            .limit(1);

        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }

        const results = await Promise.all(
            slots.map(async (slot) => {
                const result = await checkServiceAvailability(
                    serviceId,
                    service.ownerId,
                    new Date(slot.startTime),
                    new Date(slot.endTime)
                );
                return {
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                    ...result,
                };
            })
        );

        res.json({ slots: results });
    } catch (error: any) {
        if (error.name === "ZodError") {
            return res.status(400).json({ message: error.errors[0].message });
        }
        console.error("Error checking bulk availability:", error);
        res.status(500).json({ message: "Failed to check availability" });
    }
});

export { router as bookingAvailabilityRouter };

/**
 * Register booking availability routes with Express app
 */
export function registerBookingAvailabilityRoutes(app: any): void {
    app.use("/api/bookings", router);
}
