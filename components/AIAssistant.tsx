import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Sparkles, Home, Wrench, MessageCircle, DollarSign } from 'lucide-react-native';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/Design';
import { useOpenAI } from '../hooks/useOpenAI';

export default function AIAssistant() {
  const {
    isLoading,
    error,
    lastResponse,
    generatePropertyDescription,
    generateMaintenanceSuggestions,
    generateGuestResponse,
    generateTaskSuggestions,
    clearError,
    isConfigured,
  } = useOpenAI();

  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [propertyName, setPropertyName] = useState('Sunset Villa Malibu');
  const [maintenanceIssue, setMaintenanceIssue] = useState('Air conditioning not cooling properly in master bedroom');
  const [guestMessage, setGuestMessage] = useState('Hi, we arrived at the villa but the WiFi password is not working. Can you help us?');

  const handlePropertyDescription = async () => {
    setActiveFeature('property');
    clearError();

    const result = await generatePropertyDescription({
      name: propertyName,
      type: 'villa',
      bedrooms: 4,
      bathrooms: 3,
      location: 'Malibu, California',
      amenities: ['Private Pool', 'Ocean View', 'Chef Kitchen', 'Wine Cellar', 'Home Theater'],
      features: ['Infinity Pool', 'Private Beach Access', 'Smart Home Technology'],
      size: 3500,
    });

    if (result) {
      Alert.alert('Property Description Generated', 'Check the response below!');
    }
  };

  const handleMaintenanceSuggestions = async () => {
    setActiveFeature('maintenance');
    clearError();

    const result = await generateMaintenanceSuggestions({
      type: 'hvac',
      description: maintenanceIssue,
      urgency: 'medium',
      location: 'Master Bedroom',
    });

    if (result) {
      Alert.alert('Maintenance Suggestions Generated', 'Check the response below!');
    }
  };

  const handleGuestResponse = async () => {
    setActiveFeature('guest');
    clearError();

    const result = await generateGuestResponse({
      guestName: 'Sarah Johnson',
      propertyName: propertyName,
      messageType: 'request',
      originalMessage: guestMessage,
      context: 'Guest checked in today, first-time visitor',
    });

    if (result) {
      Alert.alert('Guest Response Generated', 'Check the response below!');
    }
  };

  const handleTaskSuggestions = async () => {
    setActiveFeature('tasks');
    clearError();

    const result = await generateTaskSuggestions('villa', 'summer', '2024-01-15');

    if (result) {
      Alert.alert('Task Suggestions Generated', 'Check the response below!');
    }
  };

  if (!isConfigured()) {
    return (
      <Card style={styles.container}>
        <View style={styles.notConfiguredContainer}>
          <Sparkles size={48} color={Colors.primary} />
          <Text style={styles.notConfiguredTitle}>AI Assistant Not Configured</Text>
          <Text style={styles.notConfiguredText}>
            To enable AI-powered features, add your OpenAI API key to the .env.local file:
          </Text>
          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>EXPO_PUBLIC_OPENAI_API_KEY=your_api_key_here</Text>
          </View>
          <Text style={styles.notConfiguredSubtext}>
            Get your API key from: https://platform.openai.com/api-keys
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Card style={styles.headerCard}>
        <View style={styles.header}>
          <Sparkles size={32} color={Colors.primary} />
          <View style={styles.headerText}>
            <Text style={styles.title}>AI Assistant</Text>
            <Text style={styles.subtitle}>Powered by OpenAI for Villa Management</Text>
          </View>
        </View>
      </Card>

      <View style={styles.featuresGrid}>
        <Card style={styles.featureCard}>
          <Home size={24} color={Colors.primary} />
          <Text style={styles.featureTitle}>Property Descriptions</Text>
          <Text style={styles.featureDescription}>
            Generate compelling property descriptions for listings
          </Text>
          <Input
            value={propertyName}
            onChangeText={setPropertyName}
            placeholder="Property name"
            style={styles.input}
          />
          <Button
            title="Generate Description"
            onPress={handlePropertyDescription}
            loading={isLoading && activeFeature === 'property'}
            size="sm"
          />
        </Card>

        <Card style={styles.featureCard}>
          <Wrench size={24} color={Colors.primary} />
          <Text style={styles.featureTitle}>Maintenance Help</Text>
          <Text style={styles.featureDescription}>
            Get AI-powered maintenance suggestions and solutions
          </Text>
          <Input
            value={maintenanceIssue}
            onChangeText={setMaintenanceIssue}
            placeholder="Describe the issue"
            multiline
            style={styles.textArea}
          />
          <Button
            title="Get Suggestions"
            onPress={handleMaintenanceSuggestions}
            loading={isLoading && activeFeature === 'maintenance'}
            size="sm"
          />
        </Card>

        <Card style={styles.featureCard}>
          <MessageCircle size={24} color={Colors.primary} />
          <Text style={styles.featureTitle}>Guest Communication</Text>
          <Text style={styles.featureDescription}>
            Generate professional responses to guest messages
          </Text>
          <Input
            value={guestMessage}
            onChangeText={setGuestMessage}
            placeholder="Guest message"
            multiline
            style={styles.textArea}
          />
          <Button
            title="Generate Response"
            onPress={handleGuestResponse}
            loading={isLoading && activeFeature === 'guest'}
            size="sm"
          />
        </Card>

        <Card style={styles.featureCard}>
          <DollarSign size={24} color={Colors.primary} />
          <Text style={styles.featureTitle}>Smart Tasks</Text>
          <Text style={styles.featureDescription}>
            Get AI-generated maintenance and preparation tasks
          </Text>
          <Button
            title="Generate Tasks"
            onPress={handleTaskSuggestions}
            loading={isLoading && activeFeature === 'tasks'}
            size="sm"
          />
        </Card>
      </View>

      {error && (
        <Card style={styles.errorCard}>
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Clear Error" onPress={clearError} variant="outline" size="sm" />
        </Card>
      )}

      {lastResponse && (
        <Card style={styles.responseCard}>
          <Text style={styles.responseTitle}>AI Response</Text>
          <Text style={styles.responseText}>{lastResponse}</Text>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  notConfiguredContainer: {
    alignItems: 'center',
    padding: Spacing[8],
  },

  notConfiguredTitle: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.sizes.xl.fontSize,
    fontWeight: Typography.weights.bold,
    color: Colors.white,
    marginTop: Spacing[4],
    marginBottom: Spacing[3],
    textAlign: 'center',
  },

  notConfiguredText: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.sizes.base.fontSize,
    color: Colors.neutral300,
    textAlign: 'center',
    marginBottom: Spacing[4],
    lineHeight: 24,
  },

  notConfiguredSubtext: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.sizes.sm.fontSize,
    color: Colors.neutral400,
    textAlign: 'center',
    marginTop: Spacing[3],
  },

  codeBlock: {
    backgroundColor: Colors.neutral800,
    borderRadius: BorderRadius.default,
    padding: Spacing[3],
    marginVertical: Spacing[2],
  },

  codeText: {
    fontFamily: 'monospace',
    fontSize: Typography.sizes.sm.fontSize,
    color: Colors.primary,
  },

  headerCard: {
    marginBottom: Spacing[4],
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerText: {
    marginLeft: Spacing[3],
    flex: 1,
  },

  title: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.sizes['2xl'].fontSize,
    fontWeight: Typography.weights.bold,
    color: Colors.white,
    marginBottom: Spacing[1],
  },

  subtitle: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.sizes.base.fontSize,
    color: Colors.neutral300,
  },

  featuresGrid: {
    gap: Spacing[4],
  },

  featureCard: {
    padding: Spacing[5],
  },

  featureTitle: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.sizes.lg.fontSize,
    fontWeight: Typography.weights.semibold,
    color: Colors.white,
    marginTop: Spacing[3],
    marginBottom: Spacing[2],
  },

  featureDescription: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.sizes.sm.fontSize,
    color: Colors.neutral300,
    marginBottom: Spacing[4],
    lineHeight: 20,
  },

  input: {
    marginBottom: Spacing[3],
  },

  textArea: {
    minHeight: 80,
    marginBottom: Spacing[3],
  },

  errorCard: {
    backgroundColor: `${Colors.error}15`,
    borderColor: `${Colors.error}30`,
    marginTop: Spacing[4],
  },

  errorTitle: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.sizes.lg.fontSize,
    fontWeight: Typography.weights.semibold,
    color: Colors.error,
    marginBottom: Spacing[2],
  },

  errorText: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.sizes.sm.fontSize,
    color: Colors.error,
    marginBottom: Spacing[3],
    lineHeight: 20,
  },

  responseCard: {
    marginTop: Spacing[4],
    backgroundColor: `${Colors.primary}10`,
    borderColor: `${Colors.primary}30`,
  },

  responseTitle: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.sizes.lg.fontSize,
    fontWeight: Typography.weights.semibold,
    color: Colors.primary,
    marginBottom: Spacing[3],
  },

  responseText: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.sizes.base.fontSize,
    color: Colors.white,
    lineHeight: 24,
  },
});
