/**
 * Dispute AI Service
 * 
 * Handles AI-powered dispute analysis and resolution:
 * - Evidence analysis
 * - Generating 3 resolution options for Phase 2 (via Consensus Service)
 * - Making binding decisions for Phase 3 (via Consensus Service)
 * 
 * Uses multi-model architecture (GPT-5.1, Claude Opus 4.5, Gemini 3 Pro).
 */

import OpenAI from "openai";
import { db } from "../db";
import { eq, and, desc, or } from "drizzle-orm";
import {
  escrowDisputes,
  escrowTransactions,
  users,
  bookings,
  services,
  chatConversations,
  chatMessages
} from "../../shared/schema";
import {
  disputeAiAnalysis,
  disputeAiOptions,
  disputeAiDecisions,
  disputeResponses,
  type DisputeAiAnalysis,
  type DisputeAiOption,
  type DisputeAiDecision,
  type InsertDisputeAiAnalysis,
  type InsertDisputeAiOption,
  type InsertDisputeAiDecision
} from "../../shared/schema-disputes";
import { runConsensusPhase2, runConsensusPhase3 } from "./disputeConsensusService";

// ============================================
// CONFIGURATION
// ============================================

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const AI_MODEL = "gpt-4-turbo-preview"; // Used for initial analysis only

// ============================================
// TYPES
// ============================================

interface DisputeContext {
  dispute: any;
  booking: any;
  service: any;
  customer: any;
  vendor: any;
  customerEvidence: string[];
  vendorEvidence: string[];
  chatHistory: any[];
  previousResponses: any[];
}

interface AiAnalysisResult {
  evidenceAnalysis: NonNullable<InsertDisputeAiAnalysis["evidenceAnalysis"]>;
  descriptionAnalysis: NonNullable<InsertDisputeAiAnalysis["descriptionAnalysis"]>;
  behaviorAnalysis: NonNullable<InsertDisputeAiAnalysis["behaviorAnalysis"]>;
  overallAssessment: NonNullable<InsertDisputeAiAnalysis["overallAssessment"]>;
}

// ============================================
// HELPERS: FRAUD & RISK METRICS
// ============================================

async function getDisputeHistoryStats(userId: string) {
  const disputes = await db
    .select()
    .from(disputeAiDecisions) // Check decisions to see win/loss
    .leftJoin(escrowDisputes, eq(disputeAiDecisions.disputeId, escrowDisputes.id))
    .where(
      or(
        eq(bookings.customerId, userId),
        eq(bookings.vendorId, userId)
      )
    );

  const total = disputes.length;
  if (total === 0) return { total: 0, winRate: 0 };

  // Heuristic: "Win" if refunded > 50% (customer) or paid > 50% (vendor)
  let wins = 0;
  for (const d of disputes) {
    if (!d.dispute_ai_decisions) continue;

    // If they were customer
    if (d.bookings?.customerId === userId) {
      if (d.dispute_ai_decisions.customerRefundPercent > 50) wins++;
    }
    // If they were vendor
    else if (d.bookings?.vendorId === userId) {
      if (d.dispute_ai_decisions.vendorPaymentPercent > 50) wins++;
    }
  }

  return {
    total,
    winRate: parseFloat((wins / total).toFixed(2))
  };
}

// ============================================
// CONTEXT GATHERING
// ============================================

/**
 * Gather all context needed for AI analysis
 */
