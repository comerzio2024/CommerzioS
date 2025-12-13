// @ts-nocheck
// TODO: Refine types when stable with Vercel AI SDK updates
/**
 * Listing Concierge AI Service
 * 
 * AI-powered assistant for vendors to:
 * - Optimize their service listings
 * - Get pricing suggestions based on market data
 * - Generate compelling descriptions and titles
 * - Analyze competitor offerings
 * - Improve their booking conversion rates
 * 
 * Uses Vercel AI SDK with OpenAI GPT-4
 */

import { openai } from "@ai-sdk/openai";
import { generateText, generateObject, streamText } from "ai";
import { z } from "zod";
import { db } from "./db";
import { services, users, categories, reviews } from "@shared/schema";
import { eq, and, ilike, desc, sql, avg, count, ne } from "drizzle-orm";

// Types
interface ListingAnalysis {
    overallScore: number;
    titleScore: number;
    descriptionScore: number;
    pricingScore: number;
    suggestions: string[];
    competitorInsights: string[];
}

interface PricingSuggestion {
    suggestedPrice: number;
    currency: string;
    priceUnit: string;
    reasoning: string;
    marketAverage: number;
    percentile: string;
}

// ===========================================
// SYSTEM PROMPTS
// ===========================================

const LISTING_CONCIERGE_SYSTEM_PROMPT = `You are a professional listing optimization consultant for a Swiss service marketplace.

Your role is to help vendors:
1. Create compelling service titles that attract customers
2. Write detailed, engaging descriptions
3. Set competitive pricing based on market analysis
4. Understand their competition
5. Improve their booking conversion rates

Key guidelines:
- Always provide actionable, specific advice
- Use data from the marketplace when available
- Consider Swiss market characteristics (quality focus, trust, professionalism)
- All prices should be in CHF
- Be encouraging but honest about areas for improvement
- Suggest improvements in order of impact

When analyzing listings, consider:
- SEO-friendly titles (keywords, clarity, length)
- Description completeness (what's included, experience, qualifications)
- Pricing competitiveness (market position, value proposition)
- Trust signals (reviews, verification, response time)`;

// ===========================================
// ANALYSIS FUNCTIONS
// ===========================================

/**
 * Analyze a service listing and provide improvement suggestions
 */
export async function analyzeListing(
    serviceId: string
): Promise<ListingAnalysis> {
    // Get the service
    const [service] = await db
        .select()
        .from(services)
        .where(eq(services.id, serviceId))
        .limit(1);

    if (!service) {
        throw new Error("Service not found");
    }

    // Get category for context
    const [category] = service.categoryId ? await db
        .select()
        .from(categories)
        .where(eq(categories.id, service.categoryId))
        .limit(1) : [null];

    // Get competitor data
    const competitors = await db
        .select({
            avgPrice: sql<number>`avg(cast(${services.price} as decimal))`,
            count: count(),
        })
        .from(services)
        .where(
            and(
                eq(services.status, "active"),
                service.categoryId ? eq(services.categoryId, service.categoryId) : sql`1=1`,
                ne(services.id, serviceId)
            )
        );

    const marketData = competitors[0] || { avgPrice: 0, count: 0 };

    // Generate AI analysis
    const analysisPrompt = `Analyze this service listing and provide a structured analysis:

Title: ${service.title}
Description: ${service.description}
Price: CHF ${service.price}/${service.priceUnit}
Category: ${category?.name || "Uncategorized"}
View Count: ${service.viewCount || 0}

Market Context:
- Average price in category: CHF ${Number(marketData.avgPrice)?.toFixed(2) || "N/A"}
- Number of competitors: ${marketData.count || 0}

Provide:
1. Overall score (0-100)
2. Title score (0-100)
3. Description score (0-100)
4. Pricing score (0-100)
5. 3-5 specific improvement suggestions
6. 2-3 competitor insights`;

    const result = await generateObject({
        model: openai("gpt-4o-mini"),
        prompt: analysisPrompt,
        schema: z.object({
            overallScore: z.number().min(0).max(100),
            titleScore: z.number().min(0).max(100),
            descriptionScore: z.number().min(0).max(100),
            pricingScore: z.number().min(0).max(100),
            suggestions: z.array(z.string()),
            competitorInsights: z.array(z.string()),
        }),
    });

    return result.object;
}

