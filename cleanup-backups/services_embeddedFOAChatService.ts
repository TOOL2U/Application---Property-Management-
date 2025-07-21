/**
 * Embedded FOA Chat Service
 * Manages context-aware AI chat for individual jobs
 */

import { 
  collection, 
  doc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  Timestamp,
  limit,
  updateDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { JobData } from '@/types/jobData';
import { jobChecklistService } from './jobChecklistService';

export interface ChatMessage {
  id: string;
  jobId: string;
  staffId: string;
  sender: 'staff' | 'foa';
  message: string;
  timestamp: Date;
  messageType: 'text' | 'suggestion' | 'reminder' | 'warning' | 'completion';
  context?: {
    checklistProgress?: number;
    currentLocation?: string;
    jobDuration?: number;
    triggeredBy?: string; // What triggered this message
  };
  metadata?: {
    confidence?: number;
    responseTime?: number;
    helpful?: boolean; // User feedback
    suggestions?: string[];
  };
}

export interface ChatTrigger {
  type: 'checklist_progress' | 'time_milestone' | 'location_inactivity' | 'safety_reminder' | 'completion_prompt';
  condition: any;
  lastTriggered?: Date;
  enabled: boolean;
}

export interface JobChatSession {
  jobId: string;
  staffId: string;
  startedAt: Date;
  lastActivity: Date;
  messageCount: number;
  triggers: ChatTrigger[];
  context: {
    jobType: string;
    propertyName: string;
    checklistItems: number;
    checklistCompleted: number;
    currentLocation?: string;
    timeElapsed: number;
  };
}

class EmbeddedFOAChatService {
  private listeners: Map<string, () => void> = new Map();
  private triggerTimers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Initialize chat session for a job
   */
  async initializeJobChat(job: JobData, staffId: string): Promise<JobChatSession> {
    const session: JobChatSession = {
      jobId: job.id,
      staffId,
      startedAt: new Date(),
      lastActivity: new Date(),
      messageCount: 0,
      triggers: this.getDefaultTriggers(),
      context: {
        jobType: job.jobType,
        propertyName: job.propertyRef?.name || 'Unknown Property',
        checklistItems: 0,
        checklistCompleted: 0,
        timeElapsed: 0
      }
    };

    // Send welcome message
    await this.sendFOAMessage(job.id, staffId, {
      message: `Hi! I'm your FOA Assistant for "${job.title}". I'm here to help you complete this ${job.jobType} job safely and efficiently. Ask me anything about this task!`,
      messageType: 'text',
      context: {
        triggeredBy: 'chat_initialization'
      }
    });

    // Set up context monitoring
    this.setupContextMonitoring(session);

    return session;
  }

  /**
   * Send message from staff
   */
  async sendStaffMessage(
    jobId: string, 
    staffId: string, 
    message: string, 
    job?: JobData
  ): Promise<ChatMessage> {
    try {
      // Save staff message
      const staffMessage = await this.saveMessage({
        jobId,
        staffId,
        sender: 'staff',
        message,
        timestamp: new Date(),
        messageType: 'text'
      });

      // Get FOA response if job data is available
      if (job) {
        await this.generateFOAResponse(jobId, staffId, message, job);
      }

      return staffMessage;
    } catch (error) {
      console.error('Error sending staff message:', error);
      throw error;
    }
  }

  /**
   * Generate and send FOA response
   */
  private async generateFOAResponse(
    jobId: string,
    staffId: string,
    userMessage: string,
    job: JobData
  ): Promise<void> {
    try {
      // Get current context
      const context = await this.buildJobContext(job, staffId);
      
      // Build context-aware prompt
      const contextPrompt = `
Job Context:
- Type: ${job.jobType}
- Title: ${job.title}
- Property: ${job.propertyRef?.name}
- Description: ${job.description}

Current Status:
- Checklist Progress: ${context.checklistCompleted}/${context.checklistItems} items
- Time Elapsed: ${Math.round(context.timeElapsed / 60)} minutes
- Location: ${context.currentLocation || 'Unknown'}

Staff Question: ${userMessage}

Please provide a helpful, practical response as the Field Operations Assistant. Focus on:
1. Direct answers to their question
2. Safety considerations if relevant
3. Next steps in their checklist if appropriate
4. Any tips specific to this property type and job

Keep responses concise and actionable for field work.`;

      // Create FOA context for the service
      const foaContext = {
        job: this.convertJobDataToJobType(job),
        staffRole: 'field_worker',
        staffId,
        location: job.location?.coordinates
      };

      // Generate response (AI service no longer available)
      const fallbackResponse = this.generateFallbackResponse(userMessage, job);

      await this.sendFOAMessage(jobId, staffId, {
        message: fallbackResponse,
        messageType: 'text',
        context: {
          checklistProgress: Math.round((context.checklistCompleted / Math.max(context.checklistItems, 1)) * 100),
          currentLocation: context.currentLocation,
          jobDuration: context.timeElapsed,
          triggeredBy: 'user_question'
        },
        metadata: {
          confidence: 0.8 // Default confidence
        }
      });

    } catch (error) {
      console.error('Error generating FOA response:', error);
      
      // Send fallback message
      await this.sendFOAMessage(jobId, staffId, {
        message: "I'm currently unavailable. Please continue with your checklist or contact support if you need assistance.",
        messageType: 'text',
        context: {
          triggeredBy: 'service_error'
        }
      });
    }
  }

  /**
   * Send FOA message
   */
  async sendFOAMessage(
    jobId: string,
    staffId: string,
    messageData: Partial<ChatMessage>
  ): Promise<ChatMessage> {
    const message: Omit<ChatMessage, 'id'> = {
      jobId,
      staffId,
      sender: 'foa',
      timestamp: new Date(),
      messageType: 'text',
      ...messageData,
      message: messageData.message || ''
    };

    return await this.saveMessage(message);
  }

  /**
   * Listen to chat messages for a job
   */
  subscribeToChatMessages(
    jobId: string,
    callback: (messages: ChatMessage[]) => void
  ): () => void {
    const messagesRef = collection(db, 'ai_chat_logs');
    const messagesQuery = query(
      messagesRef,
      where('jobId', '==', jobId),
      orderBy('timestamp', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messages: ChatMessage[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        })) as ChatMessage[];
        
        callback(messages);
      },
      (error) => {
        console.error('Error listening to chat messages:', error);
        callback([]);
      }
    );

    this.listeners.set(jobId, unsubscribe);
    return unsubscribe;
  }

  /**
   * Stop listening to chat messages
   */
  unsubscribeFromChat(jobId: string): void {
    const unsubscribe = this.listeners.get(jobId);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(jobId);
    }

    // Clear any timers
    const timer = this.triggerTimers.get(jobId);
    if (timer) {
      clearTimeout(timer);
      this.triggerTimers.delete(jobId);
    }
  }

  /**
   * Mark message as helpful/unhelpful
   */
  async rateMessage(messageId: string, helpful: boolean): Promise<void> {
    try {
      const messageRef = doc(db, 'ai_chat_logs', messageId);
      await updateDoc(messageRef, {
        'metadata.helpful': helpful,
        'metadata.ratedAt': serverTimestamp()
      });
    } catch (error) {
      console.error('Error rating message:', error);
    }
  }

  /**
   * Trigger context-aware messages based on job progress
   */
  async triggerContextMessage(
    jobId: string,
    staffId: string,
    trigger: ChatTrigger,
    job: JobData
  ): Promise<void> {
    const now = new Date();
    
    // Check if this trigger was recently fired
    if (trigger.lastTriggered && (now.getTime() - trigger.lastTriggered.getTime()) < 300000) {
      return; // Don't trigger if fired within last 5 minutes
    }

    let message = '';
    const context = await this.buildJobContext(job, staffId);

    switch (trigger.type) {
      case 'checklist_progress':
        if (context.checklistCompleted > 0) {
          message = `Great progress! You've completed ${context.checklistCompleted} out of ${context.checklistItems} checklist items. ${this.getProgressEncouragement(context.checklistCompleted, context.checklistItems)}`;
        }
        break;

      case 'time_milestone':
        const hours = Math.floor(context.timeElapsed / 3600);
        const minutes = Math.floor((context.timeElapsed % 3600) / 60);
        message = `You've been working for ${hours > 0 ? `${hours}h ` : ''}${minutes}m. How's everything going? Need any assistance?`;
        break;

      case 'location_inactivity':
        message = `I notice you're still at the job site. Is everything going smoothly? Let me know if you need help with any part of the task.`;
        break;

      case 'safety_reminder':
        const safetyTip = this.getSafetyTipForJobType(job.jobType);
        message = `Safety reminder: ${safetyTip}`;
        break;

      case 'completion_prompt':
        if (context.checklistCompleted === context.checklistItems) {
          message = `Excellent! You've completed all checklist items. Don't forget to take final photos and mark the job as complete.`;
        }
        break;
    }

    if (message) {
      await this.sendFOAMessage(jobId, staffId, {
        message,
        messageType: 'reminder',
        context: {
          checklistProgress: Math.round((context.checklistCompleted / Math.max(context.checklistItems, 1)) * 100),
          jobDuration: context.timeElapsed,
          triggeredBy: trigger.type
        }
      });

      trigger.lastTriggered = now;
    }
  }

  /**
   * Save message to Firestore
   */
  private async saveMessage(message: Omit<ChatMessage, 'id'>): Promise<ChatMessage> {
    const messagesRef = collection(db, 'ai_chat_logs');
    const docRef = await addDoc(messagesRef, {
      ...message,
      timestamp: Timestamp.fromDate(message.timestamp)
    });

    return {
      id: docRef.id,
      ...message
    };
  }

  /**
   * Build current job context
   */
  private async buildJobContext(job: JobData, staffId: string): Promise<JobChatSession['context']> {
    try {
      const checklist = await jobChecklistService.getJobChecklist(job.id);
      
      return {
        jobType: job.jobType,
        propertyName: job.propertyRef?.name || 'Unknown Property',
        checklistItems: checklist?.totalItems || 0,
        checklistCompleted: checklist?.completedItems || 0,
        timeElapsed: 0, // This would be calculated from job start time
        currentLocation: job.location?.address
      };
    } catch (error) {
      console.error('Error building job context:', error);
      return {
        jobType: job.jobType,
        propertyName: job.propertyRef?.name || 'Unknown Property',
        checklistItems: 0,
        checklistCompleted: 0,
        timeElapsed: 0
      };
    }
  }

  /**
   * Convert JobData to Job type for FOA service
   */
  private convertJobDataToJobType(job: JobData): any {
    return {
      id: job.id,
      title: job.title,
      description: job.description,
      type: job.jobType,
      priority: job.priority || 'medium',
      location: {
        address: job.location?.address || '',
        coordinates: job.location?.coordinates
      },
      propertyId: job.propertyRef?.id || '',
      assignedTo: job.assignedStaffId,
      estimatedDuration: job.estimatedDuration || 60
    };
  }

  /**
   * Get default triggers for job monitoring
   */
  private getDefaultTriggers(): ChatTrigger[] {
    return [
      {
        type: 'checklist_progress',
        condition: { completedItems: [2, 5, 8] }, // Trigger at 2, 5, 8 completed items
        enabled: true
      },
      {
        type: 'time_milestone',
        condition: { minutes: [30, 60, 120] }, // Trigger at 30min, 1hr, 2hr
        enabled: true
      },
      {
        type: 'location_inactivity',
        condition: { inactiveMinutes: 45 }, // Trigger after 45min of location inactivity
        enabled: true
      },
      {
        type: 'safety_reminder',
        condition: { intervalMinutes: 90 }, // Remind every 90 minutes
        enabled: true
      },
      {
        type: 'completion_prompt',
        condition: { allItemsCompleted: true },
        enabled: true
      }
    ];
  }

  /**
   * Setup context monitoring for triggers
   */
  private setupContextMonitoring(session: JobChatSession): void {
    // Set up time-based triggers  
    const timeTimer = setInterval(() => {
      session.context.timeElapsed += 60; // Increment by 1 minute
      
      // Check time milestone triggers
      const timeTrigger = session.triggers.find(t => t.type === 'time_milestone');
      if (timeTrigger && timeTrigger.enabled) {
        const minutes = session.context.timeElapsed / 60;
        if (timeTrigger.condition.minutes.includes(Math.floor(minutes))) {
          // Trigger would be called here - implement in UI component
        }
      }
    }, 60000); // Every minute

    this.triggerTimers.set(session.jobId, timeTimer as any);
  }

  /**
   * Get progress encouragement message
   */
  private getProgressEncouragement(completed: number, total: number): string {
    const progress = completed / total;
    
    if (progress < 0.25) {
      return "Keep up the great work!";
    } else if (progress < 0.5) {
      return "You're making good progress!";
    } else if (progress < 0.75) {
      return "More than halfway there!";
    } else if (progress < 1) {
      return "Almost finished - you're doing great!";
    } else {
      return "Excellent work completing all tasks!";
    }
  }

  /**
   * Get safety tip for job type
   */
  private getSafetyTipForJobType(jobType: string): string {
    const safetyTips: Record<string, string[]> = {
      maintenance: [
        "Always turn off power before electrical work",
        "Use proper ladder safety techniques",
        "Wear appropriate protective equipment"
      ],
      cleaning: [
        "Ensure proper ventilation when using chemicals",
        "Wear gloves when handling cleaning products",
        "Be aware of wet floor hazards"
      ],
      inspection: [
        "Use proper lighting in dark areas",
        "Be cautious of structural hazards",
        "Report any safety concerns immediately"
      ]
    };

    const tips = safetyTips[jobType] || safetyTips.maintenance;
    return tips[Math.floor(Math.random() * tips.length)];
  }

  /**
   * Get quick action suggestions for job type
   */
  getQuickActionSuggestions(jobType: string): string[] {
    const suggestions: Record<string, string[]> = {
      maintenance: [
        "Help me with the checklist",
        "What tools do I need?",
        "Safety tips for this job",
        "How long will this take?",
        "I'm having trouble with...",
        "Photo documentation guide"
      ],
      cleaning: [
        "Help me with the checklist",
        "What cleaning supplies do I need?",
        "Safety tips for cleaning",
        "How to handle different surfaces",
        "I'm having trouble with...",
        "Documentation requirements"
      ],
      inspection: [
        "Help me with the checklist",
        "What should I look for?",
        "Safety tips for inspection",
        "How to document findings",
        "I found an issue...",
        "Photo requirements"
      ]
    };

    return suggestions[jobType] || suggestions.maintenance;
  }

  /**
   * Generate fallback response when AI service is unavailable
   */
  private generateFallbackResponse(userMessage: string, job: JobData): string {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('help') || lowerMessage.includes('how')) {
      return `I understand you need help with ${job.title}. Please refer to your checklist items and safety protocols. If you need immediate assistance, contact your supervisor.`;
    }
    
    if (lowerMessage.includes('safety') || lowerMessage.includes('safe')) {
      return `For safety questions regarding ${job.jobType} work, please follow all standard safety protocols and use appropriate protective equipment. If unsure, contact your supervisor immediately.`;
    }
    
    if (lowerMessage.includes('complete') || lowerMessage.includes('finish')) {
      return `To complete ${job.title}, ensure all checklist items are marked as done and take required photos before marking the job as finished.`;
    }
    
    return `Thanks for your message about ${job.title}. I'm currently unavailable, but please continue with your checklist and contact your supervisor if you need immediate assistance.`;
  }
}

export const embeddedFOAChatService = new EmbeddedFOAChatService();
