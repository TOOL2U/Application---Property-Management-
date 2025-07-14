export interface User {
  id: string;
  email: string;
  role: 'staff' | 'admin' | 'manager';
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  type: 'apartment' | 'house' | 'commercial' | 'office';
  status: 'available' | 'occupied' | 'maintenance' | 'inactive';
  rent: number;
  deposit: number;
  bedrooms?: number;
  bathrooms?: number;
  area: number;
  description?: string;
  images: string[];
  amenities: string[];
  ownerId: string;
  managerId?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  staffId: string;
  propertyId: string;
  propertyName: string;
  propertyAddress: string;
  clientName?: string;
  clientPhone?: string;
  taskType: 'cleaning' | 'inspection' | 'maintenance' | 'showing' | 'checkout' | 'checkin' | 'other';
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduledDate: Date;
  checkInTime?: Date;
  checkOutTime?: Date;
  estimatedDuration: number; // in minutes
  actualDuration?: number;
  description?: string;
  notes?: string;
  images?: string[];
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  completionData?: TaskCompletionData;
}

export interface TaskCompletionData {
  taskId: string;
  staffId: string;
  notes?: string;
  issues?: string;
  photos: TaskCompletionPhoto[];
  completedAt: Date;
  actualDuration?: number;
  submittedAt: Date;
}

export interface TaskCompletionPhoto {
  id: string;
  type: 'before' | 'after' | 'issue' | 'general';
  url: string;
  caption?: string;
  uploadedAt: Date;
}

export interface Tenant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  propertyId: string;
  leaseStart: Date;
  leaseEnd: Date;
  rentAmount: number;
  depositAmount: number;
  status: 'active' | 'inactive' | 'pending';
  createdAt: Date;
  updatedAt: Date;
}

export interface MaintenanceRequest {
  id: string;
  propertyId: string;
  tenantId: string;
  title: string;
  description: string;
  category: 'plumbing' | 'electrical' | 'hvac' | 'appliance' | 'structural' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  assignedTo?: string;
  images: string[];
  estimatedCost?: number;
  actualCost?: number;
  scheduledDate?: Date;
  completedDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  tenantId: string;
  propertyId: string;
  amount: number;
  type: 'rent' | 'deposit' | 'fee' | 'refund';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  dueDate: Date;
  paidDate?: Date;
  method?: 'cash' | 'check' | 'bank_transfer' | 'card';
  reference?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
