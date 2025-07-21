/**
 * GPS Job Location Tracking Hook
 * React hook for managing GPS check-in and real-time location tracking
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import { jobLocationTrackingService, GPSCheckIn, RealTimeLocationUpdate, ArrivalDetection, LocationTrackingSession } from '@/services/jobLocationTrackingService';
import { JobData } from '@/types/jobData';
import { usePINAuth } from '@/contexts/PINAuthContext';

export interface UseJobLocationTrackingConfig {
  enableRealTimeTracking?: boolean;
  enableArrivalDetection?: boolean;
  enableFOAIntegration?: boolean;
  testMode?: boolean;
  updateInterval?: number; // seconds
}

export interface UseJobLocationTrackingState {
  // Check-in state
  isCheckingIn: boolean;
  hasCheckedIn: boolean;
  checkInData: GPSCheckIn | null;
  
  // Tracking state
  isTracking: boolean;
  trackingSession: LocationTrackingSession | null;
  currentLocation: Location.LocationObject | null;
  
  // Arrival detection
  arrivalStatus: ArrivalDetection | null;
  hasArrived: boolean;
  distanceToProperty: number | null;
  
  // FOA integration
  foaCheckInMessage: string | null;
  foaArrivalMessage: string | null;
  
  // Error handling
  error: string | null;
  permissionStatus: 'granted' | 'denied' | 'undetermined';
}

export interface UseJobLocationTrackingActions {
  // Check-in actions
  checkInToJob: (job: JobData) => Promise<boolean>;
  
  // Tracking actions
  startTracking: (job: JobData) => Promise<boolean>;
  stopTracking: () => Promise<void>;
  
  // Test mode actions
  simulateLocation: (coordinates: { latitude: number; longitude: number }) => Promise<void>;
  testCheckIn: (job: JobData) => Promise<boolean>;
  
  // Utility actions
  checkPermissions: () => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
}

export function useJobLocationTracking(
  config: UseJobLocationTrackingConfig = {}
): UseJobLocationTrackingState & UseJobLocationTrackingActions {
  const { currentProfile } = usePINAuth();
  const [state, setState] = useState<UseJobLocationTrackingState>({
    isCheckingIn: false,
    hasCheckedIn: false,
    checkInData: null,
    isTracking: false,
    trackingSession: null,
    currentLocation: null,
    arrivalStatus: null,
    hasArrived: false,
    distanceToProperty: null,
    foaCheckInMessage: null,
    foaArrivalMessage: null,
    error: null,
    permissionStatus: 'undetermined',
  });

  const currentJobRef = useRef<JobData | null>(null);
  const arrivalListenerRef = useRef<(() => void) | null>(null);

  // Configure service with hook options
  useEffect(() => {
    jobLocationTrackingService.config = {
      updateInterval: config.updateInterval || 60,
      distanceFilter: 10,
      arrivalRadius: 30,
      enableAutoStart: config.enableRealTimeTracking !== false,
      enableFOAIntegration: config.enableFOAIntegration !== false,
      testMode: config.testMode || false,
    };
  }, [config]);

  // Check permissions on mount
  useEffect(() => {
    checkPermissions();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
      if (arrivalListenerRef.current) {
        arrivalListenerRef.current();
      }
    };
  }, []);

  /**
   * Check location permissions
   */
  const checkPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      
      setState(prev => ({
        ...prev,
        permissionStatus: status === 'granted' ? 'granted' : 'denied'
      }));

      return status === 'granted';
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to check location permissions',
        permissionStatus: 'denied'
      }));
      return false;
    }
  }, []);

  /**
   * 📍 Check-in to job
   */
  const checkInToJob = useCallback(async (job: JobData): Promise<boolean> => {
    if (!currentProfile?.id) {
      setState(prev => ({ ...prev, error: 'No user profile available' }));
      return false;
    }

    setState(prev => ({ 
      ...prev, 
      isCheckingIn: true, 
      error: null,
      foaCheckInMessage: null 
    }));

    try {
      // Check permissions first
      const hasPermission = await checkPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Location Permission Required',
          'Please enable location access to check in to jobs.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Location.requestForegroundPermissionsAsync() }
          ]
        );
        setState(prev => ({ ...prev, isCheckingIn: false }));
        return false;
      }

      // Perform check-in
      const checkInData = await jobLocationTrackingService.checkInToJob(
        job.id, 
        currentProfile.id, 
        job
      );

      if (checkInData) {
        currentJobRef.current = job;
        
        setState(prev => ({
          ...prev,
          hasCheckedIn: true,
          checkInData,
          foaCheckInMessage: checkInData.foaContext || null,
          isCheckingIn: false
        }));

        // Show success message with FOA context
        const message = checkInData.foaContext || 
          `✅ Checked in successfully at ${checkInData.address || 'job location'}`;
        
        Alert.alert('Check-in Complete', message, [{ text: 'OK' }]);

        // Setup arrival detection if enabled
        if (config.enableArrivalDetection !== false) {
          setupArrivalDetection(job);
        }

        return true;
      }

      setState(prev => ({ 
        ...prev, 
        error: 'Failed to check in to job',
        isCheckingIn: false 
      }));
      return false;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Check-in failed';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage,
        isCheckingIn: false 
      }));
      
      Alert.alert('Check-in Failed', errorMessage);
      return false;
    }
  }, [currentProfile, config.enableArrivalDetection, checkPermissions]);

  /**
   * 🛰️ Start real-time tracking
   */
  const startTracking = useCallback(async (job: JobData): Promise<boolean> => {
    if (!currentProfile?.id) {
      setState(prev => ({ ...prev, error: 'No user profile available' }));
      return false;
    }

    setState(prev => ({ 
      ...prev, 
      error: null 
    }));

    try {
      await jobLocationTrackingService.startRealTimeTracking(job.id, currentProfile.id);
      
      // Get tracking session status
      const session = await jobLocationTrackingService.getTrackingSessionStatus(job.id, currentProfile.id);
      
      setState(prev => ({
        ...prev,
        isTracking: true,
        trackingSession: session
      }));

      currentJobRef.current = job;
      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start tracking';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage 
      }));
      return false;
    }
  }, [currentProfile]);

  /**
   * Stop real-time tracking
   */
  const stopTracking = useCallback(async (): Promise<void> => {
    try {
      await jobLocationTrackingService.stopRealTimeTracking();
      
      setState(prev => ({
        ...prev,
        isTracking: false,
        trackingSession: null
      }));

    } catch (error) {
      console.error('Failed to stop tracking:', error);
    }
  }, []);

  /**
   * Setup arrival detection monitoring
   */
  const setupArrivalDetection = useCallback((job: JobData) => {
    if (!currentProfile?.id || !job.location?.coordinates) return;

    // Subscribe to location updates for arrival detection
    arrivalListenerRef.current = jobLocationTrackingService.subscribeToJobLocationUpdates(
      job.id,
      (updates: RealTimeLocationUpdate[]) => {
        if (updates.length > 0) {
          const latestUpdate = updates[0];
          setState(prev => ({ ...prev, currentLocation: {
            coords: {
              latitude: latestUpdate.coordinates.latitude,
              longitude: latestUpdate.coordinates.longitude,
              accuracy: latestUpdate.accuracy,
              altitude: null,
              altitudeAccuracy: null,
              heading: latestUpdate.heading || null,
              speed: latestUpdate.speed || null
            },
            timestamp: latestUpdate.timestamp.getTime()
          }}));

          // Check for arrival
          checkArrival(job, latestUpdate);
        }
      }
    );
  }, [currentProfile]);

  /**
   * Check arrival detection
   */
  const checkArrival = useCallback(async (job: JobData, locationUpdate: RealTimeLocationUpdate) => {
    if (!job.location?.coordinates) return;

    const distance = calculateDistance(
      locationUpdate.coordinates.latitude,
      locationUpdate.coordinates.longitude,
      job.location.coordinates.latitude,
      job.location.coordinates.longitude
    );

    setState(prev => ({ ...prev, distanceToProperty: distance }));

    // Check if within arrival radius (30m)
    if (distance <= 30 && !state.hasArrived) {
      try {
        const mockLocation = {
          coords: {
            latitude: locationUpdate.coordinates.latitude,
            longitude: locationUpdate.coordinates.longitude,
            accuracy: locationUpdate.accuracy,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null
          },
          timestamp: locationUpdate.timestamp.getTime()
        };

        const arrivalDetection = await jobLocationTrackingService.checkArrivalDetection(
          job.id,
          currentProfile!.id,
          mockLocation
        );

        if (arrivalDetection?.hasArrived) {
          setState(prev => ({
            ...prev,
            hasArrived: true,
            arrivalStatus: arrivalDetection,
            foaArrivalMessage: arrivalDetection.foaMessage || null
          }));

          // Show arrival alert with FOA message
          const message = arrivalDetection.foaMessage || 
            "You've arrived! Ready to begin?";
          
          Alert.alert(
            '🎯 Arrival Detected',
            message,
            [
              { text: 'Not Yet', style: 'cancel' },
              { 
                text: 'Start Job', 
                onPress: () => {
                  // Could trigger job start workflow here
                  console.log('User confirmed arrival and ready to start');
                }
              }
            ]
          );
        }

      } catch (error) {
        console.error('Arrival detection failed:', error);
      }
    }
  }, [state.hasArrived, currentProfile]);

  /**
   * 🧪 Test mode functions
   */
  const simulateLocation = useCallback(async (coordinates: { latitude: number; longitude: number }): Promise<void> => {
    if (!config.testMode || !currentProfile?.id || !currentJobRef.current) {
      setState(prev => ({ ...prev, error: 'Test mode not enabled or no active job' }));
      return;
    }

    try {
      await jobLocationTrackingService.simulateLocation(
        currentJobRef.current.id,
        currentProfile.id,
        coordinates
      );

      setState(prev => ({
        ...prev,
        currentLocation: {
          coords: {
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            accuracy: 5,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null
          },
          timestamp: Date.now()
        }
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to simulate location';
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  }, [config.testMode, currentProfile]);

  const testCheckIn = useCallback(async (job: JobData): Promise<boolean> => {
    if (!config.testMode) {
      Alert.alert('Test Mode', 'Test mode is not enabled');
      return false;
    }

    // Simulate check-in at property location
    if (job.location?.coordinates) {
      await simulateLocation(job.location.coordinates);
    }

    return checkInToJob(job);
  }, [config.testMode, simulateLocation, checkInToJob]);

  /**
   * Utility functions
   */
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const reset = useCallback(() => {
    setState({
      isCheckingIn: false,
      hasCheckedIn: false,
      checkInData: null,
      isTracking: false,
      trackingSession: null,
      currentLocation: null,
      arrivalStatus: null,
      hasArrived: false,
      distanceToProperty: null,
      foaCheckInMessage: null,
      foaArrivalMessage: null,
      error: null,
      permissionStatus: 'undetermined',
    });
    currentJobRef.current = null;
    if (arrivalListenerRef.current) {
      arrivalListenerRef.current();
      arrivalListenerRef.current = null;
    }
  }, []);

  return {
    // State
    ...state,
    
    // Actions
    checkInToJob,
    startTracking,
    stopTracking,
    simulateLocation,
    testCheckIn,
    checkPermissions,
    clearError,
    reset,
  };
}
