import { streamText, tool } from "ai"
import { z } from "zod"

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = streamText({
    model: "anthropic/claude-sonnet-4-20250514",
    system: `You are a friendly service request assistant for Commerzio, a professional services marketplace.
Your job is to help users submit service requests that will be published to the marketplace and alert relevant vendors.

CONVERSATION FLOW:
1. Greet and ask what service they need (be conversational, understand their problem)
2. Ask clarifying questions about the job:
   - What exactly needs to be done?
   - When do they need it? (urgent, flexible, specific date)
   - Where is the location?
   - What's their budget range? (or if they want quotes)
3. Once you have enough info, use the createServiceRequest tool to publish it
4. After publishing, explain that vendors will be notified and can respond with proposals
5. Help them review any proposals that come in

GUIDELINES:
- Be conversational and helpful, not robotic
- Ask one or two questions at a time, not a long list
- Infer the service category from their description
- If they're unsure about budget, suggest they can receive quotes
- Emphasize that multiple vendors may respond with competitive offers
- Keep responses concise and friendly`,
    messages,
    tools: {
      analyzeRequest: tool({
        description: "Analyze the user's service request to extract key information",
        parameters: z.object({
          serviceType: z.string().describe("Type of service needed"),
          description: z.string().describe("Detailed description of the job"),
          urgency: z.enum(["urgent", "this_week", "flexible", "specific_date"]),
          specificDate: z.string().optional().describe("Specific date if provided"),
        }),
        execute: async ({ serviceType, description, urgency, specificDate }) => {
          return {
            category: serviceType,
            suggestedCategories: ["Home Services", "Repairs", "Maintenance"],
            estimatedResponses: Math.floor(Math.random() * 5) + 3,
          }
        },
      }),
      createServiceRequest: tool({
        description: "Publish a service request to the marketplace and notify relevant vendors",
        parameters: z.object({
          title: z.string().describe("Short title for the request"),
          description: z.string().describe("Detailed description of what's needed"),
          category: z.string().describe("Service category"),
          subcategory: z.string().optional(),
          location: z.string().describe("Service location"),
          urgency: z.enum(["urgent", "this_week", "flexible", "specific_date"]),
          preferredDate: z.string().optional(),
          budgetType: z.enum(["fixed", "hourly", "quotes"]),
          budgetMin: z.number().optional(),
          budgetMax: z.number().optional(),
          images: z.array(z.string()).optional(),
        }),
        execute: async (params) => {
          // Simulate publishing the request
          const requestId = `REQ-${Date.now().toString(36).toUpperCase()}`
          const vendorsNotified = Math.floor(Math.random() * 12) + 8

          return {
            success: true,
            requestId,
            vendorsNotified,
            estimatedResponses: Math.floor(vendorsNotified * 0.4),
            expiresIn: "7 days",
            request: params,
          }
        },
      }),
      getProposals: tool({
        description: "Get proposals from vendors for a service request",
        parameters: z.object({
          requestId: z.string(),
        }),
        execute: async ({ requestId }) => {
          // Simulate vendor proposals
          return {
            proposals: [
              {
                id: "prop-1",
                vendorName: "Mike's Plumbing",
                rating: 4.8,
                reviews: 127,
                price: "$120",
                message: "I can help with this today! I have 15 years experience with similar jobs.",
                availability: "Available today",
                verified: true,
              },
              {
                id: "prop-2",
                vendorName: "Quick Fix Services",
                rating: 4.6,
                reviews: 89,
                price: "$95",
                message: "Happy to take a look. Can be there within 2 hours.",
                availability: "Available now",
                verified: true,
              },
              {
                id: "prop-3",
                vendorName: "Pro Home Repairs",
                rating: 4.9,
                reviews: 234,
                price: "$150",
                message: "Expert in this area. Free diagnostic included.",
                availability: "Tomorrow morning",
                verified: true,
              },
            ],
            totalProposals: 3,
          }
        },
      }),
      acceptProposal: tool({
        description: "Accept a vendor's proposal",
        parameters: z.object({
          proposalId: z.string(),
          vendorName: z.string(),
        }),
        execute: async ({ proposalId, vendorName }) => {
          return {
            success: true,
            bookingId: `BK-${Date.now().toString(36).toUpperCase()}`,
            vendorName,
            vendorPhone: "(555) 123-4567",
            nextSteps: "The vendor will contact you shortly to confirm details.",
          }
        },
      }),
      askVendorQuestion: tool({
        description: "Send a question to a vendor about their proposal",
        parameters: z.object({
          proposalId: z.string(),
          vendorName: z.string(),
          question: z.string(),
        }),
        execute: async ({ proposalId, vendorName, question }) => {
          return {
            sent: true,
            vendorName,
            estimatedReply: "Usually responds within 30 minutes",
          }
        },
      }),
    },
    maxSteps: 10,
  })

  return result.toUIMessageStreamResponse()
}
