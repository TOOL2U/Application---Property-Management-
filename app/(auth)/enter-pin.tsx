/**
 * PIN Entry Screen - Brand Kit Style
 * Secure PIN input with yellow accents and grey theme matching brand identity
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
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { usePINAuth } from "@/contexts/PINAuthContext";
import { BrandTheme } from '@/constants/BrandTheme';

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
          <View
            key={index}
            style={{ marginHorizontal: 12 }}
          >
            {pin.length > index ? (
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: BrandTheme.colors.YELLOW,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <View style={{
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: BrandTheme.colors.YELLOW,
                }} />
              </View>
            ) : (
              <View style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: BrandTheme.colors.BORDER,
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
                      borderRadius: 0,
                      backgroundColor: BrandTheme.colors.SURFACE_1,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: pin.length === 0 ? BrandTheme.colors.BORDER : BrandTheme.colors.YELLOW,
                    }}
                  >
                    <Ionicons
                      name="backspace-outline"
                      size={28}
                      color={pin.length === 0 ? BrandTheme.colors.TEXT_SECONDARY : BrandTheme.colors.YELLOW}
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
                    borderRadius: 0,
                    backgroundColor: BrandTheme.colors.SURFACE_1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: BrandTheme.colors.BORDER,
                  }}
                >
                  <Text style={{
                    color: BrandTheme.colors.TEXT_PRIMARY,
                    fontSize: 24,
                    fontWeight: '600',
                    fontFamily: BrandTheme.typography.fontFamily.primary
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
      <View style={{ flex: 1, backgroundColor: BrandTheme.colors.GREY_PRIMARY }}>
        <StatusBar barStyle="light-content" backgroundColor={BrandTheme.colors.BLACK} />
        <SafeAreaView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 32 }}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ 
              color: BrandTheme.colors.TEXT_PRIMARY, 
              fontSize: 18, 
              fontFamily: BrandTheme.typography.fontFamily.regular
            }}>
              Profile not found
            </Text>
            <TouchableOpacity
              style={{
                marginTop: 16,
                backgroundColor: BrandTheme.colors.YELLOW,
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 0,
              }}
              onPress={() => router.replace('/(auth)/select-profile')}
            >
              <Text style={{ 
                color: BrandTheme.colors.BLACK, 
                fontWeight: '600', 
                fontFamily: BrandTheme.typography.fontFamily.primary
              }}>
                Back to Profiles
              </Text>
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
    <View style={{ flex: 1, backgroundColor: BrandTheme.colors.GREY_PRIMARY }}>
      <StatusBar barStyle="light-content" backgroundColor={BrandTheme.colors.BLACK} />
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 32 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 32 }}>
          <TouchableOpacity
            style={{ marginRight: 16, padding: 8 }}
            onPress={handleBackToProfiles}
          >
            <Ionicons name="chevron-back" size={24} color={BrandTheme.colors.YELLOW} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{
              color: BrandTheme.colors.TEXT_PRIMARY,
              fontSize: 28,
              fontFamily: BrandTheme.typography.fontFamily.display,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}>
              Enter PIN
            </Text>
            <Text style={{
              color: BrandTheme.colors.TEXT_SECONDARY,
              fontSize: 14,
              fontFamily: BrandTheme.typography.fontFamily.regular
            }}>
              Welcome back, {profile.name}
            </Text>
          </View>
        </View>

        {/* Profile Info */}
        <View
          style={{ alignItems: 'center', marginBottom: 32 }}
        >
          <View
            style={{
              width: 88,
              height: 88,
              borderRadius: 0,
              backgroundColor: BrandTheme.colors.YELLOW,
              padding: 3,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <View style={{
              width: 82,
              height: 82,
              borderRadius: 0,
              backgroundColor: BrandTheme.colors.SURFACE_1,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {profile.avatar ? (
                <Image
                  source={{ uri: profile.avatar }}
                  style={{ width: 82, height: 82, borderRadius: 0 }}
                />
              ) : (
                <Text style={{
                  color: BrandTheme.colors.YELLOW,
                  fontSize: 24,
                  fontWeight: 'bold',
                  fontFamily: BrandTheme.typography.fontFamily.primary
                }}>
                  {getInitials(profile.name)}
                </Text>
              )}
            </View>
          </View>
          <Text style={{
            color: BrandTheme.colors.TEXT_PRIMARY,
            fontSize: 20,
            fontWeight: '600',
            marginBottom: 4,
            fontFamily: BrandTheme.typography.fontFamily.primary
          }}>
            {profile.name}
          </Text>
          <Text style={{
            color: BrandTheme.colors.TEXT_SECONDARY,
            fontSize: 14,
            textTransform: 'capitalize',
            fontFamily: BrandTheme.typography.fontFamily.regular
          }}>
            {profile.role}
          </Text>
        </View>

        {/* PIN Input Section */}
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{
            color: BrandTheme.colors.TEXT_PRIMARY,
            fontSize: 18,
            marginBottom: 32,
            fontFamily: BrandTheme.typography.fontFamily.regular
          }}>
            Enter your 4-digit PIN
          </Text>

          {renderPinDots()}

          {error && (
            <Text style={{
              color: BrandTheme.colors.ERROR,
              fontSize: 14,
              marginBottom: 16,
              textAlign: 'center',
              fontFamily: BrandTheme.typography.fontFamily.regular
            }}>
              {error}
            </Text>
          )}

          {isLoading ? (
            <View style={{ marginTop: 32 }}>
              <ActivityIndicator size="large" color={BrandTheme.colors.YELLOW} />
            </View>
          ) : (
            renderNumberPad()
          )}

          {attempts > 0 && (
            <Text style={{
              color: BrandTheme.colors.WARNING,
              fontSize: 14,
              marginTop: 16,
              fontFamily: BrandTheme.typography.fontFamily.regular
            }}>
              Attempts remaining: {3 - attempts}
            </Text>
          )}
        </View>

        {/* Footer */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <Text style={{
            color: BrandTheme.colors.TEXT_SECONDARY,
            fontSize: 12,
            fontFamily: BrandTheme.typography.fontFamily.regular
          }}>
            Secure PIN Authentication
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}
