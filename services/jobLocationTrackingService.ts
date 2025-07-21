/**
 * Job Location Tracking Service
 * GPS check-in and real-time tracking for staff jobs with FOA integration
 */

import * as Location from 'expo-location';
import { doc, collection, setDoc, updateDoc, onSnapshot, serverTimestamp, deleteDoc, query, where, orderBy, limit, getDocs, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { JobData } from '@/types/jobData';

export interface GPSCheckIn {
  id: string;
  jobId: string;
  staffId: string;
  timestamp: Date;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  accuracy: number;
  address?: string;
  isManual: boolean;
  foaContext?: string;
}

export interface RealTimeLocationUpdate {
  id: string;
  jobId: string;
  staffId: string;
  timestamp: Date;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  accuracy: number;
  speed?: number;
  heading?: number;
  isActive: boolean;
}

export interface LocationTrackingSession {
  id: string;
  jobId: string;
  staffId: string;
  startTime: Date;
  endTime?: Date;
  totalUpdates: number;
  isActive: boolean;
  lastUpdate?: Date;
}

export interface ArrivalDetection {
  hasArrived: boolean;
  distance: number;
  timestamp: Date;
  isWithinRadius: boolean;
  foaMessage?: string;
}

export interface LocationTrackingConfig {
  updateInterval: number; // seconds
  distanceFilter: number; // meters
  arrivalRadius: number; // meters
  enableAutoStart: boolean;
  enableFOAIntegration: boolean;
  testMode: boolean;
}

export class JobLocationTrackingService {
  private watchSubscription: Location.LocationSubscription | null = null;
  private trackingSession: LocationTrackingSession | null = null;
  public config: LocationTrackingConfig;
  private lastKnownLocation: Location.LocationObject | null = null;
  private arrivalDetected = false;

  constructor(config?: Partial<LocationTrackingConfig>) {
    this.config = {
      updateInterval: 60, // 60 seconds
      distanceFilter: 10, // 10 meters
      arrivalRadius: 30, // 30 meters
      enableAutoStart: true,
      enableFOAIntegration: true,
      testMode: false,
      ...config
    };
  }

  /**
   * 📍 Check-In Feature Implementation
   */
  async checkInToJob(jobId: string, staffId: string, job?: JobData): Promise<GPSCheckIn | null> {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission not granted');
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000
      });

      const checkInId = `${jobId}_${staffId}_${Date.now()}`;
      
      // Get reverse geocoding for address
      let address: string | undefined;
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
        address = reverseGeocode[0] ? 
          `${reverseGeocode[0].street || ''} ${reverseGeocode[0].city || ''}, ${reverseGeocode[0].region || ''}`.trim() :
          undefined;
      } catch (error) {
        console.warn('Reverse geocoding failed:', error);
      }

      // Generate FOA context if enabled
      let foaContext: string | undefined;
      if (this.config.enableFOAIntegration && job) {
        try {
          foaContext = await this.generateCheckInFOAContext(job, location);
        } catch (error) {
          console.warn('FOA context generation failed:', error);
        }
      }

      const checkIn: GPSCheckIn = {
        id: checkInId,
        jobId,
        staffId,
        timestamp: new Date(),
        coordinates: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        },
        accuracy: location.coords.accuracy || 0,
        address,
        isManual: true,
        foaContext
      };

      // Save to Firestore
      const checkInRef = doc(collection(db, 'job_checkins'), checkInId);
      await setDoc(checkInRef, {
        ...checkIn,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp()
      });

      // Auto-start tracking if enabled
      if (this.config.enableAutoStart) {
        await this.startRealTimeTracking(jobId, staffId);
      }

      this.lastKnownLocation = location;
      return checkIn;

    } catch (error) {
      console.error('Check-in failed:', error);
      throw error;
    }
  }

  /**
   * 🛰️ Real-Time Location Streaming Implementation
   */
  async startRealTimeTracking(jobId: string, staffId: string): Promise<void> {
    try {
      // Request background location permissions for better tracking
      const { status } = await Location.requestBackgroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Background location permission not granted, using foreground only');
      }

      // Stop any existing tracking
      await this.stopRealTimeTracking();

      // Create tracking session
      const sessionId = `${jobId}_${staffId}_session_${Date.now()}`;
      this.trackingSession = {
        id: sessionId,
        jobId,
        staffId,
        startTime: new Date(),
        totalUpdates: 0,
        isActive: true
      };

      // Save session to Firestore
      const sessionRef = doc(collection(db, 'job_tracking_sessions'), sessionId);
      await setDoc(sessionRef, {
        ...this.trackingSession,
        startTime: serverTimestamp()
      });

      // Start location watching
      this.watchSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: this.config.testMode ? 5000 : this.config.updateInterval * 1000,
          distanceInterval: this.config.distanceFilter,
        },
        (location) => this.handleLocationUpdate(location, jobId, staffId)
      );

      console.log('✅ Real-time tracking started for job:', jobId);

    } catch (error) {
      console.error('Failed to start real-time tracking:', error);
      throw error;
    }
  }

  async stopRealTimeTracking(): Promise<void> {
    try {
      // Stop location watching
      if (this.watchSubscription) {
        this.watchSubscription.remove();
        this.watchSubscription = null;
      }

      // Update session end time
      if (this.trackingSession) {
        const sessionRef = doc(db, 'job_tracking_sessions', this.trackingSession.id);
        await updateDoc(sessionRef, {
          endTime: serverTimestamp(),
          isActive: false
        });

        this.trackingSession = null;
      }

      console.log('✅ Real-time tracking stopped');

    } catch (error) {
      console.error('Failed to stop real-time tracking:', error);
    }
  }

  private async handleLocationUpdate(
    location: Location.LocationObject, 
    jobId: string, 
    staffId: string
  ): Promise<void> {
    try {
      const updateId = `${jobId}_${staffId}_${Date.now()}`;
      
      const locationUpdate: RealTimeLocationUpdate = {
        id: updateId,
        jobId,
        staffId,
        timestamp: new Date(),
        coordinates: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        },
        accuracy: location.coords.accuracy || 0,
        speed: location.coords.speed || undefined,
        heading: location.coords.heading || undefined,
        isActive: true
      };

      // Save to Firestore - throttled updates
      const locationRef = doc(collection(db, `job_tracking/${jobId}/staff`), staffId);
      await setDoc(locationRef, {
        ...locationUpdate,
        timestamp: serverTimestamp(),
        lastUpdated: serverTimestamp()
      });

      // Update tracking session
      if (this.trackingSession) {
        this.trackingSession.totalUpdates++;
        this.trackingSession.lastUpdate = new Date();
        
        const sessionRef = doc(db, 'job_tracking_sessions', this.trackingSession.id);
        await updateDoc(sessionRef, {
          totalUpdates: this.trackingSession.totalUpdates,
          lastUpdate: serverTimestamp()
        });
      }

      this.lastKnownLocation = location;

      // Check for arrival detection
      await this.checkArrivalDetection(jobId, staffId, location);

    } catch (error) {
      console.error('Location update failed:', error);
    }
  }

  /**
   * 🚦 Arrival Detection Implementation
   */
  async checkArrivalDetection(
    jobId: string, 
    staffId: string, 
    currentLocation: Location.LocationObject
  ): Promise<ArrivalDetection | null> {
    try {
      // Get job details for property coordinates
      const jobRef = doc(db, 'jobs', jobId);
      const jobSnap = await getDoc(jobRef);
      
      if (!jobSnap.exists()) {
        return null;
      }

      const jobData = jobSnap.data() as JobData;
      if (!jobData.location?.coordinates) {
        return null;
      }

      // Calculate distance to property
      const distance = this.calculateDistance(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude,
        jobData.location.coordinates.latitude,
        jobData.location.coordinates.longitude
      );

      const isWithinRadius = distance <= this.config.arrivalRadius;
      const hasArrived = isWithinRadius && !this.arrivalDetected;

      const arrival: ArrivalDetection = {
        hasArrived,
        distance,
        timestamp: new Date(),
        isWithinRadius
      };

      // Generate FOA arrival message if arrived
      if (hasArrived && this.config.enableFOAIntegration) {
        try {
          arrival.foaMessage = await this.generateArrivalFOAMessage(jobData, distance);
        } catch (error) {
          console.warn('FOA arrival message generation failed:', error);
        }
      }

      // Mark arrival detected to prevent multiple triggers
      if (hasArrived) {
        this.arrivalDetected = true;
        
        // Save arrival detection to Firestore
        const arrivalRef = doc(collection(db, 'job_arrivals'), `${jobId}_${staffId}`);
        await setDoc(arrivalRef, {
          ...arrival,
          timestamp: serverTimestamp()
        });
      }

      return arrival;

    } catch (error) {
      console.error('Arrival detection failed:', error);
      return null;
    }
  }

  /**
   * 🔔 Missed Check-In Escalation Implementation
   */
  async setupMissedCheckInMonitoring(jobId: string, scheduledStartTime: Date): Promise<void> {
    try {
      // Calculate escalation times
      const checkInDeadline = new Date(scheduledStartTime.getTime() + 10 * 60 * 1000); // 10 minutes after start
      const escalationTime = new Date(checkInDeadline.getTime() + 10 * 60 * 1000); // 10 minutes after deadline

      // Set up monitoring document
      const monitoringRef = doc(collection(db, 'job_check_in_monitoring'), jobId);
      await setDoc(monitoringRef, {
        jobId,
        scheduledStartTime: serverTimestamp(),
        checkInDeadline: checkInDeadline,
        escalationTime: escalationTime,
        hasCheckedIn: false,
        hasEscalated: false,
        isActive: true,
        createdAt: serverTimestamp()
      });

      console.log('✅ Missed check-in monitoring set up for job:', jobId);

    } catch (error) {
      console.error('Failed to setup missed check-in monitoring:', error);
    }
  }

  /**
   * Utility Methods
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
  }

  private async generateCheckInFOAContext(job: JobData, location: Location.LocationObject): Promise<string> {
    try {
      const prompt = `Staff just checked in for job "${job.title}" at ${job.propertyRef?.name || 'property'}. 
      Location: ${location.coords.latitude}, ${location.coords.longitude}
      Accuracy: ${location.coords.accuracy}m
      
      Generate a brief check-in confirmation with:
      1. Welcome message
      2. Key safety reminders for ${job.jobType}
      3. Estimated completion time
      4. Any property-specific notes
      
      Keep it under 100 words, professional and encouraging.`;

      // Create minimal context for FOA
      const context = {
        job: {
          id: job.id,
          title: job.title,
          type: job.jobType,
          description: job.description || '',
          priority: job.priority || 'normal',
          location: { address: job.propertyRef?.address || (typeof job.location === 'string' ? job.location : job.location?.address) || '' },
          estimatedDuration: job.estimatedDuration || 60,
          status: job.status
        } as any,
        staffRole: 'staff',
      };

      // Generate check-in message (AI service no longer available)
      const jobType = job.jobType || 'maintenance';
      return `Welcome! You've successfully checked in to ${job.title}. Stay safe and follow all safety protocols for ${jobType} work.`;

    } catch (error) {
      console.error('Failed to generate check-in FOA context:', error);
      return 'Welcome! You\'ve successfully checked in. Stay safe and follow all safety protocols.';
    }
  }

  private async generateArrivalFOAMessage(job: JobData, distance: number): Promise<string> {
    try {
      const prompt = `Staff has arrived at job location "${job.title}" (${Math.round(distance)}m from property). 
      
      Generate an arrival announcement with:
      1. Congratulations on arrival
      2. "Ready to begin?" prompt
      3. Key first steps for ${job.jobType}
      4. Safety reminder
      
      Keep it under 50 words, enthusiastic and action-oriented.`;

      // Create minimal context for FOA
      const context = {
        job: {
          id: job.id,
          title: job.title,
          type: job.jobType,
          description: job.description || '',
          priority: job.priority || 'normal',
          location: { address: job.propertyRef?.address || (typeof job.location === 'string' ? job.location : job.location?.address) || '' },
          estimatedDuration: job.estimatedDuration || 60,
          status: job.status
        } as any,
        staffRole: 'staff',
      };

      // Generate arrival message (AI service no longer available)
      const jobType = job.jobType || 'maintenance';
      return `You've arrived! Ready to begin ${job.title}? Remember to follow all safety protocols for ${jobType} work.`;

    } catch (error) {
      console.error('Failed to generate arrival FOA message:', error);
      return `You've arrived! Ready to begin? Remember to follow all safety protocols for ${job.jobType}.`;
    }
  }

  /**
   * Real-time listeners for map display
   */
  subscribeToJobLocationUpdates(
    jobId: string, 
    callback: (updates: RealTimeLocationUpdate[]) => void
  ): () => void {
    const q = query(
      collection(db, `job_tracking/${jobId}/staff`),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    return onSnapshot(q, (snapshot) => {
      const updates: RealTimeLocationUpdate[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        updates.push({
          ...data,
          timestamp: data.timestamp?.toDate() || new Date()
        } as RealTimeLocationUpdate);
      });
      callback(updates);
    });
  }

  /**
   * Get tracking session status
   */
  async getTrackingSessionStatus(jobId: string, staffId: string): Promise<LocationTrackingSession | null> {
    try {
      const q = query(
        collection(db, 'job_tracking_sessions'),
        where('jobId', '==', jobId),
        where('staffId', '==', staffId),
        where('isActive', '==', true),
        orderBy('startTime', 'desc'),
        limit(1)
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      const data = doc.data();
      return {
        ...data,
        startTime: data.startTime?.toDate() || new Date(),
        endTime: data.endTime?.toDate() || undefined,
        lastUpdate: data.lastUpdate?.toDate() || undefined
      } as LocationTrackingSession;

    } catch (error) {
      console.error('Failed to get tracking session status:', error);
      return null;
    }
  }

  /**
   * Test mode for development
   */
  async simulateLocation(
    jobId: string, 
    staffId: string, 
    coordinates: { latitude: number; longitude: number }
  ): Promise<void> {
    if (!this.config.testMode) {
      throw new Error('Test mode not enabled');
    }

    const mockLocation: Location.LocationObject = {
      coords: {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        altitude: null,
        accuracy: 5,
        altitudeAccuracy: null,
        heading: null,
        speed: null
      },
      timestamp: Date.now()
    };

    await this.handleLocationUpdate(mockLocation, jobId, staffId);
  }

  /**
   * Cleanup methods
   */
  async cleanup(): Promise<void> {
    await this.stopRealTimeTracking();
    this.arrivalDetected = false;
    this.lastKnownLocation = null;
  }
}

// Export singleton instance
export const jobLocationTrackingService = new JobLocationTrackingService();
