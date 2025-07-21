/**
 * App Audit Integration Component
 * Silent initialization of background audit system
 * Add this to your main App.tsx or after authentication
 */

import React, { useEffect } from 'react';
import { backgroundAuditManager } from '@/services/backgroundAuditManager';
import { useAuth } from '@/contexts/AuthContext';

interface AppAuditIntegrationProps {
  children?: React.ReactNode;
}

/**
 * Component that silently initializes the background audit system
 * This should be placed high in your component tree, after authentication
 */
export const AppAuditIntegration: React.FC<AppAuditIntegrationProps> = ({ children }) => {
  const { user } = useAuth(); // Adjust based on your auth context

  useEffect(() => {
    const initializeAudits = async () => {
      if (user?.id) {
        // Initialize background audit system after user authentication
        await backgroundAuditManager.initialize(user.id);
      }
    };

    // Only run for authenticated users
    if (user?.id) {
      initializeAudits();
    }
  }, [user?.id]);

  // This component is invisible - just returns children
  return <>{children}</>;
};

/**
 * Alternative hook-based approach if you prefer
 * Use this in your main App component or any authenticated screen
 */
export const useBackgroundAudits = (userId?: string) => {
  useEffect(() => {
    const initializeAudits = async () => {
      if (userId) {
        await backgroundAuditManager.initialize(userId);
      }
    };

    if (userId) {
      initializeAudits();
    }
  }, [userId]);

  return {
    forceRunAudits: () => backgroundAuditManager.forceRunAudits(),
    getAuditStatus: () => backgroundAuditManager.getStatus(),
    auditSpecificStaff: (staffId: string) => backgroundAuditManager.auditSpecificStaff(staffId),
  };
};

/**
 * Development/Testing component to manually trigger audits
 * Remove this in production or hide behind admin access
 */
export const AuditTestingPanel: React.FC = () => {
  const auditStatus = backgroundAuditManager.getStatus();

  const handleForceAudit = async () => {
    console.log('🔄 Manually triggering audit process...');
    await backgroundAuditManager.forceRunAudits();
    console.log('✅ Manual audit trigger completed');
  };

  const handleTestSpecificStaff = async () => {
    // Replace with actual staff ID for testing
    const testStaffId = 'test_staff_001';
    console.log(`🔍 Testing audit for staff: ${testStaffId}`);
    await backgroundAuditManager.auditSpecificStaff(testStaffId);
  };

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      background: '#0B0F1A',
      border: '1px solid #C6FF00',
      borderRadius: 8,
      padding: 16,
      zIndex: 9999,
    }}>
      <h4 style={{ color: '#C6FF00', margin: 0, marginBottom: 12 }}>
        Audit System Testing
      </h4>
      
      <div style={{ marginBottom: 8 }}>
        <span style={{ color: '#FFFFFF', fontSize: 12 }}>
          Status: {auditStatus.isRunning ? '🔄 Running' : '⭐ Ready'}
        </span>
      </div>
      
      {auditStatus.lastCheck && (
        <div style={{ marginBottom: 12 }}>
          <span style={{ color: '#FFFFFF', fontSize: 12 }}>
            Last Check: {auditStatus.lastCheck.toLocaleTimeString()}
          </span>
        </div>
      )}
      
      <button
        onClick={handleForceAudit}
        disabled={auditStatus.isRunning}
        style={{
          background: '#C6FF00',
          color: '#0B0F1A',
          border: 'none',
          borderRadius: 4,
          padding: '8px 12px',
          marginRight: 8,
          fontSize: 12,
          fontWeight: 'bold',
          cursor: auditStatus.isRunning ? 'not-allowed' : 'pointer',
          opacity: auditStatus.isRunning ? 0.5 : 1,
        }}
      >
        {auditStatus.isRunning ? 'Running...' : 'Force Audit'}
      </button>
      
      <button
        onClick={handleTestSpecificStaff}
        disabled={auditStatus.isRunning}
        style={{
          background: 'transparent',
          color: '#C6FF00',
          border: '1px solid #C6FF00',
          borderRadius: 4,
          padding: '8px 12px',
          fontSize: 12,
          cursor: auditStatus.isRunning ? 'not-allowed' : 'pointer',
          opacity: auditStatus.isRunning ? 0.5 : 1,
        }}
      >
        Test Staff
      </button>
    </div>
  );
};

export default AppAuditIntegration;
