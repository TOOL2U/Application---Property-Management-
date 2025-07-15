// Admin system types for Sia Moon Property Management

export interface AdminUser {
  uid: string;
  email: string;
  role: 'admin' | 'super_admin';
  displayName?: string;
  createdAt: Date;
  lastLogin: Date;
  permissions: AdminPermission[];
}

export interface AdminPermission {
  resource: 'bookings' | 'staff' | 'tasks' | 'properties' | 'users';
  actions: ('read' | 'write' | 'delete' | 'approve')[];
}

export interface Booking {
  id: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  propertyId: string;
  propertyName: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  totalAmount: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  specialRequests?: string;
  createdAt: Date;
  updatedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'cleaner' | 'maintenance' | 'concierge' | 'manager';
  avatar?: string;
  isActive: boolean;
  availability: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  skills: string[];
  rating: number;
  completedTasks: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  bookingId: string;
  title: string;
  description: string;
  type: 'cleaning' | 'maintenance' | 'concierge' | 'inspection';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo: string[]; // Staff IDs
  assignedBy: string; // Admin ID
  dueDate: Date;
  estimatedDuration: number; // in minutes
  actualDuration?: number; // in minutes
  notes?: string;
  completionNotes?: string;
  attachments?: string[]; // URLs to images/documents
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  type: 'villa' | 'apartment' | 'house' | 'studio';
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  amenities: string[];
  images: string[];
  pricePerNight: number;
  isActive: boolean;
  description: string;
  rules: string[];
  checkInTime: string;
  checkOutTime: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingAction {
  type: 'approve' | 'reject';
  bookingId: string;
  adminId: string;
  reason?: string;
  timestamp: Date;
}

export interface TaskAssignment {
  taskId: string;
  staffIds: string[];
  assignedBy: string;
  assignedAt: Date;
  notes?: string;
}

// Firebase collection names
export const COLLECTIONS = {
  BOOKINGS: 'bookings',
  STAFF: 'staff',
  TASKS: 'tasks',
  PROPERTIES: 'properties',
  ADMIN_USERS: 'admin_users',
  BOOKING_ACTIONS: 'booking_actions',
  TASK_ASSIGNMENTS: 'task_assignments',
} as const;

// Admin dashboard stats
export interface AdminStats {
  totalBookings: number;
  pendingBookings: number;
  approvedBookings: number;
  rejectedBookings: number;
  totalRevenue: number;
  activeStaff: number;
  pendingTasks: number;
  completedTasks: number;
  averageRating: number;
}
