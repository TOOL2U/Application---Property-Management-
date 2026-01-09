/**
 * Interactive Map Screen - Snapchat-style Map
 * Shows properties with job status indicators
 * - Green Flashing: Accepted/Active jobs
 * - Yellow: Pending jobs
 * - Grey: Properties without jobs
 * 
 * Location Data:
 * Uses robust coordinate extraction to handle multiple Firebase property formats.
 * All Koh Phangan properties have verified coordinates (9.695-9.77°N, 99.985-100.075°E).
 * See: MOBILE_TEAM_LOCATION_GUIDE.md from webapp team for coordinate format details.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { usePINAuth } from '@/contexts/PINAuthContext';
import { useStaffJobs } from '@/hooks/useStaffJobs';
import { propertyService } from '@/services/propertyService';
import { BrandTheme } from '@/constants/BrandTheme';
import { useTranslation } from '@/hooks/useTranslation';
import type { Job } from '@/types/job';

interface PropertyMarker {
  id: string;
  latitude: number;
  longitude: number;
  propertyName: string;
  address: string;
  city: string;
  googleMapsLink?: string;
  jobs: Job[];
  status: 'active' | 'pending' | 'inactive';
}

export default function MapScreen() {
  const { currentProfile } = usePINAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  
  const {
    jobs,
    pendingJobs,
    activeJobs,
    loading,
    refreshJobs,
  } = useStaffJobs({
    enableRealtime: true,
    enableCache: true,
  });

  const [propertyMarkers, setPropertyMarkers] = useState<PropertyMarker[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<PropertyMarker | null>(null);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 9.7200, // Koh Phangan, Thailand center
    longitude: 100.0100,
    latitudeDelta: 0.2,
    longitudeDelta: 0.2,
  });

  // Animation for flashing markers
  const flashAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Create flashing animation for active job markers
    const flashAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(flashAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(flashAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    flashAnimation.start();

    return () => flashAnimation.stop();
  }, []);

  useEffect(() => {
    // Load all properties from Firebase
    loadAllProperties();
  }, []);

  // Refresh jobs when map tab is focused (to catch updates from webapp)
  useFocusEffect(
    React.useCallback(() => {
      console.log('🗺️ MapScreen: Tab focused, refreshing jobs for real-time updates...');
      refreshJobs();
    }, [refreshJobs])
  );

  useEffect(() => {
    // Update job status on property markers when jobs change
    // Only update if we have markers AND jobs have actually changed
    if (propertyMarkers.length > 0) {
      console.log('🔄 MapScreen: Jobs updated, refreshing markers...');
      console.log(`   📊 Pending jobs: ${pendingJobs.length}, Active jobs: ${activeJobs.length}, Total jobs: ${jobs.length}`);
      updateJobStatusOnMarkers();
    }
  }, [jobs, pendingJobs, activeJobs]); // Don't include propertyMarkers here!

  /**
   * Extract property coordinates from various possible formats
   * Based on Mobile Team Location Guide from webapp team
   */
  const getPropertyCoordinates = (property: any): { latitude: number; longitude: number } | null => {
    // Priority 1: location.coordinates (most common - standard format)
    if (property.location?.coordinates?.latitude && property.location?.coordinates?.longitude) {
      return {
        latitude: property.location.coordinates.latitude,
        longitude: property.location.coordinates.longitude
      };
    }
    
    // Priority 2: top-level coordinates (alternative format)
    if (property.coordinates?.latitude && property.coordinates?.longitude) {
      return {
        latitude: property.coordinates.latitude,
        longitude: property.coordinates.longitude
      };
    }
    
    // Priority 3: address.coordinates (less common)
    if (property.address?.coordinates?.latitude && property.address?.coordinates?.longitude) {
      return {
        latitude: property.address.coordinates.latitude,
        longitude: property.address.coordinates.longitude
      };
    }
    
    // Priority 4: separate lat/lng fields (rare legacy format)
    if (property.latitude && property.longitude) {
      return {
        latitude: property.latitude,
        longitude: property.longitude
      };
    }
    
    console.warn('⚠️ No coordinates found for property:', property.id, property.name);
    return null;
  };

  /**
   * Validate coordinates are within Koh Phangan bounds
   */
  const validateCoordinates = (coords: { latitude: number; longitude: number }): boolean => {
    // Check if coordinates are valid numbers
    if (typeof coords.latitude !== 'number' || typeof coords.longitude !== 'number') {
      console.error('❌ Invalid coordinate types:', coords);
      return false;
    }
    
    // Koh Phangan island boundaries (from webapp team guide)
    const isOnKohPhangan = 
      coords.latitude >= 9.695 && coords.latitude <= 9.77 &&
      coords.longitude >= 99.985 && coords.longitude <= 100.075;
    
    if (!isOnKohPhangan) {
      console.warn('⚠️ Coordinates outside Koh Phangan:', coords);
      // Still return true to show the marker, but log warning
    }
    
    return true;
  };

  /**
   * Load all properties from Firebase and display on map
   */
  const loadAllProperties = async () => {
    try {
      console.log('🗺️ MapScreen: Loading all properties from Firebase...');
      setLoadingProperties(true);

      const response = await propertyService.getAllProperties();

      if (!response.success || !response.properties) {
        console.error('❌ MapScreen: Failed to load properties:', response.error);
        Alert.alert('Error', 'Failed to load properties. Please try again.');
        setLoadingProperties(false);
        return;
      }

      const properties = response.properties;
      console.log(`✅ MapScreen: Loaded ${properties.length} properties from Firebase`);

      // Convert properties to markers using robust coordinate extraction
      const markers: PropertyMarker[] = properties
        .map(prop => {
          // Extract coordinates using priority-based function
          const coords = getPropertyCoordinates(prop);
          
          if (!coords) {
            console.warn(`⚠️ MapScreen: Skipping property ${prop.name} (${prop.id}) - no valid GPS coordinates`);
            return null;
          }
          
          // Validate coordinates
          if (!validateCoordinates(coords)) {
            console.warn(`⚠️ MapScreen: Skipping property ${prop.name} (${prop.id}) - invalid coordinates`);
            return null;
          }
          
          // Log successful coordinate extraction for debugging
          console.log(`📍 MapScreen: Property ${prop.name} - lat: ${coords.latitude}, lng: ${coords.longitude}`);
          
          return {
            id: prop.id,
            latitude: coords.latitude,
            longitude: coords.longitude,
            propertyName: prop.name,
            address: prop.location?.address || '',
            city: prop.location?.city || '',
            googleMapsLink: `https://www.google.com/maps/search/?api=1&query=${coords.latitude},${coords.longitude}`,
            jobs: [],
            status: 'inactive' as const,
          } as PropertyMarker;
        })
        .filter((marker) => marker !== null) as PropertyMarker[]; // Remove null entries

      console.log(`✅ MapScreen: Created ${markers.length} markers with valid GPS coordinates`);
      setPropertyMarkers(markers);

      // Center map on first property if available
      if (markers.length > 0 && mapRef.current) {
        const firstMarker = markers[0];
        console.log(`📍 MapScreen: Centering map on ${firstMarker.propertyName}`);
        mapRef.current.animateToRegion({
          latitude: firstMarker.latitude,
          longitude: firstMarker.longitude,
          latitudeDelta: 0.2,
          longitudeDelta: 0.2,
        }, 1000);
      }

      setLoadingProperties(false);

      // Update with job status (pass markers directly to avoid re-render loop)
      if (markers.length > 0) {
        updateJobStatusOnMarkers(markers);
      }

    } catch (error) {
      console.error('❌ MapScreen: Error loading properties:', error);
      Alert.alert('Error', 'Failed to load properties. Please try again.');
      setLoadingProperties(false);
    }
  };

  /**
   * Update property markers with job status overlay
   */
  const updateJobStatusOnMarkers = (markersToUpdate?: PropertyMarker[]) => {
    // Use the provided markers OR get current state
    setPropertyMarkers(prevMarkers => {
      const markers = markersToUpdate || prevMarkers;
      if (markers.length === 0) return prevMarkers;

      console.log(`🔄 MapScreen: Updating job status for ${markers.length} markers`);
      
      // Create a map of jobs by propertyId
      const jobsByProperty = new Map<string, Job[]>();
      
      [...pendingJobs, ...activeJobs].forEach(job => {
        const propertyId = job.propertyId;
        if (!propertyId) return;
        
        if (!jobsByProperty.has(propertyId)) {
          jobsByProperty.set(propertyId, []);
        }
        jobsByProperty.get(propertyId)!.push(job);
      });

      // Update markers with job information
      const updatedMarkers = markers.map(marker => {
        const propertyJobs = jobsByProperty.get(marker.id) || [];
        
        // Determine status based on jobs - matching dashboard logic
        let status: 'active' | 'pending' | 'inactive' = 'inactive';
        
        // Get status color helper (matching dashboard implementation)
        const getJobStatusPriority = (jobStatus: string): number => {
          // Higher number = higher priority
          switch (jobStatus) {
            case 'in_progress': return 4; // Highest - job being worked on
            case 'accepted': return 3;    // High - job confirmed
            case 'assigned': return 2;    // Medium - job assigned
            case 'pending': return 1;     // Low - job waiting
            case 'offered': return 1;     // Low - job offered but not assigned
            default: return 0;            // No priority
          }
        };
        
        // Find the highest priority status among all jobs for this property
        let highestPriority = 0;
        let highestPriorityStatus = '';
        
        propertyJobs.forEach(j => {
          const priority = getJobStatusPriority(j.status);
          if (priority > highestPriority) {
            highestPriority = priority;
            highestPriorityStatus = j.status;
          }
        });
        
        // Map to marker status based on highest priority job
        if (highestPriorityStatus === 'accepted' || highestPriorityStatus === 'in_progress') {
          status = 'active';
          console.log(`✅ MapScreen: Property ${marker.propertyName} marked as ACTIVE (green) - highest status: "${highestPriorityStatus}"`);
        } else if (highestPriorityStatus === 'assigned' || highestPriorityStatus === 'pending' || highestPriorityStatus === 'offered') {
          status = 'pending';
          console.log(`⏳ MapScreen: Property ${marker.propertyName} marked as PENDING (yellow) - highest status: "${highestPriorityStatus}"`);
        } else if (propertyJobs.length > 0) {
          console.log(`⚠️ MapScreen: Property ${marker.propertyName} has jobs but unknown status:`, 
            propertyJobs.map(j => j.status)
          );
        }
        
        // Log all job statuses for debugging
        if (propertyJobs.length > 0) {
          console.log(`🏠 MapScreen: Property ${marker.propertyName} has ${propertyJobs.length} job(s):`, 
            propertyJobs.map(j => ({ id: j.id, status: j.status, title: j.title }))
          );
        }

        // Only update if status or jobs changed
        if (marker.status === status && marker.jobs.length === propertyJobs.length) {
          return marker; // No change needed
        }

        return {
          ...marker,
          jobs: propertyJobs,
          status,
        };
      });

      // Only update state if something actually changed
      const hasChanges = updatedMarkers.some((marker, index) => {
        const prev = markers[index];
        return marker.status !== prev.status || marker.jobs.length !== prev.jobs.length;
      });

      if (!hasChanges) {
        return prevMarkers; // No changes, don't trigger re-render
      }

      const activeCount = updatedMarkers.filter(m => m.status === 'active').length;
      const pendingCount = updatedMarkers.filter(m => m.status === 'pending').length;
      const inactiveCount = updatedMarkers.filter(m => m.status === 'inactive').length;
      
      console.log(`✅ MapScreen: Status updated - 🟢 ${activeCount} active, 🟡 ${pendingCount} pending, ⚪ ${inactiveCount} inactive`);

      return updatedMarkers;
    });
  };

  const handleMarkerPress = (property: PropertyMarker) => {
    setSelectedProperty(property);
    
    // Center map on selected property
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: property.latitude,
        longitude: property.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 500);
    }
  };

  const handlePropertyCardPress = (property: PropertyMarker) => {
    if (property.jobs.length > 0) {
      // Navigate to job details
      router.push(`/jobs/${property.jobs[0].id}`);
    }
  };

  const handleNavigatePress = (property: PropertyMarker) => {
    if (property.googleMapsLink) {
      console.log(`🗺️ MapScreen: Opening navigation to ${property.propertyName}`);
      Linking.openURL(property.googleMapsLink).catch(err => {
        console.error('❌ MapScreen: Failed to open Google Maps:', err);
        Alert.alert('Error', 'Failed to open Google Maps. Please try again.');
      });
    } else {
      Alert.alert(
        'Navigation Not Available',
        'Google Maps link not available for this property.'
      );
    }
  };

  const centerOnUserLocation = () => {
    // TODO: Implement user location centering with expo-location
    Alert.alert(
      t('map.locationFeature'),
      t('map.locationFeatureDescription')
    );
  };

  const handleRefresh = () => {
    console.log('🔄 MapScreen: Refreshing map data...');
    loadAllProperties();
    refreshJobs();
  };

  const getMarkerColor = (status: PropertyMarker['status']) => {
    switch (status) {
      case 'active':
        return BrandTheme.colors.SUCCESS; // Green for active jobs
      case 'pending':
        return BrandTheme.colors.YELLOW; // Yellow for pending jobs
      default:
        return BrandTheme.colors.GREY_SECONDARY; // Grey for no jobs
    }
  };

  const renderCustomMarker = (property: PropertyMarker) => {
    const color = getMarkerColor(property.status);
    const isPending = property.status === 'pending'; // Flash only for pending jobs
    const iconColor = property.status === 'active' ? BrandTheme.colors.BLACK : BrandTheme.colors.TEXT_PRIMARY;
    
    // Debug log for icon color
    if (property.jobs.length > 0) {
      console.log(`🎨 MapScreen: Rendering marker for ${property.propertyName} - Status: ${property.status}, Pin color: ${color}, Icon color: ${iconColor}`);
    }

    return (
      <Marker
        key={`${property.id}-${property.status}-${property.jobs.length}`}
        coordinate={{
          latitude: property.latitude,
          longitude: property.longitude,
        }}
        onPress={() => handleMarkerPress(property)}
      >
        <Animated.View
          style={[
            styles.markerContainer,
            {
              opacity: isPending ? flashAnim : 1, // Only flash pending markers
            },
          ]}
        >
          <View style={[styles.markerPin, { backgroundColor: color }]}>
            <Ionicons
              name="home"
              size={24}
              color={iconColor}
            />
          </View>
          {property.jobs.length > 1 && (
            <View style={[styles.jobCountBadge, { backgroundColor: color }]}>
              <Text style={styles.jobCountText}>{property.jobs.length}</Text>
            </View>
          )}
        </Animated.View>
      </Marker>
    );
  };

  if (loading || loadingProperties) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BrandTheme.colors.YELLOW} />
          <Text style={styles.loadingText}>
            {loadingProperties ? t('map.loadingProperties') : t('map.loadingMap')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('map.title')}</Text>
          <Text style={styles.headerSubtitle}>
            {propertyMarkers.length} {t('map.properties')}
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
        >
          <Ionicons name="refresh" size={20} color={BrandTheme.colors.YELLOW} />
        </TouchableOpacity>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: BrandTheme.colors.SUCCESS }]} />
          <Text style={styles.legendText}>{t('map.activeJobs')}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: BrandTheme.colors.YELLOW }]} />
          <Text style={styles.legendText}>{t('map.pendingJobs')}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: BrandTheme.colors.GREY_SECONDARY }]} />
          <Text style={styles.legendText}>{t('map.noJobs')}</Text>
        </View>
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={mapRegion}
        showsUserLocation
        showsMyLocationButton={false}
        customMapStyle={darkMapStyle}
      >
        {propertyMarkers.map((property) => renderCustomMarker(property))}
      </MapView>

      {/* Location Button */}
      <TouchableOpacity
        style={styles.locationButton}
        onPress={centerOnUserLocation}
      >
        <Ionicons name="locate" size={24} color={BrandTheme.colors.YELLOW} />
      </TouchableOpacity>

      {/* Selected Property Card */}
      {selectedProperty && (
        <View style={styles.propertyCard}>
          <TouchableOpacity
            style={styles.propertyCardContent}
            activeOpacity={0.9}
          >
            <View style={styles.propertyCardHeader}>
              <View style={styles.propertyCardInfo}>
                <Text style={styles.propertyCardTitle}>
                  {selectedProperty.propertyName}
                </Text>
                <Text style={styles.propertyCardAddress}>
                  {selectedProperty.address}
                </Text>
                {selectedProperty.city && (
                  <Text style={styles.propertyCardCity}>
                    📍 {selectedProperty.city}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => setSelectedProperty(null)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={20} color={BrandTheme.colors.TEXT_SECONDARY} />
              </TouchableOpacity>
            </View>

            <View style={styles.propertyCardJobs}>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getMarkerColor(selectedProperty.status) + '20' }
              ]}>
                <Text style={[
                  styles.statusBadgeText,
                  { color: getMarkerColor(selectedProperty.status) }
                ]}>
                  {selectedProperty.jobs.length > 0 
                    ? `${selectedProperty.jobs.length} ${t('map.jobs')}`
                    : t('map.noJobs')}
                </Text>
              </View>

              {selectedProperty.jobs.slice(0, 2).map((job, index) => (
                <View key={index} style={styles.jobPreview}>
                  <Ionicons
                    name="briefcase"
                    size={14}
                    color={BrandTheme.colors.TEXT_SECONDARY}
                  />
                  <Text style={styles.jobPreviewText} numberOfLines={1}>
                    {job.title || t('map.untitledJob')}
                  </Text>
                </View>
              ))}

              {selectedProperty.jobs.length > 2 && (
                <Text style={styles.moreJobsText}>
                  +{selectedProperty.jobs.length - 2} {t('map.moreJobs')}
                </Text>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              {selectedProperty.googleMapsLink && (
                <TouchableOpacity
                  style={styles.navigateButton}
                  onPress={() => handleNavigatePress(selectedProperty)}
                >
                  <Ionicons name="navigate" size={18} color={BrandTheme.colors.BLACK} />
                  <Text style={styles.navigateButtonText}>Navigate</Text>
                </TouchableOpacity>
              )}
              
              {selectedProperty.jobs.length > 0 && (
                <TouchableOpacity
                  style={styles.viewDetailsButtonAlt}
                  onPress={() => handlePropertyCardPress(selectedProperty)}
                >
                  <Text style={styles.viewDetailsTextAlt}>{t('map.viewDetails')}</Text>
                  <Ionicons name="chevron-forward" size={16} color={BrandTheme.colors.YELLOW} />
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Empty State */}
      {propertyMarkers.length === 0 && (
        <View style={styles.emptyState}>
          <View style={styles.emptyStateCard}>
            <Ionicons name="map-outline" size={64} color={BrandTheme.colors.GREY_SECONDARY} />
            <Text style={styles.emptyStateTitle}>{t('map.noProperties')}</Text>
            <Text style={styles.emptyStateText}>
              {t('map.noPropertiesDescription')}
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// Dark theme map style (Google Maps style JSON)
const darkMapStyle = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#212121' }],
  },
  {
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#757575' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#212121' }],
  },
  {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [{ color: '#757575' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#757575' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.fill',
    stylers: [{ color: '#2c2c2c' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8a8a8a' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#000000' }],
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandTheme.colors.GREY_PRIMARY,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: BrandTheme.colors.TEXT_SECONDARY,
    fontSize: 16,
    marginTop: 16,
    fontFamily: BrandTheme.typography.fontFamily.regular,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: BrandTheme.colors.BLACK,
    borderBottomWidth: 1,
    borderBottomColor: BrandTheme.colors.BORDER_SUBTLE,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: BrandTheme.colors.TEXT_PRIMARY,
    fontFamily: BrandTheme.typography.fontFamily.primary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: BrandTheme.colors.TEXT_SECONDARY,
    marginTop: 4,
    fontFamily: BrandTheme.typography.fontFamily.regular,
  },
  refreshButton: {
    padding: 8,
    backgroundColor: BrandTheme.colors.SURFACE_1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BrandTheme.colors.BORDER,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 12,
    backgroundColor: BrandTheme.colors.BLACK,
    borderBottomWidth: 1,
    borderBottomColor: BrandTheme.colors.BORDER_SUBTLE,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: BrandTheme.colors.TEXT_SECONDARY,
    fontFamily: BrandTheme.typography.fontFamily.regular,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerPin: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: BrandTheme.colors.BLACK,
    ...BrandTheme.shadows.MEDIUM_GLOW,
  },
  jobCountBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: BrandTheme.colors.BLACK,
  },
  jobCountText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: BrandTheme.colors.BLACK,
    fontFamily: BrandTheme.typography.fontFamily.primary,
  },
  locationButton: {
    position: 'absolute',
    bottom: 140,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BrandTheme.colors.BLACK,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BrandTheme.colors.YELLOW,
    ...BrandTheme.shadows.YELLOW_GLOW,
  },
  propertyCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: BrandTheme.colors.SURFACE_1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BrandTheme.colors.BORDER,
    ...BrandTheme.shadows.LARGE_GLOW,
  },
  propertyCardContent: {
    padding: 16,
  },
  propertyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  propertyCardInfo: {
    flex: 1,
  },
  propertyCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: BrandTheme.colors.TEXT_PRIMARY,
    fontFamily: BrandTheme.typography.fontFamily.primary,
    marginBottom: 4,
  },
  propertyCardAddress: {
    fontSize: 14,
    color: BrandTheme.colors.TEXT_SECONDARY,
    fontFamily: BrandTheme.typography.fontFamily.regular,
  },
  propertyCardCity: {
    fontSize: 12,
    color: BrandTheme.colors.TEXT_SECONDARY,
    fontFamily: BrandTheme.typography.fontFamily.regular,
    marginTop: 4,
  },
  closeButton: {
    padding: 4,
  },
  propertyCardJobs: {
    gap: 8,
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: BrandTheme.typography.fontFamily.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  jobPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  jobPreviewText: {
    fontSize: 14,
    color: BrandTheme.colors.TEXT_SECONDARY,
    fontFamily: BrandTheme.typography.fontFamily.regular,
    flex: 1,
  },
  moreJobsText: {
    fontSize: 12,
    color: BrandTheme.colors.YELLOW,
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontWeight: '600',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: BrandTheme.colors.BORDER_SUBTLE,
    marginTop: 4,
  },
  viewDetailsText: {
    fontSize: 14,
    color: BrandTheme.colors.YELLOW,
    fontWeight: '600',
    fontFamily: BrandTheme.typography.fontFamily.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  navigateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: BrandTheme.colors.YELLOW,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: BrandTheme.colors.BLACK,
    ...BrandTheme.shadows.YELLOW_GLOW,
  },
  navigateButtonText: {
    fontSize: 14,
    color: BrandTheme.colors.BLACK,
    fontWeight: 'bold',
    fontFamily: BrandTheme.typography.fontFamily.primary,
  },
  viewDetailsButtonAlt: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: BrandTheme.colors.SURFACE_1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BrandTheme.colors.YELLOW,
  },
  viewDetailsTextAlt: {
    fontSize: 14,
    color: BrandTheme.colors.YELLOW,
    fontWeight: '600',
    fontFamily: BrandTheme.typography.fontFamily.primary,
  },
  emptyState: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateCard: {
    backgroundColor: BrandTheme.colors.SURFACE_1,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BrandTheme.colors.BORDER,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: BrandTheme.colors.TEXT_PRIMARY,
    marginTop: 16,
    marginBottom: 8,
    fontFamily: BrandTheme.typography.fontFamily.primary,
  },
  emptyStateText: {
    fontSize: 14,
    color: BrandTheme.colors.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: BrandTheme.typography.fontFamily.regular,
  },
});
