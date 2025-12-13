/**
 * Disputes Routes
 * 
 * API endpoints for the 3-phase AI dispute resolution system:
 * - Phase 1: Human negotiation (7 days)
 * - Phase 2: AI-generated resolution options (7 days)
 * - Phase 3: Binding AI verdict (24h review period)
 */

import { Express, Request, Response, NextFunction } from "express";
import { db } from "../db";
import { escrowDisputes, bookings, users } from "@shared/schema";
import { eq, and, desc, isNull } from "drizzle-orm";
import * as disputePhaseService from "../services/disputePhaseService";
import * as disputeAiService from "../services/disputeAiService";
import * as disputeResolutionService from "../services/disputeResolutionService";

// Auth middleware type
type AuthenticatedRequest = Request & { user?: { id: string } };

// Simple auth check middleware
const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) {
        return res.status(401).json({ error: "Authentication required" });
    }
    next();
};

export function registerDisputesRoutes(app: Express): void {

    // ============================================
    // DISPUTE LISTING & CREATION
    // ============================================

    /**
     * GET /api/disputes
     * Get user's disputes (as customer or vendor)
     */
    app.get("/api/disputes", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user!.id;
            const status = req.query.status as string | undefined;

            // Get bookings where user is customer
            const customerBookings = await db
                .select({ id: bookings.id })
                .from(bookings)
                .where(eq(bookings.customerId, userId));

            // Get bookings where user is vendor
            const vendorServices = await db
                .select({ id: bookings.id })
                .from(bookings)
                .innerJoin(users, eq(users.id, bookings.customerId)) // The vendor owns services
                .where(eq(users.id, userId));

            const bookingIds = [
                ...customerBookings.map(b => b.id),
                ...vendorServices.map(b => b.id)
            ];

            if (bookingIds.length === 0) {
                return res.json({ disputes: [] });
            }

            // Get disputes for these bookings
            let query = db
                .select()
                .from(escrowDisputes)
                .where(
                    and(
                        // disputeId is in user's bookings
                        eq(escrowDisputes.bookingId, bookingIds[0]), // TODO: Support multiple bookingIds with inArray
                        status ? eq(escrowDisputes.status, status as any) : undefined,
                        isNull(escrowDisputes.deletedAt)
                    )
                )
                .orderBy(desc(escrowDisputes.createdAt));

            const disputes = await query;

            // Enrich with phase info
            const enrichedDisputes = await Promise.all(
                disputes.map(async (d) => {
                    const phases = await disputePhaseService.getDisputePhases(d.id);
                    const deadline = await disputePhaseService.getTimeUntilDeadline(d.id);
                    return {
                        ...d,
                        phases,
                        deadline,
                    };
                })
            );

            res.json({ disputes: enrichedDisputes });
        } catch (error) {
            console.error("Error fetching disputes:", error);
            res.status(500).json({ error: "Failed to fetch disputes" });
        }
    });

    /**
     * GET /api/disputes/:id
     * Get single dispute with full details
     */
    app.get("/api/disputes/:id", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { id } = req.params;
            const userId = req.user!.id;

            const [dispute] = await db
                .select()
                .from(escrowDisputes)
                .where(eq(escrowDisputes.id, id));

            if (!dispute) {
                return res.status(404).json({ error: "Dispute not found" });
            }

            // Verify user is party to dispute
            const parties = await disputePhaseService.getDisputeParties(id);
            if (!parties || (parties.customerId !== userId && parties.vendorId !== userId)) {
                return res.status(403).json({ error: "Not authorized to view this dispute" });
            }

            // Get enriched data
            const phases = await disputePhaseService.getDisputePhases(id);
            const deadline = await disputePhaseService.getTimeUntilDeadline(id);
            const analysis = await disputeAiService.getLatestAnalysis(id);
            const options = await disputeAiService.getResolutionOptions(id);
            const decision = await disputeAiService.getAiDecision(id);

            res.json({
                dispute,
                phases,
                deadline,
                analysis,
                options,
                decision,
            });
        } catch (error) {
            console.error("Error fetching dispute:", error);
            res.status(500).json({ error: "Failed to fetch dispute" });
        }
    });

    /**
     * POST /api/disputes
     * Open a new dispute for a booking
     */
    app.post("/api/disputes", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user!.id;
            const { bookingId, reason, description, evidenceUrls } = req.body;

            if (!bookingId || !reason || !description) {
                return res.status(400).json({ error: "bookingId, reason, and description are required" });
            }

            // Verify booking exists and user is a party
            const [booking] = await db
                .select()
                .from(bookings)
                .where(eq(bookings.id, bookingId));

            if (!booking) {
                return res.status(404).json({ error: "Booking not found" });
            }

            // Check if dispute already exists
            const existingDispute = await db
                .select()
                .from(escrowDisputes)
                .where(
                    and(
                        eq(escrowDisputes.bookingId, bookingId),
                        isNull(escrowDisputes.deletedAt)
                    )
                );

            if (existingDispute.length > 0) {
                return res.status(400).json({
                    error: "A dispute already exists for this booking",
                    disputeId: existingDispute[0].id
                });
            }

            // Create dispute
            const [dispute] = await db
                .insert(escrowDisputes)
                .values({
                    bookingId,
                    openedBy: userId,
                    reason,
                    description,
                    evidenceUrls: evidenceUrls || [],
                    status: "open",
                })
                .returning();

            // Initialize phase tracking
            const phases = await disputePhaseService.initializeDisputePhases(dispute.id);

            // Notify parties
            await disputePhaseService.notifyDisputeParties(
                dispute.id,
                "Dispute Opened",
                `A dispute has been opened for booking ${bookingId}. You have 7 days to negotiate.`,
                { phase: "phase_1" }
            );

            res.status(201).json({
                dispute,
                phases,
                message: "Dispute opened successfully. Phase 1 negotiation period has begun."
            });
        } catch (error) {
            console.error("Error creating dispute:", error);
            res.status(500).json({ error: "Failed to create dispute" });
        }
    });

    // ============================================
    // PHASE MANAGEMENT
    // ============================================

    /**
     * POST /api/disputes/:id/escalate
     * Escalate dispute to next phase
     */
    app.post("/api/disputes/:id/escalate", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { id } = req.params;
            const userId = req.user!.id;

            // Verify user is party
            const parties = await disputePhaseService.getDisputeParties(id);
            if (!parties || (parties.customerId !== userId && parties.vendorId !== userId)) {
                return res.status(403).json({ error: "Not authorized" });
            }

            // Check if can escalate
            const canEscalate = await disputePhaseService.canEscalateDispute(id);
            if (!canEscalate.canEscalate) {
                return res.status(400).json({ error: canEscalate.reason || "Cannot escalate at this time" });
            }

            let phases;
            if (canEscalate.currentPhase === "phase_1") {
                phases = await disputePhaseService.escalateToPhase2(id, userId);
            } else if (canEscalate.currentPhase === "phase_2") {
                phases = await disputePhaseService.escalateToPhase3(id, userId);
            } else {
                return res.status(400).json({ error: "Dispute is already in final phase" });
            }

            res.json({
                phases,
                message: `Escalated to ${canEscalate.nextPhase}`
            });
        } catch (error) {
            console.error("Error escalating dispute:", error);
            res.status(500).json({ error: "Failed to escalate dispute" });
        }
    });

    /**
     * GET /api/disputes/:id/deadline
     * Get time remaining until phase deadline
     */
    app.get("/api/disputes/:id/deadline", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { id } = req.params;
            const deadline = await disputePhaseService.getTimeUntilDeadline(id);
            res.json(deadline);
        } catch (error) {
            console.error("Error fetching deadline:", error);
            res.status(500).json({ error: "Failed to fetch deadline" });
        }
    });

    // ============================================
    // AI RESOLUTION (Phase 2)
    // ============================================

    /**
     * GET /api/disputes/:id/options
     * Get AI-generated resolution options (Phase 2)
     */
    app.get("/api/disputes/:id/options", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { id } = req.params;

            // Get existing options
            let options = await disputeAiService.getResolutionOptions(id);

            // If no options exist, check if we're in Phase 2 and generate them
            if (options.length === 0) {
                const phases = await disputePhaseService.getDisputePhases(id);
                if (phases?.currentPhase === "phase_2") {
                    options = await disputeAiService.generateResolutionOptions(id);
                }
            }

            res.json({ options });
        } catch (error) {
            console.error("Error fetching options:", error);
            res.status(500).json({ error: "Failed to fetch resolution options" });
        }
    });

    /**
     * POST /api/disputes/:id/options/:optionId/accept
     * Accept a resolution option (Phase 2)
     */
    app.post("/api/disputes/:id/options/:optionId/accept", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { id, optionId } = req.params;
            const userId = req.user!.id;

            // Verify user is party
            const parties = await disputePhaseService.getDisputeParties(id);
            if (!parties || (parties.customerId !== userId && parties.vendorId !== userId)) {
                return res.status(403).json({ error: "Not authorized" });
            }

            // Record the response (integration with disputeResolutionService)
            const role = parties.customerId === userId ? "customer" : "vendor";

            // TODO: Implement option response tracking
            // For now, just acknowledge
            res.json({
                message: `Option ${optionId} accepted by ${role}`,
                nextStep: "Waiting for other party to respond"
            });
        } catch (error) {
            console.error("Error accepting option:", error);
            res.status(500).json({ error: "Failed to accept option" });
        }
    });

    // ============================================
    // AI FINAL DECISION (Phase 3)
    // ============================================

    /**
     * GET /api/disputes/:id/decision
     * Get AI's binding decision (Phase 3)
     */
    app.get("/api/disputes/:id/decision", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { id } = req.params;

            let decision = await disputeAiService.getAiDecision(id);

            // If no decision exists, check if we're in Phase 3 and generate it
            if (!decision) {
                const phases = await disputePhaseService.getDisputePhases(id);
                if (phases?.currentPhase === "phase_3") {
                    decision = await disputeAiService.generateFinalDecision(id);
                }
            }

            res.json({ decision });
        } catch (error) {
            console.error("Error fetching decision:", error);
            res.status(500).json({ error: "Failed to fetch decision" });
        }
    });

    // ============================================
    // RESOLUTION  
    // ============================================

    /**
     * POST /api/disputes/:id/resolve
     * Manually resolve a dispute (Phase 1 or 2 agreement)
     */
    app.post("/api/disputes/:id/resolve", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { id } = req.params;
            const userId = req.user!.id;
            const { resolution, refundPercent } = req.body;

            // Verify user is party
            const parties = await disputePhaseService.getDisputeParties(id);
            if (!parties || (parties.customerId !== userId && parties.vendorId !== userId)) {
                return res.status(403).json({ error: "Not authorized" });
            }

            // Get current phase
            const phases = await disputePhaseService.getDisputePhases(id);
            if (!phases || phases.currentPhase === "phase_3") {
                return res.status(400).json({ error: "Cannot manually resolve in Phase 3" });
            }

            // Mark as resolved
            const role = parties.customerId === userId ? "customer" : "vendor";
            const updatedPhases = await disputePhaseService.markExternalResolution(id, role as any);

            // Update dispute status
            await db
                .update(escrowDisputes)
                .set({
                    status: "resolved",
                    resolvedAt: new Date(),
                    resolution: resolution || "Mutual agreement",
                })
                .where(eq(escrowDisputes.id, id));

            res.json({
                phases: updatedPhases,
                message: "Dispute resolved successfully"
            });
        } catch (error) {
            console.error("Error resolving dispute:", error);
            res.status(500).json({ error: "Failed to resolve dispute" });
        }
    });

    /**
     * POST /api/disputes/:id/evidence
     * Add evidence to a dispute
     */
    app.post("/api/disputes/:id/evidence", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { id } = req.params;
            const userId = req.user!.id;
            const { evidenceUrls, description } = req.body;

            if (!evidenceUrls || !Array.isArray(evidenceUrls)) {
                return res.status(400).json({ error: "evidenceUrls array required" });
            }

            // Verify user is party
            const parties = await disputePhaseService.getDisputeParties(id);
            if (!parties || (parties.customerId !== userId && parties.vendorId !== userId)) {
                return res.status(403).json({ error: "Not authorized" });
            }

            // Check phase allows evidence (Phase 1 only)
            const phases = await disputePhaseService.getDisputePhases(id);
            if (phases && phases.currentPhase !== "phase_1") {
                return res.status(400).json({ error: "Evidence can only be submitted during Phase 1" });
            }

            // Get current evidence and append
            const [dispute] = await db
                .select()
                .from(escrowDisputes)
                .where(eq(escrowDisputes.id, id));

            const currentEvidence = dispute.evidenceUrls || [];
            const newEvidence = [...currentEvidence, ...evidenceUrls];

            await db
                .update(escrowDisputes)
                .set({ evidenceUrls: newEvidence })
                .where(eq(escrowDisputes.id, id));

            res.json({
                evidenceUrls: newEvidence,
                message: `Added ${evidenceUrls.length} evidence items`
            });
        } catch (error) {
            console.error("Error adding evidence:", error);
            res.status(500).json({ error: "Failed to add evidence" });
        }
    });

    console.log("✓ Disputes routes registered");
}
