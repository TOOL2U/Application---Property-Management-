/**
 * Language Picker Component
 * Allows users to select their preferred language
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useTranslation } from '@/hooks/useTranslation';
import { SupportedLanguage } from '@/services/i18nService';

interface LanguagePickerProps {
  visible: boolean;
  onClose: () => void;
}

export const LanguagePicker: React.FC<LanguagePickerProps> = ({ visible, onClose }) => {
  const { t, currentLanguage, supportedLanguages, changeLanguage, isLoading } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage);

  const handleLanguageSelect = async (languageCode: string) => {
    setSelectedLanguage(languageCode);
    await changeLanguage(languageCode);
    setTimeout(onClose, 500); // Give time for the change to register
  };

  const renderLanguageOption = (language: SupportedLanguage, index: number) => (
    <Animatable.View
      key={language.code}
      animation="fadeInUp"
      delay={index * 100}
    >
      <TouchableOpacity
        onPress={() => handleLanguageSelect(language.code)}
        disabled={isLoading}
        style={{
          backgroundColor: '#1C1F2A',
          borderRadius: 16,
          padding: 20,
          marginBottom: 12,
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: selectedLanguage === language.code ? 2 : 1,
          borderColor: selectedLanguage === language.code ? '#C6FF00' : '#374151',
          opacity: isLoading && selectedLanguage !== language.code ? 0.5 : 1,
        }}
        activeOpacity={0.8}
      >
        <Text style={{ fontSize: 32, marginRight: 16 }}>
          {language.flag}
        </Text>
        
        <View style={{ flex: 1 }}>
          <Text style={{
            color: selectedLanguage === language.code ? '#C6FF00' : 'white',
            fontSize: 18,
            fontWeight: '600',
            marginBottom: 4,
          }}>
            {language.name}
          </Text>
          <Text style={{
            color: '#9CA3AF',
            fontSize: 14,
          }}>
            {language.nativeName}
          </Text>
        </View>

        {isLoading && selectedLanguage === language.code ? (
          <ActivityIndicator size="small" color="#C6FF00" />
        ) : selectedLanguage === language.code ? (
          <Ionicons name="checkmark-circle" size={24} color="#C6FF00" />
        ) : null}
      </TouchableOpacity>
    </Animatable.View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: '#0B0F1A' }}>
        <SafeAreaView style={{ flex: 1 }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#1E2A3A',
          }}>
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(198, 255, 0, 0.1)',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 16,
              }}
            >
              <Ionicons name="close" size={20} color="#C6FF00" />
            </TouchableOpacity>
            
            <View style={{ flex: 1 }}>
              <Text style={{
                color: 'white',
                fontSize: 20,
                fontWeight: 'bold',
              }}>
                {t('settings.language')}
              </Text>
              <Text style={{
                color: '#9CA3AF',
                fontSize: 14,
                marginTop: 2,
              }}>
                {t('common.selectPreferredLanguage') || 'Select your preferred language'}
              </Text>
            </View>
          </View>

          {/* Language Options */}
          <ScrollView 
            style={{ flex: 1 }} 
            contentContainerStyle={{ padding: 20 }}
            showsVerticalScrollIndicator={false}
          >
            <Animatable.View
              animation="fadeInUp"
              duration={600}
            >
              <Text style={{
                color: 'white',
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 20,
              }}>
                {t('common.availableLanguages') || 'Available Languages'}
              </Text>
            </Animatable.View>

            {supportedLanguages.map((language, index) => 
              renderLanguageOption(language, index)
            )}

            {/* Device Language Info */}
            <Animatable.View
              animation="fadeInUp"
              delay={supportedLanguages.length * 100}
              style={{
                backgroundColor: 'rgba(198, 255, 0, 0.1)',
                borderRadius: 12,
                padding: 16,
                marginTop: 20,
                borderWidth: 1,
                borderColor: 'rgba(198, 255, 0, 0.3)',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons name="information-circle" size={20} color="#C6FF00" style={{ marginRight: 8 }} />
                <Text style={{
                  color: '#C6FF00',
                  fontSize: 14,
                  fontWeight: '600',
                }}>
                  {t('common.deviceLanguage') || 'Device Language'}
                </Text>
              </View>
              <Text style={{
                color: '#9CA3AF',
                fontSize: 14,
                lineHeight: 20,
              }}>
                {t('common.deviceLanguageInfo') || 'The app will automatically detect your device language on first launch. You can change it anytime from here.'}
              </Text>
            </Animatable.View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

export default LanguagePicker;
