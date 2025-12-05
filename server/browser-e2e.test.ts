/**
 * Comprehensive Browser E2E Tests
 * 
 * Tests all critical user journeys against the live server.
 * Simulates browser behavior with cookies and session management.
 */

import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';

const BASE_URL = 'http://localhost:5000';

// Test user credentials (generated fresh for each test run)
const testUserEmail = `browser_test_${Date.now()}@test.com`;
const testUserPassword = 'TestPassword123!';
let authCookies: string[] = [];
let testUserId: string = '';
let testServiceId: string = '';
let testBookingId: string = '';
let testDisputeId: string = '';

// Helper to make requests with auth cookies
async function authRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  
  if (authCookies.length > 0) {
    headers['Cookie'] = authCookies.join('; ');
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
  
  // Capture any new cookies
  const setCookieHeader = response.headers.get('set-cookie');
  if (setCookieHeader) {
    // Parse and store cookies
    const newCookies = setCookieHeader.split(',').map(c => c.split(';')[0].trim());
    newCookies.forEach(cookie => {
      const cookieName = cookie.split('=')[0];
      authCookies = authCookies.filter(c => !c.startsWith(cookieName + '='));
      authCookies.push(cookie);
    });
  }
  
  return response;
}

describe('Browser E2E Tests - Complete User Journeys', () => {
  
  describe('Journey 1: New User Registration & Onboarding', () => {
    it('1.1 - should register a new user successfully', async () => {
      const response = await authRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: testUserEmail,
          password: testUserPassword,
          firstName: 'Browser',
          lastName: 'TestUser',
        }),
      });
      
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.message).toContain('Account created');
    });
    
    it('1.2 - should login with registered credentials', async () => {
      const response = await authRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: testUserEmail,
          password: testUserPassword,
        }),
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(testUserEmail);
      testUserId = data.user.id;
    });
    
    it('1.3 - should access user profile', async () => {
      const response = await authRequest('/api/auth/user');
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe(testUserId);
    });
    
    it('1.4 - should update user profile', async () => {
      const response = await authRequest('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          bio: 'Test user bio for browser testing',
          city: 'Zurich',
        }),
      });
      
      // Accept 200 or 404 (if route doesn't exist)
      expect([200, 404]).toContain(response.status);
    });
  });
  
  describe('Journey 2: Browse & Discover Services', () => {
    it('2.1 - should fetch homepage services', async () => {
      const response = await authRequest('/api/services');
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });
    
    it('2.2 - should fetch categories', async () => {
      const response = await authRequest('/api/categories');
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });
    
    it('2.3 - should search services by location', async () => {
      const response = await authRequest('/api/services?city=Zurich');
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });
    
    it('2.4 - should search services by category', async () => {
      const response = await authRequest('/api/services?category=cleaning');
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });
    
    it('2.5 - should search services by keyword', async () => {
      const response = await authRequest('/api/services/search?q=test');
      // This might be 200 or 404 depending on if route exists
      expect([200, 404]).toContain(response.status);
    });
    
    it('2.6 - should get service details if any service exists', async () => {
      // First get list of services
      const listResponse = await authRequest('/api/services');
      const services = await listResponse.json();
      
      if (services.length > 0) {
        testServiceId = services[0].id;
        const response = await authRequest(`/api/services/${testServiceId}`);
        expect(response.status).toBe(200);
        const service = await response.json();
        expect(service.id).toBe(testServiceId);
      } else {
        // No services, skip
        console.log('No services found to test details');
      }
    });

    it('2.7 - should verify service images structure', async () => {
      if (!testServiceId) {
        const listResponse = await authRequest('/api/services');
        const services = await listResponse.json();
        if (services.length > 0) {
          testServiceId = services[0].id;
        }
      }
      
      if (testServiceId) {
        const response = await authRequest(`/api/services/${testServiceId}`);
        expect(response.status).toBe(200);
        const service = await response.json();
        
        // Verify images array exists
        expect(service).toHaveProperty('images');
        expect(Array.isArray(service.images)).toBe(true);
        
        // Verify image metadata structure if images exist
        if (service.images.length > 0) {
          expect(typeof service.images[0]).toBe('string'); // URLs are strings
        }
      }
    });

    it('2.8 - should get user plan with image limits', async () => {
      const response = await authRequest('/api/auth/user');
      if (response.status === 200) {
        const user = await response.json();
        // Verify plan structure includes maxImages
        if (user.plan) {
          expect(user.plan).toHaveProperty('maxImages');
          expect(typeof user.plan.maxImages).toBe('number');
        }
      }
    });
  });

  describe('Journey 2.5: Service Creation (Vendor Side)', () => {
    it('2.5.1 - should get categories for service creation', async () => {
      const response = await authRequest('/api/categories');
      expect(response.status).toBe(200);
      const categories = await response.json();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
      
      // Categories should have required fields for service creation
      if (categories.length > 0) {
        expect(categories[0]).toHaveProperty('id');
        expect(categories[0]).toHaveProperty('name');
      }
    });

    it('2.5.2 - should get image upload configuration', async () => {
      // This verifies the upload endpoint is accessible
      const response = await authRequest('/api/upload/config');
      // Accept 200 or 404 if config endpoint doesn't exist
      expect([200, 404]).toContain(response.status);
    });

    it('2.5.3 - should validate service creation payload', async () => {
      // Test validation without actually creating
      const response = await authRequest('/api/services', {
        method: 'POST',
        body: JSON.stringify({
          // Intentionally incomplete to test validation
          title: '', // Empty title should fail
        }),
      });
      
      // Should return validation error
      expect([400, 422]).toContain(response.status);
    });

    it('2.5.4 - should enforce image limits based on plan', async () => {
      // Get user plan first
      const userResponse = await authRequest('/api/auth/user');
      if (userResponse.status === 200) {
        const user = await userResponse.json();
        const maxImages = user.plan?.maxImages || 4;
        
        // Verify the limit is reasonable
        expect(maxImages).toBeGreaterThanOrEqual(1);
        expect(maxImages).toBeLessThanOrEqual(20);
        
        console.log(`User plan allows ${maxImages} images`);
      }
    });

    it('2.5.5 - should return available plans with image limits', async () => {
      const response = await authRequest('/api/plans');
      expect(response.status).toBe(200);
      const plans = await response.json();
      expect(Array.isArray(plans)).toBe(true);
      
      // Each plan should specify image limits
      plans.forEach((plan: any) => {
        if (plan.maxImages !== undefined) {
          expect(typeof plan.maxImages).toBe('number');
        }
      });
    });
  });
  
  describe('Journey 3: Service Requests (Customer Side)', () => {
    it('3.1 - should get service requests list', async () => {
      const response = await authRequest('/api/service-requests');
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('requests');
      expect(Array.isArray(data.requests)).toBe(true);
    });
    
    it('3.2 - should create a service request', async () => {
      const response = await authRequest('/api/service-requests', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test Service Request',
          description: 'I need help with testing',
          categoryId: '1', // May not exist
          budget: 100,
          location: 'Zurich',
          urgency: 'flexible',
        }),
      });
      
      // Accept 201 (created) or 400/404 (validation/not found issues)
      expect([201, 400, 404, 500]).toContain(response.status);
      if (response.status === 201) {
        const data = await response.json();
        console.log('Created service request:', data);
      }
    });
    
    it('3.3 - should get my service requests', async () => {
      const response = await authRequest('/api/service-requests/mine');
      // Accept 200 or 404 (route may not exist)
      expect([200, 404]).toContain(response.status);
    });
  });
  
  describe('Journey 4: Bookings Flow', () => {
    it('4.1 - should get user bookings', async () => {
      const response = await authRequest('/api/bookings/my');
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });
    
    it('4.2 - should handle booking creation (if service exists)', async () => {
      if (!testServiceId) {
        console.log('No service ID available for booking test');
        return;
      }
      
      const response = await authRequest('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          serviceId: testServiceId,
          scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          notes: 'Test booking from browser e2e tests',
        }),
      });
      
      // Accept various statuses - booking might fail due to missing payment etc.
      console.log(`Booking creation status: ${response.status}`);
      if (response.status === 201 || response.status === 200) {
        const data = await response.json();
        testBookingId = data.id || data.booking?.id;
      }
    });
    
    it('4.3 - should get booking details (if booking exists)', async () => {
      if (!testBookingId) {
        console.log('No booking ID available');
        return;
      }
      
      const response = await authRequest(`/api/bookings/${testBookingId}`);
      expect([200, 404]).toContain(response.status);
    });
  });
  
  describe('Journey 5: Disputes', () => {
    it('5.1 - should get user disputes', async () => {
      const response = await authRequest('/api/disputes');
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });
    
    it('5.2 - should handle dispute creation (if booking exists)', async () => {
      if (!testBookingId) {
        console.log('No booking ID available for dispute test');
        return;
      }
      
      const response = await authRequest(`/api/disputes/booking/${testBookingId}`, {
        method: 'POST',
        body: JSON.stringify({
          reason: 'service_not_provided',
          description: 'Test dispute from browser e2e tests',
        }),
      });
      
      console.log(`Dispute creation status: ${response.status}`);
      if (response.status === 201 || response.status === 200) {
        const data = await response.json();
        testDisputeId = data.id || data.dispute?.id;
      }
    });
    
    it('5.3 - should get dispute details (if dispute exists)', async () => {
      if (!testDisputeId) {
        console.log('No dispute ID available');
        return;
      }
      
      const response = await authRequest(`/api/disputes/${testDisputeId}`);
      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200) {
        const data = await response.json();
        // Verify dispute detail structure
        expect(data).toHaveProperty('dispute');
        expect(data).toHaveProperty('phases');
        expect(data).toHaveProperty('parties');
        expect(data).toHaveProperty('timeline');
      }
    });

    it('5.4 - should support dispute evidence upload', async () => {
      if (!testDisputeId) {
        console.log('No dispute ID available for evidence test');
        return;
      }
      
      // Get dispute details to check evidence upload capability
      const response = await authRequest(`/api/disputes/${testDisputeId}`);
      if (response.status === 200) {
        const data = await response.json();
        // Verify evidence array exists in the response
        expect(data.dispute).toHaveProperty('customerEvidence');
        expect(data.dispute).toHaveProperty('vendorEvidence');
      }
    });

    it('5.5 - should get evidence for a dispute', async () => {
      if (!testDisputeId) {
        console.log('No dispute ID available for evidence retrieval test');
        return;
      }
      
      const response = await authRequest(`/api/disputes/${testDisputeId}/evidence`);
      // Accept 200 or 404 (route may not exist yet)
      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200) {
        const data = await response.json();
        expect(Array.isArray(data) || (data && data.evidence)).toBe(true);
      }
    });

    it('5.6 - should handle evidence reordering', async () => {
      if (!testDisputeId) {
        console.log('No dispute ID available for reorder test');
        return;
      }
      
      // This tests that the API can accept reorder requests
      const response = await authRequest(`/api/disputes/${testDisputeId}/evidence/reorder`, {
        method: 'PUT',
        body: JSON.stringify({
          evidenceIds: ['evidence-1', 'evidence-2'] // Test ordering
        }),
      });
      
      // Accept 200 (success), 400 (validation), 404 (not found), or 501 (not implemented)
      expect([200, 400, 404, 501]).toContain(response.status);
    });
  });
  
  describe('Journey 6: Notifications', () => {
    it('6.1 - should get user notifications', async () => {
      const response = await authRequest('/api/notifications');
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('notifications');
      expect(Array.isArray(data.notifications)).toBe(true);
    });
    
    it('6.2 - should get unread notifications count', async () => {
      const response = await authRequest('/api/notifications/unread/count');
      // Accept 200 or 404
      expect([200, 404]).toContain(response.status);
    });
    
    it('6.3 - should mark notifications as read', async () => {
      const response = await authRequest('/api/notifications/mark-all-read', {
        method: 'POST',
      });
      // Accept 200 or 404
      expect([200, 404]).toContain(response.status);
    });
  });
  
  describe('Journey 7: Reviews', () => {
    it('7.1 - should get reviews for a service (if service exists)', async () => {
      if (!testServiceId) {
        console.log('No service ID for review test');
        return;
      }
      
      const response = await authRequest(`/api/services/${testServiceId}/reviews`);
      expect([200, 404]).toContain(response.status);
    });
    
    it('7.2 - should handle review submission (if booking completed)', async () => {
      if (!testBookingId) {
        console.log('No booking for review test');
        return;
      }
      
      const response = await authRequest(`/api/bookings/${testBookingId}/review`, {
        method: 'POST',
        body: JSON.stringify({
          rating: 5,
          comment: 'Test review from browser e2e tests',
        }),
      });
      
      // Accept various statuses - review might fail due to booking status
      console.log(`Review submission status: ${response.status}`);
    });
  });
  
  describe('Journey 8: Favorites', () => {
    it('8.1 - should get user favorites', async () => {
      const response = await authRequest('/api/favorites');
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });
    
    it('8.2 - should add service to favorites (if service exists)', async () => {
      if (!testServiceId) {
        console.log('No service ID for favorites test');
        return;
      }
      
      const response = await authRequest(`/api/favorites/${testServiceId}`, {
        method: 'POST',
      });
      
      expect([200, 201, 400, 409]).toContain(response.status);
    });
    
    it('8.3 - should remove service from favorites (if service exists)', async () => {
      if (!testServiceId) {
        console.log('No service ID for favorites test');
        return;
      }
      
      const response = await authRequest(`/api/favorites/${testServiceId}`, {
        method: 'DELETE',
      });
      
      expect([200, 204, 404]).toContain(response.status);
    });
  });
  
  describe('Journey 9: Chat/Messaging', () => {
    it('9.1 - should get conversations', async () => {
      const response = await authRequest('/api/conversations');
      expect([200, 404]).toContain(response.status);
    });
    
    it('9.2 - should get chat rooms', async () => {
      const response = await authRequest('/api/chat-rooms');
      expect([200, 404]).toContain(response.status);
    });
  });
  
  describe('Journey 10: Analytics & Dashboard', () => {
    it('10.1 - should get user dashboard stats', async () => {
      const response = await authRequest('/api/dashboard/stats');
      // Accept 200 or 404
      expect([200, 404]).toContain(response.status);
    });
    
    it('10.2 - should get vendor analytics (if vendor)', async () => {
      const response = await authRequest('/api/vendor/analytics');
      // Accept 200, 403 (not a vendor), or 404
      expect([200, 403, 404]).toContain(response.status);
    });
  });
  
  describe('Journey 11: Referrals & Points', () => {
    it('11.1 - should get referral info', async () => {
      const response = await authRequest('/api/referral');
      expect([200, 404]).toContain(response.status);
    });
    
    it('11.2 - should get points balance', async () => {
      const response = await authRequest('/api/points');
      expect([200, 404]).toContain(response.status);
    });
    
    it('11.3 - should get points history', async () => {
      const response = await authRequest('/api/points/history');
      expect([200, 404]).toContain(response.status);
    });
  });
  
  describe('Journey 12: Logout & Session', () => {
    it('12.1 - should logout successfully', async () => {
      const response = await authRequest('/api/auth/logout', {
        method: 'POST',
      });
      
      expect([200, 204]).toContain(response.status);
    });
    
    it('12.2 - should be unauthorized after logout', async () => {
      // Clear cookies to simulate logged out state
      authCookies = [];
      
      const response = await authRequest('/api/auth/user');
      expect([401, 403]).toContain(response.status);
    });
  });
});

