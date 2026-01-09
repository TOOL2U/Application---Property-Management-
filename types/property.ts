/**
 * Property Management Types
 * Defines all types related to properties in the system
 */

export interface PropertyCoordinates {
  latitude: number;
  longitude: number;
}

export interface PropertyLocation {
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  coordinates: PropertyCoordinates;
}

export interface PropertyAmenity {
  id: string;
  name: string;
  icon?: string;
  available: boolean;
}

export interface PropertyContact {
  name: string;
  phone: string;
  email?: string;
  role: 'owner' | 'manager' | 'emergency';
}

export type PropertyType = 
  | 'villa'
  | 'condo'
  | 'apartment'
  | 'house'
  | 'resort'
  | 'hotel'
  | 'other';

export type PropertyStatus = 
  | 'active'
  | 'inactive'
  | 'maintenance'
  | 'under_construction';

export interface Property {
  id: string;
  name: string;
  type: PropertyType;
  status: PropertyStatus;
  
  // Location data
  location: PropertyLocation;
  
  // Media
  photos: string[];
  thumbnailUrl?: string;
  virtualTourUrl?: string;
  
  // Details
  description?: string;
  bedrooms?: number;
  bathrooms?: number;
  squareMeters?: number;
  amenities?: PropertyAmenity[];
  
  // Contacts
  contacts?: PropertyContact[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  
  // Access information
  accessCodes?: {
    gate?: string;
    door?: string;
    wifi?: string;
    alarm?: string;
  };
  
  // Special instructions
  accessInstructions?: string;
  parkingInstructions?: string;
  specialNotes?: string;
  
  // Booking integration (optional)
  bookingPlatform?: string;
  externalId?: string;
}

export interface PropertyWithJobs extends Property {
  activeJobCount: number;
  pendingJobCount: number;
  completedJobCount: number;
  lastJobDate?: Date;
}

export interface PropertySearchFilter {
  type?: PropertyType[];
  status?: PropertyStatus[];
  city?: string;
  minBedrooms?: number;
  maxBedrooms?: number;
  amenities?: string[];
  hasActiveJobs?: boolean;
}

export interface PropertyStats {
  totalProperties: number;
  activeProperties: number;
  propertiesWithJobs: number;
  averageJobsPerProperty: number;
  cityCoverage: {
    city: string;
    count: number;
  }[];
}

// For map markers
export interface PropertyMarker {
  id: string;
  name: string;
  coordinates: PropertyCoordinates;
  jobCount: number;
  status: 'active' | 'pending' | 'inactive';
  type: PropertyType;
}

// API Response types
export interface PropertyResponse {
  success: boolean;
  property?: Property;
  error?: string;
  message?: string;
}

export interface PropertyListResponse {
  success: boolean;
  properties: Property[];
  total: number;
  page?: number;
  limit?: number;
  error?: string;
}

export interface NearbyPropertiesRequest {
  latitude: number;
  longitude: number;
  radiusKm: number;
  limit?: number;
}

export default Property;
