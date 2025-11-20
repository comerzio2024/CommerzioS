import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface CategorySuggestion {
  categorySlug: string;
  confidence: number;
  reasoning: string;
}

export async function categorizeService(
  title: string,
  description: string
): Promise<CategorySuggestion> {
  try {
    const prompt = `Analyze this service listing and suggest the most appropriate category from the following options:
- home-services (Home Services)
- design-creative (Design & Creative)
- education (Education & Tutoring)
- wellness (Wellness & Fitness)
- business (Business Support)

Service Title: ${title}
Service Description: ${description}

Respond with JSON in this format: { "categorySlug": string, "confidence": number (0-1), "reasoning": string }`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an AI assistant that categorizes service listings with high accuracy.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    return {
      categorySlug: result.categorySlug || "business",
      confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
      reasoning: result.reasoning || "Auto-categorized",
    };
  } catch (error) {
    console.error("AI categorization failed:", error);
    // Fallback to business category
    return {
      categorySlug: "business",
      confidence: 0.3,
      reasoning: "Fallback categorization due to AI service error",
    };
  }
}
