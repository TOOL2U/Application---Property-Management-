import { useState, useEffect, useCallback } from 'react';
import { syncService, SyncStatus, ConflictResolution } from '../services/syncService';
import { notificationService } from '../services/notificationService';

interface UseSyncReturn {
  syncStatus: SyncStatus;
  conflicts: ConflictResolution[];
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  pendingOperations: number;
  conflictCount: number;
  forceSyncNow: () => Promise<void>;
  resolveConflict: (conflictId: string, resolution: 'local' | 'remote' | 'merge') => Promise<void>;
  refreshStatus: () => void;
}

export function useSync(): UseSyncReturn {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(syncService.getSyncStatus());
  const [conflicts, setConflicts] = useState<ConflictResolution[]>(syncService.getConflicts());
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Refresh status data
  const refreshStatus = useCallback(() => {
    setSyncStatus(syncService.getSyncStatus());
    setConflicts(syncService.getConflicts());
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Auto-refresh status every 5 seconds
  useEffect(() => {
    const interval = setInterval(refreshStatus, 5000);
    return () => clearInterval(interval);
  }, [refreshStatus]);

  // Force sync now
  const forceSyncNow = useCallback(async () => {
    try {
      console.log('🔄 User initiated force sync...');
      await syncService.forceSyncNow();
      refreshStatus();
      
      // Send completion notification
      await notificationService.sendSyncCompletionNotification({
        itemsUpdated: 0, // This would be calculated from sync results
        conflictsResolved: 0,
      });
      
      console.log('✅ Force sync completed');
    } catch (error) {
      console.error('❌ Force sync failed:', error);
      throw error;
    }
  }, [refreshStatus]);

  // Resolve conflict
  const resolveConflict = useCallback(async (
    conflictId: string, 
    resolution: 'local' | 'remote' | 'merge'
  ) => {
    try {
      console.log(`🔧 Resolving conflict ${conflictId} with ${resolution} strategy...`);
      await syncService.resolveConflict(conflictId, resolution);
      refreshStatus();
      console.log('✅ Conflict resolved successfully');
    } catch (error) {
      console.error('❌ Failed to resolve conflict:', error);
      throw error;
    }
  }, [refreshStatus]);

  // Derived values
  const isOnline = syncStatus.isOnline && syncStatus.realtimeConnected;
  const isSyncing = syncStatus.syncInProgress;
  const lastSyncTime = syncStatus.lastSyncTimestamp > 0 
    ? new Date(syncStatus.lastSyncTimestamp) 
    : null;
  const pendingOperations = syncStatus.pendingOperations + syncStatus.webhookQueueSize;
  const conflictCount = syncStatus.conflictCount;

  return {
    syncStatus,
    conflicts,
    isOnline,
    isSyncing,
    lastSyncTime,
    pendingOperations,
    conflictCount,
    forceSyncNow,
    resolveConflict,
    refreshStatus,
  };
}

export default useSync;
