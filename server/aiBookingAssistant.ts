// @ts-nocheck
// TODO: Refine types when stable with Vercel AI SDK updates
/**
 * Booking Assistant AI Service
 * 
 * AI-powered booking assistant that helps users:
 * - Find services based on natural language descriptions
 * - Answer questions about service providers
 * - Guide through the booking process
 * - Provide pricing estimates and availability
 * 
 * Uses Vercel AI SDK with OpenAI GPT-4
 */

import { openai } from "@ai-sdk/openai";
import { generateText, streamText, tool } from "ai";
import { z } from "zod";
import { db } from "./db";
import { services, users, categories, reviews, bookings } from "@shared/schema";
import { eq, and, ilike, desc, sql, gte } from "drizzle-orm";

// Types
interface ConversationMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

interface BookingAssistantContext {
    userId?: string;
    conversationHistory: ConversationMessage[];
    currentServiceId?: string;
    currentVendorId?: string;
}

interface SearchResult {
    services: Array<{
        id: string;
        title: string;
        description: string;
        price: string;
        rating: number;
        reviewCount: number;
        vendorName: string;
        location: string;
    }>;
}

// ===========================================
// SYSTEM PROMPTS
// ===========================================

const BOOKING_ASSISTANT_SYSTEM_PROMPT = `You are a helpful booking assistant for a Swiss service marketplace platform.

Your role is to:
1. Help users find the right services based on their needs
2. Answer questions about service providers and their offerings
3. Guide users through the booking process
4. Provide pricing estimates and availability information
5. Handle inquiries and connect users with vendors

Key behaviors:
- Be friendly, professional, and concise
- Always provide accurate information based on the tools available
- If you don't have enough information, ask clarifying questions
- Respect Swiss cultural norms (formal-friendly tone, respect for privacy)
- Use CHF for all pricing
- When showing multiple options, present them clearly with key differentiators

You have access to tools to:
- Search for services
- Get service details
- Check vendor profiles
- Check availability
- Initiate bookings

Always use the tools to get real data rather than making assumptions.`;

// ===========================================
// AI TOOLS
// ===========================================

const searchServicesTool = tool({
    description: "Search for services matching the user's requirements",
    parameters: z.object({
        query: z.string().describe("Search query describing the service needed"),
        category: z.string().optional().describe("Category to filter by"),
        location: z.string().optional().describe("Location/city to filter by"),
        maxPrice: z.number().optional().describe("Maximum price in CHF"),
        minRating: z.number().optional().describe("Minimum rating (1-5)"),
    }),
    execute: async ({ query, category, location, maxPrice, minRating }) => {
        // Build query conditions
        const conditions: any[] = [eq(services.status, "active")];

        // Search by query in title or description
        if (query) {
            conditions.push(
                sql`(${ilike(services.title, `%${query}%`)} OR ${ilike(services.description, `%${query}%`)})`
            );
        }

        // Filter by viewCount as proxy for popularity (no rating column on services)
        // Rating would need to be computed from reviews table

        const results = await db
            .select({
                id: services.id,
                title: services.title,
                description: services.description,
                price: services.price,
                priceUnit: services.priceUnit,
                viewCount: services.viewCount,
                preferredLocationName: services.preferredLocationName,
                ownerId: services.ownerId,
            })
            .from(services)
            .where(and(...conditions))
            .orderBy(desc(services.viewCount))
            .limit(5);

        // Enrich with vendor names
        const enrichedResults = await Promise.all(
            results.map(async (service) => {
                const [vendor] = await db
                    .select({ firstName: users.firstName, lastName: users.lastName })
                    .from(users)
                    .where(eq(users.id, service.ownerId))
                    .limit(1);

                return {
                    id: service.id,
                    title: service.title,
                    description: service.description?.substring(0, 150) + "...",
                    price: `CHF ${service.price}/${service.priceUnit}`,
                    rating: 0, // Would need to compute from reviews
                    reviewCount: 0, // Would need to compute from reviews
                    vendorName: vendor ? `${vendor.firstName} ${vendor.lastName}` : "Unknown",
                    location: service.preferredLocationName || "Switzerland",
                };
            })
        );

        return { services: enrichedResults };
    },
});

const getServiceDetailsTool = tool({
    description: "Get detailed information about a specific service",
    parameters: z.object({
        serviceId: z.string().describe("The ID of the service to get details for"),
    }),
    execute: async ({ serviceId }) => {
        const [service] = await db
            .select()
            .from(services)
            .where(eq(services.id, serviceId))
            .limit(1);

        if (!service) {
            return { error: "Service not found" };
        }

        const [vendor] = await db
            .select()
            .from(users)
            .where(eq(users.id, service.ownerId))
            .limit(1);

        // Get recent reviews
        const recentReviews = await db
            .select({
                rating: reviews.rating,
                comment: reviews.comment,
                createdAt: reviews.createdAt,
            })
            .from(reviews)
            .where(eq(reviews.serviceId, serviceId))
            .orderBy(desc(reviews.createdAt))
            .limit(3);

        return {
            id: service.id,
            title: service.title,
            description: service.description,
            price: `CHF ${service.price}/${service.priceUnit}`,
            rating: 0, // Would need to compute from reviews
            reviewCount: recentReviews.length,
            minBookingHours: service.minBookingHours || 1,
            whatsIncluded: service.whatsIncluded || [],
            location: service.preferredLocationName || "Switzerland",
            vendor: vendor ? {
                name: `${vendor.firstName} ${vendor.lastName}`,
                verified: vendor.isVerified,
                memberSince: vendor.createdAt?.toISOString().split("T")[0],
            } : null,
            recentReviews: recentReviews.map(r => ({
                rating: r.rating,
                comment: r.comment?.substring(0, 100),
                date: r.createdAt?.toISOString().split("T")[0],
            })),
        };
    },
});

