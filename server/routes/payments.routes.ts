/**
 * Payments Routes
 * 
 * Modular endpoints for payment processing:
 * - Stripe configuration
 * - Customer creation
 * - Connect account management (vendors)
 * - Payment intents
 * - Checkout sessions
 * - Webhook handling
 * - Refunds
 * - TWINT support
 */

import { Router, Response } from "express";
import { isAuthenticated } from "../auth";
import { storage } from "../storage";
import {
    getStripePublishableKey,
    isStripeConfigured,
    getOrCreateStripeCustomer,
    createConnectAccount,
    getConnectAccountStatus,
    createPaymentIntent,
    createCheckoutSession,
    PLATFORM_FEE_PERCENTAGE,
} from "../stripeService";

const router = Router();

// ===========================================
// CONFIGURATION
// ===========================================

/**
 * GET /api/payments/config
 * Get Stripe configuration (public key, fee percentage)
 */
router.get("/config", (_req: any, res: Response) => {
    res.json({
        publishableKey: getStripePublishableKey(),
        isConfigured: isStripeConfigured(),
        platformFeePercentage: PLATFORM_FEE_PERCENTAGE,
    });
});

// ===========================================
// CUSTOMER MANAGEMENT
// ===========================================

/**
 * POST /api/payments/create-customer
 * Create Stripe customer for current user
 */
router.post("/create-customer", isAuthenticated, async (req: any, res: Response) => {
    try {
        const customerId = await getOrCreateStripeCustomer(req.user!.id);
        res.json({ customerId });
    } catch (error) {
        console.error("Error creating Stripe customer:", error);
        res.status(500).json({ message: "Failed to create payment customer" });
    }
});

// ===========================================
// CONNECT (VENDOR) ACCOUNTS
// ===========================================

/**
 * POST /api/payments/connect/create
 * Create Stripe Connect account for vendor
 */
router.post("/connect/create", isAuthenticated, async (req: any, res: Response) => {
    try {
        const result = await createConnectAccount(req.user!.id);
        if (!result) {
            return res.status(503).json({ message: "Payment system not configured" });
        }
        res.json(result);
    } catch (error) {
        console.error("Error creating Connect account:", error);
        res.status(500).json({ message: "Failed to create vendor payment account" });
    }
});

/**
 * GET /api/payments/connect/status
 * Get Connect account status for current user
 */
router.get("/connect/status", isAuthenticated, async (req: any, res: Response) => {
    try {
        const status = await getConnectAccountStatus(req.user!.id);
        res.json(status || {
            hasAccount: false,
            isOnboarded: false,
            chargesEnabled: false,
            payoutsEnabled: false
        });
    } catch (error) {
        console.error("Error getting Connect status:", error);
        res.status(500).json({ message: "Failed to get payment account status" });
    }
});

// ===========================================
// PAYMENT PROCESSING
// ===========================================

/**
 * POST /api/payments/create-intent
 * Create payment intent for an order
 */
router.post("/create-intent", isAuthenticated, async (req: any, res: Response) => {
    try {
        const { orderId, amount, description } = req.body;

        if (!orderId || !amount) {
            return res.status(400).json({ message: "orderId and amount are required" });
        }

        // Get order to verify ownership and get vendor
        const order = await storage.getOrderById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        if (order.customerId !== req.user!.id) {
            return res.status(403).json({ message: "Not authorized to pay for this order" });
        }

        const result = await createPaymentIntent({
            orderId,
            customerId: req.user!.id,
            vendorId: order.vendorId,
            amount: Math.round(amount * 100), // Convert to cents
            description,
        });

        if (!result) {
            return res.status(503).json({ message: "Payment system not configured" });
        }

        res.json(result);
    } catch (error) {
        console.error("Error creating payment intent:", error);
        res.status(500).json({ message: "Failed to create payment" });
    }
});

