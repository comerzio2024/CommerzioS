/**
 * AI Routes
 * 
 * API endpoints for AI-powered features:
 * - Booking Assistant (for customers)
 * - Listing Concierge (for vendors)
 */

import { Express, Request, Response, NextFunction } from "express";
import * as bookingAssistant from "../aiBookingAssistant";
import * as listingConcierge from "../aiListingConcierge";

// Auth middleware type
type AuthenticatedRequest = Request & { user?: { id: string } };

// Simple auth check middleware
const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) {
        return res.status(401).json({ error: "Authentication required" });
    }
    next();
};

export function registerAiRoutes(app: Express): void {

    // ============================================
    // BOOKING ASSISTANT (Customer-facing)
    // ============================================

    /**
     * POST /api/ai/booking-assistant/chat
     * Send a message to the booking assistant
     */
    app.post("/api/ai/booking-assistant/chat", async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { message, conversationHistory = [] } = req.body;

            if (!message) {
                return res.status(400).json({ error: "Message is required" });
            }

            const result = await bookingAssistant.processBookingAssistantMessage(
                message,
                {
                    userId: req.user?.id,
                    conversationHistory,
                }
            );

            res.json({
                response: result.response,
                toolCalls: result.toolCalls,
            });
        } catch (error: any) {
            console.error("Booking assistant error:", error);
            res.status(500).json({ error: error.message || "Failed to process message" });
        }
    });

    /**
     * POST /api/ai/booking-assistant/search
     * Quick service search without conversation
     */
    app.post("/api/ai/booking-assistant/search", async (req: Request, res: Response) => {
        try {
            const { query } = req.body;

            if (!query) {
                return res.status(400).json({ error: "Query is required" });
            }

            const result = await bookingAssistant.quickServiceSearch(query);

            res.json(result);
        } catch (error: any) {
            console.error("Quick search error:", error);
            res.status(500).json({ error: error.message || "Failed to search" });
        }
    });

    /**
     * GET /api/ai/booking-assistant/recommendation/:serviceId
     * Get AI recommendation for a service
     */
    app.get("/api/ai/booking-assistant/recommendation/:serviceId", async (req: Request, res: Response) => {
        try {
            const { serviceId } = req.params;
            const { budget, urgency, experience } = req.query as any;

            const result = await bookingAssistant.getBookingRecommendation(
                serviceId,
                { budget: budget ? Number(budget) : undefined, urgency, experience }
            );

            res.json(result);
        } catch (error: any) {
            console.error("Recommendation error:", error);
            res.status(500).json({ error: error.message || "Failed to get recommendation" });
        }
    });

    // ============================================
    // LISTING CONCIERGE (Vendor-facing)
    // ============================================

    /**
     * GET /api/ai/listing-concierge/analyze/:serviceId
     * Analyze a service listing for improvements
     */
    app.get("/api/ai/listing-concierge/analyze/:serviceId", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { serviceId } = req.params;

            // TODO: Verify user owns this service

            const analysis = await listingConcierge.analyzeListing(serviceId);

            res.json(analysis);
        } catch (error: any) {
            console.error("Listing analysis error:", error);
            res.status(500).json({ error: error.message || "Failed to analyze listing" });
        }
    });

    /**
     * GET /api/ai/listing-concierge/pricing/:serviceId
     * Get AI pricing suggestion for a service
     */
    app.get("/api/ai/listing-concierge/pricing/:serviceId", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { serviceId } = req.params;

            const suggestion = await listingConcierge.getPricingSuggestion(serviceId);

            res.json(suggestion);
        } catch (error: any) {
            console.error("Pricing suggestion error:", error);
            res.status(500).json({ error: error.message || "Failed to get pricing suggestion" });
        }
    });

    /**
     * POST /api/ai/listing-concierge/title/:serviceId
     * Generate optimized title suggestions
     */
    app.post("/api/ai/listing-concierge/title/:serviceId", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { serviceId } = req.params;
            const { keywords } = req.body;

            const titles = await listingConcierge.generateOptimizedTitle(serviceId, keywords);

            res.json(titles);
        } catch (error: any) {
            console.error("Title generation error:", error);
            res.status(500).json({ error: error.message || "Failed to generate title" });
        }
    });

    /**
     * POST /api/ai/listing-concierge/description/:serviceId
     * Generate optimized description
     */
    app.post("/api/ai/listing-concierge/description/:serviceId", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { serviceId } = req.params;
            const { highlights } = req.body;

            const description = await listingConcierge.generateOptimizedDescription(serviceId, highlights);

            res.json(description);
        } catch (error: any) {
            console.error("Description generation error:", error);
            res.status(500).json({ error: error.message || "Failed to generate description" });
        }
    });

    /**
     * GET /api/ai/listing-concierge/competitors/:serviceId
     * Analyze competitors for a service
     */
    app.get("/api/ai/listing-concierge/competitors/:serviceId", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { serviceId } = req.params;

            const analysis = await listingConcierge.analyzeCompetitors(serviceId);

            res.json(analysis);
        } catch (error: any) {
            console.error("Competitor analysis error:", error);
            res.status(500).json({ error: error.message || "Failed to analyze competitors" });
        }
    });

    /**
     * GET /api/ai/listing-concierge/conversion-tips/:serviceId
     * Get conversion optimization tips
     */
    app.get("/api/ai/listing-concierge/conversion-tips/:serviceId", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { serviceId } = req.params;

            const tips = await listingConcierge.getConversionTips(serviceId);

            res.json(tips);
        } catch (error: any) {
            console.error("Conversion tips error:", error);
            res.status(500).json({ error: error.message || "Failed to get conversion tips" });
        }
    });

    console.log("✓ AI routes registered (9 endpoints)");
}
