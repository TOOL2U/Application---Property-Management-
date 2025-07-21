/**
 * PIN Entry Screen - AIS Telecom Style
 * Beautiful secure PIN input with neon green accents and dark theme matching profile selection
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
import * as Animatable from 'react-native-animatable';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { usePINAuth } from "@/contexts/PINAuthContext";

export default function EnterPINScreen() {
  const router = useRouter();
  const { profileId } = useLocalSearchParams<{ profileId: string }>();
  const { 
    loginWithPIN, 
    staffProfiles, 
    isLoading, 
    error, 
    clearError 
  } = usePINAuth();

  const [pin, setPin] = useState('');
  const [attempts, setAttempts] = useState(0);
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
    if (pin.length < 4) {
      const newPin = pin + number;
      setPin(newPin);
      
      // Auto-submit when 4 digits are entered
      if (newPin.length === 4) {
        setTimeout(() => handleSubmit(newPin), 100);
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  const handleSubmit = async (pinToSubmit: string = pin) => {
    if (pinToSubmit.length !== 4) return;

    try {
      const success = await loginWithPIN(profileId!, pinToSubmit);
      
      if (success) {
        console.log('✅ EnterPIN: Login successful, navigating to dashboard...');
        console.log('🚀 EnterPIN: Executing navigation to /(tabs)');
  router.replace('/');
      } else {
        console.log('❌ EnterPIN: Login failed');
        // Handle failed attempt
        setAttempts(prev => prev + 1);
        setPin('');
        
        if (attempts >= 2) {
          Alert.alert(
            'Too Many Attempts',
            'You have exceeded the maximum number of PIN attempts. Please try again later.',
            [
              {
                text: 'Back to Profiles',
                onPress: () => router.replace('/(auth)/select-profile'),
              },
            ]
          );
        }
      }
    } catch (error) {
      console.error('PIN submission error:', error);
      setPin('');
    }
  };

  const handleBackToProfiles = () => {
    router.back();
  };

  const renderPinDots = () => {
    return (
      <View style={{
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 32,
        paddingHorizontal: 20
      }}>
        {[0, 1, 2, 3].map((index) => (
          <Animatable.View
            key={index}
            animation={pin.length > index ? 'bounceIn' : undefined}
            duration={300}
            style={{ marginHorizontal: 12 }}
          >
            {pin.length > index ? (
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
          </Animatable.View>
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
                    disabled={pin.length === 0}
                    activeOpacity={0.8}
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 36,
                      backgroundColor: '#1C1F2A',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: pin.length === 0 ? '#374151' : '#C6FF00',
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
                      color={pin.length === 0 ? '#71717A' : '#C6FF00'}
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
              Enter PIN
            </Text>
            <Text style={{
              color: '#9CA3AF',
              fontSize: 14,
              fontFamily: 'Inter'
            }}>
              Welcome back, {profile.name}
            </Text>
          </View>
        </View>

        {/* Profile Info */}
        <Animatable.View
          animation="fadeInUp"
          duration={600}
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
        </Animatable.View>

        {/* PIN Input Section */}
        <Animatable.View
          animation={isShaking ? 'shake' : 'fadeInUp'}
          duration={600}
          delay={200}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{
            color: 'white',
            fontSize: 18,
            marginBottom: 32,
            fontFamily: 'Inter'
          }}>
            Enter your 4-digit PIN
          </Text>

          {renderPinDots()}

          {error && (
            <Animatable.View animation="fadeInDown" duration={300}>
              <Text style={{
                color: '#EF4444',
                fontSize: 14,
                marginBottom: 16,
                textAlign: 'center',
                fontFamily: 'Inter'
              }}>
                {error}
              </Text>
            </Animatable.View>
          )}

          {isLoading ? (
            <View style={{ marginTop: 32 }}>
              <ActivityIndicator size="large" color="#C6FF00" />
            </View>
          ) : (
            renderNumberPad()
          )}

          {attempts > 0 && (
            <Animatable.View animation="fadeInUp" duration={300}>
              <Text style={{
                color: '#F59E0B',
                fontSize: 14,
                marginTop: 16,
                fontFamily: 'Inter'
              }}>
                Attempts remaining: {3 - attempts}
              </Text>
            </Animatable.View>
          )}
        </Animatable.View>

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
