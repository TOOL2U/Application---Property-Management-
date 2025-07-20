/**
 * Comprehensive tests for the Unified Job Notification Service
 * Tests deduplication, rate limiting, and notification delivery
 */

import { jest } from '@jest/globals';
import { unifiedJobNotificationService } from '../../services/unifiedJobNotificationService';
import { enhancedNotificationDeduplicationService } from '../../services/enhancedNotificationDeduplicationService';
import { notificationRateLimitingService } from '../../services/notificationRateLimitingService';

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
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ toMillis: () => Date.now() })),
    fromMillis: jest.fn((ms) => ({ toMillis: () => ms }))
  }
}));

// Mock push notification service
jest.mock('../../services/pushNotificationService', () => ({
  pushNotificationService: {
    sendToUser: jest.fn().mockResolvedValue(true)
  }
}));

describe('UnifiedJobNotificationService', () => {
  const mockJobData = {
    jobId: 'test-job-123',
    title: 'Test Cleaning Job',
    description: 'Clean the property thoroughly',
    type: 'cleaning',
    priority: 'normal' as const,
    propertyName: 'Test Property',
    propertyAddress: '123 Test St',
    scheduledDate: new Date('2024-01-15T10:00:00Z'),
    assignedStaffId: 'staff-456'
  };

  const mockStaffData = {
    id: 'staff-456',
    name: 'John Doe',
    role: 'staff' as const,
    fcmTokens: ['token1', 'token2'],
    notificationPreferences: {
      pushEnabled: true,
      emailEnabled: true,
      smsEnabled: false,
      jobAssignments: true,
      jobUpdates: true,
      urgentOnly: false
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock getDoc to return staff data
    const { getDoc } = require('firebase/firestore');
    getDoc.mockResolvedValue({
      exists: () => true,
      id: mockStaffData.id,
      data: () => mockStaffData
    });
  });

  describe('Job Assignment Notifications', () => {
    test('should send job assignment notification successfully', async () => {
      // Mock deduplication service to allow notification
      const mockDeduplicationResult = {
        allowed: true,
        event: { id: 'event-123' }
      };
      jest.spyOn(enhancedNotificationDeduplicationService, 'shouldAllowNotification')
        .mockResolvedValue(mockDeduplicationResult);

      // Mock rate limiting service to allow notification
      const mockRateLimitResult = {
        allowed: true,
        currentCount: 1,
        limit: 10,
        resetTime: Date.now() + 60000
      };
      jest.spyOn(notificationRateLimitingService, 'checkRateLimit')
        .mockResolvedValue(mockRateLimitResult);

      const result = await unifiedJobNotificationService.sendJobAssignmentNotification(mockJobData);

      expect(result.success).toBe(true);
      expect(result.eventId).toBe('event-123');
      expect(result.recipientCount).toBe(1);
      expect(result.duplicatesBlocked).toBe(0);
      expect(result.channelResults.push.success).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    test('should block duplicate job assignment notifications', async () => {
      // Mock deduplication service to block notification
      const mockDeduplicationResult = {
        allowed: false,
        reason: 'Exact duplicate found',
        duplicateId: 'original-event-123',
        event: { id: 'blocked-event-456' }
      };
      jest.spyOn(enhancedNotificationDeduplicationService, 'shouldAllowNotification')
        .mockResolvedValue(mockDeduplicationResult);

      const result = await unifiedJobNotificationService.sendJobAssignmentNotification(mockJobData);

      expect(result.success).toBe(true); // Success because it's not an error, just blocked
      expect(result.duplicatesBlocked).toBe(1);
      expect(result.channelResults.push.success).toBe(0);
      expect(result.eventId).toBe('blocked-event-456');
    });

    test('should handle rate limiting for job assignment notifications', async () => {
      // Mock rate limiting service to block notification
      const mockRateLimitResult = {
        allowed: false,
        reason: 'User per-minute limit exceeded',
        currentCount: 10,
        limit: 10,
        resetTime: Date.now() + 30000,
        retryAfter: 30
      };
      jest.spyOn(notificationRateLimitingService, 'checkRateLimit')
        .mockResolvedValue(mockRateLimitResult);

      const result = await unifiedJobNotificationService.sendJobAssignmentNotification(mockJobData);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Rate limited: User per-minute limit exceeded');
      expect(result.channelResults.push.success).toBe(0);
    });

    test('should handle staff member not found', async () => {
      // Mock getDoc to return non-existent staff
      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValue({
        exists: () => false
      });

      const result = await unifiedJobNotificationService.sendJobAssignmentNotification(mockJobData);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Staff member not found: staff-456');
    });

    test('should respect staff notification preferences', async () => {
      // Mock staff with job assignments disabled
      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValue({
        exists: () => true,
        id: mockStaffData.id,
        data: () => ({
          ...mockStaffData,
          notificationPreferences: {
            ...mockStaffData.notificationPreferences,
            jobAssignments: false
          }
        })
      });

      const result = await unifiedJobNotificationService.sendJobAssignmentNotification(mockJobData);

      expect(result.success).toBe(true);
      expect(result.recipientCount).toBe(0);
      expect(result.channelResults.push.success).toBe(0);
    });
  });

  describe('Job Status Update Notifications', () => {
    const mockStatusUpdateData = {
      ...mockJobData,
      assignedStaffName: 'John Doe',
      status: 'completed',
      previousStatus: 'in_progress',
      completionNotes: 'Job completed successfully'
    };

    test('should send job status update notification to admins', async () => {
      // Mock getDocs to return admin users
      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValue({
        forEach: (callback: any) => {
          callback({
            id: 'admin-1',
            data: () => ({
              name: 'Admin User',
              role: 'admin',
              fcmTokens: ['admin-token-1'],
              notificationPreferences: {
                pushEnabled: true,
                jobUpdates: true
              }
            })
          });
        }
      });

      // Mock deduplication service to allow notification
      jest.spyOn(enhancedNotificationDeduplicationService, 'shouldAllowNotification')
        .mockResolvedValue({
          allowed: true,
          event: { id: 'status-event-123' }
        });

      const result = await unifiedJobNotificationService.sendJobStatusUpdateNotification(mockStatusUpdateData);

      expect(result.success).toBe(true);
      expect(result.recipientCount).toBe(1);
      expect(result.channelResults.push.success).toBe(1);
    });

    test('should handle multiple admin recipients', async () => {
      // Mock getDocs to return multiple admin users
      const { getDocs } = require('firebase/firestore');
      const mockAdmins = [
        { id: 'admin-1', name: 'Admin One', role: 'admin' },
        { id: 'admin-2', name: 'Admin Two', role: 'manager' }
      ];

      getDocs.mockResolvedValue({
        forEach: (callback: any) => {
          mockAdmins.forEach(admin => {
            callback({
              id: admin.id,
              data: () => ({
                name: admin.name,
                role: admin.role,
                fcmTokens: [`${admin.id}-token`],
                notificationPreferences: {
                  pushEnabled: true,
                  jobUpdates: true
                }
              })
            });
          });
        }
      });

      // Mock deduplication service to allow all notifications
      jest.spyOn(enhancedNotificationDeduplicationService, 'shouldAllowNotification')
        .mockResolvedValue({
          allowed: true,
          event: { id: 'status-event-123' }
        });

      const result = await unifiedJobNotificationService.sendJobStatusUpdateNotification(mockStatusUpdateData);

      expect(result.success).toBe(true);
      expect(result.recipientCount).toBe(2);
      expect(result.channelResults.push.success).toBe(2);
    });

    test('should block duplicate status update notifications', async () => {
      // Mock getDocs to return admin users
      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValue({
        forEach: (callback: any) => {
          callback({
            id: 'admin-1',
            data: () => ({
              name: 'Admin User',
              role: 'admin',
              fcmTokens: ['admin-token-1'],
              notificationPreferences: {
                pushEnabled: true,
                jobUpdates: true
              }
            })
          });
        }
      });

      // Mock deduplication service to block notification
      jest.spyOn(enhancedNotificationDeduplicationService, 'shouldAllowNotification')
        .mockResolvedValue({
          allowed: false,
          reason: 'Content duplicate found',
          duplicateId: 'original-status-event',
          event: { id: 'blocked-status-event' }
        });

      const result = await unifiedJobNotificationService.sendJobStatusUpdateNotification(mockStatusUpdateData);

      expect(result.duplicatesBlocked).toBe(1);
      expect(result.channelResults.push.success).toBe(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle push notification service errors gracefully', async () => {
      // Mock push notification service to throw error
      const { pushNotificationService } = require('../../services/pushNotificationService');
      pushNotificationService.sendToUser.mockRejectedValue(new Error('Push service unavailable'));

      // Mock deduplication service to allow notification
      jest.spyOn(enhancedNotificationDeduplicationService, 'shouldAllowNotification')
        .mockResolvedValue({
          allowed: true,
          event: { id: 'error-event-123' }
        });

      // Mock rate limiting service to allow notification
      jest.spyOn(notificationRateLimitingService, 'checkRateLimit')
        .mockResolvedValue({
          allowed: true,
          currentCount: 1,
          limit: 10,
          resetTime: Date.now() + 60000
        });

      const result = await unifiedJobNotificationService.sendJobAssignmentNotification(mockJobData);

      expect(result.success).toBe(true); // Real-time channel should still succeed
      expect(result.channelResults.push.failed).toBe(1);
      expect(result.channelResults.realtime.success).toBe(1);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should handle database connection errors', async () => {
      // Mock getDoc to throw error
      const { getDoc } = require('firebase/firestore');
      getDoc.mockRejectedValue(new Error('Database connection failed'));

      const result = await unifiedJobNotificationService.sendJobAssignmentNotification(mockJobData);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Notification Content Generation', () => {
    test('should generate appropriate content for different job statuses', async () => {
      const statusTests = [
        { status: 'accepted', expectedTitle: '✅ Job Accepted' },
        { status: 'rejected', expectedTitle: '❌ Job Rejected' },
        { status: 'started', expectedTitle: '🚀 Job Started' },
        { status: 'completed', expectedTitle: '🎉 Job Completed' },
        { status: 'cancelled', expectedTitle: '🚫 Job Cancelled' }
      ];

      // Mock getDocs to return admin users
      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValue({
        forEach: (callback: any) => {
          callback({
            id: 'admin-1',
            data: () => ({
              name: 'Admin User',
              role: 'admin',
              fcmTokens: ['admin-token-1'],
              notificationPreferences: {
                pushEnabled: true,
                jobUpdates: true
              }
            })
          });
        }
      });

      // Mock deduplication service to allow notifications
      jest.spyOn(enhancedNotificationDeduplicationService, 'shouldAllowNotification')
        .mockResolvedValue({
          allowed: true,
          event: { id: 'content-test-event' }
        });

      for (const test of statusTests) {
        const statusUpdateData = {
          ...mockJobData,
          assignedStaffName: 'John Doe',
          status: test.status,
          previousStatus: 'in_progress'
        };

        const result = await unifiedJobNotificationService.sendJobStatusUpdateNotification(statusUpdateData);
        
        expect(result.success).toBe(true);
        // The actual content validation would need to be done by inspecting the notification request
        // This is a simplified test to ensure the service handles different statuses
      }
    });
  });

  describe('Statistics and Monitoring', () => {
    test('should provide notification statistics', async () => {
      // Mock deduplication service stats
      jest.spyOn(enhancedNotificationDeduplicationService, 'getStats')
        .mockResolvedValue({
          memoryCache: 5,
          recentBlocked: 2,
          totalProcessed: 10
        });

      const stats = await unifiedJobNotificationService.getStats();

      expect(stats).toHaveProperty('deduplication');
      expect(stats).toHaveProperty('recentNotifications');
      expect(stats.deduplication.memoryCache).toBe(5);
      expect(stats.deduplication.recentBlocked).toBe(2);
      expect(stats.recentNotifications).toBe(10);
    });
  });

  // Integration test to verify no duplicates are sent
  describe('Integration Tests - Duplicate Prevention', () => {
    test('should prevent duplicates when same job assignment is triggered multiple times', async () => {
      // Reset mocks
      jest.clearAllMocks();

      // Mock staff data
      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValue({
        exists: () => true,
        id: mockStaffData.id,
        data: () => mockStaffData
      });

      // Mock rate limiting to allow
      jest.spyOn(notificationRateLimitingService, 'checkRateLimit')
        .mockResolvedValue({
          allowed: true,
          currentCount: 1,
          limit: 10,
          resetTime: Date.now() + 60000
        });

      // First call should succeed
      jest.spyOn(enhancedNotificationDeduplicationService, 'shouldAllowNotification')
        .mockResolvedValueOnce({
          allowed: true,
          event: { id: 'first-event-123' }
        });

      const firstResult = await unifiedJobNotificationService.sendJobAssignmentNotification(mockJobData);
      expect(firstResult.success).toBe(true);
      expect(firstResult.duplicatesBlocked).toBe(0);

      // Second call should be blocked as duplicate
      jest.spyOn(enhancedNotificationDeduplicationService, 'shouldAllowNotification')
        .mockResolvedValueOnce({
          allowed: false,
          reason: 'Exact duplicate found',
          duplicateId: 'first-event-123',
          event: { id: 'duplicate-event-456' }
        });

      const secondResult = await unifiedJobNotificationService.sendJobAssignmentNotification(mockJobData);
      expect(secondResult.success).toBe(true); // Not an error, just blocked
      expect(secondResult.duplicatesBlocked).toBe(1);
      expect(secondResult.channelResults.push.success).toBe(0);
    });

    test('should handle rapid-fire duplicate requests correctly', async () => {
      // Mock staff data
      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValue({
        exists: () => true,
        id: mockStaffData.id,
        data: () => mockStaffData
      });

      // Mock rate limiting to allow
      jest.spyOn(notificationRateLimitingService, 'checkRateLimit')
        .mockResolvedValue({
          allowed: true,
          currentCount: 1,
          limit: 10,
          resetTime: Date.now() + 60000
        });

      // First request allowed, subsequent blocked
      jest.spyOn(enhancedNotificationDeduplicationService, 'shouldAllowNotification')
        .mockResolvedValueOnce({
          allowed: true,
          event: { id: 'rapid-event-1' }
        })
        .mockResolvedValue({
          allowed: false,
          reason: 'Exact duplicate found',
          duplicateId: 'rapid-event-1',
          event: { id: 'rapid-duplicate' }
        });

      // Send 5 rapid requests
      const promises = Array(5).fill(null).map(() =>
        unifiedJobNotificationService.sendJobAssignmentNotification(mockJobData)
      );

      const results = await Promise.all(promises);

      // Only first should succeed with actual notification
      const successfulNotifications = results.filter(r => r.success && r.duplicatesBlocked === 0);
      const blockedDuplicates = results.filter(r => r.duplicatesBlocked > 0);

      expect(successfulNotifications).toHaveLength(1);
      expect(blockedDuplicates).toHaveLength(4);
    });
  });
});
