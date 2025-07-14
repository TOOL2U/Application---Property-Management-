import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Dimensions } from 'react-native';
import { Task } from '@/types';
import { Navigation, MapPin } from 'lucide-react-native';

interface MapPreviewProps {
  task: Task;
  height?: number;
}

export function MapPreview({ task, height = 150 }: MapPreviewProps) {
  const { width } = Dimensions.get('window');
  const mapWidth = width - 64; // Account for card padding

  const openInMaps = () => {
    const address = encodeURIComponent(task.propertyAddress);
    const url = `https://maps.google.com/?q=${address}`;
    Linking.openURL(url);
  };

  const openDirections = () => {
    if (task.coordinates) {
      const { latitude, longitude } = task.coordinates;
      const url = `https://maps.google.com/maps?daddr=${latitude},${longitude}`;
      Linking.openURL(url);
    } else {
      openInMaps();
    }
  };

  // Generate Google Maps Static API URL for preview
  const getStaticMapUrl = () => {
    if (!task.coordinates) {
      // Fallback to address-based map
      const address = encodeURIComponent(task.propertyAddress);
      return `https://maps.googleapis.com/maps/api/staticmap?center=${address}&zoom=15&size=${Math.floor(mapWidth)}x${height}&markers=color:red%7C${address}&key=demo`;
    }

    const { latitude, longitude } = task.coordinates;
    return `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=15&size=${Math.floor(mapWidth)}x${height}&markers=color:red%7C${latitude},${longitude}&key=demo`;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.mapContainer, { height }]} 
        onPress={openInMaps}
        activeOpacity={0.8}
      >
        {/* Placeholder map background */}
        <View style={[styles.mapPlaceholder, { height }]}>
          <MapPin size={32} color="#ef4444" />
          <Text style={styles.mapPlaceholderText}>Tap to view in Maps</Text>
        </View>
        
        {/* Map overlay with address */}
        <View style={styles.mapOverlay}>
          <View style={styles.addressContainer}>
            <MapPin size={14} color="#ffffff" />
            <Text style={styles.addressText} numberOfLines={2}>
              {task.propertyAddress}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Action buttons */}
      <View style={styles.mapActions}>
        <TouchableOpacity style={styles.actionButton} onPress={openInMaps}>
          <MapPin size={16} color="#3b82f6" />
          <Text style={styles.actionButtonText}>View</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={openDirections}>
          <Navigation size={16} color="#3b82f6" />
          <Text style={styles.actionButtonText}>Directions</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  mapContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f3f4f6',
  },
  mapPlaceholder: {
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  mapPlaceholderText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addressText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  mapActions: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#eff6ff',
    borderRadius: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3b82f6',
  },
});