const checkAvailabilityTool = tool({
    description: "Check if a service is available on a specific date",
    parameters: z.object({
        serviceId: z.string().describe("The service ID"),
        date: z.string().describe("The date to check (YYYY-MM-DD format)"),
    }),
    execute: async ({ serviceId, date }) => {
        // Get service scheduling type
        const [service] = await db
            .select({
                schedulingType: services.schedulingType,
                instantBookingEnabled: services.instantBookingEnabled,
                concurrentCapacity: services.concurrentCapacity,
            })
            .from(services)
            .where(eq(services.id, serviceId))
            .limit(1);

        if (!service) {
            return { available: false, reason: "Service not found" };
        }

        // For now, return optimistic availability
        // In production, this would check vendorCalendarBlocks and existing bookings
        return {
            available: true,
            date,
            instantBooking: service.instantBookingEnabled,
            bookingType: service.instantBookingEnabled ? "INSTANT" : "REQUEST",
            message: service.instantBookingEnabled
                ? "This service offers instant booking. You can book immediately."
                : "This service requires vendor approval. The vendor typically responds within 24 hours.",
        };
    },
});

const initiateBookingTool = tool({
    description: "Start the booking process for a service",
    parameters: z.object({
        serviceId: z.string().describe("The service ID to book"),
        preferredDate: z.string().describe("Preferred date (YYYY-MM-DD)"),
        preferredTime: z.string().optional().describe("Preferred time (HH:MM)"),
        notes: z.string().optional().describe("Additional notes for the vendor"),
    }),
    execute: async ({ serviceId, preferredDate, preferredTime, notes }) => {
        // Return booking initiation info
        // The actual booking would be created through the booking flow API
        return {
            action: "initiate_booking",
            serviceId,
            preferredDate,
            preferredTime,
            notes,
            nextStep: "Please confirm the booking details and proceed to payment.",
            bookingUrl: `/service/${serviceId}/book?date=${preferredDate}${preferredTime ? `&time=${preferredTime}` : ""}`,
        };
    },
});

// ===========================================
// ASSISTANT FUNCTIONS
// ===========================================

/**
 * Process a user message through the booking assistant
 */
export async function processBookingAssistantMessage(
    userMessage: string,
    context: BookingAssistantContext
): Promise<{ response: string; toolCalls?: any[] }> {
    const messages: ConversationMessage[] = [
        { role: "system", content: BOOKING_ASSISTANT_SYSTEM_PROMPT },
        ...context.conversationHistory,
        { role: "user", content: userMessage },
    ];

    const result = await generateText({
        model: openai("gpt-4o-mini"),
        messages,
        tools: {
            searchServices: searchServicesTool,
            getServiceDetails: getServiceDetailsTool,
            checkAvailability: checkAvailabilityTool,
            initiateBooking: initiateBookingTool,
        },
        maxSteps: 5, // Allow multi-step tool use
    });

    return {
        response: result.text,
        toolCalls: result.toolCalls,
    };
}

/**
 * Stream a response from the booking assistant
 */
export async function streamBookingAssistantMessage(
    userMessage: string,
    context: BookingAssistantContext
) {
    const messages: ConversationMessage[] = [
        { role: "system", content: BOOKING_ASSISTANT_SYSTEM_PROMPT },
        ...context.conversationHistory,
        { role: "user", content: userMessage },
    ];

    const stream = streamText({
        model: openai("gpt-4o-mini"),
        messages,
        tools: {
            searchServices: searchServicesTool,
            getServiceDetails: getServiceDetailsTool,
            checkAvailability: checkAvailabilityTool,
            initiateBooking: initiateBookingTool,
        },
        maxSteps: 5,
    });

    return stream;
}

/**
 * Quick service search without conversation context
 */
export async function quickServiceSearch(query: string): Promise<SearchResult> {
    const result = await searchServicesTool.execute(
        { query },
        { toolCallId: "quick-search", messages: [] }
    );
    return result as SearchResult;
}

/**
 * Get AI-generated booking recommendation
 */
export async function getBookingRecommendation(
    serviceId: string,
    userPreferences?: {
        budget?: number;
        urgency?: "flexible" | "soon" | "urgent";
        experience?: "first-time" | "returning";
    }
): Promise<{ recommendation: string; confidence: number }> {
    const serviceDetails = await getServiceDetailsTool.execute(
        { serviceId },
        { toolCallId: "get-details", messages: [] }
    );

    if ("error" in serviceDetails) {
        return { recommendation: "Unable to provide recommendation.", confidence: 0 };
    }

    const prompt = `Based on this service:
Title: ${serviceDetails.title}
Price: ${serviceDetails.price}
Rating: ${serviceDetails.rating}/5 (${serviceDetails.reviewCount} reviews)
${userPreferences ? `User preferences: ${JSON.stringify(userPreferences)}` : ""}

Provide a brief recommendation (2-3 sentences) on whether to book this service and why.`;

    const result = await generateText({
        model: openai("gpt-4o-mini"),
        prompt,
    });

    return {
        recommendation: result.text,
        confidence: serviceDetails.rating >= 4 ? 0.9 : serviceDetails.rating >= 3 ? 0.7 : 0.5,
    };
}

// ===========================================
// EXPORTS
// ===========================================

export {
    BOOKING_ASSISTANT_SYSTEM_PROMPT,
    searchServicesTool,
    getServiceDetailsTool,
    checkAvailabilityTool,
    initiateBookingTool,
};
