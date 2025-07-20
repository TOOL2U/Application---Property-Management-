# Unified Notification Architecture

## Overview

This document outlines the design for a new unified notification system that eliminates duplicate notifications and provides a reliable, scalable notification infrastructure for the property management application.

## Current Problems Solved

1. **Multiple Notification Sources**: Eliminates 6+ different notification services running simultaneously
2. **Duplicate Notifications**: Prevents the 19 duplicate notifications issue through centralized deduplication
3. **Race Conditions**: Eliminates race conditions between multiple listeners and services
4. **No Event Sourcing**: Provides single source of truth for all notification events
5. **Inconsistent Retry Logic**: Unified retry and error handling across all notification types

## Architecture Components

### 1. Unified Notification Service (`UnifiedNotificationService`)

**Core Responsibilities:**
- Single entry point for all notification requests
- Event deduplication and rate limiting
- Notification routing to appropriate channels
- Retry logic and error handling
- Audit logging and analytics

**Key Features:**
- Event-driven architecture with proper event sourcing
- Persistent notification queue with Redis/Firestore
- Configurable notification channels (push, email, SMS, webhook)
- Real-time status tracking and delivery confirmation

### 2. Enhanced Deduplication Engine

**Improvements over current system:**
- Persistent storage (Firestore) instead of in-memory maps
- Configurable deduplication windows per event type
- Cross-device and cross-session deduplication
- Intelligent duplicate detection using event fingerprinting

**Deduplication Strategy:**
```typescript
interface NotificationFingerprint {
  eventType: string;
  entityId: string;
  recipientId: string;
  contentHash: string;
  timestamp: number;
}
```

### 3. Notification Queue System

**Queue Architecture:**
- Priority-based queuing (urgent, high, normal, low)
- Batch processing for efficiency
- Dead letter queue for failed notifications
- Configurable retry policies per notification type

**Queue Types:**
- **Immediate Queue**: Real-time notifications (urgent jobs)
- **Batch Queue**: Non-urgent notifications processed in batches
- **Retry Queue**: Failed notifications with exponential backoff
- **Dead Letter Queue**: Permanently failed notifications for manual review

### 4. Rate Limiting & Throttling

**Multi-level Rate Limiting:**
- Per-user rate limits (prevent spam to individual users)
- Per-event-type rate limits (prevent system overload)
- Global system rate limits (protect infrastructure)
- Adaptive rate limiting based on system load

**Throttling Rules:**
```typescript
interface RateLimitConfig {
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
```

### 5. Notification Channels

**Supported Channels:**
- **Push Notifications**: FCM for mobile devices
- **Real-time Updates**: WebSocket for web clients
- **Email Notifications**: For important updates
- **SMS Notifications**: For critical alerts
- **Webhook Notifications**: For external system integration

**Channel Selection Logic:**
- User preferences and notification settings
- Event priority and urgency
- Device availability and connectivity
- Fallback channel hierarchy

## Event Types & Routing

### Job-Related Events
```typescript
enum JobEventType {
  JOB_CREATED = 'job.created',
  JOB_ASSIGNED = 'job.assigned',
  JOB_ACCEPTED = 'job.accepted',
  JOB_REJECTED = 'job.rejected',
  JOB_STARTED = 'job.started',
  JOB_COMPLETED = 'job.completed',
  JOB_CANCELLED = 'job.cancelled',
  JOB_UPDATED = 'job.updated',
  JOB_OVERDUE = 'job.overdue'
}
```

### Notification Routing Rules
```typescript
interface NotificationRule {
  eventType: JobEventType;
  recipients: RecipientSelector;
  channels: NotificationChannel[];
  priority: NotificationPriority;
  deduplicationWindow: number; // milliseconds
  retryPolicy: RetryPolicy;
}
```

## Implementation Plan

### Phase 1: Core Infrastructure
1. Create `UnifiedNotificationService` class
2. Implement enhanced deduplication engine
3. Set up notification queue system
4. Add comprehensive logging and monitoring

### Phase 2: Channel Integration
1. Integrate existing push notification service
2. Add webhook notification support
3. Implement real-time WebSocket notifications
4. Add email/SMS notification channels

### Phase 3: Migration & Testing
1. Update all notification trigger points
2. Comprehensive testing suite
3. Gradual rollout with feature flags
4. Performance monitoring and optimization

## Benefits

1. **Zero Duplicate Notifications**: Guaranteed single notification per event
2. **Improved Reliability**: Persistent queues and retry logic
3. **Better Performance**: Batch processing and rate limiting
4. **Enhanced Monitoring**: Complete audit trail and analytics
5. **Scalability**: Designed to handle high notification volumes
6. **Maintainability**: Single codebase for all notification logic

## Configuration

The system will be highly configurable through environment variables and database settings:

```typescript
interface NotificationConfig {
  deduplication: {
    defaultWindow: number;
    persistentStorage: boolean;
    cleanupInterval: number;
  };
  rateLimiting: RateLimitConfig;
  queues: {
    batchSize: number;
    processingInterval: number;
    maxRetries: number;
  };
  channels: {
    push: PushChannelConfig;
    webhook: WebhookChannelConfig;
    email: EmailChannelConfig;
  };
}
```

This architecture ensures reliable, efficient, and duplicate-free notifications while providing the flexibility to handle future requirements and scale with the application's growth.
