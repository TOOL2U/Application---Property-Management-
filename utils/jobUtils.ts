/**
 * Job Utility Functions
 * Shared utilities for job-related components to reduce code duplication
 */

// Color constants for consistent theming
export const JOB_COLORS = {
  // Main colors
  primary: '#C6FF00',
  primaryDark: '#9FCC00',
  
  // Status colors
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  
  // Background colors
  background: '#0B0F1A',
  surface: '#1C1F2A',
  surfaceElevated: '#374151',
  
  // Text colors
  textPrimary: '#F1F1F1',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
} as const;

// Status colors
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pending': return '#f59e0b';      // warning orange
    case 'assigned': return '#6b7280';     // gray
    case 'accepted': return '#22c55e';     // success green
    case 'in_progress': return '#3b82f6';  // blue
    case 'completed': return '#10b981';    // emerald
    case 'declined': return '#ef4444';     // error red
    case 'overdue': return '#dc2626';      // dark red
    default: return '#71717A';             // neutral
  }
};

// Priority colors
export const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'urgent': return '#ef4444';   // red
    case 'high': return '#f97316';     // orange  
    case 'medium': return '#eab308';   // yellow
    case 'low': return '#22c55e';      // green
    default: return '#6b7280';         // gray
  }
};

// Status display text - now returns translation keys
export const getStatusTextKey = (status: string): string => {
  if (!status || typeof status !== 'string') {
    return 'jobs.status.unknown';
  }
  
  switch (status.toLowerCase()) {
    case 'pending': return 'jobs.status.pending';
    case 'assigned': return 'jobs.status.assigned';
    case 'accepted': return 'jobs.status.accepted';
    case 'in_progress': return 'jobs.status.inProgress';
    case 'completed': return 'jobs.status.completed';
    case 'declined': return 'jobs.status.declined';
    case 'overdue': return 'jobs.status.overdue';
    default: return 'jobs.status.unknown';
  }
};

// Priority display text - now returns translation keys
export const getPriorityTextKey = (priority: string): string => {
  if (!priority || typeof priority !== 'string') {
    return 'jobs.priority.normal';
  }
  
  switch (priority.toLowerCase()) {
    case 'urgent': return 'jobs.priority.urgent';
    case 'high': return 'jobs.priority.high';
    case 'medium': return 'jobs.priority.medium';
    case 'low': return 'jobs.priority.low';
    default: return 'jobs.priority.normal';
  }
};

// Legacy functions kept for backward compatibility
export const getStatusText = (status: string): string => {
  switch (status) {
    case 'pending': return 'Pending';
    case 'assigned': return 'Assigned';
    case 'accepted': return 'Accepted';
    case 'in_progress': return 'In Progress';
    case 'completed': return 'Completed';
    case 'declined': return 'Declined';
    case 'overdue': return 'Overdue';
    default: return 'Unknown';
  }
};

// Priority display text
export const getPriorityText = (priority: string): string => {
  switch (priority) {
    case 'urgent': return 'Urgent';
    case 'high': return 'High';
    case 'medium': return 'Medium';
    case 'low': return 'Low';
    default: return 'Normal';
  }
};

// Job type icons
export const getJobTypeIcon = (type: string): string => {
  switch (type) {
    case 'maintenance': return 'construct-outline';
    case 'cleaning': return 'sparkles-outline';
    case 'inspection': return 'search-outline';
    case 'plumbing': return 'water-outline';
    case 'electrical': return 'flash-outline';
    case 'hvac': return 'thermometer-outline';
    case 'landscaping': return 'leaf-outline';
    case 'security': return 'shield-outline';
    default: return 'briefcase-outline';
  }
};

// Job type display text - now returns translation keys
export const getJobTypeTextKey = (type: string): string => {
  if (!type || typeof type !== 'string') {
    return 'jobs.type.general';
  }
  
  switch (type.toLowerCase()) {
    case 'maintenance': return 'jobs.type.maintenance';
    case 'inspection': return 'jobs.type.inspection';
    case 'repair': return 'jobs.type.repair';
    case 'cleaning': return 'jobs.type.cleaning';
    case 'renovation': return 'jobs.type.renovation';
    case 'emergency': return 'jobs.type.emergency';
    case 'preventive': return 'jobs.type.preventive';
    case 'routine': return 'jobs.type.routine';
    default: return 'jobs.type.general';
  }
};

// Priority icons
export const getPriorityIcon = (priority: string): string => {
  switch (priority) {
    case 'urgent': return 'warning';
    case 'high': return 'alert-circle';
    case 'medium': return 'information-circle';
    case 'low': return 'checkmark-circle';
    default: return 'information-circle';
  }
};

// Date formatting utilities
export const formatJobDate = (date: string | Date | undefined, includeTime = true): string => {
  if (!date) return 'No date scheduled';
  
  const jobDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const jobDay = new Date(jobDate.getFullYear(), jobDate.getMonth(), jobDate.getDate());

  if (jobDay.getTime() === today.getTime()) {
    return includeTime 
      ? `Today, ${jobDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
      : 'Today';
  } else if (jobDay.getTime() === tomorrow.getTime()) {
    return includeTime
      ? `Tomorrow, ${jobDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
      : 'Tomorrow';
  } else {
    return includeTime
      ? jobDate.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
      : jobDate.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric'
        });
  }
};

// Firebase timestamp conversion
export const convertFirebaseTimestamp = (timestamp: any): Date | undefined => {
  if (!timestamp) return undefined;
  return timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
};

// Duration formatting
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  }
};

// Address formatting
export const formatAddress = (location: any): string => {
  if (!location) return 'Location not specified';
  
  if (typeof location === 'string') return location;
  
  const { address, city, state, zipCode } = location;
  if (address && city && state) {
    return `${address}, ${city}, ${state}${zipCode ? ` ${zipCode}` : ''}`;
  }
  
  return address || 'Location not specified';
};

// Job card accessibility label
export const getJobCardAccessibilityLabel = (job: any): string => {
  const status = getStatusText(job.status);
  const priority = getPriorityText(job.priority);
  const date = formatJobDate(job.scheduledDate || job.scheduledFor, false);
  
  return `${job.title}, ${priority} priority, ${status}, scheduled for ${date}`;
};

// Validation utilities
export const isJobOverdue = (scheduledDate: string | Date | undefined): boolean => {
  if (!scheduledDate) return false;
  const jobDate = typeof scheduledDate === 'string' ? new Date(scheduledDate) : scheduledDate;
  return jobDate < new Date() && jobDate.toDateString() !== new Date().toDateString();
};

export const canCompleteJob = (job: any): boolean => {
  return job.status === 'in_progress' && 
         job.photos && 
         job.photos.length > 0;
};

export const canStartJob = (job: any): boolean => {
  return job.status === 'accepted';
};

// Common styles
export const COMMON_STYLES = {
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cardPadding: 16,
  borderRadius: 16,
  buttonHeight: 44,  // Minimum touch target size
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
} as const;

// Animation constants
export const ANIMATION_CONFIG = {
  timing: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
  spring: {
    tension: 100,
    friction: 8,
  },
  stagger: 100, // Delay between animated items
} as const;
