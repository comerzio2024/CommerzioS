import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function analyzeImagesForHashtags(imageUrls: string[]): Promise<string[]> {
  if (!imageUrls || imageUrls.length === 0) {
    return [];
  }

  try {
    const imageContents = imageUrls.slice(0, 3).map(url => ({
      type: "image_url" as const,
      image_url: { url }
    }));

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze these images and suggest up to 10 relevant hashtags for a Swiss service marketplace. Focus on the service type, industry, and key features visible. Return only the hashtags as a comma-separated list without the # symbol. Examples: plumbing, renovation, bathroom"
            },
            ...imageContents
          ]
        }
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || "";
    const hashtags = content
      .split(/[,\n]/)
      .map(tag => tag.trim().toLowerCase().replace(/^#/, ''))
      .filter(tag => tag.length > 0)
      .slice(0, 10);

    return hashtags;
  } catch (error) {
    console.error("Error analyzing images for hashtags:", error);
    return [];
  }
}

export async function generateServiceTitle(images: string[], currentTitle?: string): Promise<string> {
  if (!images || images.length === 0) {
    return currentTitle || "Professional Service";
  }

  try {
    const imageContents = images.slice(0, 2).map(url => ({
      type: "image_url" as const,
      image_url: { url }
    }));

    const contextText = currentTitle
      ? `Current title: "${currentTitle}". Suggest an improved version or keep it if already good.`
      : "Suggest a professional service title.";

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze these images and suggest a professional service title for a Swiss marketplace. ${contextText} Keep it concise (max 200 characters), professional, and descriptive. Return only the title, no explanation.`
            },
            ...imageContents
          ]
        }
      ],
      max_tokens: 100,
      temperature: 0.7,
    });

    const title = response.choices[0]?.message?.content?.trim() || currentTitle || "Professional Service";
    return title.substring(0, 200);
  } catch (error) {
    console.error("Error generating service title:", error);
    return currentTitle || "Professional Service";
  }
}

export async function generateServiceDescription(
  images: string[],
  title: string,
  category?: string
): Promise<string> {
  if (!images || images.length === 0) {
    return "Professional service available.";
  }

  try {
    const imageContents = images.slice(0, 3).map(url => ({
      type: "image_url" as const,
      image_url: { url }
    }));

    const categoryContext = category ? `Category: ${category}` : "";

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze these images and generate a professional service description for a Swiss marketplace.
              
Service Title: ${title}
${categoryContext}

Generate a detailed, professional description (50-500 words) that:
- Describes the service based on what you see in the images
- Highlights key features and benefits
- Uses professional language suitable for Switzerland (English or German)
- Focuses on quality and expertise
- Is formatted in clear paragraphs

Return only the description, no additional commentary.`
            },
            ...imageContents
          ]
        }
      ],
      max_tokens: 600,
      temperature: 0.7,
    });

    const description = response.choices[0]?.message?.content?.trim() || "Professional service available.";
    return description;
  } catch (error) {
    console.error("Error generating service description:", error);
    return "Professional service available. Contact us for more details.";
  }
}

export async function generatePricingSuggestion(
  images: string[],
  title: string,
  description: string,
  category?: string
): Promise<{ type: string; price?: string; priceText?: string }> {
  try {
    const imageContents = images.slice(0, 2).map(url => ({
      type: "image_url" as const,
      image_url: { url }
    }));

    const categoryContext = category ? `Category: ${category}` : "";

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this service and suggest appropriate pricing for the Swiss market (CHF).

Service Title: ${title}
Description: ${description}
${categoryContext}

Based on the images and service details, suggest:
1. Pricing type: "fixed" (single price), "list" (price list for different options), or "text" (custom pricing description)
2. For fixed pricing: suggest a reasonable CHF price range (e.g., "150-200")
3. For list pricing: suggest price points
4. For text pricing: suggest pricing description

Return JSON format:
{
  "type": "fixed" | "list" | "text",
  "price": "price range for fixed, e.g., 150-200",
  "priceText": "pricing description"
}

Consider Swiss market rates and service complexity.`
            },
            ...imageContents
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 300,
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0]?.message?.content || "{}");
    
    return {
      type: result.type || "text",
      price: result.price,
      priceText: result.priceText || "Contact for pricing"
    };
  } catch (error) {
    console.error("Error generating pricing suggestion:", error);
    return {
      type: "text",
      priceText: "Contact for pricing"
    };
  }
}

export async function filterProfanity(
  text: string
): Promise<{ isClean: boolean; filtered: string; issues: string[] }> {
  if (!text || text.trim().length === 0) {
    return { isClean: true, filtered: text, issues: [] };
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a content moderation AI for a Swiss service marketplace. Detect and filter:
1. Explicit sexual content
2. Hate speech and slurs
3. Scam patterns: "100% guaranteed", "money back no questions", "get rich quick", "make money fast", "too good to be true"
4. Suspicious contact information in inappropriate contexts
5. Discriminatory language
6. Threats or violence

Analyze the text and return JSON:
{
  "isClean": boolean,
  "filtered": "sanitized version with blocked words replaced with [removed]",
  "issues": ["list of specific issues found"]
}

Be strict but fair. Swiss marketplace context - multiple languages are normal.`
        },
        {
          role: "user",
          content: `Analyze this text:\n\n${text}`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0]?.message?.content || "{}");
    
    return {
      isClean: result.isClean ?? true,
      filtered: result.filtered || text,
      issues: result.issues || []
    };
  } catch (error) {
    console.error("Error filtering profanity:", error);
    return {
      isClean: true,
      filtered: text,
      issues: ["Unable to verify content - please review manually"]
    };
  }
}
