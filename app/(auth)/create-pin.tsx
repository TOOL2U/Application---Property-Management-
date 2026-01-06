/**
 * Create PIN Screen - AIS Telecom Style
 * Beautiful PIN creation with neon green accents and dark theme matching profile selection
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Vibration,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { usePINAuth } from "@/contexts/PINAuthContext";

export default function CreatePINScreen() {
  const router = useRouter();
  const { profileId } = useLocalSearchParams<{ profileId: string }>();
  const { 
    createPIN, 
    loginWithPIN,
    staffProfiles, 
    isLoading, 
    error, 
    clearError 
  } = usePINAuth();

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [isShaking, setIsShaking] = useState(false);

  const profile = staffProfiles.find(p => p.id === profileId);

  useEffect(() => {
    if (error) {
      setIsShaking(true);
      Vibration.vibrate(500);
      setTimeout(() => {
        setIsShaking(false);
        clearError();
      }, 600);
    }
  }, [error]);

  const handleNumberPress = (number: string) => {
    if (step === 'create' && pin.length < 4) {
      const newPin = pin + number;
      setPin(newPin);
      
      // Auto-proceed to confirm when 4 digits are entered
      if (newPin.length === 4) {
        setTimeout(() => setStep('confirm'), 300);
      }
    } else if (step === 'confirm' && confirmPin.length < 4) {
      const newConfirmPin = confirmPin + number;
      setConfirmPin(newConfirmPin);
      
      // Auto-submit when 4 digits are entered
      if (newConfirmPin.length === 4) {
        setTimeout(() => handleSubmit(newConfirmPin), 100);
      }
    }
  };

  const handleBackspace = () => {
    if (step === 'create') {
      setPin(pin.slice(0, -1));
    } else {
      setConfirmPin(confirmPin.slice(0, -1));
    }
  };

  const handleSubmit = async (pinToSubmit: string = confirmPin) => {
    if (step !== 'confirm' || pinToSubmit.length !== 4) return;

    if (pin !== pinToSubmit) {
      // PINs don't match
      setIsShaking(true);
      Vibration.vibrate(500);
      setTimeout(() => {
        setIsShaking(false);
        setConfirmPin('');
        Alert.alert(
          'PINs Don\'t Match',
          'The PINs you entered don\'t match. Please try again.',
          [{ text: 'OK' }]
        );
      }, 600);
      return;
    }

    try {
      // Create PIN
      const success = await createPIN(profileId!, pin);
      
      if (success) {
        console.log('✅ CreatePIN: PIN created successfully, attempting auto-login...');
        
        // Login with the new PIN
        const loginSuccess = await loginWithPIN(profileId!, pin);
        
        if (loginSuccess) {
          console.log('✅ CreatePIN: Auto-login successful, navigating to dashboard...');
          console.log('🚀 CreatePIN: Executing navigation to /(tabs)');
          router.replace('/');
        } else {
          console.log('❌ CreatePIN: Auto-login failed');
          // Handle login failure
          Alert.alert(
            'Login Failed',
            'Your PIN was created successfully, but we couldn\'t log you in automatically. Please try logging in again.',
            [
              {
                text: 'OK',
                onPress: () => router.replace('/(auth)/select-profile'),
              },
            ]
          );
        }
      } else {
        console.log('❌ CreatePIN: PIN creation failed');
        // Handle PIN creation failure
        setPin('');
        setConfirmPin('');
        setStep('create');
      }
    } catch (error) {
      console.error('PIN creation error:', error);
      setPin('');
      setConfirmPin('');
      setStep('create');
    }
  };

  const handleBackToProfiles = () => {
    router.back();
  };

  const renderPinDots = () => {
    const currentPin = step === 'create' ? pin : confirmPin;
    
    return (
      <View style={{
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 32,
        paddingHorizontal: 20
      }}>
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            style={{ marginHorizontal: 12 }}
          >
            {currentPin.length > index ? (
              <LinearGradient
                colors={['#C6FF00', '#A3E635']}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <View style={{
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: '#C6FF00',
                }} />
              </LinearGradient>
            ) : (
              <View style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: '#374151',
                backgroundColor: 'transparent',
              }} />
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderNumberPad = () => {
    const numbers = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['', '0', 'backspace'],
    ];

    const currentPin = step === 'create' ? pin : confirmPin;

    return (
      <View style={{ width: '100%', maxWidth: 300, alignSelf: 'center' }}>
        {numbers.map((row, rowIndex) => (
          <View key={rowIndex} style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 16,
            paddingHorizontal: 20
          }}>
            {row.map((item, itemIndex) => {
              if (item === '') {
                return <View key={itemIndex} style={{ width: 72, height: 72 }} />;
              }

              if (item === 'backspace') {
                return (
                  <TouchableOpacity
                    key={itemIndex}
                    onPress={handleBackspace}
                    disabled={currentPin.length === 0}
                    activeOpacity={0.8}
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 36,
                      backgroundColor: '#1C1F2A',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: currentPin.length === 0 ? '#374151' : '#C6FF00',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 4,
                      elevation: 4,
                    }}
                  >
                    <Ionicons
                      name="backspace-outline"
                      size={28}
                      color={currentPin.length === 0 ? '#71717A' : '#C6FF00'}
                    />
                  </TouchableOpacity>
                );
              }

              return (
                <TouchableOpacity
                  key={itemIndex}
                  onPress={() => handleNumberPress(item)}
                  disabled={isLoading}
                  activeOpacity={0.8}
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    backgroundColor: '#1C1F2A',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: '#374151',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 4,
                  }}
                >
                  <Text style={{
                    color: 'white',
                    fontSize: 24,
                    fontWeight: '600',
                    fontFamily: 'Urbanist'
                  }}>
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  if (!profile) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0B0F1A' }}>
        <StatusBar barStyle="light-content" backgroundColor="#0B0F1A" />
        <SafeAreaView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 32 }}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: 'white', fontSize: 18, fontFamily: 'Inter' }}>Profile not found</Text>
            <TouchableOpacity
              style={{
                marginTop: 16,
                backgroundColor: '#C6FF00',
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 12,
              }}
              onPress={() => router.replace('/(auth)/select-profile')}
            >
              <Text style={{ color: '#0B0F1A', fontWeight: '600', fontFamily: 'Inter' }}>Back to Profiles</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0B0F1A' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F1A" />
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 32 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 32 }}>
          <TouchableOpacity
            style={{ marginRight: 16, padding: 8 }}
            onPress={handleBackToProfiles}
          >
            <Ionicons name="chevron-back" size={24} color="#C6FF00" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{
              color: 'white',
              fontSize: 24,
              fontWeight: 'bold',
              fontFamily: 'Urbanist'
            }}>
              {step === 'create' ? 'Create PIN' : 'Confirm PIN'}
            </Text>
            <Text style={{
              color: '#9CA3AF',
              fontSize: 14,
              fontFamily: 'Inter'
            }}>
              {step === 'create' 
                ? 'Set up a secure 4-digit PIN' 
                : 'Enter the same PIN again to confirm'}
            </Text>
          </View>
        </View>

        {/* Profile Info */}
        <View
          style={{ alignItems: 'center', marginBottom: 32 }}
        >
          <LinearGradient
            colors={['#C6FF00', '#A3E635']}
            style={{
              width: 88,
              height: 88,
              borderRadius: 44,
              padding: 3,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <View style={{
              width: 82,
              height: 82,
              borderRadius: 41,
              backgroundColor: '#374151',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {profile.avatar ? (
                <Image
                  source={{ uri: profile.avatar }}
                  style={{ width: 82, height: 82, borderRadius: 41 }}
                />
              ) : (
                <Text style={{
                  color: '#C6FF00',
                  fontSize: 24,
                  fontWeight: 'bold',
                  fontFamily: 'Urbanist'
                }}>
                  {getInitials(profile.name)}
                </Text>
              )}
            </View>
          </LinearGradient>
          <Text style={{
            color: 'white',
            fontSize: 20,
            fontWeight: '600',
            marginBottom: 4,
            fontFamily: 'Urbanist'
          }}>
            {profile.name}
          </Text>
          <Text style={{
            color: '#9CA3AF',
            fontSize: 14,
            textTransform: 'capitalize',
            fontFamily: 'Inter'
          }}>
            {profile.role}
          </Text>
        </View>

        {/* PIN Input Section */}
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{
            color: 'white',
            fontSize: 18,
            marginBottom: 32,
            fontFamily: 'Inter'
          }}>
            {step === 'create' 
              ? 'Create your 4-digit PIN' 
              : 'Confirm your PIN'}
          </Text>

          {renderPinDots()}

          {error && (
            <Text style={{
              color: '#EF4444',
              fontSize: 14,
              marginBottom: 16,
              textAlign: 'center',
              fontFamily: 'Inter'
            }}>
              {error}
            </Text>
          )}

          {isLoading ? (
            <View style={{ marginTop: 32 }}>
              <ActivityIndicator size="large" color="#C6FF00" />
            </View>
          ) : (
            renderNumberPad()
          )}
        </View>

        {/* Footer */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <Text style={{
            color: '#6B7280',
            fontSize: 12,
            fontFamily: 'Inter'
          }}>
            Secure PIN Authentication
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}
