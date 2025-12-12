import { useCallback } from 'react';

// Weights for different interactions
const WEIGHTS = {
    VIEW: 1,
    CLICK: 2,
    BOOK: 5,
};

interface InterestScore {
    [category: string]: number;
}

// Helper to check if analytics cookies are allowed
function isAnalyticsAllowed(): boolean {
    try {
        const stored = localStorage.getItem('cookie_preferences');
        if (!stored) return false;
        const prefs = JSON.parse(stored);
        return prefs.analytics === true;
    } catch {
        return false;
    }
}

// Helper to check if marketing cookies are allowed
function isMarketingAllowed(): boolean {
    try {
        const stored = localStorage.getItem('cookie_preferences');
        if (!stored) return false;
        const prefs = JSON.parse(stored);
        return prefs.marketing === true;
    } catch {
        return false;
    }
}

export function useAnalytics() {
    const trackView = useCallback((categoryId: string) => {
        if (!isAnalyticsAllowed()) return;
        updateInterestInternal(categoryId, WEIGHTS.VIEW);
    }, []);

    const trackAction = useCallback((categoryId: string, type: 'CLICK' | 'BOOK') => {
        if (!isAnalyticsAllowed()) return;
        updateInterestInternal(categoryId, WEIGHTS[type]);
    }, []);

    const getTopInterests = useCallback((limit = 3): string[] => {
        // Marketing consent required for personalization
        if (!isMarketingAllowed()) return [];

        try {
            const interests: InterestScore = JSON.parse(localStorage.getItem('user_interests') || '{}');
            return Object.entries(interests)
                .sort(([, a], [, b]) => b - a)
                .slice(0, limit)
                .map(([category]) => category);
        } catch {
            return [];
        }
    }, []);

    return { trackView, trackAction, getTopInterests };
}

function updateInterestInternal(categoryId: string, weight: number) {
    try {
        const interests: InterestScore = JSON.parse(localStorage.getItem('user_interests') || '{}');
        interests[categoryId] = (interests[categoryId] || 0) + weight;
        localStorage.setItem('user_interests', JSON.stringify(interests));
    } catch {
        // Ignore errors (e.g. quota exceeded)
    }
}
