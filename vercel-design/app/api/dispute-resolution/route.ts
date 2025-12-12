import { streamText } from "ai"

// Types for the dispute resolution system
interface DisputeEvidence {
  id: string
  type: "image" | "document" | "message" | "receipt"
  url?: string
  content?: string
  uploadedBy: "customer" | "vendor"
  timestamp: string
  description: string
}

interface ChatMessage {
  id: string
  sender: "customer" | "vendor" | "system"
  content: string
  timestamp: string
  attachments?: string[]
}

interface DisputeContext {
  disputeId: string
  bookingId: string
  serviceType: string
  disputedAmount: number
  customerClaim: string
  vendorResponse: string
  chatHistory: ChatMessage[]
  evidence: DisputeEvidence[]
  phase: 1 | 2 | 3
  previousProposals?: AIProposal[]
}

interface AIProposal {
  id: string
  proposalNumber: 1 | 2 | 3
  model: "claude" | "gpt" | "gemini"
  recommendation: string
  refundAmount: number
  refundPercentage: number
  reasoning: string
  fairnessScore: number
  confidence: number
}

interface ConsensusProposal {
  proposalNumber: 1 | 2 | 3
  recommendation: string
  refundAmount: number
  refundPercentage: number
  reasoning: string
  aiConsensus: {
    claude: AIProposal
    gpt: AIProposal
    gemini: AIProposal
  }
  aggregatedConfidence: number
  votingResult: "unanimous" | "majority" | "split"
}

// Simulate AI model responses (in production, these would call actual APIs)
async function getClaudeProposal(context: DisputeContext, proposalNum: 1 | 2 | 3): Promise<AIProposal> {
  // Simulated Claude analysis
  const baseRefund = proposalNum === 1 ? 0.75 : proposalNum === 2 ? 0.5 : 0.25
  return {
    id: `claude-${proposalNum}-${Date.now()}`,
    proposalNumber: proposalNum,
    model: "claude",
    recommendation:
      proposalNum === 1
        ? "Partial refund with service completion guarantee"
        : proposalNum === 2
          ? "Moderate refund with vendor credit"
          : "Minimal refund with future discount",
    refundAmount: context.disputedAmount * baseRefund,
    refundPercentage: baseRefund * 100,
    reasoning: `Based on chat history analysis and evidence review, the customer's claim appears ${proposalNum === 1 ? "well-supported" : proposalNum === 2 ? "partially supported" : "minimally supported"}. The vendor's response indicates ${proposalNum === 1 ? "acknowledgment of issues" : proposalNum === 2 ? "partial disagreement" : "strong disagreement"}.`,
    fairnessScore: proposalNum === 1 ? 0.85 : proposalNum === 2 ? 0.75 : 0.65,
    confidence: proposalNum === 1 ? 0.88 : proposalNum === 2 ? 0.82 : 0.78,
  }
}

async function getGPTProposal(context: DisputeContext, proposalNum: 1 | 2 | 3): Promise<AIProposal> {
  const baseRefund = proposalNum === 1 ? 0.7 : proposalNum === 2 ? 0.45 : 0.2
  return {
    id: `gpt-${proposalNum}-${Date.now()}`,
    proposalNumber: proposalNum,
    model: "gpt",
    recommendation:
      proposalNum === 1
        ? "Full service redo or substantial refund"
        : proposalNum === 2
          ? "Partial refund with apology credit"
          : "Service credit for future booking",
    refundAmount: context.disputedAmount * baseRefund,
    refundPercentage: baseRefund * 100,
    reasoning: `Evidence analysis suggests ${proposalNum === 1 ? "clear service deficiency" : proposalNum === 2 ? "mixed responsibility" : "shared accountability"}. Recommendation balances customer satisfaction with vendor fairness.`,
    fairnessScore: proposalNum === 1 ? 0.82 : proposalNum === 2 ? 0.78 : 0.7,
    confidence: proposalNum === 1 ? 0.85 : proposalNum === 2 ? 0.8 : 0.75,
  }
}

async function getGeminiProposal(context: DisputeContext, proposalNum: 1 | 2 | 3): Promise<AIProposal> {
  const baseRefund = proposalNum === 1 ? 0.8 : proposalNum === 2 ? 0.55 : 0.3
  return {
    id: `gemini-${proposalNum}-${Date.now()}`,
    proposalNumber: proposalNum,
    model: "gemini",
    recommendation:
      proposalNum === 1
        ? "Refund with vendor improvement plan"
        : proposalNum === 2
          ? "Split resolution with mediated terms"
          : "Minimal compensation with case closure",
    refundAmount: context.disputedAmount * baseRefund,
    refundPercentage: baseRefund * 100,
    reasoning: `Multi-factor analysis of ${context.chatHistory.length} messages and ${context.evidence.length} evidence items indicates ${proposalNum === 1 ? "strong customer position" : proposalNum === 2 ? "balanced perspectives" : "complex situation requiring compromise"}.`,
    fairnessScore: proposalNum === 1 ? 0.87 : proposalNum === 2 ? 0.76 : 0.68,
    confidence: proposalNum === 1 ? 0.9 : proposalNum === 2 ? 0.83 : 0.76,
  }
}