async function gatherDisputeContext(disputeId: string): Promise<DisputeContext & { riskMetrics: any }> {
  // Get dispute
  const [dispute] = await db
    .select()
    .from(escrowDisputes)
    .where(eq(escrowDisputes.id, disputeId))
    .limit(1);

  if (!dispute) {
    throw new Error("Dispute not found");
  }

  // Get booking
  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, dispute.bookingId))
    .limit(1);

  if (!booking) {
    throw new Error("Booking not found");
  }

  // Get escrow transaction for amount
  const [escrow] = await db
    .select()
    .from(escrowTransactions)
    .where(eq(escrowTransactions.bookingId, dispute.bookingId))
    .limit(1);

  const escrowAmount = escrow ? escrow.amount : "0";

  // Get service
  const [service] = booking?.serviceId
    ? await db.select().from(services).where(eq(services.id, booking.serviceId)).limit(1)
    : [null];

  // Get customer and vendor from booking
  const [customer] = await db
    .select({ id: users.id, firstName: users.firstName, lastName: users.lastName, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, booking.customerId))
    .limit(1);

  const [vendor] = await db
    .select({ id: users.id, firstName: users.firstName, lastName: users.lastName, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, booking.vendorId))
    .limit(1);

  // Get evidence from evidenceUrls field
  const evidenceUrls = (dispute.evidenceUrls as string[]) || [];
  const customerEvidence = dispute.raisedBy === "customer" ? evidenceUrls : [];
  const vendorEvidence = dispute.raisedBy === "vendor" ? evidenceUrls : [];

  // Get Chat History (Phase 1 Monitoring)
  // Find conversation linked to booking
  let chatHistory: any[] = [];
  const [conversation] = await db.select()
    .from(chatConversations)
    .where(eq(chatConversations.bookingId, dispute.bookingId))
    .limit(1);

  if (conversation) {
    const messages = await db.select()
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, conversation.id))
      .orderBy(desc(chatMessages.createdAt));

    // Reverse to chronological order for AI context
    chatHistory = messages.reverse().map(m => ({
      sender: m.senderId === customer.id ? "Customer" : "Vendor",
      content: m.content,
      timestamp: m.createdAt,
      type: m.messageType
    }));
  }

  // Get previous responses in this dispute
  const previousResponses = await db
    .select()
    .from(disputeResponses)
    .where(eq(disputeResponses.disputeId, disputeId))
    .orderBy(desc(disputeResponses.createdAt));

  // Risk Metrics Calculation
  const customerStats = await getDisputeHistoryStats(customer.id);
  const vendorStats = await getDisputeHistoryStats(vendor.id);

  // Calculate message latencies (average response time in hours)
  const calculateLatency = (senderId: string) => {
    const senderMessages = chatHistory.filter(m =>
      (senderId === customer.id && m.sender === "Customer") ||
      (senderId === vendor.id && m.sender === "Vendor")
    );
    if (senderMessages.length < 2) return 0;

    let totalLatency = 0;
    let count = 0;
    for (let i = 1; i < chatHistory.length; i++) {
      const prev = chatHistory[i - 1];
      const curr = chatHistory[i];
      // Only count if this message was a response (different sender)
      if (prev.sender !== curr.sender &&
        ((senderId === customer.id && curr.sender === "Customer") ||
          (senderId === vendor.id && curr.sender === "Vendor"))) {
        const diff = new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime();
        totalLatency += diff / (1000 * 60 * 60); // Convert to hours
        count++;
      }
    }
    return count > 0 ? parseFloat((totalLatency / count).toFixed(1)) : 0;
  };

  // Scan for chargeback/threat keywords
  const chargebackKeywords = ['chargeback', 'bank', 'lawyer', 'sue', 'legal', 'police', 'fraud', 'scam'];
  const detectChargebackThreats = (senderId: string) => {
    const senderMessages = chatHistory.filter(m =>
      (senderId === customer.id && m.sender === "Customer") ||
      (senderId === vendor.id && m.sender === "Vendor")
    );
    for (const msg of senderMessages) {
      const content = (msg.content || "").toLowerCase();
      for (const keyword of chargebackKeywords) {
        if (content.includes(keyword)) return true;
      }
    }
    return false;
  };

  return {
    dispute: {
      ...dispute,
      customerId: booking.customerId,
      vendorId: booking.vendorId,
      escrowAmount: escrowAmount,
      customerDescription: dispute.description,
      vendorResponse: null,
    },
    booking,
    service,
    customer,
    vendor,
    customerEvidence,
    vendorEvidence,
    chatHistory,
    previousResponses,
    riskMetrics: {
      customer: {
        ...customerStats,
        accountAgeDays: Math.floor((Date.now() - new Date(customer.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
        avgLatencyHours: calculateLatency(customer.id),
        chargebackThreatDetected: detectChargebackThreats(customer.id)
      },
      vendor: {
        ...vendorStats,
        accountAgeDays: Math.floor((Date.now() - new Date(vendor.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
        avgLatencyHours: calculateLatency(vendor.id),
        chargebackThreatDetected: detectChargebackThreats(vendor.id)
      }
    }
  };
}

// ============================================
// AI ANALYSIS (Phase 2)
// ============================================

/**
 * Perform comprehensive AI analysis of the dispute (Initial Context Analysis)
 */
/**
 * Perform comprehensive AI analysis of the dispute (Initial Context Analysis)
 */
export async function analyzeDispute(disputeId: string): Promise<DisputeAiAnalysis> {
  const context = await gatherDisputeContext(disputeId);
  const prompt = buildAnalysisPrompt(context);

  const response = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [
      {
        role: "system",
        content: `You are a fair and highly vigilant dispute resolution AI. 
Your task is to analyze the entire chat history, evidence, and dispute metadata for a service marketplace dispute.

IMPORTANT:
- Carefully check for contradictions, suspicious behavior, or signs of manipulation from either party.
- Consider the tone, timing, and consistency of all communications.
- Factor in dispute history, message latency, sentiment shifts, and evidence submission timing.
- Penalize any detected bad-faith actions or fabricated claims.
- Identify and highlight any scam patterns such as chargeback threats, repeated contradictory requests, evasiveness, or suspicious edits.
- Assign a scam risk score (0-100) for each party based on your analysis.

Always respond in valid JSON format.`
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const aiResponse = JSON.parse(response.choices[0].message.content || "{}") as AiAnalysisResult;

  // Store analysis
  const [analysis] = await db
    .insert(disputeAiAnalysis)
    .values({
      disputeId,
      evidenceAnalysis: aiResponse.evidenceAnalysis,
      descriptionAnalysis: aiResponse.descriptionAnalysis,
      behaviorAnalysis: aiResponse.behaviorAnalysis, // Now includes scamRiskScore inside
      overallAssessment: aiResponse.overallAssessment,
      rawAiResponse: aiResponse,
      aiModel: AI_MODEL,
      aiPromptTokens: response.usage?.prompt_tokens,
      aiCompletionTokens: response.usage?.completion_tokens,
    })
    .returning();

  console.log(`[DisputeAI] Analyzed dispute ${disputeId} with fraud detection`);

  return analysis;
}

function buildAnalysisPrompt(context: DisputeContext & { riskMetrics: any }): string {
  const chatTranscript = context.chatHistory.length > 0
    ? context.chatHistory.map(m => `[${m.timestamp?.toISOString()}] ${m.sender}: ${m.content}`).join("\n")
    : "No chat history available.";

  return `Analyze this dispute and provide a comprehensive assessment including fraud risk.

## Dispute Details
- Dispute ID: ${context.dispute.id}
- Opened: ${context.dispute.createdAt}
- Amount in Escrow: ${context.dispute.escrowAmount} CHF

## Risk Metadata
- Customer: ${context.riskMetrics.customer.total} past disputes (${context.riskMetrics.customer.winRate * 100}% win rate), Account Age: ${context.riskMetrics.customer.accountAgeDays} days
- Vendor: ${context.riskMetrics.vendor.total} past disputes (${context.riskMetrics.vendor.winRate * 100}% win rate), Account Age: ${context.riskMetrics.vendor.accountAgeDays} days

## Booking Details
- Service: ${context.service?.title || "N/A"}
- Original Price: ${context.dispute.escrowAmount} CHF
- Booking Date: ${context.booking?.requestedStartTime?.toISOString() || "N/A"}

## Customer's Claim
${context.dispute.customerDescription || "No description provided"}

## Chat History (Phase 1)
${chatTranscript}

## Evidence Submitted
### Customer Evidence (${context.customerEvidence.length} items)
${context.customerEvidence.map((e: string, i: number) => `${i + 1}. ${e}`).join("\n") || "No evidence submitted"}

### Vendor Evidence (${context.vendorEvidence.length} items)
${context.vendorEvidence.map((e: string, i: number) => `${i + 1}. ${e}`).join("\n") || "No evidence submitted"}

## Response Format
{
  "evidenceAnalysis": {
    "customer": {
      "evidenceCount": number,
      "evidenceTypes": string[],
      "evidenceStrength": "strong" | "moderate" | "weak" | "none",
      "evidenceSummary": string
    },
    "vendor": {
      "evidenceCount": number,
      "evidenceTypes": string[],
      "evidenceStrength": "strong" | "moderate" | "weak" | "none",
      "evidenceSummary": string
    }
  },
  "descriptionAnalysis": {
    "customerAccount": string,
    "vendorAccount": string,
    "consistencyScore": number (0-100),
    "contradictions": string[],
    "verifiableClaims": string[]
  },
  "behaviorAnalysis": {
    "customer": {
      "scamRiskScore": number (0-100), // NEW: Fraud risk
      "scamRiskReasoning": "Why this score?",
      "responseTime": "fast" | "moderate" | "slow",
      "tone": "professional" | "hostile" | "cooperative"
    },
    "vendor": {
      "scamRiskScore": number (0-100), // NEW: Fraud risk
      "scamRiskReasoning": "Why this score?",
      "responseTime": "fast" | "moderate" | "slow",
      "tone": "professional" | "hostile" | "cooperative"
    }
  },
  "overallAssessment": {
    "primaryIssue": string,
    "faultAssessment": string,
    "mitigatingFactors": string[],
    "aggravatingFactors": string[]
  }
}`;
}

// ============================================
// RESOLUTION OPTIONS GENERATION (Phase 2)
// ============================================

/**
 * Generate 3 resolution options for Phase 2 via Consensus Service
 */
export async function generateResolutionOptions(
  disputeId: string,
  analysisId?: string
): Promise<DisputeAiOption[]> {
  const context = await gatherDisputeContext(disputeId);

  // Get analysis if available
  let analysis: DisputeAiAnalysis | null = null;
  if (analysisId) {
    const [a] = await db
      .select()
      .from(disputeAiAnalysis)
      .where(eq(disputeAiAnalysis.id, analysisId))
      .limit(1);
    analysis = a;
  } else {
    // Get latest analysis
    const [a] = await db
      .select()
      .from(disputeAiAnalysis)
      .where(eq(disputeAiAnalysis.disputeId, disputeId))
      .orderBy(desc(disputeAiAnalysis.createdAt))
      .limit(1);
    analysis = a;
  }

  const prompt = buildOptionsPrompt(context, analysis);

  // DELEGATE TO CONSENSUS SERVICE
  const result = await runConsensusPhase2(disputeId, prompt);

  console.log(`[DisputeAI] Consensus generated ${result.options.length} resolution options (Log ID: ${result.consensusLogId})`);

  // Return the options (they are already inserted by consensus service)
  return result.options as DisputeAiOption[];
}

function buildOptionsPrompt(context: DisputeContext & { riskMetrics: any }, analysis: DisputeAiAnalysis | null): string {
  const behavior = analysis?.behaviorAnalysis as any;
  const analysisSection = analysis ? `
## AI Analysis Summary
- Customer Scam Risk: ${behavior?.customer?.scamRiskScore || "N/A"} (${behavior?.customer?.scamRiskReasoning || ""})
- Vendor Scam Risk: ${behavior?.vendor?.scamRiskScore || "N/A"} (${behavior?.vendor?.scamRiskReasoning || ""})
- Primary Issue: ${(analysis.overallAssessment as any)?.primaryIssue || "N/A"}
` : "";

  const chatTranscript = context.chatHistory.length > 0
    ? context.chatHistory.map(m => `[${m.timestamp?.toISOString()}] ${m.sender}: ${m.content}`).join("\n")
    : "No chat history available.";

  return `Generate 3 progressive negotiation proposals for this dispute.

## Dispute Details
- Escrow Amount: ${context.dispute.escrowAmount} CHF
- Customer's Claim: ${context.dispute.customerDescription || "N/A"}

## Risk Metadata
- Customer: ${context.riskMetrics.customer.total} past disputes, Account Age: ${context.riskMetrics.customer.accountAgeDays} days
- Vendor: ${context.riskMetrics.vendor.total} past disputes, Account Age: ${context.riskMetrics.vendor.accountAgeDays} days

## Chat History Context
${chatTranscript}

${analysisSection}

## Instructions
- Provide 3 progressive options (Conservative, Balanced, Policy-Strict).
- Penalize any detected bad-faith actions or high scam risk scores in your proposals.
- If a party has a high scam risk (>70), their favorable options should be severely limited.

## Response Format
{
  "options": [
    {
      "label": "A", 
      "title": "Evidence-Based Resolution",
      "customerRefundPercent": number,
      "vendorPaymentPercent": number,
      "reasoning": "Brief explanation including risk factors"
    }
  ]
}`;
}

// ============================================
// FINAL DECISION (Phase 3)
// ============================================

/**
 * Generate binding AI decision for Phase 3 via Consensus Service
 */
export async function generateFinalDecision(disputeId: string): Promise<DisputeAiDecision> {
  const context = await gatherDisputeContext(disputeId);

  // Get all analysis and responses from Phase 2
  const [analysis] = await db
    .select()
    .from(disputeAiAnalysis)
    .where(eq(disputeAiAnalysis.disputeId, disputeId))
    .orderBy(desc(disputeAiAnalysis.createdAt))
    .limit(1);

  const options = await db
    .select()
    .from(disputeAiOptions)
    .where(eq(disputeAiOptions.disputeId, disputeId));

  const responses = await db
    .select()
    .from(disputeResponses)
    .where(eq(disputeResponses.disputeId, disputeId))
    .orderBy(desc(disputeResponses.createdAt));

  const prompt = buildDecisionPrompt(context, analysis, options, responses);

  // DELEGATE TO CONSENSUS SERVICE
  const result = await runConsensusPhase3(disputeId, prompt);

  // Store the decision in the decisions table (Consensus service only logs it, doesn't create the official decision record until here - actually wait, consensus service return format suggests it just returns data)
  // Let's check consensus service: runConsensusPhase3 returns { decision: {...}, consensusLogId }
  // We need to insert it into disputeAiDecisions here.

  const escrowAmount = parseFloat(context.dispute.escrowAmount);
  const customerAmount = Math.round(escrowAmount * result.decision.customerRefundPercent / 100 * 100) / 100;
  const vendorAmount = Math.round(escrowAmount * result.decision.vendorPaymentPercent / 100 * 100) / 100;

  const [decision] = await db
    .insert(disputeAiDecisions)
    .values({
      disputeId,
      customerRefundPercent: result.decision.customerRefundPercent,
      vendorPaymentPercent: result.decision.vendorPaymentPercent,
      customerRefundAmount: customerAmount.toFixed(2),
      vendorPaymentAmount: vendorAmount.toFixed(2),
      decisionSummary: result.decision.decisionSummary,
      fullReasoning: result.decision.fullReasoning,
      keyFactors: [], // Consensus might not return this yet, could add it
      status: "pending",
    })
    .returning();

  console.log(`[DisputeAI] Generated final decision for dispute ${disputeId} via Consensus`);

  return decision;
}

function buildDecisionPrompt(
  context: DisputeContext & { riskMetrics: any },
  analysis: DisputeAiAnalysis | null,
  options: DisputeAiOption[],
  responses: any[]
): string {
  const behavior = analysis?.behaviorAnalysis as any;
  const riskContext = analysis ? `
## AI Risk Assessment
- Customer Scam Risk: ${behavior?.customer?.scamRiskScore || "N/A"}
- Vendor Scam Risk: ${behavior?.vendor?.scamRiskScore || "N/A"}
` : "";

  // Summarize Phase 2 activity
  const customerResponses = responses.filter(r => r.userId === context.customer.id);
  const vendorResponses = responses.filter(r => r.userId === context.vendor.id);

  const phase2Summary = options.length > 0 ? `
## Phase 2 Options Presented
${options.map(o => `- Option ${o.optionLabel}: ${o.customerRefundPercent}% customer / ${o.vendorPaymentPercent}% vendor - ${o.optionTitle}`).join("\n")}

## Party Responses
- Customer selected: ${customerResponses.find(r => r.selectedOptionLabel)?.selectedOptionLabel || "None"}
- Vendor selected: ${vendorResponses.find(r => r.selectedOptionLabel)?.selectedOptionLabel || "None"}
` : "No Phase 2 options were generated.";

  const chatTranscript = context.chatHistory.length > 0
    ? context.chatHistory.map(m => `[${m.timestamp?.toISOString()}] ${m.sender}: ${m.content}`).join("\n")
    : "No chat history available.";

  return `Render a FINAL BINDING DECISION for this dispute.

## Dispute Details
- Escrow Amount: ${context.dispute.escrowAmount} CHF
- Customer's Claim: ${context.dispute.customerDescription || "N/A"}

## Risk Metadata
- Customer: ${context.riskMetrics.customer.total} past disputes, Account Age: ${context.riskMetrics.customer.accountAgeDays} days
- Vendor: ${context.riskMetrics.vendor.total} past disputes, Account Age: ${context.riskMetrics.vendor.accountAgeDays} days

${riskContext}

## Chat History
${chatTranscript}

${phase2Summary}

## Your Task
Make a final, binding decision.
- Re-assess any scam risk indicators and inconsistencies thoroughly.
- Use weighted reasoning across all evidence and behaviors to decide the fairest outcome.
- Explicitly mention detecting risk factors or suspicious behavior in your reasoning.

## Response Format
{
  "customerRefundPercent": number (0-100),
  "vendorPaymentPercent": number (0-100), // must be 100 - customerRefundPercent
  "decisionSummary": "One paragraph summary of the decision",
  "fullReasoning": "Detailed multi-paragraph explanation of the decision"
}`;
}

// ============================================
// DECISION EXECUTION
// ============================================

/**
 * Mark AI decision as executed after funds transfer
 */
export async function markDecisionExecuted(
  decisionId: string,
  customerRefundStripeId?: string,
  vendorPaymentStripeId?: string
): Promise<DisputeAiDecision> {
  const [updated] = await db
    .update(disputeAiDecisions)
    .set({
      status: "executed",
      executedAt: new Date(),
      customerRefundStripeId,
      vendorPaymentStripeId,
      updatedAt: new Date(),
    })
    .where(eq(disputeAiDecisions.id, decisionId))
    .returning();

  console.log(`[DisputeAI] Marked decision ${decisionId} as executed`);

  return updated;
}

/**
 * Mark AI decision as overridden by external resolution
 */
export async function markDecisionOverridden(
  decisionId: string,
  overriddenBy: "customer" | "vendor" | "both"
): Promise<DisputeAiDecision> {
  const [updated] = await db
    .update(disputeAiDecisions)
    .set({
      status: "overridden_external",
      overriddenBy,
      overriddenAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(disputeAiDecisions.id, decisionId))
    .returning();

  console.log(`[DisputeAI] Marked decision ${decisionId} as overridden by ${overriddenBy}`);

  return updated;
}

// ============================================
// QUERIES
// ============================================

export async function getLatestAnalysis(disputeId: string): Promise<DisputeAiAnalysis | null> {
  const [analysis] = await db
    .select()
    .from(disputeAiAnalysis)
    .where(eq(disputeAiAnalysis.disputeId, disputeId))
    .orderBy(desc(disputeAiAnalysis.createdAt))
    .limit(1);

  return analysis || null;
}

export async function getResolutionOptions(disputeId: string): Promise<DisputeAiOption[]> {
  return db
    .select()
    .from(disputeAiOptions)
    .where(eq(disputeAiOptions.disputeId, disputeId))
    .orderBy(disputeAiOptions.optionLabel);
}

export async function getAiDecision(disputeId: string): Promise<DisputeAiDecision | null> {
  const [decision] = await db
    .select()
    .from(disputeAiDecisions)
    .where(eq(disputeAiDecisions.disputeId, disputeId))
    .orderBy(desc(disputeAiDecisions.createdAt))
    .limit(1);

  return decision || null;
}