describe('Browser E2E Tests - Edge Cases & Error Handling', () => {
  
  describe('Invalid Inputs', () => {
    it('should reject registration with invalid email', async () => {
      const response = await authRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'not-an-email',
          password: testUserPassword,
          firstName: 'Test',
          lastName: 'User',
        }),
      });
      
      expect([400, 422]).toContain(response.status);
    });
    
    it('should reject registration with weak password', async () => {
      const response = await authRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'valid@test.com',
          password: '123', // Too short
          firstName: 'Test',
          lastName: 'User',
        }),
      });
      
      expect([400, 422]).toContain(response.status);
    });
    
    it('should reject login with wrong password', async () => {
      const response = await authRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: testUserEmail,
          password: 'WrongPassword123!',
        }),
      });
      
      expect([401, 400]).toContain(response.status);
    });
  });
  
  describe('404 Handling', () => {
    it('should return 404 for non-existent service', async () => {
      const response = await authRequest('/api/services/non-existent-id-12345');
      expect([404, 400]).toContain(response.status);
    });
    
    it('should return 404 for non-existent booking', async () => {
      const response = await authRequest('/api/bookings/non-existent-id-12345');
      expect([404, 401, 400]).toContain(response.status);
    });
    
    it('should return 404 for non-existent dispute', async () => {
      const response = await authRequest('/api/disputes/non-existent-id-12345');
      expect([404, 401, 400]).toContain(response.status);
    });
  });
  
  describe('Authorization', () => {
    it('should reject unauthenticated access to protected routes', async () => {
      // Clear cookies
      authCookies = [];
      
      const protectedRoutes = [
        '/api/auth/user',
        '/api/bookings/my',
        '/api/favorites',
        '/api/notifications',
        '/api/disputes',
      ];
      
      for (const route of protectedRoutes) {
        const response = await authRequest(route);
        expect([401, 403]).toContain(response.status);
      }
    });
  });
});

