import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

interface Message {
  id?: string;
  sender: 'staff' | 'ai';
  text: string;
  createdAt: any;
  isLoading?: boolean;
}

interface FOAMessageProps {
  message: Message;
  isLast?: boolean;
}

export default function FOAMessage({ message, isLast }: FOAMessageProps) {
  const isAI = message.sender === 'ai';
  const isStaff = message.sender === 'staff';

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
      isStaff ? styles.staffMessage : styles.aiMessage,
      isLast && styles.lastMessage
    ]}>
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {isAI ? (
          <Avatar.Icon 
            size={32} 
            icon={() => <MaterialIcons name="smart-toy" size={18} color="white" />}
            style={styles.aiAvatar}
          />
        ) : (
          <Avatar.Icon 
            size={32} 
            icon={() => <MaterialIcons name="person" size={18} color="white" />}
            style={styles.staffAvatar}
          />
        )}
      </View>

      {/* Message Bubble */}
      <View style={styles.messageContent}>
        <View style={[
          styles.messageBubble,
          isStaff ? styles.staffBubble : styles.aiBubble
        ]}>
          <Text style={[
            styles.messageText,
            isStaff ? styles.staffText : styles.aiText
          ]}>
            {message.text}
          </Text>
        </View>
        
        {/* Timestamp */}
        <Text style={[
          styles.timestamp,
          isStaff ? styles.staffTimestamp : styles.aiTimestamp
        ]}>
          {formatTime(message.createdAt)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  lastMessage: {
    marginBottom: 8,
  },
  staffMessage: {
    justifyContent: 'flex-end',
  },
  aiMessage: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginHorizontal: 8,
  },
  aiAvatar: {
    backgroundColor: '#4F46E5',
  },
  staffAvatar: {
    backgroundColor: '#059669',
  },
  messageContent: {
    flex: 1,
    maxWidth: '80%',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  staffBubble: {
    backgroundColor: '#059669',
    borderBottomRightRadius: 4,
    alignSelf: 'flex-end',
  },
  aiBubble: {
    backgroundColor: '#f1f5f9',
    borderBottomLeftRadius: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  staffText: {
    color: 'white',
  },
  aiText: {
    color: '#1e293b',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    marginHorizontal: 4,
  },
  staffTimestamp: {
    color: '#64748b',
    textAlign: 'right',
  },
  aiTimestamp: {
    color: '#64748b',
    textAlign: 'left',
  },
});
