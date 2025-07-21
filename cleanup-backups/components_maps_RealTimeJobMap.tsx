/**
 * Real-Time Job Location Map
 * Live tracking display for staff location and property
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import MapView, { Marker, Circle, Polyline } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Navigation, User, Target, Clock, RefreshCw } from 'lucide-react-native';
import { jobLocationTrackingService, RealTimeLocationUpdate } from '@/services/jobLocationTrackingService';
import { JobData } from '@/types/jobData';

interface RealTimeJobMapProps {
  job: JobData;
  staffId: string;
  autoCenter?: boolean;
  showTrackingHistory?: boolean;
  style?: any;
}

interface LocationHistory {
  coordinates: { latitude: number; longitude: number };
  timestamp: Date;
}

export default function RealTimeJobMap({
  job,
  staffId,
  autoCenter = true,
  showTrackingHistory = true,
  style
}: RealTimeJobMapProps) {
  const [currentLocation, setCurrentLocation] = useState<RealTimeLocationUpdate | null>(null);
  const [locationHistory, setLocationHistory] = useState<LocationHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [trackingActive, setTrackingActive] = useState(false);

  const mapRef = useRef<MapView>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Property location
  const propertyLocation = job.location?.coordinates;

  useEffect(() => {
    if (!propertyLocation) {
      setIsLoading(false);
      return;
    }

    // Subscribe to real-time location updates
    const unsubscribe = jobLocationTrackingService.subscribeToJobLocationUpdates(
      job.id,
      (updates: RealTimeLocationUpdate[]) => {
        setIsLoading(false);
        
        if (updates.length > 0) {
          const latestUpdate = updates.find(update => update.staffId === staffId);
          
          if (latestUpdate) {
            setCurrentLocation(latestUpdate);
            setLastUpdate(latestUpdate.timestamp);
            setTrackingActive(latestUpdate.isActive);

            // Add to history for trail visualization
            if (showTrackingHistory) {
              setLocationHistory(prev => {
                const newHistory = [
                  {
                    coordinates: latestUpdate.coordinates,
                    timestamp: latestUpdate.timestamp
                  },
                  ...prev.slice(0, 49) // Keep last 50 points
                ];
                return newHistory;
              });
            }

            // Auto-center map if enabled
            if (autoCenter && mapRef.current) {
              animateToLocation(latestUpdate.coordinates);
            }
          }
        }
      }
    );

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [job.id, staffId, autoCenter, showTrackingHistory, propertyLocation]);

  const animateToLocation = (coordinates: { latitude: number; longitude: number }) => {
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        latitudeDelta: 0.001,
        longitudeDelta: 0.001,
      }, 1000);
    }
  };

  const calculateDistance = (
    lat1: number, lon1: number, 
    lat2: number, lon2: number
  ): number => {
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

  const getDistance = (): number | null => {
    if (!currentLocation || !propertyLocation) return null;
    
    return calculateDistance(
      currentLocation.coordinates.latitude,
      currentLocation.coordinates.longitude,
      propertyLocation.latitude,
      propertyLocation.longitude
    );
  };

  const centerOnBoth = () => {
    if (!mapRef.current || !currentLocation || !propertyLocation) return;

    const minLat = Math.min(currentLocation.coordinates.latitude, propertyLocation.latitude);
    const maxLat = Math.max(currentLocation.coordinates.latitude, propertyLocation.latitude);
    const minLon = Math.min(currentLocation.coordinates.longitude, propertyLocation.longitude);
    const maxLon = Math.max(currentLocation.coordinates.longitude, propertyLocation.longitude);

    const latDelta = Math.max(0.001, (maxLat - minLat) * 1.5);
    const lonDelta = Math.max(0.001, (maxLon - minLon) * 1.5);

    mapRef.current.animateToRegion({
      latitude: (minLat + maxLat) / 2,
      longitude: (minLon + maxLon) / 2,
      latitudeDelta: latDelta,
      longitudeDelta: lonDelta,
    }, 1000);
  };

  const getInitialRegion = () => {
    if (currentLocation && propertyLocation) {
      // Show both locations
      const minLat = Math.min(currentLocation.coordinates.latitude, propertyLocation.latitude);
      const maxLat = Math.max(currentLocation.coordinates.latitude, propertyLocation.latitude);
      const minLon = Math.min(currentLocation.coordinates.longitude, propertyLocation.longitude);
      const maxLon = Math.max(currentLocation.coordinates.longitude, propertyLocation.longitude);

      return {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLon + maxLon) / 2,
        latitudeDelta: Math.max(0.001, (maxLat - minLat) * 1.5),
        longitudeDelta: Math.max(0.001, (maxLon - minLon) * 1.5),
      };
    } else if (propertyLocation) {
      // Center on property
      return {
        latitude: propertyLocation.latitude,
        longitude: propertyLocation.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
    } else {
      // Default region
      return {
        latitude: 9.7601,
        longitude: 100.0356,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }
  };

  const distance = getDistance();
  const isWithinArrivalRadius = distance !== null && distance <= 30;

  if (!propertyLocation) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.errorContainer}>
          <MapPin size={48} color="#6b7280" />
          <Text style={styles.errorTitle}>Location Not Available</Text>
          <Text style={styles.errorText}>Property coordinates not found for this job</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>Live Location Tracking</Text>
          <Text style={styles.subtitle}>
            {trackingActive ? '🟢 Active' : '🔴 Inactive'} • 
            {lastUpdate ? ` Updated ${lastUpdate.toLocaleTimeString()}` : ' No updates'}
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={centerOnBoth}>
          <RefreshCw size={20} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {/* Status Info */}
      <View style={styles.statusBar}>
        {distance !== null && (
          <View style={styles.statusItem}>
            <Target size={16} color={isWithinArrivalRadius ? '#10b981' : '#6b7280'} />
            <Text style={[styles.statusText, { 
              color: isWithinArrivalRadius ? '#10b981' : '#6b7280' 
            }]}>
              {Math.round(distance)}m to property
            </Text>
          </View>
        )}
        
        {currentLocation && (
          <View style={styles.statusItem}>
            <Clock size={16} color="#6b7280" />
            <Text style={styles.statusText}>
              Speed: {currentLocation.speed ? `${Math.round(currentLocation.speed * 3.6)}km/h` : 'Stationary'}
            </Text>
          </View>
        )}
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={getInitialRegion()}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
      >
        {/* Property Marker */}
        <Marker
          coordinate={propertyLocation}
          title={job.propertyRef?.name || 'Job Location'}
          description={job.title}
          pinColor="#6366f1"
        >
          <View style={styles.propertyMarker}>
            <MapPin size={24} color="#ffffff" />
          </View>
        </Marker>

        {/* Arrival Radius Circle */}
        <Circle
          center={propertyLocation}
          radius={30}
          strokeColor="rgba(99, 102, 241, 0.5)"
          fillColor="rgba(99, 102, 241, 0.1)"
          strokeWidth={2}
        />

        {/* Staff Location Marker */}
        {currentLocation && (
          <Marker
            coordinate={currentLocation.coordinates}
            title="Staff Location"
            description={`Last updated: ${currentLocation.timestamp.toLocaleTimeString()}`}
          >
            <View style={[styles.staffMarker, { 
              backgroundColor: trackingActive ? '#10b981' : '#6b7280' 
            }]}>
              <User size={20} color="#ffffff" />
            </View>
          </Marker>
        )}

        {/* Movement History Trail */}
        {showTrackingHistory && locationHistory.length > 1 && (
          <Polyline
            coordinates={locationHistory.map(h => h.coordinates)}
            strokeColor="#6366f1"
            strokeWidth={3}
          />
        )}
      </MapView>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <Text style={styles.loadingText}>Loading location data...</Text>
          </View>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => {
            if (currentLocation) {
              animateToLocation(currentLocation.coordinates);
            }
          }}
          disabled={!currentLocation}
        >
          <User size={18} color={currentLocation ? "#6366f1" : "#9ca3af"} />
          <Text style={[styles.controlText, { 
            color: currentLocation ? "#6366f1" : "#9ca3af" 
          }]}>
            Staff
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => animateToLocation(propertyLocation)}
        >
          <MapPin size={18} color="#6366f1" />
          <Text style={styles.controlText}>Property</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => {
            Alert.alert(
              'Navigation',
              'Open navigation to property?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Navigate', 
                  onPress: () => {
                    const url = `https://maps.google.com/maps?daddr=${propertyLocation.latitude},${propertyLocation.longitude}`;
                    // Could open navigation here
                    console.log('Navigate to:', url);
                  }
                }
              ]
            );
          }}
        >
          <Navigation size={18} color="#6366f1" />
          <Text style={styles.controlText}>Navigate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  map: {
    flex: 1,
  },
  propertyMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  staffMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContent: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  controls: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  controlText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6366f1',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
});
