import { convertToModelMessages, streamText, tool, type UIMessage } from "ai"
import { z } from "zod"

export const maxDuration = 60

// Categories and subcategories for the AI to suggest
const categoryData = {
  "home-services": {
    name: "Home Services",
    subcategories: ["Plumbing", "Electrical", "Painting", "HVAC", "General Repairs", "Cleaning"],
  },
  "health-wellness": {
    name: "Health & Wellness",
    subcategories: ["Personal Training", "Massage Therapy", "Nutrition", "Mental Health", "Physiotherapy"],
  },
  education: {
    name: "Education",
    subcategories: ["Academic Tutoring", "Language Lessons", "Music Lessons", "Math & Science"],
  },
  events: {
    name: "Events",
    subcategories: ["Photography", "Catering", "DJ & Music", "Event Planning"],
  },
  "tech-support": {
    name: "Tech Support",
    subcategories: ["Computer Repair", "Phone Repair", "Network Setup", "Data Recovery"],
  },
  automotive: {
    name: "Automotive",
    subcategories: ["Mechanics", "Delivery Services", "Bike Courier", "Moving Services"],
  },
  security: {
    name: "Security",
    subcategories: ["Home Security", "Surveillance", "Security Guards"],
  },
}

const updateListingTool = tool({
  description:
    "Update the listing data based on information gathered from the conversation. Call this whenever you have new information about the listing.",
  inputSchema: z.object({
    title: z.string().optional().describe("Service title"),
    description: z.string().optional().describe("Full service description"),
    shortDescription: z.string().optional().describe("Brief tagline for the service"),
    category: z.string().optional().describe("Main category ID"),
    subcategory: z.string().optional().describe("Subcategory name"),
    pricingType: z.enum(["fixed", "hourly", "package"]).optional(),
    basePrice: z.number().optional(),
    hourlyRate: z.number().optional(),
    tags: z.array(z.string()).optional(),
    experience: z.string().optional(),
    serviceArea: z.enum(["local", "regional", "remote"]).optional(),
    city: z.string().optional(),
    availableDays: z.array(z.string()).optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
  }),
  execute: async (data) => {
    return { success: true, updatedFields: Object.keys(data).filter((k) => data[k as keyof typeof data] !== undefined) }
  },
})

const suggestCategoryTool = tool({
  description: "Suggest the best category and subcategory for the service based on the description",
  inputSchema: z.object({
    serviceDescription: z.string().describe("Description of the service"),
  }),
  execute: async ({ serviceDescription }) => {
    // In a real app, this would use AI to analyze and suggest
    const suggestions = []
    const desc = serviceDescription.toLowerCase()

    if (
      desc.includes("clean") ||
      desc.includes("house") ||
      desc.includes("plumb") ||
      desc.includes("repair") ||
      desc.includes("paint") ||
      desc.includes("electric")
    ) {
      suggestions.push({ category: "home-services", confidence: 0.9 })
    }
    if (
      desc.includes("fitness") ||
      desc.includes("train") ||
      desc.includes("health") ||
      desc.includes("massage") ||
      desc.includes("therapy")
    ) {
      suggestions.push({ category: "health-wellness", confidence: 0.85 })
    }
    if (
      desc.includes("tutor") ||
      desc.includes("teach") ||
      desc.includes("lesson") ||
      desc.includes("music") ||
      desc.includes("language")
    ) {
      suggestions.push({ category: "education", confidence: 0.85 })
    }
    if (
      desc.includes("photo") ||
      desc.includes("video") ||
      desc.includes("event") ||
      desc.includes("wedding") ||
      desc.includes("cater") ||
      desc.includes("dj")
    ) {
      suggestions.push({ category: "events", confidence: 0.9 })
    }
    if (
      desc.includes("computer") ||
      desc.includes("phone") ||
      desc.includes("tech") ||
      desc.includes("it ") ||
      desc.includes("network") ||
      desc.includes("software")
    ) {
      suggestions.push({ category: "tech-support", confidence: 0.9 })
    }
    if (
      desc.includes("car") ||
      desc.includes("mechanic") ||
      desc.includes("delivery") ||
      desc.includes("moving") ||
      desc.includes("transport")
    ) {
      suggestions.push({ category: "automotive", confidence: 0.85 })
    }

    return {
      suggestions: suggestions.length > 0 ? suggestions : [{ category: "home-services", confidence: 0.5 }],
      categoryData,
    }
  },
})

