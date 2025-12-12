import { convertToModelMessages, streamText, tool, type UIMessage } from "ai"
import { z } from "zod"

export const maxDuration = 60

// Mock service providers data
const serviceProviders = [
  {
    id: "1",
    name: "Maria's Cleaning Services",
    category: "home-services",
    subcategory: "Cleaning",
    rating: 4.9,
    reviews: 127,
    price: 85,
    priceType: "fixed",
    location: "Brooklyn, NY",
    distance: 2.3,
    available: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    nextAvailable: "Tomorrow, 9:00 AM",
    description: "Professional deep cleaning with eco-friendly products",
    image: "/professional-cleaning-service.png",
    verified: true,
  },
  {
    id: "2",
    name: "Mike's Plumbing Pro",
    category: "home-services",
    subcategory: "Plumbing",
    rating: 4.8,
    reviews: 89,
    price: 75,
    priceType: "hourly",
    location: "Manhattan, NY",
    distance: 3.1,
    available: ["Mon", "Wed", "Fri", "Sat"],
    nextAvailable: "Today, 2:00 PM",
    description: "Licensed plumber with 15+ years experience",
    image: "/professional-plumber-working.png",
    verified: true,
  },
  {
    id: "3",
    name: "FitLife Personal Training",
    category: "health-wellness",
    subcategory: "Personal Training",
    rating: 5.0,
    reviews: 64,
    price: 60,
    priceType: "hourly",
    location: "Queens, NY",
    distance: 4.2,
    available: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    nextAvailable: "Tomorrow, 7:00 AM",
    description: "Certified trainer specializing in weight loss and strength",
    image: "/personal-trainer-fitness-gym.jpg",
    verified: true,
  },
  {
    id: "4",
    name: "Sarah's Math Tutoring",
    category: "education",
    subcategory: "Academic Tutoring",
    rating: 4.9,
    reviews: 156,
    price: 45,
    priceType: "hourly",
    location: "Online / Bronx, NY",
    distance: 0,
    available: ["Mon", "Tue", "Wed", "Thu", "Sat", "Sun"],
    nextAvailable: "Today, 4:00 PM",
    description: "PhD student offering K-12 and college math tutoring",
    image: "/tutor-teaching-student.jpg",
    verified: true,
  },
  {
    id: "5",
    name: "EventPro Photography",
    category: "events",
    subcategory: "Photography",
    rating: 4.7,
    reviews: 203,
    price: 250,
    priceType: "fixed",
    location: "All NYC Areas",
    distance: 5.0,
    available: ["Fri", "Sat", "Sun"],
    nextAvailable: "Saturday, 10:00 AM",
    description: "Award-winning event and portrait photography",
    image: "/professional-photographer-event.jpg",
    verified: true,
  },
  {
    id: "6",
    name: "TechFix Solutions",
    category: "tech-support",
    subcategory: "Computer Repair",
    rating: 4.8,
    reviews: 91,
    price: 50,
    priceType: "fixed",
    location: "Manhattan, NY",
    distance: 2.8,
    available: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    nextAvailable: "Today, 11:00 AM",
    description: "Fast computer and laptop repair, data recovery",
    image: "/it-technician-computer-repair.jpg",
    verified: true,
  },
]

// Tools for the booking assistant
const searchServicesTool = tool({
  description: "Search for available services based on user requirements",
  inputSchema: z.object({
    serviceType: z.string().describe("Type of service needed"),
    budget: z.number().optional().describe("Maximum budget in dollars"),
    radius: z.number().optional().describe("Search radius in miles"),
    urgency: z.enum(["today", "this-week", "flexible"]).optional(),
  }),
  execute: async ({ serviceType, budget, radius, urgency }) => {
    // Filter providers based on criteria
    let filtered = serviceProviders.filter((p) => {
      const matchesType =
        p.subcategory.toLowerCase().includes(serviceType.toLowerCase()) ||
        p.category.includes(serviceType.toLowerCase()) ||
        p.description.toLowerCase().includes(serviceType.toLowerCase())
      const matchesBudget = !budget || p.price <= budget
      const matchesRadius = !radius || p.distance <= radius
      return matchesType && matchesBudget && matchesRadius
    })

    // Sort by rating
    filtered = filtered.sort((a, b) => b.rating - a.rating)

    return {
      found: filtered.length,
      providers: filtered.slice(0, 4),
      searchCriteria: { serviceType, budget, radius, urgency },
    }
  },
})

const getProviderDetailsTool = tool({
  description: "Get detailed information about a specific service provider",
  inputSchema: z.object({
    providerId: z.string().describe("The ID of the provider"),
  }),
  execute: async ({ providerId }) => {
    const provider = serviceProviders.find((p) => p.id === providerId)
    if (!provider) return { error: "Provider not found" }

    return {
      ...provider,
      fullSchedule: {
        monday: provider.available.includes("Mon") ? "9:00 AM - 5:00 PM" : "Unavailable",
        tuesday: provider.available.includes("Tue") ? "9:00 AM - 5:00 PM" : "Unavailable",
        wednesday: provider.available.includes("Wed") ? "9:00 AM - 5:00 PM" : "Unavailable",
        thursday: provider.available.includes("Thu") ? "9:00 AM - 5:00 PM" : "Unavailable",
        friday: provider.available.includes("Fri") ? "9:00 AM - 5:00 PM" : "Unavailable",
        saturday: provider.available.includes("Sat") ? "10:00 AM - 4:00 PM" : "Unavailable",
        sunday: provider.available.includes("Sun") ? "10:00 AM - 2:00 PM" : "Unavailable",
      },
      additionalInfo: {
        responseTime: "Usually responds within 1 hour",
        completedJobs: Math.floor(provider.reviews * 1.5),
        memberSince: "2022",
      },
    }
  },
})

