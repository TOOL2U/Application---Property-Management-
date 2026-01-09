/**
 * Translation Debug Component
 * Temporarily add this to your notifications screen to force reload translations
 * Remove after testing
 */

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import i18nService from '@/services/i18nService';
import { useTranslation } from '@/hooks/useTranslation';

export const TranslationDebug: React.FC = () => {
  const { t, forceUpdate } = useTranslation();
  
  useEffect(() => {
    // Force reload translations on mount
    console.log('🔧 TranslationDebug: Force reloading translations...');
    i18nService.reloadTranslations();
    forceUpdate();
  }, []);
  
  const handleForceReload = () => {
    console.log('🔧 Manual reload triggered');
    i18nService.reloadTranslations();
    forceUpdate();
  };
  
  // Test the problematic keys
  const testKeys = [
    'notifications.no_notifications',
    'notifications.no_notifications_subtitle',
    'notifications.all_caught_up',
    'notifications.refresh'
  ];
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Translation Debug</Text>
      
      {testKeys.map(key => (
        <View key={key} style={styles.testRow}>
          <Text style={styles.key}>{key}:</Text>
          <Text style={styles.value}>{t(key)}</Text>
        </View>
      ))}
      
      <TouchableOpacity style={styles.button} onPress={handleForceReload}>
        <Text style={styles.buttonText}>Force Reload Translations</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.9)',
    padding: 16,
    borderRadius: 8,
    zIndex: 9999,
  },
  title: {
    color: '#FFF02B',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  testRow: {
    marginBottom: 8,
  },
  key: {
    color: '#888',
    fontSize: 11,
  },
  value: {
    color: '#fff',
    fontSize: 13,
  },
  button: {
    backgroundColor: '#FFF02B',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  buttonText: {
    color: '#000',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
