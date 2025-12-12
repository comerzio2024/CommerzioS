import { useState, useCallback, useEffect } from 'react';

export interface CookiePreferences {
    essential: boolean; // Always true, cannot be disabled
    functional: boolean;
    analytics: boolean;
    marketing: boolean;
}

const DEFAULT_PREFERENCES: CookiePreferences = {
    essential: true,
    functional: false,
    analytics: false,
    marketing: false,
};

const STORAGE_KEY = 'cookie_preferences';

export function useCookiePreferences() {
    const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);
    const [hasConsented, setHasConsented] = useState(false);

    // Load preferences from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                setPreferences({ ...DEFAULT_PREFERENCES, ...parsed, essential: true });
                setHasConsented(true);
            }
        } catch {
            // Ignore parse errors
        }
    }, []);

    const savePreferences = useCallback((newPrefs: Partial<CookiePreferences>) => {
        const updated: CookiePreferences = {
            ...preferences,
            ...newPrefs,
            essential: true, // Always enforce essential
        };
        setPreferences(updated);
        setHasConsented(true);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }, [preferences]);

    const acceptAll = useCallback(() => {
        const allAccepted: CookiePreferences = {
            essential: true,
            functional: true,
            analytics: true,
            marketing: true,
        };
        setPreferences(allAccepted);
        setHasConsented(true);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allAccepted));
    }, []);

    const declineAll = useCallback(() => {
        // Only essential stays on
        const minimal: CookiePreferences = {
            essential: true,
            functional: false,
            analytics: false,
            marketing: false,
        };
        setPreferences(minimal);
        setHasConsented(true);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(minimal));
    }, []);

    const isAllowed = useCallback((category: keyof CookiePreferences) => {
        return preferences[category];
    }, [preferences]);

    return {
        preferences,
        hasConsented,
        savePreferences,
        acceptAll,
        declineAll,
        isAllowed,
    };
}
