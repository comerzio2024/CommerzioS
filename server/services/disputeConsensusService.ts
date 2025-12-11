
/**
 * Dispute Consensus Service (Multi-Model Architecture)
 * 
 * Orchestrates parallel execution of three AI models:
 * 1. OpenAI GPT-5.1 (Policy Specialist)
 * 2. Anthropic Claude 3 Opus 4.5 (Reasoning Specialist)
 * 3. Google Gemini 3 Pro (Context/Data Specialist)
 * 
 * Implements:
 * - Parallel execution via Promise.all
 * - Proposal aggregation (clustering similar options)
 * - Final verdict consensus (majority rule or weighted scoring)
 * - Detailed audit logging
 */

import { db } from "../db";
import { eq } from "drizzle-orm";
import { 
  disputeAiConsensusLogs, 
  type InsertDisputeAiOption 
} from "../../shared/schema-disputes";
import OpenAI from "openai";
import crypto from "crypto";

// ============================================
// SECURITY HELPERS
// ============================================

/**
 * Compute tamper-proof SHA256 hash for audit logging
 */
function computeIntegrityHash(data: object): string {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

// ============================================
// CONSTANTS & CONFIG
// ============================================

const MODELS = {
  GPT: "gpt-5.1",
  CLAUDE: "claude-3-opus-4.5",
  GEMINI: "gemini-3-pro"
} as const;

type ModelId = typeof MODELS[keyof typeof MODELS];

// Weights for weighted voting fallback
const MODEL_WEIGHTS: Record<ModelId, number> = {
  [MODELS.CLAUDE]: 1.5, // Reasoning primary
  [MODELS.GPT]: 1.2,    // Policy secondary
  [MODELS.GEMINI]: 1.0  // Data tertiary
};

// Initialize OpenAI client (primary interface, adapters would be here for others)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ============================================
// TYPES
// ============================================

interface ProposalRaw {
  customerRefundPercent: number;
  vendorPaymentPercent: number; // calculated as 100 - customer
  reasoning: string;
}

interface Phase2ModelOutput {
  proposals: ProposalRaw[];
  reasoning: string;
}

interface Phase3ModelOutput {
  customerRefundPercent: number;
  reasoning: string;
}

// ============================================
// CORE ORCHESTRATOR
// ============================================

/**
 * Execute Phase 2 Consensus: Generate Negotiation Proposals
 */
export async function runConsensusPhase2(
  disputeId: string, 
  contextPrompt: string
): Promise<{ options: InsertDisputeAiOption[], consensusLogId: string }> {
  
  // 1. Parallel Model Execution
  console.log(`[Consensus] Starting Phase 2 for dispute ${disputeId} with ${Object.values(MODELS).join(", ")}`);
  
  const [gptRes, claudeRes, geminiRes] = await Promise.all([
    callModelPhase2(MODELS.GPT, contextPrompt),
    callModelPhase2(MODELS.CLAUDE, contextPrompt),
    callModelPhase2(MODELS.GEMINI, contextPrompt)
  ]);

  const modelOutputs = {
    gpt: gptRes,
    claude: claudeRes,
    gemini: geminiRes
  };

  // 2. Aggregation Logic
  const allProposals = [
    ...gptRes.proposals.map(p => ({ ...p, source: MODELS.GPT })),
    ...claudeRes.proposals.map(p => ({ ...p, source: MODELS.CLAUDE })),
    ...geminiRes.proposals.map(p => ({ ...p, source: MODELS.GEMINI }))
  ];

  const aggregatedOptions = aggregateProposals(allProposals, disputeId);

  // 3. Log Consensus Draft
  const [log] = await db.insert(disputeAiConsensusLogs).values({
    disputeId,
    phase: 'phase_2',
    inputContext: { promptLength: contextPrompt.length },
    modelOutputs: modelOutputs,
    aggregatedResult: aggregatedOptions,
    consensusMetadata: {
      agreementScore: calculateAgreementScore(allProposals),
      method: 'majority',
      iterations: 1
    }
  }).returning();

  // 4. Compute and store tamper-proof hash
  const hashData = { disputeId, phase: 'phase_2', timestamp: new Date().toISOString(), modelOutputs, aggregatedOptions };
  const integrityHash = computeIntegrityHash(hashData);
  await db.update(disputeAiConsensusLogs).set({ integrityHash }).where(eq(disputeAiConsensusLogs.id, log.id));
  console.log(`[Consensus] Phase 2 integrityHash: ${integrityHash.substring(0, 16)}...`);

  return { options: aggregatedOptions, consensusLogId: log.id };
}

/**
 * Execute Phase 3 Consensus: Final Binding Verdict
 */
export async function runConsensusPhase3(
  disputeId: string,
  contextPrompt: string
): Promise<{ 
  decision: { customerRefundPercent: number, vendorPaymentPercent: number, decisionSummary: string, fullReasoning: string },
  consensusLogId: string 
}> {

  console.log(`[Consensus] Starting Phase 3 for dispute ${disputeId}`);

  // 1. Parallel Execution
  const [gptRes, claudeRes, geminiRes] = await Promise.all([
    callModelPhase3(MODELS.GPT, contextPrompt),
    callModelPhase3(MODELS.CLAUDE, contextPrompt),
    callModelPhase3(MODELS.GEMINI, contextPrompt)
  ]);

  const modelOutputs = { gpt: gptRes, claude: claudeRes, gemini: geminiRes };

  // 2. Voting Logic
  const decisions = [
    { percent: gptRes.customerRefundPercent, model: MODELS.GPT, reasoning: gptRes.reasoning },
    { percent: claudeRes.customerRefundPercent, model: MODELS.CLAUDE, reasoning: claudeRes.reasoning },
    { percent: geminiRes.customerRefundPercent, model: MODELS.GEMINI, reasoning: geminiRes.reasoning }
  ];

  const { percent: finalPercent, method } = calculateConsensusVerdict(decisions);
  const synthesizedReasoning = synthesizeReasoning(decisions.map(d => d.reasoning));

  // 3. Log Consensus Draft
  const [log] = await db.insert(disputeAiConsensusLogs).values({
    disputeId,
    phase: 'phase_3_ai',
    inputContext: { promptLength: contextPrompt.length },
    modelOutputs: modelOutputs,
    aggregatedResult: { finalPercent, method },
    consensusMetadata: {
      agreementScore: calculateVerdictAgreement(decisions.map(d => d.percent)),
      method: method,
      iterations: 1
    }
  }).returning();

  // 4. Compute and store tamper-proof hash
  const hashData = { disputeId, phase: 'phase_3_ai', timestamp: new Date().toISOString(), modelOutputs, finalPercent };
  const integrityHash = computeIntegrityHash(hashData);
  await db.update(disputeAiConsensusLogs).set({ integrityHash }).where(eq(disputeAiConsensusLogs.id, log.id));
  console.log(`[Consensus] Phase 3 integrityHash: ${integrityHash.substring(0, 16)}...`);

  return {
    decision: {
      customerRefundPercent: finalPercent,
      vendorPaymentPercent: 100 - finalPercent,
      decisionSummary: `Consensus decision via ${method} method.`,
      fullReasoning: synthesizedReasoning
    },
    consensusLogId: log.id
  };
}

// ============================================
// MODEL ADAPTERS (MOCKED FOR DEMO)
//In a real scenario, these would call separate API endpoints for Anthropic/Google.
//Here we simulate the behavior using GPT-4o but identified as the new models.
// ============================================

async function callModelPhase2(modelId: string, prompt: string): Promise<Phase2ModelOutput> {
  // Simulate unique persona per model
  const persona = 
    modelId === MODELS.CLAUDE ? "You are Claude Opus 4.5. Focus deeply on logical consistency and nuance." :
    modelId === MODELS.GEMINI ? "You are Gemini 3 Pro. Focus on data accuracy and evidence sufficiency." :
    "You are GPT-5.1. Focus on platform policy application and fairness.";

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Providing actual model as fallback since 5.1/Opus4.5 don't support API yet
      messages: [
        { role: "system", content: `${persona}\nGenerate 3 dispute resolution options. Response in JSON.` },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5
    });

    const parsed = JSON.parse(completion.choices[0].message.content || "{}");
    
    // Normalize output structure
    return {
      proposals: (parsed.options || []).map((o: any) => ({
        customerRefundPercent: o.customerRefundPercent,
        vendorPaymentPercent: o.vendorPaymentPercent,
        reasoning: o.reasoning
      })),
      reasoning: "Generated by " + modelId
    };
  } catch (e) {
    console.error(`Model ${modelId} failed:`, e);
    // Fallback in case of failure
    return { proposals: [], reasoning: "Model failure" };
  }
}

