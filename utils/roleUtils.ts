/**
 * Role Utilities
 * Helper functions for role-based access control and feature detection
 */

export type UserRole = 'admin' | 'manager' | 'cleaner' | 'maintenance' | 'staff';

export interface RolePermissions {
  canViewAllBookings: boolean;
  canAssignStaff: boolean;
  canManageJobs: boolean;
  canViewProperties: boolean;
  canManagePayments: boolean;
  canViewReports: boolean;
  canManageUsers: boolean;
  canAccessAdminFeatures: boolean;
}

/**
 * Define role hierarchy and permissions
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 5,
  manager: 4,
  staff: 3,
  maintenance: 2,
  cleaner: 1,
};

/**
 * Define permissions for each role
 */
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: {
    canViewAllBookings: true,
    canAssignStaff: true,
    canManageJobs: true,
    canViewProperties: true,
    canManagePayments: true,
    canViewReports: true,
    canManageUsers: true,
    canAccessAdminFeatures: true,
  },
  manager: {
    canViewAllBookings: true,
    canAssignStaff: true,
    canManageJobs: true,
    canViewProperties: true,
    canManagePayments: false,
    canViewReports: true,
    canManageUsers: false,
    canAccessAdminFeatures: true,
  },
  staff: {
    canViewAllBookings: false,
    canAssignStaff: false,
    canManageJobs: false,
    canViewProperties: false,
    canManagePayments: false,
    canViewReports: false,
    canManageUsers: false,
    canAccessAdminFeatures: false,
  },
  maintenance: {
    canViewAllBookings: false,
    canAssignStaff: false,
    canManageJobs: false,
    canViewProperties: false,
    canManagePayments: false,
    canViewReports: false,
    canManageUsers: false,
    canAccessAdminFeatures: false,
  },
  cleaner: {
    canViewAllBookings: false,
    canAssignStaff: false,
    canManageJobs: false,
    canViewProperties: false,
    canManagePayments: false,
    canViewReports: false,
    canManageUsers: false,
    canAccessAdminFeatures: false,
  },
};

/**
 * Check if user has specific role
 */
export function hasRole(userRole: string | undefined, targetRoles: UserRole | UserRole[]): boolean {
  if (!userRole) return false;
  
  const roles = Array.isArray(targetRoles) ? targetRoles : [targetRoles];
  return roles.includes(userRole as UserRole);
}

/**
 * Check if user has minimum role level
 */
export function hasMinimumRole(userRole: string | undefined, minimumRole: UserRole): boolean {
  if (!userRole) return false;
  
  const userLevel = ROLE_HIERARCHY[userRole as UserRole];
  const minimumLevel = ROLE_HIERARCHY[minimumRole];
  
  return userLevel >= minimumLevel;
}

/**
 * Get permissions for a specific role
 */
export function getRolePermissions(userRole: string | undefined): RolePermissions {
  if (!userRole || !(userRole in ROLE_PERMISSIONS)) {
    return ROLE_PERMISSIONS.cleaner; // Default to most restrictive permissions
  }
  
  return ROLE_PERMISSIONS[userRole as UserRole];
}

/**
 * Check if user has specific permission
 */
export function hasPermission(
  userRole: string | undefined, 
  permission: keyof RolePermissions
): boolean {
  const permissions = getRolePermissions(userRole);
  return permissions[permission];
}

/**
 * Check if user is admin or manager
 */
export function isAdminOrManager(userRole: string | undefined): boolean {
  return hasRole(userRole, ['admin', 'manager']);
}

/**
 * Check if user is staff member (cleaner, maintenance, staff)
 */
export function isStaffMember(userRole: string | undefined): boolean {
  return hasRole(userRole, ['cleaner', 'maintenance', 'staff']);
}

/**
 * Get user role display name
 */
export function getRoleDisplayName(userRole: string | undefined): string {
  if (!userRole) return 'Unknown';
  
  const roleNames: Record<UserRole, string> = {
    admin: 'Administrator',
    manager: 'Manager',
    staff: 'Staff Member',
    maintenance: 'Maintenance Technician',
    cleaner: 'Cleaner',
  };
  
  return roleNames[userRole as UserRole] || userRole;
}

/**
 * Get role color for UI display
 */
export function getRoleColor(userRole: string | undefined): string {
  if (!userRole) return '#6b7280';
  
  const roleColors: Record<UserRole, string> = {
    admin: '#8b5cf6',
    manager: '#3b82f6',
    staff: '#6b7280',
    maintenance: '#f59e0b',
    cleaner: '#22c55e',
  };
  
  return roleColors[userRole as UserRole] || '#6b7280';
}

/**
 * Get available features for a role
 */
export function getAvailableFeatures(userRole: string | undefined): string[] {
  const permissions = getRolePermissions(userRole);
  const features: string[] = [];
  
  // Always available features
  features.push('Dashboard', 'Profile');
  
  if (isStaffMember(userRole)) {
    features.push('Active Jobs');
  } else {
    features.push('Jobs');
  }
  
  // Admin/Manager features
  if (permissions.canViewAllBookings) features.push('All Bookings');
  if (permissions.canAssignStaff) features.push('Assign Staff');
  if (permissions.canManageJobs) features.push('Manage Jobs');
  if (permissions.canViewProperties) features.push('Properties');
  if (permissions.canManagePayments) features.push('Payments');
  if (permissions.canViewReports) features.push('Reports');
  if (permissions.canManageUsers) features.push('User Management');
  
  return features;
}

/**
 * Get restricted features message
 */
export function getRestrictedMessage(userRole: string | undefined): string {
  const roleName = getRoleDisplayName(userRole);
  
  if (isStaffMember(userRole)) {
    return `This feature is only available to administrators and managers. Your current role is ${roleName}.`;
  }
  
  return 'You do not have permission to access this feature. Contact your administrator for access.';
}

/**
 * Log role-based access attempt
 */
export function logRoleAccess(
  userRole: string | undefined,
  feature: string,
  granted: boolean
): void {
  const roleName = getRoleDisplayName(userRole);
  const status = granted ? '✅ GRANTED' : '❌ DENIED';
  
  console.log(`🔐 Role Access: ${status} - ${roleName} attempting to access ${feature}`);
}

/**
 * Enhanced role detection for mobile app
 */
export function detectMobileUserType(userRole: string | undefined): {
  type: 'staff' | 'admin';
  tabCount: number;
  features: string[];
  permissions: RolePermissions;
} {
  const permissions = getRolePermissions(userRole);
  const features = getAvailableFeatures(userRole);
  
  if (isStaffMember(userRole)) {
    return {
      type: 'staff',
      tabCount: 3, // Dashboard, Active Jobs, Profile
      features: ['Dashboard', 'Active Jobs', 'Profile'],
      permissions,
    };
  } else {
    return {
      type: 'admin',
      tabCount: 13, // All admin features
      features,
      permissions,
    };
  }
}