/**
 * Get AI-powered pricing suggestion
 */
export async function getPricingSuggestion(
    serviceId: string
): Promise<PricingSuggestion> {
    const [service] = await db
        .select()
        .from(services)
        .where(eq(services.id, serviceId))
        .limit(1);

    if (!service) {
        throw new Error("Service not found");
    }

    // Get market pricing data
    const priceData = await db
        .select({
            price: services.price,
            viewCount: services.viewCount,
        })
        .from(services)
        .where(
            and(
                eq(services.status, "active"),
                service.categoryId ? eq(services.categoryId, service.categoryId) : sql`1=1`
            )
        )
        .orderBy(services.price);

    const prices = priceData.map(p => parseFloat(p.price || "0")).filter(p => p > 0);
    const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
    const currentPrice = parseFloat(service.price || "0");

    // Calculate percentile
    const belowCount = prices.filter(p => p < currentPrice).length;
    const percentile = prices.length > 0 ? Math.round((belowCount / prices.length) * 100) : 50;

    const pricingPrompt = `Suggest optimal pricing for this service:

Service: ${service.title}
Current Price: CHF ${service.price}/${service.priceUnit}
Views: ${service.viewCount || 0}

Market Data:
- Price range: CHF ${Math.min(...prices) || 0} - ${Math.max(...prices) || 0}
- Average price: CHF ${avgPrice.toFixed(2)}
- Current percentile: ${percentile}th

Consider: quality positioning, Swiss market expectations, review count trust factor.
Suggest a price and explain your reasoning.`;

    const result = await generateObject({
        model: openai("gpt-4o-mini"),
        prompt: pricingPrompt,
        schema: z.object({
            suggestedPrice: z.number(),
            reasoning: z.string(),
            percentile: z.string(),
        }),
    });

    return {
        suggestedPrice: result.object.suggestedPrice,
        currency: "CHF",
        priceUnit: service.priceUnit || "hour",
        reasoning: result.object.reasoning,
        marketAverage: Math.round(avgPrice * 100) / 100,
        percentile: result.object.percentile,
    };
}

/**
 * Generate an optimized title for a service
 */
export async function generateOptimizedTitle(
    serviceId: string,
    keywords?: string[]
): Promise<{ title: string; alternatives: string[] }> {
    const [service] = await db
        .select()
        .from(services)
        .where(eq(services.id, serviceId))
        .limit(1);

    if (!service) {
        throw new Error("Service not found");
    }

    const titlePrompt = `Generate an optimized title for this Swiss service listing:

Current Title: ${service.title}
Description: ${service.description?.substring(0, 200)}
${keywords ? `Important Keywords: ${keywords.join(", ")}` : ""}

Requirements:
- Maximum 60 characters
- Include key service benefit
- Clear and professional
- SEO-friendly

Generate 1 best title and 3 alternatives.`;

    const result = await generateObject({
        model: openai("gpt-4o-mini"),
        prompt: titlePrompt,
        schema: z.object({
            title: z.string(),
            alternatives: z.array(z.string()).length(3),
        }),
    });

    return result.object;
}

/**
 * Generate an optimized description for a service
 */
export async function generateOptimizedDescription(
    serviceId: string,
    highlights?: string[]
): Promise<{ description: string; wordCount: number }> {
    const [service] = await db
        .select()
        .from(services)
        .where(eq(services.id, serviceId))
        .limit(1);

    if (!service) {
        throw new Error("Service not found");
    }

    const [vendor] = await db
        .select({ vendorBio: users.vendorBio, certifications: users.certifications })
        .from(users)
        .where(eq(users.id, service.ownerId))
        .limit(1);

    const descriptionPrompt = `Generate an optimized service description for a Swiss marketplace:

Current Title: ${service.title}
Current Description: ${service.description}
What's Included: ${JSON.stringify(service.whatsIncluded || [])}
Vendor Bio: ${vendor?.vendorBio || "Not provided"}
${highlights ? `Key Highlights: ${highlights.join(", ")}` : ""}

Create a compelling description that:
- Opens with a value proposition
- Lists key benefits (not just features)
- Includes what's included
- Ends with a call to action
- Uses professional yet friendly tone
- 150-250 words
- Suitable for Swiss market (quality focus)`;

    const result = await generateText({
        model: openai("gpt-4o-mini"),
        prompt: descriptionPrompt,
    });

    return {
        description: result.text,
        wordCount: result.text.split(/\s+/).length,
    };
}