const generateListingContentTool = tool({
  description:
    "Generate professional listing content including title, description, and tags based on service information",
  inputSchema: z.object({
    serviceType: z.string(),
    experience: z.string().optional(),
    specialties: z.array(z.string()).optional(),
    location: z.string().optional(),
  }),
  execute: async ({ serviceType, experience, specialties, location }) => {
    return {
      generatedTitle: `Professional ${serviceType} Services`,
      generatedDescription: `Expert ${serviceType.toLowerCase()} services with ${experience || "years of"} experience. ${specialties?.length ? `Specializing in ${specialties.join(", ")}.` : ""} ${location ? `Serving the ${location} area.` : ""} Quality work guaranteed with attention to detail and customer satisfaction.`,
      suggestedTags: [
        serviceType.toLowerCase(),
        "professional",
        "experienced",
        "reliable",
        ...(specialties || []).map((s) => s.toLowerCase()),
      ],
    }
  },
})

const analyzeImageTool = tool({
  description: "Analyze an uploaded image to extract service-related information",
  inputSchema: z.object({
    imageDescription: z.string().describe("User description of what the image shows"),
  }),
  execute: async ({ imageDescription }) => {
    return {
      analysis: `Image shows: ${imageDescription}. This will help customers understand your service better.`,
      suggestedCaption: `Professional service demonstration`,
    }
  },
})

const finalizeListingTool = tool({
  description: "Mark the listing as ready to publish and show final preview",
  inputSchema: z.object({
    confirmReady: z.boolean().describe("Whether all required fields are complete"),
  }),
  execute: async ({ confirmReady }) => {
    return {
      ready: confirmReady,
      message: confirmReady ? "Your listing is ready to publish!" : "Please provide the missing information first.",
    }
  },
})

const systemPrompt = `You are a friendly AI assistant helping vendors create professional service listings on Commerzio, a services marketplace platform.

Your goal is to make listing creation effortless. Guide the conversation naturally to gather all needed information:

1. **Service Information**: What service they offer, their experience, specialties
2. **Category**: Help them pick the right category (use suggestCategory tool)
3. **Pricing**: How they want to charge (fixed price, hourly, or packages)
4. **Availability**: When they're available, service area
5. **Media**: Encourage them to share photos of their work

IMPORTANT BEHAVIORS:
- Be conversational and friendly, not robotic
- Ask one or two questions at a time, don't overwhelm
- When you have information, immediately call updateListing to save it
- Suggest improvements to make their listing stand out
- After gathering key info, use generateListingContent to create professional text
- Always confirm details before finalizing
- Celebrate their progress and encourage them

REQUIRED FIELDS TO GATHER:
- Service type/title
- Description of what they offer  
- Category and subcategory
- Pricing (at least one pricing method)
- Location/service area

START by warmly greeting them and asking what service they'd like to offer. Keep the conversation flowing naturally!`

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  const result = streamText({
    model: "anthropic/claude-sonnet-4",
    system: systemPrompt,
    messages: convertToModelMessages(messages),
    tools: {
      updateListing: updateListingTool,
      suggestCategory: suggestCategoryTool,
      generateListingContent: generateListingContentTool,
      analyzeImage: analyzeImageTool,
      finalizeListing: finalizeListingTool,
    },
    maxOutputTokens: 2000,
  })

  return result.toUIMessageStreamResponse()
}