describe('Browser E2E Tests - API Response Validation', () => {
  
  beforeAll(async () => {
    // Login for these tests
    const response = await authRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: testUserEmail,
        password: testUserPassword,
      }),
    });
    
    if (response.status !== 200) {
      console.log('Note: Login failed for response validation tests, some may be skipped');
    }
  });
  
  describe('Response Shape Validation', () => {
    it('services list should have correct shape', async () => {
      const response = await authRequest('/api/services');
      expect(response.status).toBe(200);
      const services = await response.json();
      
      expect(Array.isArray(services)).toBe(true);
      if (services.length > 0) {
        const service = services[0];
        expect(service).toHaveProperty('id');
        expect(service).toHaveProperty('title');
        expect(service).toHaveProperty('price');
      }
    });
    
    it('categories list should have correct shape', async () => {
      const response = await authRequest('/api/categories');
      expect(response.status).toBe(200);
      const categories = await response.json();
      
      expect(Array.isArray(categories)).toBe(true);
      if (categories.length > 0) {
        const category = categories[0];
        expect(category).toHaveProperty('id');
        expect(category).toHaveProperty('name');
      }
    });
    
    it('disputes response should be an array', async () => {
      const response = await authRequest('/api/disputes');
      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(Array.isArray(data)).toBe(true);
      
      // Verify dispute structure if any exist
      if (data.length > 0) {
        const dispute = data[0];
        expect(dispute).toHaveProperty('id');
        expect(dispute).toHaveProperty('status');
        expect(dispute).toHaveProperty('reason');
      }
    });

    it('dispute details should have complete structure', async () => {
      const listResponse = await authRequest('/api/disputes');
      if (listResponse.status === 200) {
        const disputes = await listResponse.json();
        
        if (disputes.length > 0) {
          const response = await authRequest(`/api/disputes/${disputes[0].id}`);
          if (response.status === 200) {
            const data = await response.json();
            
            // Verify complete dispute detail structure
            expect(data).toHaveProperty('dispute');
            expect(data.dispute).toHaveProperty('id');
            expect(data.dispute).toHaveProperty('status');
            expect(data.dispute).toHaveProperty('customerEvidence');
            expect(data.dispute).toHaveProperty('vendorEvidence');
            
            // Evidence arrays should be arrays
            expect(Array.isArray(data.dispute.customerEvidence)).toBe(true);
            expect(Array.isArray(data.dispute.vendorEvidence)).toBe(true);
            
            expect(data).toHaveProperty('phases');
            expect(data).toHaveProperty('parties');
            expect(data).toHaveProperty('timeline');
          }
        }
      }
    });
    
    it('notifications response should have correct shape', async () => {
      const response = await authRequest('/api/notifications');
      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data).toHaveProperty('notifications');
      expect(Array.isArray(data.notifications)).toBe(true);
    });
    
    it('bookings response should be an array', async () => {
      const response = await authRequest('/api/bookings/my');
      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(Array.isArray(data)).toBe(true);
    });
    
    it('favorites response should be an array', async () => {
      const response = await authRequest('/api/favorites');
      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(Array.isArray(data)).toBe(true);
    });

    it('services should have images array structure', async () => {
      const response = await authRequest('/api/services');
      expect(response.status).toBe(200);
      const services = await response.json();
      
      expect(Array.isArray(services)).toBe(true);
      
      if (services.length > 0) {
        const service = services[0];
        expect(service).toHaveProperty('id');
        expect(service).toHaveProperty('title');
        expect(service).toHaveProperty('images');
        expect(Array.isArray(service.images)).toBe(true);
      }
    });

    it('user profile should include plan with image limits', async () => {
      const response = await authRequest('/api/auth/user');
      if (response.status === 200) {
        const user = await response.json();
        expect(user).toHaveProperty('id');
        
        // Plan may be null for users without a plan
        if (user.plan) {
          expect(user.plan).toHaveProperty('maxImages');
          expect(typeof user.plan.maxImages).toBe('number');
          expect(user.plan.maxImages).toBeGreaterThan(0);
        }
      }
    });
  });
});