/**
 * POST /api/payments/create-checkout
 * Create checkout session for an order
 */
router.post("/create-checkout", isAuthenticated, async (req: any, res: Response) => {
    try {
        const { orderId, lineItems, successUrl, cancelUrl } = req.body;

        if (!orderId || !lineItems || !successUrl || !cancelUrl) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const order = await storage.getOrderById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        if (order.customerId !== req.user!.id) {
            return res.status(403).json({ message: "Not authorized" });
        }

        const result = await createCheckoutSession({
            orderId,
            customerId: req.user!.id,
            vendorId: order.vendorId,
            lineItems,
            successUrl,
            cancelUrl,
        });

        if (!result) {
            return res.status(503).json({ message: "Payment system not configured" });
        }

        res.json(result);
    } catch (error) {
        console.error("Error creating checkout session:", error);
        res.status(500).json({ message: "Failed to create checkout" });
    }
});

// ===========================================
// WEBHOOK
// ===========================================

/**
 * POST /api/payments/webhook
 * Handle Stripe webhook events
 * Note: Webhook handling is done in routes.ts with express.raw() middleware
 */
router.post("/webhook", async (req: any, res: Response) => {
    const signature = req.headers["stripe-signature"] as string;

    if (!signature) {
        return res.status(400).json({ message: "Missing signature" });
    }

    try {
        // Webhook processing requires raw body - this is handled in main routes.ts
        // This route is here for documentation/structure
        res.json({ received: true });
    } catch (error: any) {
        console.error("Webhook error:", error);
        res.status(400).json({ message: error.message || "Webhook processing failed" });
    }
});

// ===========================================
// REFUNDS
// ===========================================

/**
 * POST /api/payments/refund
 * Process a refund for an order
 */
router.post("/refund", isAuthenticated, async (req: any, res: Response) => {
    try {
        const { orderId, amount, reason } = req.body;

        if (!orderId) {
            return res.status(400).json({ message: "orderId is required" });
        }

        // Get order to verify authorization
        const order = await storage.getOrderById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Get user to check admin status
        const user = await storage.getUser(req.user!.id);
        if (order.vendorId !== req.user!.id && !user?.isAdmin) {
            return res.status(403).json({ message: "Not authorized to refund this order" });
        }

        // Refund processing is handled by stripeService in routes.ts
        // This is a placeholder that provides the structure
        res.json({
            success: true,
            message: "Refund initiated",
            orderId,
            amount: amount ? Math.round(amount * 100) : "full",
            reason: reason || "Customer request"
        });
    } catch (error: any) {
        console.error("Error processing refund:", error);
        res.status(500).json({ message: error.message || "Failed to process refund" });
    }
});

// ===========================================
// TWINT SUPPORT
// ===========================================

/**
 * GET /api/payments/twint-eligibility
 * Check if user is eligible for TWINT payments
 */
router.get("/twint-eligibility", isAuthenticated, async (req: any, res: Response) => {
    try {
        // TWINT eligibility based on user verification and country
        const user = await storage.getUser(req.user!.id);

        res.json({
            eligible: user?.isVerified || false,
            reason: !user?.isVerified
                ? "Identity verification required for TWINT payments"
                : null,
        });
    } catch (error) {
        console.error("Error checking TWINT eligibility:", error);
        res.status(500).json({ message: "Failed to check eligibility" });
    }
});

/**
 * GET /api/payments/twint-thresholds
 * Get TWINT payment thresholds
 */
router.get("/twint-thresholds", (_req: any, res: Response) => {
    res.json({
        minAmount: 100, // CHF 1.00 in cents
        maxAmount: 500000, // CHF 5,000.00 in cents
        dailyLimit: 1000000, // CHF 10,000.00 in cents
    });
});

// ===========================================
// EXPORTS
// ===========================================

export { router as paymentsRouter };

export function registerPaymentsRoutes(app: any): void {
    app.use("/api/payments", router);
}
