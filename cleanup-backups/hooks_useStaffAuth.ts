/**
 * Staff Authentication Hook
 * Provides role-based access control and staff-specific utilities
 */

import { usePINAuth } from "@/contexts/PINAuthContext";

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
  const { currentProfile, isAuthenticated, isLoading } = usePINAuth();

  // Debug logging
  console.log('🔍 useStaffAuth Debug:', {
    currentProfile,
    userRole: currentProfile?.role,
    userEmail: currentProfile?.email,
    isAuthenticated,
    isLoading
  });

  /**
   * Check if user has specific role(s)
   */
  const hasRole = (roles: string | string[]): boolean => {
    console.log('🎭 hasRole check:', { userRole: currentProfile?.role, checkingRoles: roles });
    if (!currentProfile?.role) return false;

    const roleArray = Array.isArray(roles) ? roles : [roles];
    const result = roleArray.includes(currentProfile.role);
    console.log('🎭 hasRole result:', result);
    return result;
  };

  /**
   * Check if user has specific permission
   */
  const hasPermission = (permission: string): boolean => {
    if (!currentProfile?.permissions) return false;
    return currentProfile.permissions.includes(permission);
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
    user: currentProfile as StaffUser | null,
    isAuthenticated,
    isLoading,
    hasRole,
    hasPermission,
    isAdminOrManager: isAdminOrManager(),
    isStaffUser: isStaffUser(),
    userRole: currentProfile?.role || null,
  };
}

export default useStaffAuth;
