import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Zap
} from 'lucide-react-native';
import { useSync } from '../../hooks/useSync';
import { NeumorphicTheme } from '../../constants/NeumorphicTheme';

interface SyncStatusIndicatorProps {
  showDetails?: boolean;
  onPress?: () => void;
}

export function SyncStatusIndicator({ showDetails = false, onPress }: SyncStatusIndicatorProps) {
  const { 
    isOnline, 
    isSyncing, 
    lastSyncTime, 
    pendingOperations, 
    conflictCount,
    forceSyncNow 
  } = useSync();

  const getStatusColor = () => {
    if (!isOnline) return NeumorphicTheme.colors.semantic.error;
    if (isSyncing) return NeumorphicTheme.colors.semantic.warning;
    if (conflictCount > 0) return NeumorphicTheme.colors.semantic.warning;
    if (pendingOperations > 0) return NeumorphicTheme.colors.semantic.info;
    return NeumorphicTheme.colors.semantic.success;
  };

  const getStatusIcon = () => {
    const color = getStatusColor();
    const size = 16;

    if (!isOnline) return <WifiOff size={size} color={color} />;
    if (isSyncing) return <RefreshCw size={size} color={color} />;
    if (conflictCount > 0) return <AlertTriangle size={size} color={color} />;
    if (pendingOperations > 0) return <Clock size={size} color={color} />;
    return <CheckCircle size={size} color={color} />;
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (isSyncing) return 'Syncing...';
    if (conflictCount > 0) return `${conflictCount} Conflicts`;
    if (pendingOperations > 0) return `${pendingOperations} Pending`;
    return 'Synced';
  };

  const getLastSyncText = () => {
    if (!lastSyncTime) return 'Never synced';
    
    const now = new Date();
    const diffMs = now.getTime() - lastSyncTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (!isSyncing) {
      forceSyncNow();
    }
  };

  if (!showDetails) {
    // Compact indicator
    return (
      <TouchableOpacity 
        style={[styles.compactContainer, { borderColor: getStatusColor() }]}
        onPress={handlePress}
        disabled={isSyncing}
      >
        <View style={styles.compactContent}>
          {getStatusIcon()}
          <Text style={[styles.compactText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Detailed indicator
  return (
    <TouchableOpacity 
      style={[styles.detailedContainer, NeumorphicTheme.shadows.neumorphic.small]}
      onPress={handlePress}
      disabled={isSyncing}
    >
      <View style={styles.detailedHeader}>
        <View style={styles.statusRow}>
          {getStatusIcon()}
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>
        
        {!isSyncing && (
          <TouchableOpacity 
            style={styles.syncButton}
            onPress={forceSyncNow}
          >
            <Zap size={14} color={NeumorphicTheme.colors.brand.primary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.detailedInfo}>
        <View style={styles.infoRow}>
          <Wifi size={12} color={NeumorphicTheme.colors.text.tertiary} />
          <Text style={styles.infoText}>
            {isOnline ? 'Connected' : 'Disconnected'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Clock size={12} color={NeumorphicTheme.colors.text.tertiary} />
          <Text style={styles.infoText}>
            {getLastSyncText()}
          </Text>
        </View>

        {pendingOperations > 0 && (
          <View style={styles.infoRow}>
            <RefreshCw size={12} color={NeumorphicTheme.colors.semantic.info} />
            <Text style={[styles.infoText, { color: NeumorphicTheme.colors.semantic.info }]}>
              {pendingOperations} pending operations
            </Text>
          </View>
        )}

        {conflictCount > 0 && (
          <View style={styles.infoRow}>
            <AlertTriangle size={12} color={NeumorphicTheme.colors.semantic.warning} />
            <Text style={[styles.infoText, { color: NeumorphicTheme.colors.semantic.warning }]}>
              {conflictCount} conflicts need resolution
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Compact styles
  compactContainer: {
    borderWidth: 1,
    borderRadius: NeumorphicTheme.borderRadius.md,
    paddingHorizontal: NeumorphicTheme.spacing[2],
    paddingVertical: NeumorphicTheme.spacing[1],
    backgroundColor: NeumorphicTheme.colors.background.secondary,
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: NeumorphicTheme.spacing[1],
  },
  compactText: {
    fontSize: NeumorphicTheme.typography.sizes.xs.fontSize,
    fontWeight: NeumorphicTheme.typography.weights.medium,
  },

  // Detailed styles
  detailedContainer: {
    backgroundColor: NeumorphicTheme.colors.background.secondary,
    borderRadius: NeumorphicTheme.borderRadius.lg,
    padding: NeumorphicTheme.spacing[3],
    marginVertical: NeumorphicTheme.spacing[2],
  },
  detailedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: NeumorphicTheme.spacing[2],
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: NeumorphicTheme.spacing[2],
  },
  statusText: {
    fontSize: NeumorphicTheme.typography.sizes.sm.fontSize,
    fontWeight: NeumorphicTheme.typography.weights.semibold,
  },
  syncButton: {
    padding: NeumorphicTheme.spacing[1],
    borderRadius: NeumorphicTheme.borderRadius.sm,
    backgroundColor: `${NeumorphicTheme.colors.brand.primary}20`,
  },
  detailedInfo: {
    gap: NeumorphicTheme.spacing[1],
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: NeumorphicTheme.spacing[2],
  },
  infoText: {
    fontSize: NeumorphicTheme.typography.sizes.xs.fontSize,
    color: NeumorphicTheme.colors.text.tertiary,
  },
});

export default SyncStatusIndicator;
