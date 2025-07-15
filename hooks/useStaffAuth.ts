import { useContext, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';

/**
 * Enhanced Staff Authentication Hook
 * Provides additional authentication utilities and role-based access control
 */

export interface UseStaffAuthReturn {
  // Basic auth state
  user: any;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  userRole: string | null;
  isSessionValid: boolean;

  // Auth actions
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;

  // Role-based utilities
  hasRole: (role: string | string[]) => boolean;
  hasPermission: (permission: string) => boolean;
  isAdmin: boolean;
  isManager: boolean;
  isCleaner: boolean;
  isMaintenance: boolean;
  isStaff: boolean;

  // Session utilities
  getSessionInfo: () => Promise<any>;
  validateCurrentSession: () => Promise<boolean>;
}

// Role hierarchy for permission checking
const ROLE_HIERARCHY = {
  admin: 5,
  manager: 4,
  maintenance: 3,
  cleaner: 2,
  staff: 1,
};

// Permission mappings
const ROLE_PERMISSIONS = {
  admin: [
    'manage_users',
    'manage_properties',
    'manage_bookings',
    'assign_tasks',
    'view_reports',
    'manage_settings',
    'view_all_data',
  ],
  manager: [
    'manage_properties',
    'manage_bookings',
    'assign_tasks',
    'view_reports',
    'view_staff_data',
  ],
  maintenance: [
    'view_maintenance_tasks',
    'update_task_status',
    'view_property_details',
    'report_issues',
  ],
  cleaner: [
    'view_cleaning_tasks',
    'update_task_status',
    'view_property_details',
    'report_issues',
  ],
  staff: [
    'view_assigned_tasks',
    'update_task_status',
    'view_basic_property_info',
  ],
};

export function useStaffAuth(): UseStaffAuthReturn {
  const authContext = useAuth();

  if (!authContext) {
    throw new Error('useStaffAuth must be used within an AuthProvider');
  }

  const {
    user,
    isLoading,
    isAuthenticated,
    error,
    userRole,
    isSessionValid,
    signIn,
    signOut,
    refreshSession,
    clearError,
  } = authContext;

  // Role checking utilities
  const hasRole = useCallback((role: string | string[]): boolean => {
    if (!userRole) return false;
    
    if (Array.isArray(role)) {
      return role.includes(userRole);
    }
    
    return userRole === role;
  }, [userRole]);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!userRole) return false;
    
    const rolePermissions = ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS];
    return rolePermissions ? rolePermissions.includes(permission) : false;
  }, [userRole]);

  // Role-based boolean flags
  const isAdmin = hasRole('admin');
  const isManager = hasRole('manager');
  const isCleaner = hasRole('cleaner');
  const isMaintenance = hasRole('maintenance');
  const isStaff = hasRole('staff');

  // Session utilities
  const getSessionInfo = useCallback(async () => {
    try {
      return await authService.getStoredSession();
    } catch (error) {
      console.error('Failed to get session info:', error);
      return null;
    }
  }, []);

  const validateCurrentSession = useCallback(async (): Promise<boolean> => {
    try {
      const validatedUser = await authService.validateSession();
      return validatedUser !== null;
    } catch (error) {
      console.error('Session validation failed:', error);
      return false;
    }
  }, []);

  return {
    // Basic auth state
    user,
    isLoading,
    isAuthenticated,
    error,
    userRole,
    isSessionValid,

    // Auth actions
    signIn,
    signOut,
    refreshSession,
    clearError,

    // Role-based utilities
    hasRole,
    hasPermission,
    isAdmin,
    isManager,
    isCleaner,
    isMaintenance,
    isStaff,

    // Session utilities
    getSessionInfo,
    validateCurrentSession,
  };
}

/**
 * Higher-order component for role-based access control
 */
export function withRoleAccess<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles: string | string[],
  fallbackComponent?: React.ComponentType<P>
) {
  return function RoleProtectedComponent(props: P) {
    const { hasRole, isLoading } = useStaffAuth();

    if (isLoading) {
      return null; // or loading component
    }

    if (!hasRole(allowedRoles)) {
      if (fallbackComponent) {
        const FallbackComponent = fallbackComponent;
        return <FallbackComponent {...props} />;
      }
      return null;
    }

    return <Component {...props} />;
  };
}

/**
 * Hook for permission-based rendering
 */
export function usePermission(permission: string) {
  const { hasPermission, isLoading } = useStaffAuth();
  
  return {
    hasPermission: hasPermission(permission),
    isLoading,
  };
}

/**
 * Hook for role hierarchy checking
 */
export function useRoleHierarchy() {
  const { userRole } = useStaffAuth();

  const hasMinimumRole = useCallback((minimumRole: string): boolean => {
    if (!userRole) return false;
    
    const userLevel = ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY];
    const minimumLevel = ROLE_HIERARCHY[minimumRole as keyof typeof ROLE_HIERARCHY];
    
    return userLevel >= minimumLevel;
  }, [userRole]);

  const getRoleLevel = useCallback((): number => {
    if (!userRole) return 0;
    return ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY] || 0;
  }, [userRole]);

  return {
    hasMinimumRole,
    getRoleLevel,
    userRole,
  };
}

export default useStaffAuth;
