/**
 * FOA Log Timeline Component
 * Shows chronological AI interaction logs with filtering and grouping
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Card, Chip, Button } from 'react-native-paper';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { aiLoggingService } from '@/services/aiLoggingService';

interface FOALogEntry {
  id: string;
  jobId: string;
  staffId: string;
  type: 'checklist' | 'reminder' | 'escalation' | 'report' | 'guidance' | 'chat' | 'photos' | 'safety' | 'timing';
  question: string;
  response: string;
  aiFunction: string;
  confidence?: number;
  rating?: number;
  createdAt: Date;
  jobTitle?: string;
}

interface FOALogTimelineProps {
  staffId: string;
  jobId?: string; // Optional filter by specific job
}

export const FOALogTimeline: React.FC<FOALogTimelineProps> = ({ staffId, jobId }) => {
  const [logs, setLogs] = useState<FOALogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [groupedLogs, setGroupedLogs] = useState<{ [key: string]: FOALogEntry[] }>({});

  useEffect(() => {
    loadLogs();
  }, [staffId, jobId, filterType]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      
      // Get AI logs from Firestore
      const { getDb } = await import('@/lib/firebase');
      const { collection, query, where, orderBy, getDocs, limit } = await import('firebase/firestore');
      
      const db = await getDb();
      let q = query(
        collection(db, 'ai_logs'),
        where('staffId', '==', staffId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      // Add job filter if specified
      if (jobId) {
        q = query(
          collection(db, 'ai_logs'),
          where('staffId', '==', staffId),
          where('jobId', '==', jobId),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
      }

      const snapshot = await getDocs(q);
      const logData: FOALogEntry[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        logData.push({
          id: doc.id,
          jobId: data.jobId,
          staffId: data.staffId,
          type: data.aiFunction || 'guidance',
          question: data.question,
          response: data.response,
          aiFunction: data.aiFunction,
          confidence: data.confidence,
          rating: data.rating,
          createdAt: data.createdAt?.toDate() || new Date(),
          jobTitle: data.jobTitle,
        });
      });

      // Filter by type if not 'all'
      const filteredLogs = filterType === 'all' 
        ? logData 
        : logData.filter(log => log.type === filterType);

      setLogs(filteredLogs);
      
      // Group logs by date
      const grouped = groupLogsByDate(filteredLogs);
      setGroupedLogs(grouped);

    } catch (error) {
      console.error('❌ Error loading FOA logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLogs();
    setRefreshing(false);
  };

  const groupLogsByDate = (logs: FOALogEntry[]) => {
    const groups: { [key: string]: FOALogEntry[] } = {};
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    logs.forEach(log => {
      const logDate = new Date(log.createdAt);
      let groupKey = '';

      if (isSameDay(logDate, today)) {
        groupKey = 'Today';
      } else if (isSameDay(logDate, yesterday)) {
        groupKey = 'Yesterday';
      } else {
        groupKey = logDate.toLocaleDateString();
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(log);
    });

    return groups;
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const getLogTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      checklist: 'check-circle',
      reminder: 'bell',
      escalation: 'exclamation-triangle',
      report: 'file-alt',
      guidance: 'compass',
      chat: 'comments',
      photos: 'camera',
      safety: 'shield-alt',
      timing: 'clock',
    };
    return icons[type] || 'robot';
  };

  const getLogTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      checklist: '#10B981',
      reminder: '#F59E0B',
      escalation: '#EF4444',
      report: '#3B82F6',
      guidance: '#8B5CF6',
      chat: '#06B6D4',
      photos: '#EC4899',
      safety: '#F97316',
      timing: '#10B981',
    };
    return colors[type] || '#6B7280';
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const renderFilterButtons = () => (
    <View className="px-4 mb-4">
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row space-x-2">
          {[
            { id: 'all', label: 'All', icon: 'list' },
            { id: 'guidance', label: 'Guidance', icon: 'compass' },
            { id: 'checklist', label: 'Checklists', icon: 'check-circle' },
            { id: 'photos', label: 'Photos', icon: 'camera' },
            { id: 'safety', label: 'Safety', icon: 'shield-alt' },
            { id: 'chat', label: 'Chat', icon: 'comments' },
          ].map(filter => (
            <TouchableOpacity
              key={filter.id}
              onPress={() => setFilterType(filter.id)}
              className={`px-3 py-2 rounded-full flex-row items-center ${
                filterType === filter.id ? 'bg-blue-600' : 'bg-gray-700'
              }`}
            >
              <FontAwesome5 
                name={filter.icon} 
                size={14} 
                color={filterType === filter.id ? '#FFFFFF' : '#9CA3AF'} 
              />
              <Text 
                className={`ml-2 text-sm ${
                  filterType === filter.id ? 'text-white' : 'text-gray-400'
                }`}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderLogEntry = (log: FOALogEntry) => (
    <TouchableOpacity
      key={log.id}
      onPress={() => {
        if (log.jobId) {
          router.push(`/jobs/${log.jobId}`);
        }
      }}
      className="mb-3"
    >
      <Card style={{ backgroundColor: '#1F2937' }}>
        <Card.Content>
          <View className="flex-row items-start">
            {/* Type Icon */}
            <View 
              className="w-10 h-10 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: getLogTypeColor(log.type) + '20' }}
            >
              <FontAwesome5 
                name={getLogTypeIcon(log.type)} 
                size={16} 
                color={getLogTypeColor(log.type)} 
              />
            </View>

            {/* Content */}
            <View className="flex-1">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                  <Chip
                    mode="outlined"
                    style={{
                      backgroundColor: getLogTypeColor(log.type) + '20',
                      borderColor: getLogTypeColor(log.type),
                      height: 24,
                    }}
                  >
                    <Text style={{ 
                      color: getLogTypeColor(log.type), 
                      fontSize: 11,
                      textTransform: 'capitalize'
                    }}>
                      {log.aiFunction}
                    </Text>
                  </Chip>
                  
                  {log.confidence && (
                    <Chip
                      mode="outlined"
                      style={{
                        backgroundColor: '#374151',
                        borderColor: '#4B5563',
                        height: 24,
                        marginLeft: 8,
                      }}
                    >
                      <Text style={{ color: '#9CA3AF', fontSize: 11 }}>
                        {Math.round(log.confidence * 100)}%
                      </Text>
                    </Chip>
                  )}
                </View>

                <Text className="text-xs text-gray-400">
                  {formatTime(log.createdAt)}
                </Text>
              </View>

              {/* Question */}
              <Text className="text-sm text-gray-300 mb-2">
                <Text className="font-medium">Q: </Text>
                {truncateText(log.question)}
              </Text>

              {/* Response */}
              <Text className="text-sm text-white">
                <Text className="font-medium text-blue-400">AI: </Text>
                {truncateText(log.response)}
              </Text>

              {/* Job Info */}
              {log.jobTitle && (
                <View className="flex-row items-center mt-2">
                  <FontAwesome5 name="briefcase" size={12} color="#6B7280" />
                  <Text className="text-xs text-gray-400 ml-1">
                    {log.jobTitle}
                  </Text>
                </View>
              )}

              {/* Rating */}
              {log.rating && (
                <View className="flex-row items-center mt-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <FontAwesome5
                      key={star}
                      name="star"
                      size={12}
                      color={star <= log.rating! ? '#F59E0B' : '#374151'}
                      style={{ marginRight: 2 }}
                    />
                  ))}
                </View>
              )}
            </View>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center py-8">
        <ActivityIndicator size="large" color="#60A5FA" />
        <Text className="text-gray-400 mt-4">Loading AI logs...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {renderFilterButtons()}

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#60A5FA"
          />
        }
      >
        {Object.keys(groupedLogs).length > 0 ? (
          Object.entries(groupedLogs).map(([date, dateLogs]) => (
            <View key={date} className="px-4 mb-6">
              <Text className="text-lg font-bold text-white mb-4">
                {date}
              </Text>
              {dateLogs.map(renderLogEntry)}
            </View>
          ))
        ) : (
          <View className="flex-1 justify-center items-center py-12">
            <FontAwesome5 name="robot" size={48} color="#4B5563" />
            <Text className="text-gray-400 text-center mt-4 text-lg">
              No AI logs found
            </Text>
            <Text className="text-gray-500 text-sm text-center mt-2">
              {filterType === 'all' 
                ? 'Start using the Field Ops Assistant to see activity logs here'
                : `No ${filterType} interactions found`
              }
            </Text>
            {filterType !== 'all' && (
              <Button
                mode="outlined"
                onPress={() => setFilterType('all')}
                className="mt-4"
                textColor="#60A5FA"
              >
                Show All Logs
              </Button>
            )}
          </View>
        )}

        <View className="h-20" />
      </ScrollView>
    </View>
  );
};