const checkAvailabilityTool = tool({
  description: "Check specific availability for a provider on a date/time",
  inputSchema: z.object({
    providerId: z.string(),
    preferredDate: z.string().describe("Preferred date (e.g., 'tomorrow', 'Monday', 'Dec 15')"),
    preferredTime: z.string().optional().describe("Preferred time slot"),
  }),
  execute: async ({ providerId, preferredDate, preferredTime }) => {
    const provider = serviceProviders.find((p) => p.id === providerId)
    if (!provider) return { available: false, error: "Provider not found" }

    // Simulate availability check
    const availableSlots = ["9:00 AM", "11:00 AM", "1:00 PM", "3:00 PM"]
    const randomSlots = availableSlots.filter(() => Math.random() > 0.3)

    return {
      available: randomSlots.length > 0,
      providerId,
      providerName: provider.name,
      date: preferredDate,
      availableSlots: randomSlots,
      price: provider.price,
      priceType: provider.priceType,
    }
  },
})

const createBookingTool = tool({
  description: "Create a booking for a service",
  inputSchema: z.object({
    providerId: z.string(),
    date: z.string(),
    time: z.string(),
    serviceDetails: z.string().optional().describe("Additional details about the service needed"),
    contactName: z.string(),
    contactPhone: z.string().optional(),
    contactEmail: z.string().optional(),
    address: z.string().optional().describe("Service location if applicable"),
  }),
  execute: async ({ providerId, date, time, serviceDetails, contactName, contactPhone, contactEmail, address }) => {
    const provider = serviceProviders.find((p) => p.id === providerId)
    if (!provider) return { success: false, error: "Provider not found" }

    // Generate booking confirmation
    const bookingId = `BK${Date.now().toString(36).toUpperCase()}`

    return {
      success: true,
      bookingId,
      confirmation: {
        id: bookingId,
        provider: provider.name,
        service: provider.subcategory,
        date,
        time,
        price: provider.price,
        priceType: provider.priceType,
        location: address || provider.location,
        customerName: contactName,
        customerContact: contactPhone || contactEmail,
        status: "confirmed",
      },
      message: `Booking confirmed! ${provider.name} will ${provider.subcategory.toLowerCase()} on ${date} at ${time}.`,
    }
  },
})

const updateBookingPreferencesTool = tool({
  description: "Update the user's preferences for searching services",
  inputSchema: z.object({
    budget: z.number().optional(),
    radius: z.number().optional(),
    preferredDays: z.array(z.string()).optional(),
    serviceType: z.string().optional(),
    urgency: z.string().optional(),
  }),
  execute: async (prefs) => {
    return { updated: true, preferences: prefs }
  },
})

const systemPrompt = `You are a helpful AI booking assistant for Commerzio, a services marketplace. Your job is to help users find and book services with minimal effort.

YOUR WORKFLOW:
1. **Understand the need**: Ask what service they need (be conversational, not robotic)
2. **Gather preferences**: Ask about budget and location/radius - be casual about it
3. **Search & Present**: Use searchServices tool, then present options in a friendly way
4. **Help them choose**: Answer questions, compare options, give recommendations
5. **Book it**: Collect minimal info (name, contact, time) and confirm the booking

IMPORTANT BEHAVIORS:
- Be warm, helpful, and conversational - like a knowledgeable friend
- Ask ONE question at a time, don't overwhelm users
- When presenting options, highlight the best match and explain why
- Use the tools proactively - search as soon as you know what they need
- For booking, only ask for essential info: name, phone/email, preferred time
- Always confirm details before finalizing a booking
- If they seem unsure, make a recommendation based on ratings and value

CONVERSATION STARTERS - After greeting, ask:
"What can I help you find today?" or "What service are you looking for?"

PRESENTING RESULTS FORMAT:
When showing providers, mention: Name, Rating, Price, and one standout feature.
Example: "I found Maria's Cleaning (4.9★, $85) - they use eco-friendly products and can come tomorrow!"

BOOKING FLOW:
1. Confirm the provider choice
2. Check availability for their preferred time
3. Ask for their name and contact (phone or email)
4. Ask for service address if needed
5. Confirm all details and create booking

Keep responses concise but friendly. Celebrate when you find great options or complete a booking!`

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  const result = streamText({
    model: "anthropic/claude-sonnet-4",
    system: systemPrompt,
    messages: convertToModelMessages(messages),
    tools: {
      searchServices: searchServicesTool,
      getProviderDetails: getProviderDetailsTool,
      checkAvailability: checkAvailabilityTool,
      createBooking: createBookingTool,
      updatePreferences: updateBookingPreferencesTool,
    },
    maxOutputTokens: 2000,
  })

  return result.toUIMessageStreamResponse()
}
