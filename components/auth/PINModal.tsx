/**
 * PIN Entry Modal Component
 * Handles 4-digit PIN input and validation for staff profile access
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  TextInput, 
  Platform,
  Vibration,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import { User, Lock, Shield, AlertCircle, CheckCircle } from 'lucide-react-native';

import { 
  StaffProfile, 
  validateStaffPIN, 
  saveSelectedStaffId,
  checkPINAttempts,
  recordPINAttempt
} from '@/services/staffProfileService';

interface PINEntryModalProps {
  visible: boolean;
  staffProfile: StaffProfile;
  onSuccess: (staffProfile: StaffProfile) => void;
  onCancel: () => void;
}

export const PINEntryModal: React.FC<PINEntryModalProps> = ({
  visible,
  staffProfile,
  onSuccess,
  onCancel
}) => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(5);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);
  
  const pinInputRef = useRef<TextInput>(null);
  const animationRef = useRef<any>(null);

  useEffect(() => {
    if (visible) {
      checkAttempts();
      setPin('');
      setError(null);
      setTimeout(() => {
        pinInputRef.current?.focus();
      }, 300);
    }
  }, [visible, staffProfile.id]);

  useEffect(() => {
    if (pin.length === 4 && !loading && !isLockedOut) {
      handlePINSubmit();
    }
  }, [pin]);

  const checkAttempts = async () => {
    try {
      const attemptStatus = await checkPINAttempts(staffProfile.id);
      setAttemptsLeft(attemptStatus.attemptsLeft);
      setIsLockedOut(!attemptStatus.canAttempt);
      
      if (attemptStatus.lockoutTime) {
        setLockoutTime(attemptStatus.lockoutTime);
      }
    } catch (error) {
      console.error('❌ Error checking PIN attempts:', error);
    }
  };

  const handlePINSubmit = async () => {
    if (pin.length !== 4) {
      setError('Please enter a 4-digit PIN');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await validateStaffPIN(staffProfile.id, pin);
      
      if (result.isValid && result.staffProfile) {
        await recordPINAttempt(staffProfile.id, true);
        await saveSelectedStaffId(staffProfile.id, rememberMe);
        
        if (animationRef.current) {
          animationRef.current.bounceIn();
        }
        
        if (Platform.OS !== 'web') {
          Vibration.vibrate(100);
        }
        
        setTimeout(() => {
          onSuccess(result.staffProfile);
        }, 500);
      } else {
        await recordPINAttempt(staffProfile.id, false);
        await checkAttempts();
        
        setError(result.error || 'Incorrect PIN');
        setPin('');
        
        if (animationRef.current) {
          animationRef.current.shake();
        }
        
        if (Platform.OS !== 'web') {
          Vibration.vibrate([100, 100, 100]);
        }
      }
    } catch (error) {
      console.error('❌ PIN validation error:', error);
      setError('PIN validation failed. Please try again.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handlePINChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '');
    if (numericText.length <= 4) {
      setPin(numericText);
      setError(null);
    }
  };

  const handleCancel = () => {
    setPin('');
    setError(null);
    onCancel();
  };

  const formatLockoutTime = () => {
    if (!lockoutTime) return '';
    
    const now = Date.now();
    const remaining = Math.max(0, lockoutTime - now);
    const minutes = Math.ceil(remaining / (60 * 1000));
    
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };

  const renderPINDots = () => {
    return (
      <View className="flex-row justify-center gap-4 mb-8">
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            className={`w-4 h-4 rounded-full border-2 ${
              index < pin.length
                ? 'bg-purple-500 border-purple-500'
                : 'border-gray-400'
            }`}
          />
        ))}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
        <Animatable.View
          ref={animationRef}
          animation="slideInUp"
          duration={400}
          className="w-11/12 max-w-sm mx-4"
        >
          <View className="overflow-hidden rounded-3xl border border-white/10">
            {Platform.OS !== 'web' ? (
              <BlurView intensity={40} tint="dark" className="absolute inset-0" />
            ) : (
              <View 
                className="absolute inset-0"
                style={{ backgroundColor: 'rgba(10, 10, 10, 0.95)' }}
              />
            )}
            
            <LinearGradient
              colors={['rgba(139, 92, 246, 0.1)', 'rgba(59, 130, 246, 0.05)']}
              className="p-8"
            >
              {/* Header */}
              <View className="items-center mb-8">
                <View className="relative mb-4">
                  {staffProfile.photo ? (
                    <Image
                      source={{ uri: staffProfile.photo }}
                      className="w-20 h-20 rounded-2xl"
                      style={{ backgroundColor: 'rgba(139, 92, 246, 0.2)' }}
                    />
                  ) : (
                    <View className="w-20 h-20 rounded-2xl bg-purple-500/20 items-center justify-center">
                      <User size={40} color="#8b5cf6" />
                    </View>
                  )}
                  
                  <View className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-purple-500 items-center justify-center">
                    <Lock size={16} color="white" />
                  </View>
                </View>

                <Text className="text-white text-xl font-bold mb-1">
                  {staffProfile.name}
                </Text>
                <Text className="text-purple-300 text-sm capitalize mb-4">
                  {staffProfile.role}
                </Text>
                
                {isLockedOut ? (
                  <View className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 mb-4">
                    <View className="flex-row items-center justify-center">
                      <AlertCircle size={16} color="#ef4444" />
                      <Text className="text-red-400 font-medium ml-2">Account Locked</Text>
                    </View>
                    <Text className="text-red-300 text-xs text-center mt-1">
                      Try again in {formatLockoutTime()}
                    </Text>
                  </View>
                ) : (
                  <Text className="text-gray-400 text-center">
                    Enter your 4-digit PIN to continue
                  </Text>
                )}
              </View>

              {!isLockedOut && (
                <>
                  {renderPINDots()}

                  <TextInput
                    ref={pinInputRef}
                    value={pin}
                    onChangeText={handlePINChange}
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                    autoFocus
                    style={{ 
                      position: 'absolute', 
                      left: -1000, 
                      opacity: 0 
                    }}
                    editable={!loading && !isLockedOut}
                  />

                  {error && (
                    <Animatable.View
                      animation="fadeIn"
                      className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 mb-6"
                    >
                      <View className="flex-row items-center justify-center">
                        <AlertCircle size={16} color="#ef4444" />
                        <Text className="text-red-400 font-medium ml-2">{error}</Text>
                      </View>
                      {attemptsLeft > 0 && (
                        <Text className="text-red-300 text-xs text-center mt-1">
                          {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} remaining
                        </Text>
                      )}
                    </Animatable.View>
                  )}

                  <TouchableOpacity
                    onPress={() => setRememberMe(!rememberMe)}
                    className="flex-row items-center justify-center mb-6"
                    disabled={loading}
                  >
                    <View className={`w-5 h-5 rounded border-2 mr-3 items-center justify-center ${
                      rememberMe ? 'bg-purple-500 border-purple-500' : 'border-gray-400'
                    }`}>
                      {rememberMe && <CheckCircle size={12} color="white" />}
                    </View>
                    <Text className="text-gray-300 text-sm">Remember me for 24 hours</Text>
                  </TouchableOpacity>
                </>
              )}

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={handleCancel}
                  className="flex-1 bg-gray-600/30 py-4 rounded-xl"
                  disabled={loading}
                >
                  <Text className="text-gray-300 text-center font-semibold">Cancel</Text>
                </TouchableOpacity>

                {!isLockedOut && (
                  <TouchableOpacity
                    onPress={() => pinInputRef.current?.focus()}
                    className="flex-1 bg-purple-500 py-4 rounded-xl"
                    disabled={loading || pin.length !== 4}
                    style={{ opacity: loading || pin.length !== 4 ? 0.5 : 1 }}
                  >
                    <View className="flex-row items-center justify-center">
                      {loading ? (
                        <Animatable.View animation="rotate" iterationCount="infinite">
                          <Ionicons name="refresh" size={16} color="white" />
                        </Animatable.View>
                      ) : (
                        <Shield size={16} color="white" />
                      )}
                      <Text className="text-white font-semibold ml-2">
                        {loading ? 'Verifying...' : 'Unlock'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>

              <View className="mt-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <Text className="text-blue-400 text-xs text-center">
                  🔒 Your PIN is encrypted and never stored on this device
                </Text>
              </View>
            </LinearGradient>
          </View>
        </Animatable.View>
      </View>
    </Modal>
  );
};