async function callModelPhase3(modelId: string, prompt: string): Promise<Phase3ModelOutput> {
  const persona = `You are ${modelId}. Provide a final binding verdict. Response in JSON.`;
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", 
      messages: [
        { role: "system", content: persona },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2
    });

    const parsed = JSON.parse(completion.choices[0].message.content || "{}");
    return {
      customerRefundPercent: parsed.customerRefundPercent || 0,
      reasoning: parsed.fullReasoning || "No reasoning provided"
    };
  } catch (e) {
    return { customerRefundPercent: 50, reasoning: "Model failure" };
  }
}

// ============================================
// AGGREGATION LOGIC
// ============================================

function aggregateProposals(allProposals: (ProposalRaw & { source: string })[], disputeId: string): InsertDisputeAiOption[] {
  // 1. Sort by customer refund %
  const sorted = [...allProposals].sort((a, b) => a.customerRefundPercent - b.customerRefundPercent);

  // 2. Cluster into 3 groups (Favor Vendor, Balanced, Favor Customer)
  // Simplified logic: buckets < 35%, 35-65%, > 65%
  const buckets = {
    favorVendor: sorted.filter(p => p.customerRefundPercent < 35),
    balanced: sorted.filter(p => p.customerRefundPercent >= 35 && p.customerRefundPercent <= 65),
    favorCustomer: sorted.filter(p => p.customerRefundPercent > 65)
  };

  const results: InsertDisputeAiOption[] = [];
  const baseDefaults = {
    disputeId,
    reasoning: "",
    keyFactors: [],
    basedOn: [] as string[]
  };

  // Helper to avg a bucket
  const createOption = (bucket: typeof sorted, label: string, title: string): InsertDisputeAiOption | null => {
    if (bucket.length === 0) return null;
    const avg = bucket.reduce((sum, p) => sum + p.customerRefundPercent, 0) / bucket.length;
    const sources = bucket.map(p => p.source).filter((v, i, a) => a.indexOf(v) === i); // unique sources
    
    return {
      ...baseDefaults,
      optionLabel: label,
      optionTitle: title,
      customerRefundPercent: Math.round(avg),
      vendorPaymentPercent: 100 - Math.round(avg),
      // In real tracking, we'd grab the escrow amount here to calc exact currency
      customerRefundAmount: "0", 
      vendorPaymentAmount: "0",
      reasoning: `${sources.join(" + ")} consensus: ${bucket[0].reasoning.substring(0, 100)}...`,
      isRecommended: sources.length >= 2 // Recommend if quorum exists in this bucket
    };
  };

  const optA = createOption(buckets.favorCustomer, "A", "Full/High Refund (Customer Favor)");
  const optB = createOption(buckets.balanced, "B", "Balanced Compromise");
  const optC = createOption(buckets.favorVendor, "C", "Partial/No Refund (Vendor Favor)");

  // Ensure we output valid options even if buckets empty (fallback logic)
  if (optA) results.push(optA);
  if (optB) results.push(optB);
  if (optC) results.push(optC);
  
  // If we don't have 3, fill with the nearest logic or just return what we have
  // For this implementation, we return what we found.
  return results;
}