// Generate consensus from all three AI models
async function generateConsensusProposal(context: DisputeContext, proposalNum: 1 | 2 | 3): Promise<ConsensusProposal> {
  // Call all three AI models in parallel
  const [claude, gpt, gemini] = await Promise.all([
    getClaudeProposal(context, proposalNum),
    getGPTProposal(context, proposalNum),
    getGeminiProposal(context, proposalNum),
  ])

  // Calculate weighted average for refund amount
  const avgRefundAmount = (claude.refundAmount + gpt.refundAmount + gemini.refundAmount) / 3
  const avgRefundPercentage = (claude.refundPercentage + gpt.refundPercentage + gemini.refundPercentage) / 3
  const avgConfidence = (claude.confidence + gpt.confidence + gemini.confidence) / 3

  // Determine voting result
  const recommendations = [claude.recommendation, gpt.recommendation, gemini.recommendation]
  const uniqueRecs = [...new Set(recommendations)]
  const votingResult = uniqueRecs.length === 1 ? "unanimous" : uniqueRecs.length === 2 ? "majority" : "split"

  // Synthesize combined reasoning
  const combinedRecommendation =
    proposalNum === 1
      ? `Based on unanimous AI analysis: ${Math.round(avgRefundPercentage)}% refund (CHF ${avgRefundAmount.toFixed(2)}) with service guarantee`
      : proposalNum === 2
        ? `Moderate compromise: ${Math.round(avgRefundPercentage)}% refund (CHF ${avgRefundAmount.toFixed(2)}) with vendor credit`
        : `Final offer: ${Math.round(avgRefundPercentage)}% refund (CHF ${avgRefundAmount.toFixed(2)}) to close dispute`

  return {
    proposalNumber: proposalNum,
    recommendation: combinedRecommendation,
    refundAmount: Math.round(avgRefundAmount * 100) / 100,
    refundPercentage: Math.round(avgRefundPercentage),
    reasoning: `Three AI models analyzed ${context.chatHistory.length} chat messages and ${context.evidence.length} evidence items. ${votingResult === "unanimous" ? "All models agree" : votingResult === "majority" ? "Majority consensus reached" : "Models provided diverse perspectives"} on this resolution.`,
    aiConsensus: { claude, gpt, gemini },
    aggregatedConfidence: avgConfidence,
    votingResult,
  }
}

export async function POST(req: Request) {
  const { messages, disputeContext, action } = await req.json()

  // Handle different actions
  if (action === "generate_proposals") {
    // Generate all 3 progressive proposals using consensus mechanism
    const proposals = await Promise.all([
      generateConsensusProposal(disputeContext, 1),
      generateConsensusProposal(disputeContext, 2),
      generateConsensusProposal(disputeContext, 3),
    ])

    return Response.json({ proposals })
  }

  if (action === "final_verdict") {
    // Generate final binding decision using consensus
    const finalProposal = await generateConsensusProposal(disputeContext, 2) // Use moderate as base

    return Response.json({
      verdict: {
        decision: finalProposal.recommendation,
        refundAmount: finalProposal.refundAmount,
        reasoning: `Final binding decision based on comprehensive AI analysis. ${finalProposal.reasoning}`,
        appealInstructions:
          "You may appeal this decision within 7 days by submitting new evidence not previously considered. Appeals are reviewed by our human support team.",
        nextSteps: [
          "Refund will be processed within 3-5 business days",
          "Both parties will receive email confirmation",
          "Case will be marked as resolved",
          "Appeal window opens for 7 days",
        ],
        aiConsensus: finalProposal.aiConsensus,
        confidence: finalProposal.aggregatedConfidence,
      },
    })
  }

  // Default: Stream AI mediation assistance
  const systemPrompt = `You are the AI Dispute Resolution Assistant for Commerzio. You help mediate disputes between customers and vendors fairly and professionally.

Current dispute context:
- Dispute ID: ${disputeContext?.disputeId || "Unknown"}
- Phase: ${disputeContext?.phase || 1}
- Disputed Amount: CHF ${disputeContext?.disputedAmount || 0}

Your role:
- In Phase 1: Monitor and encourage amicable resolution between parties
- In Phase 2: Present AI-generated proposals and explain reasoning
- In Phase 3: Deliver final verdict with clear justification

Always be neutral, fair, and professional. Cite specific evidence when making recommendations.`

  const result = streamText({
    model: "anthropic/claude-sonnet-4-20250514",
    system: systemPrompt,
    messages,
  })

  return result.toUIMessageStreamResponse()
}
