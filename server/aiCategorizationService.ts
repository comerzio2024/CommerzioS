/**
 * AI Categorization Service Stub
 * 
 * Placeholder for AI-powered category suggestions.
 * To be implemented when AI categorization feature is needed.
 */

export async function suggestCategories(title: string, description: string): Promise<string[]> {
    // Stub implementation - returns empty array
    console.log('[aiCategorizationService] Stub called - no suggestion available');
    return [];
}

export async function analyzeServiceContent(content: string): Promise<{
    suggestedCategory: string | null;
    suggestedSubcategory: string | null;
    confidence: number;
}> {
    // Stub implementation
    return {
        suggestedCategory: null,
        suggestedSubcategory: null,
        confidence: 0,
    };
}

export default {
    suggestCategories,
    analyzeServiceContent,
};