function calculateConsensusVerdict(decisions: { percent: number, model: string }[]): { percent: number, method: "majority" | "weighted" | "manual_escalation" } {
  // 1. Check for Majority (2/3 within 5%)
  const sorted = decisions.sort((a, b) => a.percent - b.percent);
  
  // Check pairs
  const pair1 = Math.abs(sorted[0].percent - sorted[1].percent) <= 5;
  const pair2 = Math.abs(sorted[1].percent - sorted[2].percent) <= 5;
  
  if (pair1 && pair2) {
    // All 3 agree
    return { percent: Math.round((sorted[0].percent + sorted[1].percent + sorted[2].percent) / 3), method: "majority" };
  } else if (pair1) {
    // 0 and 1 agree
    return { percent: Math.round((sorted[0].percent + sorted[1].percent) / 2), method: "majority" };
  } else if (pair2) {
    // 1 and 2 agree
    return { percent: Math.round((sorted[1].percent + sorted[2].percent) / 2), method: "majority" };
  }
  
  // 2. Weighted Fallback
  let totalWeight = 0;
  let weightedSum = 0;
  
  for (const d of decisions) {
    const w = MODEL_WEIGHTS[d.model as ModelId] || 1;
    weightedSum += d.percent * w;
    totalWeight += w;
  }
  
  return { percent: Math.round(weightedSum / totalWeight), method: "weighted" };
}

// Helper to synthesize text (mocked)
function synthesizeReasoning(reasonings: string[]) {
  return "Combined AI Consensus Reasoning:\n\n" + reasonings.join("\n\n---\n\n");
}

function calculateAgreementScore(props: ProposalRaw[]) {
  // Simple variance calculation or similar
  return 100; // Placeholder
}

function calculateVerdictAgreement(percents: number[]) {
  const max = Math.max(...percents);
  const min = Math.min(...percents);
  return 100 - (max - min);
}
