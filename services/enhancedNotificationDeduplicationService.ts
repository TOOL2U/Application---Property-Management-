/**
 * Enhanced Notification Deduplication Service
 * Prevents duplicate notifications with persistent storage and advanced deduplication logic
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  query, 
  where, 
  getDocs, 
  deleteDoc,
  Timestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import crypto from 'crypto';

export interface NotificationEvent {
  id: string;
  eventType: string;
  entityId: string; // jobId, bookingId, etc.
  recipientId: string;
  contentHash: string;
  fingerprint: string;
  timestamp: number;
  source: string;
  metadata: Record<string, any>;
  status: 'pending' | 'sent' | 'failed' | 'duplicate';
  deliveryAttempts: number;
  lastAttempt?: number;
  errorMessage?: string;
}

export interface DeduplicationConfig {
  defaultWindow: number; // Default deduplication window in milliseconds
  eventTypeWindows: Record<string, number>; // Custom windows per event type
  maxHistoryAge: number; // Maximum age to keep notification history
  cleanupInterval: number; // How often to clean up old records
  persistentStorage: boolean; // Whether to use Firestore for persistence
}

export interface NotificationRequest {
  eventType: string;
  entityId: string;
  recipientId: string;
  content: {
    title: string;
    body: string;
    data?: Record<string, any>;
  };
  source: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  metadata?: Record<string, any>;
}

class EnhancedNotificationDeduplicationService {
  private config: DeduplicationConfig;
  private memoryCache: Map<string, NotificationEvent> = new Map();
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<DeduplicationConfig>) {
    this.config = {
      defaultWindow: 30000, // 30 seconds
      eventTypeWindows: {
        'job.assigned': 60000, // 1 minute for job assignments
        'job.completed': 30000, // 30 seconds for completions
        'job.updated': 15000, // 15 seconds for updates
        'booking.updated': 45000, // 45 seconds for booking updates
        'emergency': 5000, // 5 seconds for emergency notifications
      },
      maxHistoryAge: 24 * 60 * 60 * 1000, // 24 hours
      cleanupInterval: 5 * 60 * 1000, // 5 minutes
      persistentStorage: true,
      ...config
    };

    this.startCleanupTimer();
  }

  /**
   * Check if a notification should be allowed (not a duplicate)
   */
  async shouldAllowNotification(request: NotificationRequest): Promise<{
    allowed: boolean;
    reason?: string;
    duplicateId?: string;
    event: NotificationEvent;
  }> {
    try {
      // Generate fingerprint for the notification
      const fingerprint = this.generateFingerprint(request);
      const contentHash = this.generateContentHash(request.content);

      // Create notification event record
      const event: NotificationEvent = {
        id: this.generateEventId(),
        eventType: request.eventType,
        entityId: request.entityId,
        recipientId: request.recipientId,
        contentHash,
        fingerprint,
        timestamp: Date.now(),
        source: request.source,
        metadata: request.metadata || {},
        status: 'pending',
        deliveryAttempts: 0
      };

      // Check for duplicates
      const duplicateCheck = await this.checkForDuplicates(event);
      
      if (!duplicateCheck.allowed) {
        event.status = 'duplicate';
        await this.storeNotificationEvent(event);
        
        console.log(`🔕 Duplicate notification blocked: ${request.eventType} for ${request.entityId}`, {
          reason: duplicateCheck.reason,
          duplicateId: duplicateCheck.duplicateId,
          fingerprint
        });

        return {
          allowed: false,
          reason: duplicateCheck.reason,
          duplicateId: duplicateCheck.duplicateId,
          event
        };
      }

      // Store the notification event
      await this.storeNotificationEvent(event);
      
      console.log(`✅ Notification allowed: ${request.eventType} for ${request.entityId}`, {
        eventId: event.id,
        fingerprint
      });

      return {
        allowed: true,
        event
      };

    } catch (error) {
      console.error('❌ Error in deduplication check:', error);
      
      // In case of error, allow the notification but log the issue
      const fallbackEvent: NotificationEvent = {
        id: this.generateEventId(),
        eventType: request.eventType,
        entityId: request.entityId,
        recipientId: request.recipientId,
        contentHash: 'error',
        fingerprint: 'error',
        timestamp: Date.now(),
        source: request.source,
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
        status: 'pending',
        deliveryAttempts: 0
      };

      return {
        allowed: true,
        event: fallbackEvent
      };
    }
  }

  /**
   * Mark a notification as successfully sent
   */
  async markNotificationSent(eventId: string): Promise<void> {
    try {
      const event = await this.getNotificationEvent(eventId);
      if (event) {
        event.status = 'sent';
        event.deliveryAttempts += 1;
        event.lastAttempt = Date.now();
        await this.storeNotificationEvent(event);
        
        console.log(`📤 Notification marked as sent: ${eventId}`);
      }
    } catch (error) {
      console.error('❌ Error marking notification as sent:', error);
    }
  }

  /**
   * Mark a notification as failed
   */
  async markNotificationFailed(eventId: string, errorMessage: string): Promise<void> {
    try {
      const event = await this.getNotificationEvent(eventId);
      if (event) {
        event.status = 'failed';
        event.deliveryAttempts += 1;
        event.lastAttempt = Date.now();
        event.errorMessage = errorMessage;
        await this.storeNotificationEvent(event);
        
        console.log(`❌ Notification marked as failed: ${eventId} - ${errorMessage}`);
      }
    } catch (error) {
      console.error('❌ Error marking notification as failed:', error);
    }
  }

  /**
   * Generate a unique fingerprint for the notification
   */
  private generateFingerprint(request: NotificationRequest): string {
    const data = {
      eventType: request.eventType,
      entityId: request.entityId,
      recipientId: request.recipientId,
      source: request.source,
      // Include relevant metadata that affects uniqueness
      priority: request.priority
    };
    
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Generate content hash for duplicate content detection
   */
  private generateContentHash(content: { title: string; body: string; data?: Record<string, any> }): string {
    return crypto
      .createHash('md5')
      .update(JSON.stringify(content))
      .digest('hex')
      .substring(0, 12);
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  /**
   * Check for duplicate notifications
   */
  private async checkForDuplicates(event: NotificationEvent): Promise<{
    allowed: boolean;
    reason?: string;
    duplicateId?: string;
  }> {
    const deduplicationWindow = this.config.eventTypeWindows[event.eventType] || this.config.defaultWindow;
    const cutoffTime = event.timestamp - deduplicationWindow;

    // Check memory cache first (faster)
    const memoryDuplicate = this.checkMemoryCache(event, cutoffTime);
    if (!memoryDuplicate.allowed) {
      return memoryDuplicate;
    }

    // Check persistent storage if enabled
    if (this.config.persistentStorage) {
      return await this.checkPersistentStorage(event, cutoffTime);
    }

    return { allowed: true };
  }

  /**
   * Check memory cache for duplicates
   */
  private checkMemoryCache(event: NotificationEvent, cutoffTime: number): {
    allowed: boolean;
    reason?: string;
    duplicateId?: string;
  } {
    for (const [key, cachedEvent] of this.memoryCache.entries()) {
      if (cachedEvent.timestamp < cutoffTime) {
        // Remove old entries
        this.memoryCache.delete(key);
        continue;
      }

      // Check for exact fingerprint match
      if (cachedEvent.fingerprint === event.fingerprint && 
          cachedEvent.recipientId === event.recipientId) {
        return {
          allowed: false,
          reason: 'Exact duplicate found in memory cache',
          duplicateId: cachedEvent.id
        };
      }

      // Check for content hash match (same content, different metadata)
      if (cachedEvent.contentHash === event.contentHash &&
          cachedEvent.recipientId === event.recipientId &&
          cachedEvent.entityId === event.entityId) {
        return {
          allowed: false,
          reason: 'Content duplicate found in memory cache',
          duplicateId: cachedEvent.id
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Check persistent storage for duplicates
   */
  private async checkPersistentStorage(event: NotificationEvent, cutoffTime: number): Promise<{
    allowed: boolean;
    reason?: string;
    duplicateId?: string;
  }> {
    try {
      const db = await getDb();
      const notificationsRef = collection(db, 'notification_events');
      
      // Query for recent notifications with same fingerprint
      const fingerprintQuery = query(
        notificationsRef,
        where('fingerprint', '==', event.fingerprint),
        where('recipientId', '==', event.recipientId),
        where('timestamp', '>', cutoffTime),
        orderBy('timestamp', 'desc'),
        limit(1)
      );

      const fingerprintDocs = await getDocs(fingerprintQuery);
      if (!fingerprintDocs.empty) {
        const duplicate = fingerprintDocs.docs[0].data() as NotificationEvent;
        return {
          allowed: false,
          reason: 'Exact duplicate found in persistent storage',
          duplicateId: duplicate.id
        };
      }

      // Query for content duplicates
      const contentQuery = query(
        notificationsRef,
        where('contentHash', '==', event.contentHash),
        where('recipientId', '==', event.recipientId),
        where('entityId', '==', event.entityId),
        where('timestamp', '>', cutoffTime),
        orderBy('timestamp', 'desc'),
        limit(1)
      );

      const contentDocs = await getDocs(contentQuery);
      if (!contentDocs.empty) {
        const duplicate = contentDocs.docs[0].data() as NotificationEvent;
        return {
          allowed: false,
          reason: 'Content duplicate found in persistent storage',
          duplicateId: duplicate.id
        };
      }

      return { allowed: true };

    } catch (error) {
      console.error('❌ Error checking persistent storage for duplicates:', error);
      // If storage check fails, allow the notification
      return { allowed: true };
    }
  }

  /**
   * Store notification event
   */
  private async storeNotificationEvent(event: NotificationEvent): Promise<void> {
    // Store in memory cache
    this.memoryCache.set(event.id, event);

    // Store in persistent storage if enabled
    if (this.config.persistentStorage) {
      try {
        const db = await getDb();
        const docRef = doc(db, 'notification_events', event.id);
        await setDoc(docRef, {
          ...event,
          timestamp: Timestamp.fromMillis(event.timestamp),
          lastAttempt: event.lastAttempt ? Timestamp.fromMillis(event.lastAttempt) : null
        });
      } catch (error) {
        console.error('❌ Error storing notification event in Firestore:', error);
      }
    }
  }

  /**
   * Get notification event by ID
   */
  private async getNotificationEvent(eventId: string): Promise<NotificationEvent | null> {
    // Check memory cache first
    const cached = this.memoryCache.get(eventId);
    if (cached) {
      return cached;
    }

    // Check persistent storage
    if (this.config.persistentStorage) {
      try {
        const db = await getDb();
        const docRef = doc(db, 'notification_events', eventId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          return {
            ...data,
            timestamp: data.timestamp.toMillis(),
            lastAttempt: data.lastAttempt?.toMillis()
          } as NotificationEvent;
        }
      } catch (error) {
        console.error('❌ Error getting notification event from Firestore:', error);
      }
    }

    return null;
  }

  /**
   * Start cleanup timer for old notifications
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupOldNotifications();
    }, this.config.cleanupInterval);
  }

  /**
   * Clean up old notification records
   */
  private async cleanupOldNotifications(): Promise<void> {
    const cutoffTime = Date.now() - this.config.maxHistoryAge;

    // Clean memory cache
    for (const [key, event] of this.memoryCache.entries()) {
      if (event.timestamp < cutoffTime) {
        this.memoryCache.delete(key);
      }
    }

    // Clean persistent storage
    if (this.config.persistentStorage) {
      try {
        const db = await getDb();
        const notificationsRef = collection(db, 'notification_events');
        const oldQuery = query(
          notificationsRef,
          where('timestamp', '<', Timestamp.fromMillis(cutoffTime)),
          limit(100) // Process in batches
        );

        const oldDocs = await getDocs(oldQuery);
        const deletePromises = oldDocs.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);

        if (oldDocs.size > 0) {
          console.log(`🧹 Cleaned up ${oldDocs.size} old notification records`);
        }
      } catch (error) {
        console.error('❌ Error cleaning up old notifications:', error);
      }
    }
  }

  /**
   * Get deduplication statistics
   */
  async getStats(): Promise<{
    memoryCache: number;
    recentBlocked: number;
    totalProcessed: number;
  }> {
    const memoryCache = this.memoryCache.size;
    let recentBlocked = 0;
    let totalProcessed = 0;

    // Count blocked notifications in memory
    for (const event of this.memoryCache.values()) {
      if (event.status === 'duplicate') {
        recentBlocked++;
      }
      totalProcessed++;
    }

    return {
      memoryCache,
      recentBlocked,
      totalProcessed
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.memoryCache.clear();
  }
}

// Export singleton instance
export const enhancedNotificationDeduplicationService = new EnhancedNotificationDeduplicationService();
export default enhancedNotificationDeduplicationService;
