import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Card, ActivityIndicator } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { collection, addDoc, query, orderBy, onSnapshot, doc, Timestamp } from 'firebase/firestore';
import { getDb } from '../../lib/firebase';
import { useFieldOpsAI } from '../../hooks/useFieldOpsAI';
import { JobData } from '../../types/jobData';
import { Job } from '../../types/job';

interface Message {
  id?: string;
  sender: 'staff' | 'ai';
  text: string;
  createdAt: any;
  isLoading?: boolean;
}

interface FOAChatBoxProps {
  job: JobData;
  staffId: string;
  style?: any;
}

const SUGGESTED_QUESTIONS = [
  "What's the checklist for this property?",
  "Remind me the steps to complete this job",
  "What should I do if no one is home?",
  "Can I delay this task?",
  "What safety precautions should I take?",
  "How long should this job take?"
];

// Convert JobData to Job format for AI service compatibility
const convertJobDataToJob = (jobData: JobData): Job => {
  return {
    id: jobData.id,
    title: jobData.title,
    description: jobData.description || '',
    type: (jobData.jobType as any) || 'general',
    status: (jobData.status as any) || 'pending',
    priority: jobData.priority,
    location: {
      address: typeof jobData.location === 'string' ? jobData.location : (jobData.propertyRef?.address || ''),
      city: '',
      state: '',
      zipCode: '',
      coordinates: jobData.propertyRef?.coordinates,
    },
    contacts: [],
    requirements: [],
    photos: [],
    notes: '',
    assignedTo: jobData.assignedStaffId,
    assignedBy: jobData.userId || '',
    assignedAt: jobData.assignedAt,
    createdBy: jobData.userId || '',
    createdAt: jobData.createdAt,
    updatedAt: jobData.updatedAt,
    dueDate: jobData.deadline,
    scheduledDate: jobData.scheduledDate,
    estimatedTime: jobData.estimatedDuration ? `${jobData.estimatedDuration} minutes` : undefined,
    estimatedDuration: jobData.estimatedDuration || 60,
  } as unknown as Job;
};

// Simple Message Bubble Component
const MessageBubble = ({ message, isLast }: { message: Message; isLast?: boolean }) => {
  const isAI = message.sender === 'ai';
  
  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    
    let date: Date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      return '';
    }

    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <View style={[
      styles.messageContainer,
      isAI ? styles.aiMessageContainer : styles.staffMessageContainer,
      isLast && styles.lastMessage
    ]}>
      <View style={[
        styles.messageBubble,
        isAI ? styles.aiBubble : styles.staffBubble
      ]}>
        <Text style={[
          styles.messageText,
          isAI ? styles.aiText : styles.staffText
        ]}>
          {message.text}
        </Text>
      </View>
      <Text style={[
        styles.timestamp,
        isAI ? styles.aiTimestamp : styles.staffTimestamp
      ]}>
        {formatTime(message.createdAt)}
      </Text>
    </View>
  );
};

