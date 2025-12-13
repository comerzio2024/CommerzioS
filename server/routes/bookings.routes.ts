/**
 * Bookings Routes
 * 
 * Comprehensive modular endpoints for booking management:
 * - Price calculation
 * - Booking creation with payment integration
 * - Customer and vendor booking lists
 * - Booking lifecycle actions (accept/reject/cancel/start/complete)
 * - Alternative time proposals
 * - Escrow and dispute integration
 */

import { Router, Response } from "express";
import { isAuthenticated } from "../auth";
import { storage } from "../storage";
import {
    createBookingRequest,
    getCustomerBookings,
    getVendorBookings,
    getPendingBookingsCount,
    getBookingById,
    acceptBooking,
    rejectBooking,
    proposeAlternative,
    acceptAlternative,
    cancelBooking,
    startBooking,
    completeBooking,
    getQueuePosition,
} from "../bookingService";

const router = Router();

// ===========================================
// PRICE CALCULATION
// ===========================================

/**
 * POST /api/bookings/calculate-price
 * Calculate booking price based on service, pricing option, and duration
 */
router.post("/calculate-price", async (req: any, res: Response) => {
    try {
        const { serviceId, pricingOptionId, startTime, endTime, context } = req.body;

        if (!serviceId || !startTime || !endTime) {
            return res.status(400).json({ message: "serviceId, startTime, and endTime are required" });
        }

        const { calculateBookingPrice } = await import("../pricingCalculationService");

        const breakdown = await calculateBookingPrice({
            serviceId,
            pricingOptionId,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            context,
        });

        res.json(breakdown);
    } catch (error: any) {
        console.error("Error calculating price:", error);
        res.status(400).json({ message: error.message || "Failed to calculate price" });
    }
});

// ===========================================
// BOOKING CRUD
// ===========================================

/**
 * POST /api/bookings
 * Create a new booking request with optional payment session
 */
router.post("/", isAuthenticated, async (req: any, res: Response) => {
    try {
        const { paymentMethod, pricingOptionId, ...bookingData } = req.body;

        const booking = await createBookingRequest({
            customerId: req.user!.id,
            ...bookingData,
            pricingOptionId,
            requestedStartTime: new Date(req.body.requestedStartTime),
            requestedEndTime: new Date(req.body.requestedEndTime),
        });

        // For card/twint payments, create checkout session
        if (paymentMethod === "card" || paymentMethod === "twint") {
            const service = await storage.getService(booking.serviceId);
            if (!service) {
                return res.status(404).json({ message: "Service not found" });
            }

            // Calculate price
            let amount = 0;
            try {
                const { calculateBookingPrice } = await import("../pricingCalculationService");
                const pricingResult = await calculateBookingPrice({
                    serviceId: booking.serviceId,
                    pricingOptionId,
                    startTime: new Date(req.body.requestedStartTime),
                    endTime: new Date(req.body.requestedEndTime),
                });
                amount = Math.round(pricingResult.total * 100); // Convert to cents
            } catch (priceError) {
                // Fallback to base price
                amount = Math.round(parseFloat(service.price || "0") * 100);
            }

            if (amount > 0) {
                const baseUrl = process.env.CLIENT_URL || req.headers.origin || "http://localhost:5173";

                try {
                    const paymentService = await import("../bookingPaymentService");
                    const checkoutResult = await paymentService.createBookingCheckoutSession({
                        bookingId: booking.id,
                        customerId: req.user!.id,
                        vendorId: booking.vendorId,
                        serviceTitle: service.title,
                        amount,
                        paymentMethod,
                        successUrl: `${baseUrl}/booking-success`,
                        cancelUrl: `${baseUrl}/service/${booking.serviceId}/book`,
                    });

                    if (checkoutResult) {
                        return res.status(201).json({
                            ...booking,
                            checkoutUrl: checkoutResult.checkoutUrl,
                            sessionId: checkoutResult.sessionId,
                        });
                    }
                } catch (paymentError) {
                    console.error("Payment session error:", paymentError);
                    // Fall through to return booking without payment session
                }
            }
        }

        // Cash payment or no payment needed
        res.status(201).json(booking);
    } catch (error: any) {
        console.error("Error creating booking:", error);
        res.status(400).json({ message: error.message || "Failed to create booking" });
    }
});

/**
 * GET /api/bookings/my
 * Get customer's bookings
 */
router.get("/my", isAuthenticated, async (req: any, res: Response) => {
    try {
        const { status, limit = 20, offset = 0 } = req.query;
        const bookingsList = await getCustomerBookings(
            req.user!.id,
            status as string,
            parseInt(limit as string),
            parseInt(offset as string)
        );
        res.json(bookingsList);
    } catch (error) {
        console.error("Error fetching bookings:", error);
        res.status(500).json({ message: "Failed to fetch bookings" });
    }
});

/**
 * GET /api/bookings/:id
 * Get single booking with queue position if pending
 */
router.get("/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
        const booking = await getBookingById(req.params.id, req.user!.id);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        // Add queue position if pending
        let queuePosition = null;
        if (booking.status === "pending") {
            queuePosition = await getQueuePosition(booking.id);
        }

        res.json({ ...booking, queuePosition });
    } catch (error) {
        console.error("Error fetching booking:", error);
        res.status(500).json({ message: "Failed to fetch booking" });
    }
});

