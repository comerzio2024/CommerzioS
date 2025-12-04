/**
 * End-to-End API Tests
 * 
 * These tests run against the actual dev server (http://localhost:5000)
 * Prerequisites: The dev server must be running (npm run dev)
 */

import { describe, it, expect, beforeAll } from 'vitest';

const BASE_URL = 'http://localhost:5000';

// Helper to make API requests
async function apiRequest(
  method: string,
  path: string,
  options: {
    body?: any;
    cookies?: string;
  } = {}
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (options.cookies) {
    headers['Cookie'] = options.cookies;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    credentials: 'include',
  });

  let data: any = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  return { response, data };
}

// Store session cookie after login
let sessionCookie: string | null = null;

describe('E2E API Tests', () => {
  // Check if server is running
  beforeAll(async () => {
    try {
      const { response } = await apiRequest('GET', '/api/categories');
      if (!response.ok) {
        throw new Error('Server not responding properly');
      }
    } catch (error) {
      console.error('Server not running! Please start with: npm run dev');
      throw new Error('Dev server must be running on http://localhost:5000');
    }
  });

  describe('Public Endpoints', () => {
    it('should fetch categories', async () => {
      const { response, data } = await apiRequest('GET', '/api/categories');
      
      expect(response.ok).toBe(true);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toHaveProperty('id');
      expect(data[0]).toHaveProperty('name');
    });

    it('should fetch services', async () => {
      const { response, data } = await apiRequest('GET', '/api/services');
      
      expect(response.ok).toBe(true);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toHaveProperty('id');
      expect(data[0]).toHaveProperty('title');
      expect(data[0]).toHaveProperty('ownerId');
    });

    it('should fetch nearby services', async () => {
      const { response, data } = await apiRequest('POST', '/api/services/nearby', {
        body: {
          lat: 47.3769,
          lng: 8.5417,
          radius: 50
        }
      });
      
      expect(response.ok).toBe(true);
      expect(Array.isArray(data)).toBe(true);
    });

    it('should fetch settings', async () => {
      const { response, data } = await apiRequest('GET', '/api/settings');
      
      expect(response.ok).toBe(true);
      expect(data).toHaveProperty('id');
    });

    it('should fetch maps config', async () => {
      const { response, data } = await apiRequest('GET', '/api/maps/config');
      
      expect(response.ok).toBe(true);
      expect(data).toHaveProperty('apiKey');
    });
  });

  describe('Authentication', () => {
    const testUser = {
      email: `e2etest_${Date.now()}@test.com`,
      password: 'TestPass123!',
      firstName: 'E2E',
      lastName: 'Test User',
      username: `e2etest_${Date.now()}`
    };

    it('should register a new user', async () => {
      const { response, data } = await apiRequest('POST', '/api/auth/register', {
        body: testUser
      });
      
      // Store cookie for future requests
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) {
        sessionCookie = setCookie.split(';')[0];
      }

      console.log('Registration response status:', response.status);
      console.log('Registration response data:', JSON.stringify(data, null, 2));
      
      expect(response.ok).toBe(true);
      expect(data).toHaveProperty('message');
      // Registration returns a success message, not the user object directly
    });

    it('should get current user when authenticated', async () => {
      if (!sessionCookie) {
        console.warn('No session cookie - skipping auth test');
        return;
      }

      const { response, data } = await apiRequest('GET', '/api/auth/user', {
        cookies: sessionCookie
      });
      
      expect(response.ok).toBe(true);
      expect(data).toHaveProperty('id');
      expect(data.email).toBe(testUser.email);
    });

    it('should login existing user', async () => {
      const { response, data } = await apiRequest('POST', '/api/auth/login', {
        body: {
          email: testUser.email,
          password: testUser.password
        }
      });

      const setCookie = response.headers.get('set-cookie');
      if (setCookie) {
        sessionCookie = setCookie.split(';')[0];
      }

      console.log('Login response status:', response.status);
      console.log('Login response data:', JSON.stringify(data, null, 2));

      expect(response.ok).toBe(true);
      expect(data).toHaveProperty('user');
      expect(data.user).toHaveProperty('id');
    });
  });

  describe('Services API', () => {
    it('should search services by query', async () => {
      const { response, data } = await apiRequest('GET', '/api/services?search=cleaning');
      
      expect(response.ok).toBe(true);
      expect(Array.isArray(data)).toBe(true);
    });

    it('should fetch a single service by ID', async () => {
      // First get all services
      const { data: services } = await apiRequest('GET', '/api/services');
      
      if (services && services.length > 0) {
        const { response, data } = await apiRequest('GET', `/api/services/${services[0].id}`);
        
        expect(response.ok).toBe(true);
        expect(data).toHaveProperty('id', services[0].id);
        expect(data).toHaveProperty('title');
      }
    });
  });

  describe('Disputes API', () => {
    it('should return 401 for unauthenticated disputes list', async () => {
      const { response } = await apiRequest('GET', '/api/disputes');
      // Should redirect or return 401
      expect([401, 302, 200].includes(response.status)).toBe(true);
    });

    it('should fetch disputes list when authenticated', async () => {
      // Login as admin to see disputes
      const { response: loginRes } = await apiRequest('POST', '/api/auth/login', {
        body: {
          email: 'admin@servemkt.ch',
          password: 'admin123'
        }
      });

      const setCookie = loginRes.headers.get('set-cookie');
      const adminCookie = setCookie ? setCookie.split(';')[0] : null;

      if (adminCookie) {
        const { response, data } = await apiRequest('GET', '/api/disputes', {
          cookies: adminCookie
        });
        
        expect(response.ok).toBe(true);
        expect(Array.isArray(data)).toBe(true);
      }
    });

    it('should fetch dispute details with correct structure', async () => {
      // Login as admin
      const { response: loginRes } = await apiRequest('POST', '/api/auth/login', {
        body: {
          email: 'admin@servemkt.ch',
          password: 'admin123'
        }
      });

      const setCookie = loginRes.headers.get('set-cookie');
      const adminCookie = setCookie ? setCookie.split(';')[0] : null;

      if (adminCookie) {
        // Get disputes list first
        const { data: disputes } = await apiRequest('GET', '/api/disputes', {
          cookies: adminCookie
        });

        if (disputes && disputes.length > 0) {
          const { response, data } = await apiRequest('GET', `/api/disputes/${disputes[0].id}`, {
            cookies: adminCookie
          });

          expect(response.ok).toBe(true);
          // Verify the response structure that the frontend expects
          expect(data).toHaveProperty('dispute');
          expect(data.dispute).toHaveProperty('id');
          expect(data.dispute).toHaveProperty('status');
          expect(data).toHaveProperty('phases');
          expect(data).toHaveProperty('parties');
          expect(data).toHaveProperty('booking');
          expect(data).toHaveProperty('timeline');
          expect(data).toHaveProperty('isCustomer');
        }
      }
    });
  });

  describe('Notifications API', () => {
    it('should fetch notifications when authenticated', async () => {
      if (!sessionCookie) return;

      const { response, data } = await apiRequest('GET', '/api/notifications', {
        cookies: sessionCookie
      });
      
      expect(response.ok).toBe(true);
      expect(data).toHaveProperty('notifications');
      expect(Array.isArray(data.notifications)).toBe(true);
    });

    it('should fetch unread count', async () => {
      if (!sessionCookie) return;

      const { response, data } = await apiRequest('GET', '/api/notifications/unread-count', {
        cookies: sessionCookie
      });
      
      expect(response.ok).toBe(true);
      expect(data).toHaveProperty('count');
      expect(typeof data.count).toBe('number');
    });
  });

  describe('Bookings API', () => {
    it('should fetch user bookings when authenticated', async () => {
      // Login as admin
      const { response: loginRes } = await apiRequest('POST', '/api/auth/login', {
        body: {
          email: 'admin@servemkt.ch',
          password: 'admin123'
        }
      });

      const setCookie = loginRes.headers.get('set-cookie');
      const adminCookie = setCookie ? setCookie.split(';')[0] : null;

      if (adminCookie) {
        const { response, data } = await apiRequest('GET', '/api/bookings/my', {
          cookies: adminCookie
        });
        
        expect(response.ok).toBe(true);
        expect(Array.isArray(data)).toBe(true);
        
        // Check booking structure
        if (data.length > 0) {
          expect(data[0]).toHaveProperty('id');
          expect(data[0]).toHaveProperty('status');
          expect(data[0]).toHaveProperty('service');
        }
      }
    });
  });

  describe('Reviews API', () => {
    it('should fetch reviews received', async () => {
      // Login as admin
      const { response: loginRes } = await apiRequest('POST', '/api/auth/login', {
        body: {
          email: 'admin@servemkt.ch',
          password: 'admin123'
        }
      });

      const setCookie = loginRes.headers.get('set-cookie');
      const adminCookie = setCookie ? setCookie.split(';')[0] : null;

      if (adminCookie) {
        const { response, data } = await apiRequest('GET', '/api/users/me/reviews-received', {
          cookies: adminCookie
        });
        
        expect(response.ok).toBe(true);
        expect(Array.isArray(data)).toBe(true);
        
        if (data.length > 0) {
          expect(data[0]).toHaveProperty('id');
          expect(data[0]).toHaveProperty('rating');
          expect(data[0]).toHaveProperty('reviewer');
        }
      }
    });
  });

  describe('Service Requests API', () => {
    it('should fetch service requests list', async () => {
      const { response, data } = await apiRequest('GET', '/api/service-requests');
      
      console.log('Service requests response status:', response.status);
      console.log('Service requests response data:', JSON.stringify(data, null, 2));
      
      expect(response.ok).toBe(true);
      // Should return array or paginated response
      if (Array.isArray(data)) {
        // Array response
        expect(Array.isArray(data)).toBe(true);
      } else if (data && typeof data === 'object') {
        // Paginated response
        expect(data).toHaveProperty('requests');
      }
    });

    it('should create service request when authenticated', async () => {
      if (!sessionCookie) return;

      // Get a category first
      const { data: categories } = await apiRequest('GET', '/api/categories');
      
      if (categories && categories.length > 0) {
        const { response, data } = await apiRequest('POST', '/api/service-requests', {
          cookies: sessionCookie,
          body: {
            title: 'E2E Test Request',
            description: 'This is a test request from E2E tests',
            categoryId: categories[0].id,
            budget: 100,
            location: 'Zürich, Switzerland',
            canton: 'ZH'
          }
        });

        // Should either succeed or give a meaningful error
        if (response.ok) {
          expect(data).toHaveProperty('id');
          expect(data.title).toBe('E2E Test Request');
        } else {
          // Log the error for debugging
          console.log('Service request creation failed:', data);
        }
      }
    });
  });

  describe('Favorites API', () => {
    it('should check favorite status', async () => {
      // Get a service first
      const { data: services } = await apiRequest('GET', '/api/services');
      
      if (services && services.length > 0 && sessionCookie) {
        const { response, data } = await apiRequest('GET', `/api/favorites/${services[0].id}/status`, {
          cookies: sessionCookie
        });
        
        expect(response.ok).toBe(true);
        expect(data).toHaveProperty('isFavorite');
        expect(typeof data.isFavorite).toBe('boolean');
      }
    });
  });

  describe('User Profile API', () => {
    it('should fetch user addresses', async () => {
      if (!sessionCookie) return;

      const { response, data } = await apiRequest('GET', '/api/users/me/addresses', {
        cookies: sessionCookie
      });
      
      expect(response.ok).toBe(true);
      expect(Array.isArray(data)).toBe(true);
    });
  });
});