/**
 * Analyze competitors in the same category
 */
export async function analyzeCompetitors(
    serviceId: string
): Promise<{
    competitors: Array<{
        id: string;
        title: string;
        price: string;
        rating: number;
        strengthWeakness: string;
    }>;
    marketPosition: string;
    differentiationAdvice: string;
}> {
    const [service] = await db
        .select()
        .from(services)
        .where(eq(services.id, serviceId))
        .limit(1);

    if (!service) {
        throw new Error("Service not found");
    }

    // Get top competitors
    const competitors = await db
        .select({
            id: services.id,
            title: services.title,
            price: services.price,
            priceUnit: services.priceUnit,
            viewCount: services.viewCount,
            description: services.description,
        })
        .from(services)
        .where(
            and(
                eq(services.status, "active"),
                service.categoryId ? eq(services.categoryId, service.categoryId) : sql`1=1`,
                ne(services.id, serviceId)
            )
        )
        .orderBy(desc(services.viewCount))
        .limit(5);

    const analysisPrompt = `Analyze these competitors for a service listing:

Your Service:
- Title: ${service.title}
- Price: CHF ${service.price}/${service.priceUnit}
- Views: ${service.viewCount || 0}

Top Competitors:
${competitors.map((c, i) => `${i + 1}. ${c.title} - CHF ${c.price}/${c.priceUnit} - ${c.viewCount || 0} views`).join("\n")}

Provide:
1. One strength/weakness for each competitor (brief)
2. Your market position (leader/challenger/niche/new)
3. How to differentiate from competitors`;

    const result = await generateObject({
        model: openai("gpt-4o-mini"),
        prompt: analysisPrompt,
        schema: z.object({
            competitorAnalysis: z.array(z.object({
                id: z.string(),
                strengthWeakness: z.string(),
            })),
            marketPosition: z.string(),
            differentiationAdvice: z.string(),
        }),
    });

    return {
        competitors: competitors.map((c, i) => ({
            id: c.id,
            title: c.title,
            price: `CHF ${c.price}/${c.priceUnit}`,
            rating: 0, // Would need to compute from reviews
            strengthWeakness: result.object.competitorAnalysis[i]?.strengthWeakness || "N/A",
        })),
        marketPosition: result.object.marketPosition,
        differentiationAdvice: result.object.differentiationAdvice,
    };
}

/**
 * Get conversion optimization tips
 */
export async function getConversionTips(
    serviceId: string
): Promise<{ tips: Array<{ priority: "high" | "medium" | "low"; tip: string; impact: string }> }> {
    const [service] = await db
        .select()
        .from(services)
        .where(eq(services.id, serviceId))
        .limit(1);

    if (!service) {
        throw new Error("Service not found");
    }

    const conversionPrompt = `Analyze this service listing for conversion optimization:

Title: ${service.title}
Description Length: ${service.description?.length || 0} characters
Images: ${service.images?.length || 0}
Views: ${service.viewCount || 0}
Price: CHF ${service.price}/${service.priceUnit}
Instant Booking: ${service.instantBookingEnabled ? "Yes" : "No"}
Min Booking Hours: ${service.minBookingHours || 1}

Provide 5 specific tips to improve booking conversions, prioritized by impact.`;

    const result = await generateObject({
        model: openai("gpt-4o-mini"),
        prompt: conversionPrompt,
        schema: z.object({
            tips: z.array(z.object({
                priority: z.enum(["high", "medium", "low"]),
                tip: z.string(),
                impact: z.string(),
            })),
        }),
    });

    return result.object;
}

// ===========================================
// EXPORTS
// ===========================================

export {
    LISTING_CONCIERGE_SYSTEM_PROMPT,
};