// ===========================================
// VENDOR ACTIONS
// ===========================================

/**
 * POST /api/bookings/:id/accept
 * Accept a booking (vendor)
 */
router.post("/:id/accept", isAuthenticated, async (req: any, res: Response) => {
    try {
        const booking = await acceptBooking(req.params.id, req.user!.id, req.body.message);
        res.json(booking);
    } catch (error: any) {
        console.error("Error accepting booking:", error);
        res.status(400).json({ message: error.message || "Failed to accept booking" });
    }
});

/**
 * POST /api/bookings/:id/reject
 * Reject a booking (vendor)
 */
router.post("/:id/reject", isAuthenticated, async (req: any, res: Response) => {
    try {
        const booking = await rejectBooking(req.params.id, req.user!.id, req.body.reason);
        res.json(booking);
    } catch (error: any) {
        console.error("Error rejecting booking:", error);
        res.status(400).json({ message: error.message || "Failed to reject booking" });
    }
});

/**
 * POST /api/bookings/:id/propose-alternative
 * Propose alternative time (vendor)
 */
router.post("/:id/propose-alternative", isAuthenticated, async (req: any, res: Response) => {
    try {
        const { alternativeStartTime, alternativeEndTime, message, expiryHours } = req.body;

        if (!alternativeStartTime || !alternativeEndTime) {
            return res.status(400).json({ message: "Alternative times are required" });
        }

        const booking = await proposeAlternative(
            req.params.id,
            req.user!.id,
            new Date(alternativeStartTime),
            new Date(alternativeEndTime),
            message,
            expiryHours
        );
        res.json(booking);
    } catch (error: any) {
        console.error("Error proposing alternative:", error);
        res.status(400).json({ message: error.message || "Failed to propose alternative" });
    }
});

/**
 * POST /api/bookings/:id/start
 * Start a booking (vendor)
 */
router.post("/:id/start", isAuthenticated, async (req: any, res: Response) => {
    try {
        const booking = await startBooking(req.params.id, req.user!.id);
        if (!booking) {
            return res.status(400).json({ message: "Cannot start this booking" });
        }
        res.json(booking);
    } catch (error) {
        console.error("Error starting booking:", error);
        res.status(500).json({ message: "Failed to start booking" });
    }
});

/**
 * POST /api/bookings/:id/complete
 * Complete a booking (vendor)
 */
router.post("/:id/complete", isAuthenticated, async (req: any, res: Response) => {
    try {
        const booking = await completeBooking(req.params.id, req.user!.id);
        if (!booking) {
            return res.status(400).json({ message: "Cannot complete this booking" });
        }
        res.json(booking);
    } catch (error) {
        console.error("Error completing booking:", error);
        res.status(500).json({ message: "Failed to complete booking" });
    }
});

// ===========================================
// CUSTOMER ACTIONS
// ===========================================

/**
 * POST /api/bookings/:id/accept-alternative
 * Accept alternative time proposal (customer)
 */
router.post("/:id/accept-alternative", isAuthenticated, async (req: any, res: Response) => {
    try {
        const booking = await acceptAlternative(req.params.id, req.user!.id);
        res.json(booking);
    } catch (error: any) {
        console.error("Error accepting alternative:", error);
        res.status(400).json({ message: error.message || "Failed to accept alternative" });
    }
});

/**
 * POST /api/bookings/:id/cancel
 * Cancel a booking (customer or vendor)
 */
router.post("/:id/cancel", isAuthenticated, async (req: any, res: Response) => {
    try {
        const booking = await cancelBooking(req.params.id, req.user!.id, req.body.reason);
        res.json(booking);
    } catch (error: any) {
        console.error("Error cancelling booking:", error);
        res.status(400).json({ message: error.message || "Failed to cancel booking" });
    }
});

// ===========================================
// VENDOR ROUTES (for /api/vendor/bookings)
// ===========================================

// These are registered separately since they use a different base path

// ===========================================
// EXPORTS
// ===========================================

export { router as bookingsRouter };

export function registerBookingsRoutes(app: any): void {
    app.use("/api/bookings", router);

    // Additional vendor booking routes
    app.get("/api/vendor/bookings", isAuthenticated, async (req: any, res: Response) => {
        try {
            const { status, startDate, endDate, limit = 20, offset = 0 } = req.query;
            const bookingsList = await getVendorBookings(
                req.user!.id,
                status as string,
                startDate ? new Date(startDate as string) : undefined,
                endDate ? new Date(endDate as string) : undefined,
                parseInt(limit as string),
                parseInt(offset as string)
            );
            res.json(bookingsList);
        } catch (error) {
            console.error("Error fetching vendor bookings:", error);
            res.status(500).json({ message: "Failed to fetch bookings" });
        }
    });

    app.get("/api/vendor/bookings/pending-count", isAuthenticated, async (req: any, res: Response) => {
        try {
            const count = await getPendingBookingsCount(req.user!.id);
            res.json({ count });
        } catch (error) {
            console.error("Error fetching pending count:", error);
            res.status(500).json({ message: "Failed to fetch pending count" });
        }
    });
}