export default function FOAChatBox({ job, staffId, style }: FOAChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const { askQuestion } = useFieldOpsAI();

  // Load chat history from Firestore
  useEffect(() => {
    if (!job?.id || !staffId) return;

    let unsubscribe: (() => void) | undefined;

    const setupFirestoreListener = async () => {
      try {
        setFirestoreError(null);
        const db = await getDb();
        
        if (!db) {
          throw new Error('Failed to initialize Firestore');
        }

        const chatRef = collection(db, 'ai_chats', staffId, job.id);
        const q = query(chatRef, orderBy('createdAt', 'asc'));

        unsubscribe = onSnapshot(q, 
          (snapshot) => {
            const loadedMessages: Message[] = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            } as Message));
            
            setMessages(loadedMessages);
            
            // Auto-scroll to bottom after loading messages
            setTimeout(() => {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
          },
          (error) => {
            console.error('Error loading chat messages:', error);
            setFirestoreError('Failed to load chat messages');
          }
        );

      } catch (error) {
        console.error('Error setting up Firestore listener:', error);
        setFirestoreError('Failed to connect to chat service');
      }
    };

    setupFirestoreListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [job?.id, staffId]);

  // Auto-scroll when new messages are added
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages.length]);

  const saveMessageToFirestore = async (message: Omit<Message, 'id'>) => {
    if (!job?.id || !staffId) return;

    try {
      const db = await getDb();
      if (!db) {
        throw new Error('Failed to initialize Firestore');
      }
      
      const chatRef = collection(db, 'ai_chats', staffId, job.id);
      await addDoc(chatRef, {
        ...message,
        createdAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error saving message:', error);
      setFirestoreError('Failed to save message');
    }
  };

  const sendMessage = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText || isLoading) return;

    setInputText('');
    setIsLoading(true);

    // Add user message
    const userMessage: Message = {
      sender: 'staff',
      text: messageText,
      createdAt: Timestamp.now()
    };

    // Save user message to Firestore
    await saveMessageToFirestore(userMessage);

    try {
      // Get AI response
      const aiResponse = await askQuestion(messageText, convertJobDataToJob(job));

      if (aiResponse) {
        // Add AI response
        const aiMessage: Message = {
          sender: 'ai',
          text: aiResponse.data || 'No response available',
          createdAt: Timestamp.now()
        };

        // Save AI message to Firestore
        await saveMessageToFirestore(aiMessage);
      } else {
        throw new Error('No response from AI assistant');
      }

    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Add error message
      const errorMessage: Message = {
        sender: 'ai',
        text: 'Sorry, I encountered an error. Please try again.',
        createdAt: Timestamp.now()
      };
      
      await saveMessageToFirestore(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    sendMessage(question);
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, style]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Card style={styles.chatCard}>
        <Card.Content style={styles.cardContent}>
          {/* Firestore Error Display */}
          {firestoreError && (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={20} color="#FF5722" />
              <Text style={styles.errorText}>{firestoreError}</Text>
              <Button
                mode="text"
                onPress={() => setFirestoreError(null)}
                style={styles.dismissButton}
                labelStyle={styles.dismissButtonLabel}
              >
                Dismiss
              </Button>
            </View>
          )}
          
          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            showsVerticalScrollIndicator={false}
          >
            {messages.length === 0 ? (
              <View style={styles.welcomeContainer}>
                <MaterialIcons name="smart-toy" size={48} color="#4F46E5" />
                <Text style={styles.welcomeTitle}>Hi! I'm your FOA Assistant</Text>
                <Text style={styles.welcomeText}>
                  I'm here to help you complete your job safely and efficiently. 
                  Ask me anything about this task!
                </Text>
                
                {/* Suggested Questions */}
                <View style={styles.suggestedContainer}>
                  <Text style={styles.suggestedTitle}>Try asking:</Text>
                  {SUGGESTED_QUESTIONS.slice(0, 3).map((question, index) => (
                    <Button
                      key={index}
                      mode="outlined"
                      onPress={() => handleSuggestedQuestion(question)}
                      style={styles.suggestedButton}
                      labelStyle={styles.suggestedButtonLabel}
                    >
                      {question}
                    </Button>
                  ))}
                </View>
              </View>
            ) : (
              messages.map((message, index) => (
                <MessageBubble
                  key={message.id || index}
                  message={message}
                  isLast={index === messages.length - 1}
                />
              ))
            )}
            
            {/* Loading indicator */}
            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#4F46E5" />
                <Text style={styles.loadingText}>FOA is thinking...</Text>
              </View>
            )}
          </ScrollView>

          {/* Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask FOA about this job..."
              multiline
              disabled={isLoading}
              onSubmitEditing={() => sendMessage()}
            />
            <Button
              mode="contained"
              onPress={() => sendMessage()}
              disabled={!inputText.trim() || isLoading}
              style={styles.sendButton}
              contentStyle={styles.sendButtonContent}
            >
              <MaterialIcons name="send" size={20} color="white" />
            </Button>
          </View>
        </Card.Content>
      </Card>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F1A',
  },
  chatCard: {
    flex: 1,
    backgroundColor: '#1A1F2E',
    borderRadius: 16,
    elevation: 0,
    shadowOpacity: 0,
  },
  cardContent: {
    flex: 1,
    padding: 16,
    backgroundColor: '#1A1F2E',
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#0B0F1A',
    borderRadius: 12,
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: '#0B0F1A',
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  suggestedContainer: {
    width: '100%',
  },
  suggestedTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  suggestedButton: {
    marginBottom: 8,
    borderColor: '#C6FF00',
    backgroundColor: 'rgba(198, 255, 0, 0.1)',
  },
  suggestedButtonLabel: {
    fontSize: 12,
    textAlign: 'left',
    color: '#C6FF00',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A3A4A',
    backgroundColor: '#1A1F2E',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#0B0F1A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2A3A4A',
  },
  sendButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#C6FF00',
    borderRadius: 8,
  },
  sendButtonContent: {
    height: 48,
  },
  // Message styles
  messageContainer: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  aiMessageContainer: {
    alignItems: 'flex-start',
  },
  staffMessageContainer: {
    alignItems: 'flex-end',
  },
  lastMessage: {
    marginBottom: 8,
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  aiBubble: {
    backgroundColor: '#1A1F2E',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#2A3A4A',
  },
  staffBubble: {
    backgroundColor: '#C6FF00',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  aiText: {
    color: '#FFFFFF',
  },
  staffText: {
    color: '#0B0F1A',
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    marginHorizontal: 4,
  },
  aiTimestamp: {
    color: '#64748b',
    textAlign: 'left',
  },
  staffTimestamp: {
    color: '#64748b',
    textAlign: 'right',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 87, 34, 0.1)',
    borderColor: '#FF5722',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#FF5722',
  },
  dismissButton: {
    marginLeft: 8,
  },
  dismissButtonLabel: {
    fontSize: 12,
    color: '#FF5722',
  },
});
