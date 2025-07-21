/**
 * Embedded FOA Chat Component
 * Context-aware AI chat interface for individual jobs
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  MessageSquare, 
  Send, 
  Brain, 
  User, 
  Clock, 
  ThumbsUp, 
  ThumbsDown,
  MoreHorizontal,
  Lightbulb,
  AlertTriangle,
  CheckCircle
} from 'lucide-react-native';
import { JobData } from '@/types/jobData';
import { embeddedFOAChatService, ChatMessage } from '@/services/embeddedFOAChatService';
import { usePINAuth } from '@/contexts/PINAuthContext';

interface EmbeddedJobChatProps {
  job: JobData;
  onMessageSent?: (message: string) => void;
  onFOAResponse?: (message: ChatMessage) => void;
  style?: any;
}

export default function EmbeddedJobChat({
  job,
  onMessageSent,
  onFOAResponse,
  style
}: EmbeddedJobChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatInitialized, setChatInitialized] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [typingAnimation] = useState(new Animated.Value(0));

  const scrollViewRef = useRef<ScrollView>(null);
  const { currentProfile } = usePINAuth();

  useEffect(() => {
    if (currentProfile && !chatInitialized) {
      initializeChat();
    }
  }, [currentProfile, job.id]);

  useEffect(() => {
    if (!currentProfile) return;

    const unsubscribe = embeddedFOAChatService.subscribeToChatMessages(
      job.id,
      (newMessages) => {
        setMessages(newMessages);
        // Auto-scroll to bottom when new messages arrive
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    return () => {
      unsubscribe();
      embeddedFOAChatService.unsubscribeFromChat(job.id);
    };
  }, [currentProfile, job.id]);

  const initializeChat = async () => {
    if (!currentProfile) return;

    try {
      await embeddedFOAChatService.initializeJobChat(job, currentProfile.id);
      setChatInitialized(true);
    } catch (error) {
      console.error('Error initializing chat:', error);
      Alert.alert('Error', 'Failed to initialize chat assistant.');
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !currentProfile || isLoading) return;

    const messageText = inputText.trim();
    setInputText('');
    setIsLoading(true);
    setShowSuggestions(false);

    // Start typing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(typingAnimation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(typingAnimation, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    try {
      const staffMessage = await embeddedFOAChatService.sendStaffMessage(
        job.id,
        currentProfile.id,
        messageText,
        job
      );

      onMessageSent?.(messageText);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
      typingAnimation.stopAnimation();
      typingAnimation.setValue(0);
    }
  };

  const sendSuggestedMessage = (suggestion: string) => {
    setInputText(suggestion);
    setShowSuggestions(false);
  };

  const rateMessage = async (messageId: string, helpful: boolean) => {
    try {
      await embeddedFOAChatService.rateMessage(messageId, helpful);
    } catch (error) {
      console.error('Error rating message:', error);
    }
  };

  const formatTimestamp = (timestamp: Date): string => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    return timestamp.toLocaleDateString();
  };

  const getMessageIcon = (message: ChatMessage) => {
    if (message.sender === 'staff') {
      return <User size={20} color="#6366f1" />;
    }

    switch (message.messageType) {
      case 'suggestion':
        return <Lightbulb size={20} color="#f59e0b" />;
      case 'reminder':
        return <Clock size={20} color="#8b5cf6" />;
      case 'warning':
        return <AlertTriangle size={20} color="#ef4444" />;
      case 'completion':
        return <CheckCircle size={20} color="#10b981" />;
      default:
        return <Brain size={20} color="#6366f1" />;
    }
  };

  const getMessageTypeColor = (messageType: string): string => {
    const colors: Record<string, string> = {
      suggestion: '#fef3c7',
      reminder: '#ede9fe',
      warning: '#fee2e2',
      completion: '#d1fae5',
      text: '#f3f4f6'
    };
    return colors[messageType] || '#f3f4f6';
  };

  const quickSuggestions = embeddedFOAChatService.getQuickActionSuggestions(job.jobType);

  return (
    <View style={[styles.container, style]}>
      {/* Chat Header */}
      <LinearGradient
        colors={['#6366f1', '#8b5cf6']}
        style={styles.header}
      >
        <View style={styles.headerIcon}>
          <Brain size={24} color="#ffffff" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>FOA Assistant</Text>
          <Text style={styles.headerSubtitle}>AI-powered job guidance</Text>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <MoreHorizontal size={20} color="rgba(255, 255, 255, 0.8)" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 && !isLoading ? (
          <View style={styles.emptyState}>
            <Brain size={48} color="#6366f1" />
            <Text style={styles.emptyTitle}>Your FOA Assistant is Ready</Text>
            <Text style={styles.emptySubtitle}>
              Ask me anything about this {job.jobType} job. I'm here to help you complete it safely and efficiently.
            </Text>
          </View>
        ) : (
          messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                message.sender === 'staff' ? styles.staffMessage : styles.foaMessage
              ]}
            >
              <View style={styles.messageIcon}>
                {getMessageIcon(message)}
              </View>
              
              <View style={[
                styles.messageBubble,
                message.sender === 'staff' ? styles.staffBubble : styles.foaBubble,
                { backgroundColor: getMessageTypeColor(message.messageType) }
              ]}>
                <Text style={[
                  styles.messageText,
                  message.sender === 'staff' ? styles.staffText : styles.foaText
                ]}>
                  {message.message}
                </Text>
                
                <View style={styles.messageFooter}>
                  <Text style={styles.messageTime}>
                    {formatTimestamp(message.timestamp)}
                  </Text>
                  
                  {message.sender === 'foa' && message.messageType === 'text' && (
                    <View style={styles.messageActions}>
                      <TouchableOpacity
                        style={styles.ratingButton}
                        onPress={() => rateMessage(message.id, true)}
                      >
                        <ThumbsUp size={14} color="#6b7280" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.ratingButton}
                        onPress={() => rateMessage(message.id, false)}
                      >
                        <ThumbsDown size={14} color="#6b7280" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {message.context && (
                  <View style={styles.contextInfo}>
                    {message.context.checklistProgress !== undefined && (
                      <Text style={styles.contextText}>
                        Checklist: {message.context.checklistProgress}% complete
                      </Text>
                    )}
                    {message.context.jobDuration !== undefined && (
                      <Text style={styles.contextText}>
                        Job time: {Math.round(message.context.jobDuration / 60)}min
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </View>
          ))
        )}

        {/* Typing Indicator */}
        {isLoading && (
          <View style={[styles.messageContainer, styles.foaMessage]}>
            <View style={styles.messageIcon}>
              <Brain size={20} color="#6366f1" />
            </View>
            <View style={[styles.messageBubble, styles.foaBubble, styles.typingBubble]}>
              <View style={styles.typingIndicator}>
                <Animated.View style={[
                  styles.typingDot,
                  {
                    opacity: typingAnimation.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.3, 1, 0.3]
                    })
                  }
                ]} />
                <Animated.View style={[
                  styles.typingDot,
                  {
                    opacity: typingAnimation.interpolate({
                      inputRange: [0, 0.25, 0.5, 0.75, 1],
                      outputRange: [0.3, 0.3, 1, 0.3, 0.3]
                    })
                  }
                ]} />
                <Animated.View style={[
                  styles.typingDot,
                  {
                    opacity: typingAnimation.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.3, 0.3, 1]
                    })
                  }
                ]} />
              </View>
              <Text style={styles.typingText}>FOA is thinking...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Quick Suggestions */}
      {showSuggestions && messages.length <= 1 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Try asking:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {quickSuggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionChip}
                onPress={() => sendSuggestedMessage(suggestion)}
              >
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask FOA about this job..."
            multiline
            maxLength={500}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isLoading) && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            <Send size={20} color={inputText.trim() && !isLoading ? "#ffffff" : "#9ca3af"} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F1A', // Dark theme background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1A1F2E',
    borderBottomWidth: 1,
    borderBottomColor: '#2A3A4A',
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(198, 255, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#C6FF00', // Neon green accent
    marginTop: 2,
  },
  moreButton: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  staffMessage: {
    justifyContent: 'flex-end',
  },
  foaMessage: {
    justifyContent: 'flex-start',
  },
  messageIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1A1F2E',
    borderWidth: 1,
    borderColor: '#2A3A4A',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
    marginTop: 4,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  staffBubble: {
    backgroundColor: '#C6FF00', // Neon green for staff messages
    marginLeft: 8,
    borderBottomRightRadius: 4,
  },
  foaBubble: {
    backgroundColor: '#1A1F2E', // Dark card for FOA messages
    borderWidth: 1,
    borderColor: '#2A3A4A',
    marginRight: 8,
    borderBottomLeftRadius: 4,
  },
  typingBubble: {
    backgroundColor: '#1A1F2E',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  staffText: {
    color: '#0B0F1A', // Dark text on green background
  },
  foaText: {
    color: '#ffffff', // White text on dark background
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  messageTime: {
    fontSize: 10,
    color: '#666666',
  },
  messageActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingButton: {
    padding: 4,
    marginLeft: 8,
  },
  contextInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#2A3A4A',
  },
  contextText: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 2,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#C6FF00',
    marginHorizontal: 1,
  },
  typingText: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
  },
  suggestionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#2A3A4A',
    backgroundColor: '#1A1F2E',
  },
  suggestionsTitle: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
  },
  suggestionChip: {
    backgroundColor: '#0B0F1A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#2A3A4A',
  },
  suggestionText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '500',
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#2A3A4A',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1A1F2E',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#2A3A4A',
    backgroundColor: '#0B0F1A',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    color: '#ffffff',
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#C6FF00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#2A3A4A',
  },
});
