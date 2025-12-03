/**
 * Application configuration
 * 
 * For split architecture (frontend on Vercel, backend on Railway):
 * - Set VITE_API_URL to your Railway backend URL (e.g., https://api.commerzio.online)
 * - In development, leave it empty to use same-origin requests
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Build full API URL from a path
 * @param path - API path starting with /api (e.g., /api/users)
 * @returns Full URL with base if configured
 */
export function getApiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

/**
 * Fetch wrapper that automatically prepends API_BASE_URL for /api paths
 * Use this instead of raw fetch() for API calls
 * 
 * @param input - URL or Request object
 * @param init - Fetch options
 * @returns Promise<Response>
 */
export function fetchApi(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  // Handle string URLs
  if (typeof input === 'string') {
    const url = input.startsWith('/api') ? getApiUrl(input) : input;
    return fetch(url, {
      ...init,
      credentials: init?.credentials ?? 'include', // Default to include for cross-domain auth
    });
  }
  
  // Handle Request objects
  if (input instanceof Request) {
    const url = input.url.startsWith('/api') ? getApiUrl(input.url) : input.url;
    return fetch(new Request(url, input), init);
  }
  
  // Handle URL objects
  const urlStr = input.toString();
  const fullUrl = urlStr.startsWith('/api') ? getApiUrl(urlStr) : urlStr;
  return fetch(fullUrl, {
    ...init,
    credentials: init?.credentials ?? 'include',
  });
}
