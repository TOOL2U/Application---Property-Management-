/**
 * Notification Rate Limiting Service
 * Prevents notification spam and ensures system stability
 */

import { collection, doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { getDb } from '../lib/firebase';

export interface RateLimitConfig {
  perUser: {
    maxPerMinute: number;
    maxPerHour: number;
    maxPerDay: number;
  };
  perEventType: {
    [eventType: string]: {
      maxPerMinute: number;
      burstLimit: number;
    };
  };
  global: {
    maxConcurrent: number;
    maxPerSecond: number;
  };
}

export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  retryAfter?: number; // seconds
  currentCount: number;
  limit: number;
  resetTime: number;
}

interface RateLimitBucket {
  count: number;
  resetTime: number;
  lastUpdate: number;
}

interface UserRateLimits {
  minute: RateLimitBucket;
  hour: RateLimitBucket;
  day: RateLimitBucket;
}

interface EventTypeRateLimits {
  minute: RateLimitBucket;
  burst: RateLimitBucket;
}

class NotificationRateLimitingService {
  private config: RateLimitConfig;
  private userLimits: Map<string, UserRateLimits> = new Map();
  private eventTypeLimits: Map<string, EventTypeRateLimits> = new Map();
  private globalLimits: {
    concurrent: number;
    perSecond: RateLimitBucket;
  };
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<RateLimitConfig>) {
    this.config = {
      perUser: {
        maxPerMinute: 10,
        maxPerHour: 100,
        maxPerDay: 500
      },
      perEventType: {
        'job.assigned': { maxPerMinute: 20, burstLimit: 5 },
        'job.status_updated': { maxPerMinute: 30, burstLimit: 10 },
        'job.completed': { maxPerMinute: 15, burstLimit: 3 },
        'emergency': { maxPerMinute: 5, burstLimit: 2 },
        'booking.updated': { maxPerMinute: 25, burstLimit: 8 }
      },
      global: {
        maxConcurrent: 100,
        maxPerSecond: 50
      },
      ...config
    };

    this.globalLimits = {
      concurrent: 0,
      perSecond: {
        count: 0,
        resetTime: Date.now() + 1000,
        lastUpdate: Date.now()
      }
    };

    this.startCleanupTimer();
  }

  /**
   * Check if a notification request should be rate limited
   */
  async checkRateLimit(
    userId: string,
    eventType: string,
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
  ): Promise<RateLimitResult> {
    const now = Date.now();

    try {
      // Check global rate limits first
      const globalCheck = this.checkGlobalRateLimit(now);
      if (!globalCheck.allowed) {
        return globalCheck;
      }

      // Check per-user rate limits
      const userCheck = await this.checkUserRateLimit(userId, now);
      if (!userCheck.allowed) {
        return userCheck;
      }

      // Check per-event-type rate limits
      const eventTypeCheck = this.checkEventTypeRateLimit(eventType, now);
      if (!eventTypeCheck.allowed) {
        return eventTypeCheck;
      }

      // If urgent priority, allow with higher limits
      if (priority === 'urgent') {
        return this.handleUrgentNotification(userId, eventType, now);
      }

      // All checks passed, increment counters
      this.incrementCounters(userId, eventType, now);

      return {
        allowed: true,
        currentCount: 1,
        limit: this.config.perUser.maxPerMinute,
        resetTime: now + 60000
      };

    } catch (error) {
      console.error('❌ Error in rate limit check:', error);
      // In case of error, allow the notification but log the issue
      return {
        allowed: true,
        currentCount: 0,
        limit: 0,
        resetTime: now
      };
    }
  }

  /**
   * Check global rate limits
   */
  private checkGlobalRateLimit(now: number): RateLimitResult {
    // Check concurrent notifications
    if (this.globalLimits.concurrent >= this.config.global.maxConcurrent) {
      return {
        allowed: false,
        reason: 'Global concurrent limit exceeded',
        currentCount: this.globalLimits.concurrent,
        limit: this.config.global.maxConcurrent,
        resetTime: now + 1000,
        retryAfter: 1
      };
    }

    // Check per-second limit
    const perSecondBucket = this.globalLimits.perSecond;
    if (now >= perSecondBucket.resetTime) {
      // Reset the bucket
      perSecondBucket.count = 0;
      perSecondBucket.resetTime = now + 1000;
      perSecondBucket.lastUpdate = now;
    }

    if (perSecondBucket.count >= this.config.global.maxPerSecond) {
      const retryAfter = Math.ceil((perSecondBucket.resetTime - now) / 1000);
      return {
        allowed: false,
        reason: 'Global per-second limit exceeded',
        currentCount: perSecondBucket.count,
        limit: this.config.global.maxPerSecond,
        resetTime: perSecondBucket.resetTime,
        retryAfter
      };
    }

    return { allowed: true, currentCount: 0, limit: 0, resetTime: 0 };
  }

  /**
   * Check per-user rate limits
   */
  private async checkUserRateLimit(userId: string, now: number): Promise<RateLimitResult> {
    let userLimits = this.userLimits.get(userId);
    
    if (!userLimits) {
      // Try to load from persistent storage
      userLimits = await this.loadUserLimitsFromStorage(userId, now);
      this.userLimits.set(userId, userLimits);
    }

    // Check minute limit
    if (now >= userLimits.minute.resetTime) {
      userLimits.minute = {
        count: 0,
        resetTime: now + 60000,
        lastUpdate: now
      };
    }

    if (userLimits.minute.count >= this.config.perUser.maxPerMinute) {
      const retryAfter = Math.ceil((userLimits.minute.resetTime - now) / 1000);
      return {
        allowed: false,
        reason: 'User per-minute limit exceeded',
        currentCount: userLimits.minute.count,
        limit: this.config.perUser.maxPerMinute,
        resetTime: userLimits.minute.resetTime,
        retryAfter
      };
    }

    // Check hour limit
    if (now >= userLimits.hour.resetTime) {
      userLimits.hour = {
        count: 0,
        resetTime: now + 3600000,
        lastUpdate: now
      };
    }

    if (userLimits.hour.count >= this.config.perUser.maxPerHour) {
      const retryAfter = Math.ceil((userLimits.hour.resetTime - now) / 1000);
      return {
        allowed: false,
        reason: 'User per-hour limit exceeded',
        currentCount: userLimits.hour.count,
        limit: this.config.perUser.maxPerHour,
        resetTime: userLimits.hour.resetTime,
        retryAfter
      };
    }

    // Check day limit
    if (now >= userLimits.day.resetTime) {
      userLimits.day = {
        count: 0,
        resetTime: now + 86400000,
        lastUpdate: now
      };
    }

    if (userLimits.day.count >= this.config.perUser.maxPerDay) {
      const retryAfter = Math.ceil((userLimits.day.resetTime - now) / 1000);
      return {
        allowed: false,
        reason: 'User per-day limit exceeded',
        currentCount: userLimits.day.count,
        limit: this.config.perUser.maxPerDay,
        resetTime: userLimits.day.resetTime,
        retryAfter
      };
    }

    return { allowed: true, currentCount: 0, limit: 0, resetTime: 0 };
  }

  /**
   * Check per-event-type rate limits
   */
  private checkEventTypeRateLimit(eventType: string, now: number): RateLimitResult {
    const eventConfig = this.config.perEventType[eventType];
    if (!eventConfig) {
      // No specific limits for this event type
      return { allowed: true, currentCount: 0, limit: 0, resetTime: 0 };
    }

    let eventLimits = this.eventTypeLimits.get(eventType);
    
    if (!eventLimits) {
      eventLimits = {
        minute: {
          count: 0,
          resetTime: now + 60000,
          lastUpdate: now
        },
        burst: {
          count: 0,
          resetTime: now + 10000, // 10 second burst window
          lastUpdate: now
        }
      };
      this.eventTypeLimits.set(eventType, eventLimits);
    }

    // Check minute limit
    if (now >= eventLimits.minute.resetTime) {
      eventLimits.minute = {
        count: 0,
        resetTime: now + 60000,
        lastUpdate: now
      };
    }

    if (eventLimits.minute.count >= eventConfig.maxPerMinute) {
      const retryAfter = Math.ceil((eventLimits.minute.resetTime - now) / 1000);
      return {
        allowed: false,
        reason: `Event type '${eventType}' per-minute limit exceeded`,
        currentCount: eventLimits.minute.count,
        limit: eventConfig.maxPerMinute,
        resetTime: eventLimits.minute.resetTime,
        retryAfter
      };
    }

    // Check burst limit
    if (now >= eventLimits.burst.resetTime) {
      eventLimits.burst = {
        count: 0,
        resetTime: now + 10000,
        lastUpdate: now
      };
    }

    if (eventLimits.burst.count >= eventConfig.burstLimit) {
      const retryAfter = Math.ceil((eventLimits.burst.resetTime - now) / 1000);
      return {
        allowed: false,
        reason: `Event type '${eventType}' burst limit exceeded`,
        currentCount: eventLimits.burst.count,
        limit: eventConfig.burstLimit,
        resetTime: eventLimits.burst.resetTime,
        retryAfter
      };
    }

    return { allowed: true, currentCount: 0, limit: 0, resetTime: 0 };
  }

  /**
   * Handle urgent notifications with higher limits
   */
  private handleUrgentNotification(userId: string, eventType: string, now: number): RateLimitResult {
    // Urgent notifications get 2x the normal limits
    const userLimits = this.userLimits.get(userId)!;
    const urgentMinuteLimit = this.config.perUser.maxPerMinute * 2;

    if (userLimits.minute.count >= urgentMinuteLimit) {
      const retryAfter = Math.ceil((userLimits.minute.resetTime - now) / 1000);
      return {
        allowed: false,
        reason: 'Urgent notification limit exceeded',
        currentCount: userLimits.minute.count,
        limit: urgentMinuteLimit,
        resetTime: userLimits.minute.resetTime,
        retryAfter
      };
    }

    // Allow urgent notification and increment counters
    this.incrementCounters(userId, eventType, now);

    return {
      allowed: true,
      currentCount: userLimits.minute.count,
      limit: urgentMinuteLimit,
      resetTime: userLimits.minute.resetTime
    };
  }

  /**
   * Increment all relevant counters
   */
  private incrementCounters(userId: string, eventType: string, now: number): void {
    // Increment global counters
    this.globalLimits.concurrent++;
    this.globalLimits.perSecond.count++;

    // Increment user counters
    const userLimits = this.userLimits.get(userId)!;
    userLimits.minute.count++;
    userLimits.hour.count++;
    userLimits.day.count++;

    // Increment event type counters
    const eventLimits = this.eventTypeLimits.get(eventType);
    if (eventLimits) {
      eventLimits.minute.count++;
      eventLimits.burst.count++;
    }

    // Save user limits to persistent storage (async, don't wait)
    this.saveUserLimitsToStorage(userId, userLimits).catch(error => {
      console.error('❌ Error saving user rate limits:', error);
    });
  }

  /**
   * Decrement concurrent counter when notification is complete
   */
  notificationComplete(): void {
    if (this.globalLimits.concurrent > 0) {
      this.globalLimits.concurrent--;
    }
  }

  /**
   * Load user limits from persistent storage
   */
  private async loadUserLimitsFromStorage(userId: string, now: number): Promise<UserRateLimits> {
    try {
      const db = await getDb();
      const docRef = doc(db, 'rate_limits', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          minute: {
            count: data.minute?.count || 0,
            resetTime: data.minute?.resetTime?.toMillis() || now + 60000,
            lastUpdate: data.minute?.lastUpdate?.toMillis() || now
          },
          hour: {
            count: data.hour?.count || 0,
            resetTime: data.hour?.resetTime?.toMillis() || now + 3600000,
            lastUpdate: data.hour?.lastUpdate?.toMillis() || now
          },
          day: {
            count: data.day?.count || 0,
            resetTime: data.day?.resetTime?.toMillis() || now + 86400000,
            lastUpdate: data.day?.lastUpdate?.toMillis() || now
          }
        };
      }
    } catch (error) {
      console.error('❌ Error loading user rate limits from storage:', error);
    }

    // Return default limits if loading fails
    return {
      minute: { count: 0, resetTime: now + 60000, lastUpdate: now },
      hour: { count: 0, resetTime: now + 3600000, lastUpdate: now },
      day: { count: 0, resetTime: now + 86400000, lastUpdate: now }
    };
  }

  /**
   * Save user limits to persistent storage
   */
  private async saveUserLimitsToStorage(userId: string, limits: UserRateLimits): Promise<void> {
    try {
      const db = await getDb();
      const docRef = doc(db, 'rate_limits', userId);
      
      await setDoc(docRef, {
        minute: {
          count: limits.minute.count,
          resetTime: Timestamp.fromMillis(limits.minute.resetTime),
          lastUpdate: Timestamp.fromMillis(limits.minute.lastUpdate)
        },
        hour: {
          count: limits.hour.count,
          resetTime: Timestamp.fromMillis(limits.hour.resetTime),
          lastUpdate: Timestamp.fromMillis(limits.hour.lastUpdate)
        },
        day: {
          count: limits.day.count,
          resetTime: Timestamp.fromMillis(limits.day.resetTime),
          lastUpdate: Timestamp.fromMillis(limits.day.lastUpdate)
        },
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('❌ Error saving user rate limits to storage:', error);
    }
  }

  /**
   * Start cleanup timer for expired limits
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredLimits();
    }, 60000); // Clean up every minute
  }

  /**
   * Clean up expired rate limit entries
   */
  private cleanupExpiredLimits(): void {
    const now = Date.now();

    // Clean up user limits
    for (const [userId, limits] of this.userLimits.entries()) {
      if (limits.day.resetTime < now) {
        this.userLimits.delete(userId);
      }
    }

    // Clean up event type limits
    for (const [eventType, limits] of this.eventTypeLimits.entries()) {
      if (limits.minute.resetTime < now && limits.burst.resetTime < now) {
        this.eventTypeLimits.delete(eventType);
      }
    }

    console.log('🧹 Cleaned up expired rate limit entries');
  }

  /**
   * Get current rate limit status for a user
   */
  async getRateLimitStatus(userId: string): Promise<{
    minute: { current: number; limit: number; resetTime: number };
    hour: { current: number; limit: number; resetTime: number };
    day: { current: number; limit: number; resetTime: number };
  }> {
    const now = Date.now();
    let userLimits = this.userLimits.get(userId);
    
    if (!userLimits) {
      userLimits = await this.loadUserLimitsFromStorage(userId, now);
      this.userLimits.set(userId, userLimits);
    }

    return {
      minute: {
        current: userLimits.minute.count,
        limit: this.config.perUser.maxPerMinute,
        resetTime: userLimits.minute.resetTime
      },
      hour: {
        current: userLimits.hour.count,
        limit: this.config.perUser.maxPerHour,
        resetTime: userLimits.hour.resetTime
      },
      day: {
        current: userLimits.day.count,
        limit: this.config.perUser.maxPerDay,
        resetTime: userLimits.day.resetTime
      }
    };
  }

  /**
   * Reset rate limits for a user (admin function)
   */
  async resetUserRateLimits(userId: string): Promise<void> {
    this.userLimits.delete(userId);
    
    try {
      const db = await getDb();
      const docRef = doc(db, 'rate_limits', userId);
      await setDoc(docRef, {
        minute: { count: 0, resetTime: Timestamp.now(), lastUpdate: Timestamp.now() },
        hour: { count: 0, resetTime: Timestamp.now(), lastUpdate: Timestamp.now() },
        day: { count: 0, resetTime: Timestamp.now(), lastUpdate: Timestamp.now() },
        resetAt: Timestamp.now()
      });
      
      console.log('🔄 Reset rate limits for user:', userId);
    } catch (error) {
      console.error('❌ Error resetting user rate limits:', error);
    }
  }

  /**
   * Get global rate limiting statistics
   */
  getGlobalStats(): {
    concurrent: number;
    maxConcurrent: number;
    perSecond: { current: number; limit: number };
    activeUsers: number;
    activeEventTypes: number;
  } {
    return {
      concurrent: this.globalLimits.concurrent,
      maxConcurrent: this.config.global.maxConcurrent,
      perSecond: {
        current: this.globalLimits.perSecond.count,
        limit: this.config.global.maxPerSecond
      },
      activeUsers: this.userLimits.size,
      activeEventTypes: this.eventTypeLimits.size
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
    this.userLimits.clear();
    this.eventTypeLimits.clear();
  }
}

// Export singleton instance
export const notificationRateLimitingService = new NotificationRateLimitingService();
export default notificationRateLimitingService;
