/**
 * Tests for Enhanced Notification Deduplication Service
 * Verifies duplicate detection and prevention logic
 */

import { jest } from '@jest/globals';
import { enhancedNotificationDeduplicationService } from '../../services/enhancedNotificationDeduplicationService';
import type { NotificationRequest } from '../../services/enhancedNotificationDeduplicationService';

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  getDb: jest.fn().mockResolvedValue({
    collection: jest.fn(),
    doc: jest.fn()
  })
}));

// Mock Firestore functions
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  setDoc: jest.fn(),
  deleteDoc: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ toMillis: () => Date.now() })),
    fromMillis: jest.fn((ms) => ({ toMillis: () => ms }))
  }
}));

describe('EnhancedNotificationDeduplicationService', () => {
  const mockNotificationRequest: NotificationRequest = {
    eventType: 'job.assigned',
    entityId: 'job-123',
    recipientId: 'staff-456',
    content: {
      title: 'New Job Assignment',
      body: 'Clean the property at 123 Main St',
      data: { jobId: 'job-123', priority: 'normal' }
    },
    source: 'api',
    priority: 'normal',
    metadata: { propertyId: 'prop-789' }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock empty Firestore responses by default
    const { getDocs } = require('firebase/firestore');
    getDocs.mockResolvedValue({ empty: true, docs: [] });
  });

  describe('Duplicate Detection', () => {
    test('should allow first notification for a new request', async () => {
      const result = await enhancedNotificationDeduplicationService.shouldAllowNotification(mockNotificationRequest);

      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
      expect(result.duplicateId).toBeUndefined();
      expect(result.event).toBeDefined();
      expect(result.event.eventType).toBe('job.assigned');
      expect(result.event.entityId).toBe('job-123');
      expect(result.event.recipientId).toBe('staff-456');
    });

    test('should block exact duplicate notifications', async () => {
      // First notification should be allowed
      const firstResult = await enhancedNotificationDeduplicationService.shouldAllowNotification(mockNotificationRequest);
      expect(firstResult.allowed).toBe(true);

      // Second identical notification should be blocked
      const secondResult = await enhancedNotificationDeduplicationService.shouldAllowNotification(mockNotificationRequest);
      expect(secondResult.allowed).toBe(false);
      expect(secondResult.reason).toContain('duplicate found in memory cache');
      expect(secondResult.duplicateId).toBe(firstResult.event.id);
    });

    test('should block content duplicates with different metadata', async () => {
      // First notification
      const firstResult = await enhancedNotificationDeduplicationService.shouldAllowNotification(mockNotificationRequest);
      expect(firstResult.allowed).toBe(true);

      // Second notification with same content but different source
      const duplicateContentRequest: NotificationRequest = {
        ...mockNotificationRequest,
        source: 'webhook', // Different source
        metadata: { propertyId: 'different-prop' } // Different metadata
      };

      const secondResult = await enhancedNotificationDeduplicationService.shouldAllowNotification(duplicateContentRequest);
      expect(secondResult.allowed).toBe(false);
      expect(secondResult.reason).toContain('Content duplicate found');
    });

    test('should allow notifications after deduplication window expires', async () => {
      // Create service with very short deduplication window for testing
      const testService = new (require('../../services/enhancedNotificationDeduplicationService').default.constructor)({
        defaultWindow: 100, // 100ms window
        persistentStorage: false
      });

      // First notification
      const firstResult = await testService.shouldAllowNotification(mockNotificationRequest);
      expect(firstResult.allowed).toBe(true);

      // Wait for deduplication window to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Second notification should now be allowed
      const secondResult = await testService.shouldAllowNotification(mockNotificationRequest);
      expect(secondResult.allowed).toBe(true);
    });

    test('should use custom deduplication windows for different event types', async () => {
      const emergencyRequest: NotificationRequest = {
        ...mockNotificationRequest,
        eventType: 'emergency',
        priority: 'urgent'
      };

      // Create service with custom windows
      const testService = new (require('../../services/enhancedNotificationDeduplicationService').default.constructor)({
        defaultWindow: 30000,
        eventTypeWindows: {
          'emergency': 5000, // 5 second window for emergencies
          'job.assigned': 60000 // 1 minute for job assignments
        },
        persistentStorage: false
      });

      // First emergency notification
      const firstResult = await testService.shouldAllowNotification(emergencyRequest);
      expect(firstResult.allowed).toBe(true);

      // Second emergency notification should be blocked
      const secondResult = await testService.shouldAllowNotification(emergencyRequest);
      expect(secondResult.allowed).toBe(false);
    });
  });

  describe('Persistent Storage Integration', () => {
    test('should check persistent storage for duplicates', async () => {
      // Mock Firestore to return existing notification
      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValueOnce({
        empty: false,
        docs: [{
          data: () => ({
            id: 'existing-event-123',
            fingerprint: 'test-fingerprint',
            recipientId: 'staff-456',
            timestamp: Date.now() - 10000 // 10 seconds ago
          })
        }]
      });

      // Mock the fingerprint generation to return predictable value
      const originalGenerateFingerprint = enhancedNotificationDeduplicationService['generateFingerprint'];
      enhancedNotificationDeduplicationService['generateFingerprint'] = jest.fn().mockReturnValue('test-fingerprint');

      const result = await enhancedNotificationDeduplicationService.shouldAllowNotification(mockNotificationRequest);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('persistent storage');
      expect(result.duplicateId).toBe('existing-event-123');

      // Restore original method
      enhancedNotificationDeduplicationService['generateFingerprint'] = originalGenerateFingerprint;
    });

    test('should handle Firestore errors gracefully', async () => {
      // Mock Firestore to throw error
      const { getDocs } = require('firebase/firestore');
      getDocs.mockRejectedValue(new Error('Firestore connection failed'));

      const result = await enhancedNotificationDeduplicationService.shouldAllowNotification(mockNotificationRequest);

      // Should allow notification when storage check fails
      expect(result.allowed).toBe(true);
      expect(result.event).toBeDefined();
    });
  });

  describe('Notification Status Tracking', () => {
    test('should mark notification as sent', async () => {
      const result = await enhancedNotificationDeduplicationService.shouldAllowNotification(mockNotificationRequest);
      expect(result.allowed).toBe(true);

      // Mock setDoc for Firestore update
      const { setDoc } = require('firebase/firestore');
      setDoc.mockResolvedValue(undefined);

      await enhancedNotificationDeduplicationService.markNotificationSent(result.event.id);

      // Verify the notification status was updated
      expect(setDoc).toHaveBeenCalled();
    });

    test('should mark notification as failed', async () => {
      const result = await enhancedNotificationDeduplicationService.shouldAllowNotification(mockNotificationRequest);
      expect(result.allowed).toBe(true);

      // Mock setDoc for Firestore update
      const { setDoc } = require('firebase/firestore');
      setDoc.mockResolvedValue(undefined);

      const errorMessage = 'Push notification service unavailable';
      await enhancedNotificationDeduplicationService.markNotificationFailed(result.event.id, errorMessage);

      // Verify the notification status was updated with error
      expect(setDoc).toHaveBeenCalled();
    });
  });

  describe('Fingerprint Generation', () => {
    test('should generate consistent fingerprints for identical requests', async () => {
      const result1 = await enhancedNotificationDeduplicationService.shouldAllowNotification(mockNotificationRequest);
      
      // Clear memory cache to test fingerprint consistency
      enhancedNotificationDeduplicationService['memoryCache'].clear();
      
      const result2 = await enhancedNotificationDeduplicationService.shouldAllowNotification(mockNotificationRequest);

      expect(result1.event.fingerprint).toBe(result2.event.fingerprint);
    });

    test('should generate different fingerprints for different requests', async () => {
      const result1 = await enhancedNotificationDeduplicationService.shouldAllowNotification(mockNotificationRequest);

      const differentRequest: NotificationRequest = {
        ...mockNotificationRequest,
        entityId: 'job-456' // Different job ID
      };

      const result2 = await enhancedNotificationDeduplicationService.shouldAllowNotification(differentRequest);

      expect(result1.event.fingerprint).not.toBe(result2.event.fingerprint);
    });

    test('should generate different content hashes for different content', async () => {
      const result1 = await enhancedNotificationDeduplicationService.shouldAllowNotification(mockNotificationRequest);

      const differentContentRequest: NotificationRequest = {
        ...mockNotificationRequest,
        content: {
          ...mockNotificationRequest.content,
          title: 'Different Title'
        }
      };

      const result2 = await enhancedNotificationDeduplicationService.shouldAllowNotification(differentContentRequest);

      expect(result1.event.contentHash).not.toBe(result2.event.contentHash);
    });
  });

  describe('Memory Management', () => {
    test('should clean up old notifications from memory cache', async () => {
      // Create service with short cleanup interval for testing
      const testService = new (require('../../services/enhancedNotificationDeduplicationService').default.constructor)({
        maxHistoryAge: 100, // 100ms history
        cleanupInterval: 50, // 50ms cleanup interval
        persistentStorage: false
      });

      // Add notification to cache
      await testService.shouldAllowNotification(mockNotificationRequest);
      expect(testService['memoryCache'].size).toBe(1);

      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 200));

      // Cache should be cleaned up
      expect(testService['memoryCache'].size).toBe(0);

      testService.destroy();
    });

    test('should provide accurate statistics', async () => {
      // Add some notifications
      await enhancedNotificationDeduplicationService.shouldAllowNotification(mockNotificationRequest);
      
      const duplicateRequest = { ...mockNotificationRequest };
      await enhancedNotificationDeduplicationService.shouldAllowNotification(duplicateRequest);

      const stats = await enhancedNotificationDeduplicationService.getStats();

      expect(stats.memoryCache).toBeGreaterThan(0);
      expect(stats.totalProcessed).toBeGreaterThan(0);
      expect(stats.recentBlocked).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed notification requests', async () => {
      const malformedRequest = {
        eventType: '',
        entityId: '',
        recipientId: '',
        content: { title: '', body: '' },
        source: '',
        priority: 'normal'
      } as NotificationRequest;

      const result = await enhancedNotificationDeduplicationService.shouldAllowNotification(malformedRequest);

      // Should still process the request, even if malformed
      expect(result.event).toBeDefined();
      expect(result.event.eventType).toBe('');
    });

    test('should handle service destruction gracefully', () => {
      const testService = new (require('../../services/enhancedNotificationDeduplicationService').default.constructor)();
      
      // Should not throw error
      expect(() => testService.destroy()).not.toThrow();
    });
  });

  describe('Concurrent Request Handling', () => {
    test('should handle concurrent duplicate requests correctly', async () => {
      // Send multiple identical requests concurrently
      const promises = Array(10).fill(null).map(() => 
        enhancedNotificationDeduplicationService.shouldAllowNotification(mockNotificationRequest)
      );

      const results = await Promise.all(promises);

      // Only one should be allowed, rest should be blocked as duplicates
      const allowedResults = results.filter(r => r.allowed);
      const blockedResults = results.filter(r => !r.allowed);

      expect(allowedResults).toHaveLength(1);
      expect(blockedResults).toHaveLength(9);
    });
  });
});
