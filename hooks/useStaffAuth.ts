/**
 * Staff Authentication Hook
 * Provides role-based access control and staff-specific utilities
 */

import { useAuth } from '../contexts/AuthContext';

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  permissions?: string[];
  isActive: boolean;
}

/**
 * Enhanced Staff Authentication Hook
 */
export function useStaffAuth() {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Debug logging
  console.log('🔍 useStaffAuth Debug:', {
    user,
    userRole: user?.role,
    userEmail: user?.email,
    isAuthenticated,
    isLoading
  });

  /**
   * Check if user has specific role(s)
   */
  const hasRole = (roles: string | string[]): boolean => {
    console.log('🎭 hasRole check:', { userRole: user?.role, checkingRoles: roles });
    if (!user?.role) return false;

    const roleArray = Array.isArray(roles) ? roles : [roles];
    const result = roleArray.includes(user.role);
    console.log('🎭 hasRole result:', result);
    return result;
  };

  /**
   * Check if user has specific permission
   */
  const hasPermission = (permission: string): boolean => {
    if (!user?.permissions) return false;
    return user.permissions.includes(permission);
  };

  /**
   * Check if user is admin or manager
   */
  const isAdminOrManager = (): boolean => {
    return hasRole(['admin', 'manager']);
  };

  /**
   * Check if user is staff (cleaner, maintenance, staff)
   */
  const isStaffUser = (): boolean => {
    return hasRole(['cleaner', 'maintenance', 'staff']);
  };

  return {
    user: user as StaffUser | null,
    isAuthenticated,
    isLoading,
    hasRole,
    hasPermission,
    isAdminOrManager: isAdminOrManager(),
    isStaffUser: isStaffUser(),
    userRole: user?.role || null,
  };
}

export default useStaffAuth;
