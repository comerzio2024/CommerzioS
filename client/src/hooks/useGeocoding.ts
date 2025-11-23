import { useState, useEffect, useCallback, useRef } from 'react';
import { searchGeocodeSuggestions, type GeocodingSuggestion } from '@/lib/geocoding';

export interface UseGeocodingOptions {
  /** Minimum query length before triggering search */
  minQueryLength?: number;
  /** Debounce delay in milliseconds */
  debounceMs?: number;
  /** Maximum number of suggestions to return */
  limit?: number;
  /** Whether to automatically search as user types */
  autoSearch?: boolean;
}

export interface UseGeocodingReturn {
  /** Current search query */
  query: string;
  /** Update the search query */
  setQuery: (query: string) => void;
  /** Array of geocoding suggestions */
  suggestions: GeocodingSuggestion[];
  /** Whether suggestions are currently being fetched */
  isLoading: boolean;
  /** Error message if search fails */
  error: string | null;
  /** Clear all suggestions */
  clearSuggestions: () => void;
  /** Manually trigger a search */
  search: () => Promise<void>;
}

/**
 * Hook for geocoding search with debouncing and automatic suggestion fetching
 * Centralizes geocoding logic to ensure consistent behavior across components
 */
export function useGeocoding(options: UseGeocodingOptions = {}): UseGeocodingReturn {
  const {
    minQueryLength = 2,
    debounceMs = 300,
    limit = 10,
    autoSearch = true,
  } = options;

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeocodingSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const performSearch = useCallback(async (searchQuery: string) => {
    // Clear previous abort controller
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this search
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const results = await searchGeocodeSuggestions(
        searchQuery, 
        limit, 
        controller.signal
      );
      
      // Only update state if this controller is still current
      if (abortControllerRef.current === controller) {
        setSuggestions(results);
      }
    } catch (err: any) {
      // Only update state if this controller is still current
      if (abortControllerRef.current === controller) {
        // Don't set error if request was aborted
        if (err.name !== 'AbortError') {
          setError(err.message || 'Failed to fetch suggestions');
          setSuggestions([]);
        }
      }
    } finally {
      // Only clear loading if this controller is still current
      if (abortControllerRef.current === controller) {
        setIsLoading(false);
      }
    }
  }, [limit]);

  const search = useCallback(async () => {
    if (query.trim().length >= minQueryLength) {
      await performSearch(query);
    }
  }, [query, minQueryLength, performSearch]);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Auto-search effect with debouncing
  useEffect(() => {
    if (!autoSearch) return;

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Clear suggestions if query is too short
    if (query.trim().length < minQueryLength) {
      setSuggestions([]);
      setIsLoading(false);
      // Abort any in-flight requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      return;
    }

    // Set up debounced search
    timeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, debounceMs);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query, minQueryLength, debounceMs, performSearch, autoSearch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    query,
    setQuery,
    suggestions,
    isLoading,
    error,
    clearSuggestions,
    search,
  };
}
