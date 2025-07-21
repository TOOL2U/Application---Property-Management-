/**
 * Field Operations Assistant Component
 * AI-powered assistant for staff field operations and job completion
 * Enhanced with modern dark theme and improved UX
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from '@/hooks/useTranslation';
import { useFieldOpsAI } from '@/hooks/useFieldOpsAI';
import { Job } from '@/types/job';

const { width: screenWidth } = Dimensions.get('window');

interface FieldOpsAssistantProps {
  job: Job;
  visible: boolean;
  onClose?: () => void;
  onOpenPhotoChecklist?: () => void;
  embedded?: boolean;
}

interface QuickAction {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  action: () => void;
  color: string;
}

export default function FieldOpsAssistant({
  job,
  visible = true,
  onClose,
  onOpenPhotoChecklist,
  embedded = false
}: FieldOpsAssistantProps) {
  const { t } = useTranslation();
  const {
    isLoading,
    error,
    jobGuidance,
    photoGuidance,
    safetyRecommendations,
    timeEstimation,
    conversationHistory,
    loadJobGuidance,
    askQuestion,
    getPhotoGuidance,
    getSafetyRecommendations,
    getTimeEstimation,
    clearError,
    isConfigured,
  } = useFieldOpsAI();

  const [currentQuestion, setCurrentQuestion] = useState('');
  const [activeTab, setActiveTab] = useState<'guidance' | 'chat' | 'photos' | 'safety' | 'timing'>('guidance');
  const [hasLoadedGuidance, setHasLoadedGuidance] = useState(false);

  // Load initial guidance when component mounts
  useEffect(() => {
    if (job && isConfigured() && !hasLoadedGuidance) {
      loadJobGuidance(job);
      setHasLoadedGuidance(true);
    }
  }, [job, isConfigured, loadJobGuidance, hasLoadedGuidance]);

  // Quick actions for common questions with enhanced design
  const quickActions: QuickAction[] = [
    {
      id: 'photos',
      title: 'Photo Guide',
      icon: 'camera-outline',
      action: () => {
        setActiveTab('photos');
        if (!photoGuidance) {
          getPhotoGuidance(job);
        }
      },
      color: '#C6FF00'
    },
    {
      id: 'safety',
      title: 'Safety Tips',
      icon: 'shield-checkmark-outline',
      action: () => {
        setActiveTab('safety');
        if (!safetyRecommendations) {
          getSafetyRecommendations(job);
        }
      },
      color: '#FF5722'
    },
    {
      id: 'timing',
      title: 'Time Estimate',
      icon: 'time-outline',
      action: () => {
        setActiveTab('timing');
        if (!timeEstimation) {
          getTimeEstimation(job);
        }
      },
      color: '#00E5FF'
    },
    {
      id: 'chat',
      title: 'Ask Question',
      icon: 'chatbubble-outline',
      action: () => setActiveTab('chat'),
      color: '#FF6B35'
    },
  ];

  const handleAskQuestion = async () => {
    if (!currentQuestion.trim()) return;

    await askQuestion(currentQuestion, job);
    setCurrentQuestion('');
  };

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={styles.sectionTitle}>AI Field Assistant</Text>
      <Text style={styles.sectionSubtitle}>Get instant guidance for your current job</Text>
      
      <View style={styles.quickActionsGrid}>
        {quickActions.map((action, index) => (
          <Animatable.View
            key={action.id}
            animation="fadeInUp"
            delay={index * 100}
            style={styles.quickActionWrapper}
          >
            <TouchableOpacity
              onPress={action.action}
              style={styles.quickActionButton}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[
                  `${action.color}15`,
                  `${action.color}08`
                ]}
                style={styles.quickActionGradient}
              >
                <View style={[
                  styles.quickActionIconContainer,
                  { borderColor: action.color }
                ]}>
                  <Ionicons
                    name={action.icon}
                    size={24}
                    color={action.color}
                  />
                </View>
                <Text style={styles.quickActionText}>
                  {action.title}
                </Text>
                <View style={[styles.quickActionIndicator, { backgroundColor: action.color }]} />
              </LinearGradient>
            </TouchableOpacity>
          </Animatable.View>
        ))}
      </View>
    </View>
  );

  const renderTabContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#C6FF00" />
          <Text style={styles.loadingText}>
            AI Assistant is analyzing your job...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={48} color="#FF5722" />
          <Text style={styles.errorText}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={clearError}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    switch (activeTab) {
      case 'guidance':
        return renderGuidanceTab();
      case 'chat':
        return renderChatTab();
      case 'photos':
        return renderPhotosTab();
      case 'safety':
        return renderSafetyTab();
      case 'timing':
        return renderTimingTab();
      default:
        return renderGuidanceTab();
    }
  };

  const renderGuidanceTab = () => (
    <ScrollView style={styles.contentContainer}>
      <View style={styles.contentSection}>
        <LinearGradient
          colors={['#1A1F2E', '#252A3A']}
          style={{
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: '#2A3A4A',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{
              backgroundColor: 'rgba(198, 255, 0, 0.1)',
              borderRadius: 8,
              padding: 8,
              marginRight: 12,
            }}>
              <Ionicons name="clipboard-outline" size={24} color="#C6FF00" />
            </View>
            <Text style={styles.contentTitle}>Job Overview</Text>
          </View>
          
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#FFFFFF',
            marginBottom: 8,
          }}>
            {job.title}
          </Text>
          
          <Text style={{
            fontSize: 16,
            color: '#CCCCCC',
            lineHeight: 24,
            marginBottom: 16,
          }}>
            {job.description}
          </Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              backgroundColor: 'rgba(0, 229, 255, 0.1)',
              borderColor: '#00E5FF',
              borderWidth: 1,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              marginRight: 12,
            }}>
              <Text style={{ color: '#00E5FF', fontSize: 12, fontWeight: '600' }}>
                {job.type}
              </Text>
            </View>
            <View style={{
              backgroundColor: 'rgba(255, 107, 53, 0.1)',
              borderColor: '#FF6B35',
              borderWidth: 1,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
            }}>
              <Text style={{ color: '#FF6B35', fontSize: 12, fontWeight: '600' }}>
                {job.priority}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {jobGuidance?.data && (
          <LinearGradient
            colors={['#1A1F2E', '#252A3A']}
            style={{
              borderRadius: 16,
              padding: 20,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: '#2A3A4A',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{
                backgroundColor: 'rgba(198, 255, 0, 0.1)',
                borderRadius: 8,
                padding: 8,
                marginRight: 12,
              }}>
                <Ionicons name="bulb-outline" size={24} color="#C6FF00" />
              </View>
              <Text style={styles.contentTitle}>AI Guidance</Text>
            </View>
            <Text style={styles.contentText}>{jobGuidance.data}</Text>
          </LinearGradient>
        )}

        {jobGuidance?.checklist && jobGuidance.checklist.length > 0 && (
          <LinearGradient
            colors={['#1A1F2E', '#252A3A']}
            style={{
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: '#2A3A4A',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{
                backgroundColor: 'rgba(0, 229, 255, 0.1)',
                borderRadius: 8,
                padding: 8,
                marginRight: 12,
              }}>
                <Ionicons name="checkmark-circle-outline" size={24} color="#00E5FF" />
              </View>
              <Text style={styles.contentTitle}>Task Checklist</Text>
            </View>
            {jobGuidance.checklist.map((item, index) => (
              <View key={index} style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                marginBottom: 12,
                paddingHorizontal: 12,
                paddingVertical: 8,
                backgroundColor: 'rgba(0, 229, 255, 0.05)',
                borderRadius: 8,
              }}>
                <Ionicons 
                  name="radio-button-off-outline" 
                  size={20} 
                  color="#00E5FF" 
                  style={{ marginRight: 12, marginTop: 2 }}
                />
                <Text style={{
                  color: '#CCCCCC',
                  flex: 1,
                  fontSize: 15,
                  lineHeight: 22,
                }}>
                  {typeof item === 'string' ? item : item.task}
                </Text>
              </View>
            ))}
          </LinearGradient>
        )}
      </View>
    </ScrollView>
  );

  const renderChatTab = () => (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.chatContainer}>
        {conversationHistory.map((item, index) => (
          <View key={index} style={{ marginBottom: 20 }}>
            <View style={{
              backgroundColor: '#C6FF00',
              padding: 16,
              borderRadius: 16,
              borderBottomRightRadius: 4,
              alignSelf: 'flex-end',
              maxWidth: '80%',
              marginBottom: 8,
            }}>
              <Text style={{
                color: '#0B0F1A',
                fontSize: 15,
                fontWeight: '500',
              }}>
                {item.question}
              </Text>
            </View>
            <View style={{
              backgroundColor: '#1A1F2E',
              borderWidth: 1,
              borderColor: '#2A3A4A',
              padding: 16,
              borderRadius: 16,
              borderBottomLeftRadius: 4,
              alignSelf: 'flex-start',
              maxWidth: '80%',
            }}>
              <Text style={{
                color: '#CCCCCC',
                fontSize: 15,
                lineHeight: 22,
              }}>
                {item.response.data}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
      
      <View style={styles.chatInputContainer}>
        <TextInput
          style={styles.chatInput}
          value={currentQuestion}
          onChangeText={setCurrentQuestion}
          placeholder="Ask the AI assistant..."
          placeholderTextColor="#666666"
          multiline
        />
        <TouchableOpacity
          onPress={handleAskQuestion}
          style={styles.sendButton}
          disabled={!currentQuestion.trim() || isLoading}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPhotosTab = () => (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <LinearGradient
        colors={['#1A1F2E', '#252A3A']}
        style={{
          borderRadius: 16,
          padding: 20,
          borderWidth: 1,
          borderColor: '#2A3A4A',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <View style={{
            backgroundColor: 'rgba(198, 255, 0, 0.1)',
            borderRadius: 8,
            padding: 8,
            marginRight: 12,
          }}>
            <Ionicons name="camera-outline" size={24} color="#C6FF00" />
          </View>
          <Text style={{
            fontSize: 18,
            fontWeight: '700',
            color: '#FFFFFF',
          }}>
            Photo Documentation Guide
          </Text>
        </View>
        {photoGuidance?.data ? (
          <Text style={{
            color: '#CCCCCC',
            fontSize: 16,
            lineHeight: 24,
          }}>
            {photoGuidance.data}
          </Text>
        ) : (
          <TouchableOpacity
            onPress={() => getPhotoGuidance(job)}
            style={{
              backgroundColor: '#2A3A4A',
              padding: 20,
              borderRadius: 12,
              alignItems: 'center',
            }}
          >
            <Ionicons name="camera-outline" size={32} color="#C6FF00" />
            <Text style={{
              color: '#C1C9D6',
              marginTop: 8,
              fontWeight: '500',
            }}>
              Get Photo Guidance
            </Text>
          </TouchableOpacity>
        )}
      </LinearGradient>
    </ScrollView>
  );

  const renderSafetyTab = () => (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <LinearGradient
        colors={['#1A1F2E', '#252A3A']}
        style={{
          borderRadius: 16,
          padding: 20,
          borderWidth: 1,
          borderColor: '#2A3A4A',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <View style={{
            backgroundColor: 'rgba(255, 87, 34, 0.1)',
            borderRadius: 8,
            padding: 8,
            marginRight: 12,
          }}>
            <Ionicons name="shield-checkmark-outline" size={24} color="#FF5722" />
          </View>
          <Text style={{
            fontSize: 18,
            fontWeight: '700',
            color: '#FFFFFF',
          }}>
            Safety Recommendations
          </Text>
        </View>
        {safetyRecommendations?.data ? (
          <Text style={{
            color: '#CCCCCC',
            fontSize: 16,
            lineHeight: 24,
          }}>
            {safetyRecommendations.data}
          </Text>
        ) : (
          <TouchableOpacity
            onPress={() => getSafetyRecommendations(job)}
            style={{
              backgroundColor: '#2A3A4A',
              padding: 20,
              borderRadius: 12,
              alignItems: 'center',
            }}
          >
            <Ionicons name="shield-checkmark-outline" size={32} color="#FF5722" />
            <Text style={{
              color: '#C1C9D6',
              marginTop: 8,
              fontWeight: '500',
            }}>
              Get Safety Tips
            </Text>
          </TouchableOpacity>
        )}
      </LinearGradient>
    </ScrollView>
  );

  const renderTimingTab = () => (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <LinearGradient
        colors={['#1A1F2E', '#252A3A']}
        style={{
          borderRadius: 16,
          padding: 20,
          borderWidth: 1,
          borderColor: '#2A3A4A',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <View style={{
            backgroundColor: 'rgba(0, 229, 255, 0.1)',
            borderRadius: 8,
            padding: 8,
            marginRight: 12,
          }}>
            <Ionicons name="time-outline" size={24} color="#00E5FF" />
          </View>
          <Text style={{
            fontSize: 18,
            fontWeight: '700',
            color: '#FFFFFF',
          }}>
            Time Estimation
          </Text>
        </View>
        {timeEstimation?.data ? (
          <Text style={{
            color: '#CCCCCC',
            fontSize: 16,
            lineHeight: 24,
          }}>
            {timeEstimation.data}
          </Text>
        ) : (
          <TouchableOpacity
            onPress={() => getTimeEstimation(job)}
            style={{
              backgroundColor: '#2A3A4A',
              padding: 20,
              borderRadius: 12,
              alignItems: 'center',
            }}
          >
            <Ionicons name="time-outline" size={32} color="#00E5FF" />
            <Text style={{
              color: '#C1C9D6',
              marginTop: 8,
              fontWeight: '500',
            }}>
              Get Time Estimate
            </Text>
          </TouchableOpacity>
        )}
      </LinearGradient>
    </ScrollView>
  );

  if (!isConfigured()) {
    return (
      <View style={styles.container}>
        <View style={{
          backgroundColor: '#1A1F2E',
          borderRadius: 16,
          padding: 24,
          margin: 20,
          borderWidth: 1,
          borderColor: '#2A3A4A',
          alignItems: 'center',
        }}>
          <Ionicons name="warning-outline" size={48} color="#FF6B35" />
          <Text style={{
            color: '#FFFFFF',
            fontWeight: '700',
            fontSize: 18,
            marginTop: 16,
            textAlign: 'center',
          }}>
            AI Assistant Not Available
          </Text>
          <Text style={{
            color: '#CCCCCC',
            marginTop: 8,
            textAlign: 'center',
            lineHeight: 22,
          }}>
            OpenAI configuration is required to use the Field Operations Assistant.
          </Text>
        </View>
      </View>
    );
  }

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      {[
        { id: 'guidance', title: 'Overview', icon: 'clipboard-outline' },
        { id: 'chat', title: 'Chat', icon: 'chatbubble-outline' },
        { id: 'photos', title: 'Photos', icon: 'camera-outline' },
        { id: 'safety', title: 'Safety', icon: 'shield-checkmark-outline' },
        { id: 'timing', title: 'Timing', icon: 'time-outline' },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.id}
          onPress={() => setActiveTab(tab.id as any)}
          style={[
            styles.tabButton,
            activeTab === tab.id && styles.activeTab,
          ]}
        >
          <Ionicons
            name={tab.icon as any}
            size={16}
            color={activeTab === tab.id ? '#0B0F1A' : '#666666'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === tab.id && styles.activeTabText,
            ]}
          >
            {tab.title}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const content = (
    <View style={styles.container}>
      {!embedded && (
        <LinearGradient
          colors={['#1A1F2E', '#0B0F1A']}
          style={styles.header}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                backgroundColor: 'rgba(198, 255, 0, 0.1)',
                borderRadius: 8,
                padding: 8,
                marginRight: 12,
              }}>
                <Ionicons name="hardware-chip-outline" size={24} color="#C6FF00" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Field Assistant</Text>
                <Text style={styles.headerSubtitle}>AI-Powered Job Guidance</Text>
              </View>
            </View>
            {onClose && (
              <TouchableOpacity onPress={onClose} style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 8,
                padding: 8,
              }}>
                <Ionicons name="close" size={24} color="#CCCCCC" />
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      )}

      {activeTab === 'guidance' && renderQuickActions()}
      {renderTabs()}
      {renderTabContent()}
    </View>
  );

  if (embedded) {
    return content;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      {content}
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F1A',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1F2E',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#C6FF00',
    fontWeight: '500',
  },
  quickActionsContainer: {
    padding: 20,
    backgroundColor: '#0B0F1A',
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 24,
    lineHeight: 22,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  quickActionWrapper: {
    width: (screenWidth - 60) / 2,
    marginBottom: 16,
  },
  quickActionButton: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1A1F2E',
    borderWidth: 1,
    borderColor: '#2A3A4A',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  quickActionGradient: {
    padding: 20,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  quickActionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1.5,
  },
  quickActionText: {
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 18,
  },
  quickActionIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1A1F2E',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3A4A',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#C6FF00',
  },
  tabText: {
    color: '#666666',
    fontWeight: '500',
    fontSize: 12,
  },
  activeTabText: {
    color: '#0B0F1A',
    fontWeight: '700',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#0B0F1A',
  },
  contentSection: {
    padding: 20,
  },
  contentTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  contentText: {
    fontSize: 16,
    color: '#CCCCCC',
    lineHeight: 24,
    marginBottom: 16,
  },
  chatContainer: {
    flex: 1,
    padding: 20,
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1F2E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A3A4A',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 16,
  },
  chatInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    paddingRight: 12,
  },
  sendButton: {
    backgroundColor: '#C6FF00',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sendButtonText: {
    color: '#0B0F1A',
    fontWeight: '600',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    color: '#666666',
    marginTop: 16,
    textAlign: 'center',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorText: {
    color: '#FF5722',
    marginTop: 16,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: 'rgba(255, 87, 34, 0.1)',
    borderWidth: 1,
    borderColor: '#FF5722',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#FF5722',
    fontWeight: '600',
  },
});
