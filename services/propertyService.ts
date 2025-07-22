/**
 * Property Service
 * Handles fetching and managing property data from Firestore
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase';

export interface PropertyLocation {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  accessInstructions?: string;
  accessCode?: string;
}

export interface PropertyContact {
  name: string;
  role: string;
  phone: string;
  email?: string;
}

export interface PropertyRequirementTemplate {
  id: string;
  description: string;
  isRequired: boolean;
  category: 'safety' | 'cleaning' | 'maintenance' | 'inspection' | 'photo' | 'other';
  estimatedTime?: number; // minutes
  notes?: string;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  description?: string;
  location: PropertyLocation;
  contacts: PropertyContact[];
  amenities: string[];
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  hasPool?: boolean;
  hasParking?: boolean;
  hasAirConditioning?: boolean;
  hasLaundry?: boolean;
  isActive: boolean;
  requirementsTemplate?: PropertyRequirementTemplate[]; // Job requirements template
  googleMapsLocation?: {
    latitude: number;
    longitude: number;
    address: string;
    placeName: string;
    description: string;
  };
}

export interface PropertyServiceResponse {
  success: boolean;
  property?: Property;
  properties?: Property[];
  error?: string;
}

class PropertyService {
  private readonly PROPERTIES_COLLECTION = 'properties';

  /**
   * Get a single property by ID
   */
  async getProperty(propertyId: string): Promise<PropertyServiceResponse> {
    try {
      console.log('🏠 PropertyService: Getting property:', propertyId);

      const db = await getDb();
      const propertyRef = doc(db, this.PROPERTIES_COLLECTION, propertyId);
      const propertyDoc = await getDoc(propertyRef);

      if (!propertyDoc.exists()) {
        console.log('❌ PropertyService: Property not found:', propertyId);
        return {
          success: false,
          error: 'Property not found'
        };
      }

      const data = propertyDoc.data();
      const property = this.mapFirestoreDataToProperty(propertyDoc.id, data);

      console.log('✅ PropertyService: Property retrieved:', property.name);
      return {
        success: true,
        property
      };

    } catch (error) {
      console.error('❌ PropertyService: Error getting property:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get property'
      };
    }
  }

  /**
   * Get property requirements template for job creation
   */
  async getPropertyRequirementsTemplate(propertyId: string): Promise<PropertyRequirementTemplate[]> {
    try {
      console.log('📋 PropertyService: Getting requirements template for property:', propertyId);

      const response = await this.getProperty(propertyId);
      
      if (!response.success || !response.property) {
        console.warn('⚠️ PropertyService: Property not found, returning empty requirements');
        return [];
      }

      const requirements = response.property.requirementsTemplate || [];
      console.log(`✅ PropertyService: Found ${requirements.length} requirements in template`);
      
      return requirements;
    } catch (error) {
      console.error('❌ PropertyService: Error getting property requirements template:', error);
      return [];
    }
  }

  /**
   * Convert property requirements template to job requirements format
   */
  static convertTemplateToJobRequirements(template: PropertyRequirementTemplate[]): any[] {
    return template.map(item => ({
      id: item.id,
      description: item.description,
      isCompleted: false,
      isRequired: item.isRequired,
      category: item.category,
      photos: [],
      notes: '',
      estimatedTime: item.estimatedTime,
      templateNotes: item.notes,
      completedAt: null,
      completedBy: null,
    }));
  }

  /**
   * Get all active properties
   */
  async getActiveProperties(): Promise<PropertyServiceResponse> {
    try {
      console.log('🏠 PropertyService: Getting active properties');

      const db = await getDb();
      const propertiesRef = collection(db, this.PROPERTIES_COLLECTION);
      const q = query(
        propertiesRef,
        where('isActive', '==', true),
        orderBy('name', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const properties: Property[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const property = this.mapFirestoreDataToProperty(doc.id, data);
        properties.push(property);
      });

      console.log('✅ PropertyService: Found', properties.length, 'active properties');
      return {
        success: true,
        properties
      };

    } catch (error) {
      console.error('❌ PropertyService: Error getting active properties:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get properties'
      };
    }
  }

  /**
   * Get all properties (including inactive)
   */
  async getAllProperties(): Promise<PropertyServiceResponse> {
    try {
      console.log('🏠 PropertyService: Getting all properties');

      const db = await getDb();
      const propertiesRef = collection(db, this.PROPERTIES_COLLECTION);
      const q = query(propertiesRef, orderBy('name', 'asc'));

      const querySnapshot = await getDocs(q);
      const properties: Property[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const property = this.mapFirestoreDataToProperty(doc.id, data);
        properties.push(property);
      });

      console.log('✅ PropertyService: Found', properties.length, 'total properties');
      return {
        success: true,
        properties
      };

    } catch (error) {
      console.error('❌ PropertyService: Error getting all properties:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get properties'
      };
    }
  }

  /**
   * Search properties by name or address
   */
  async searchProperties(searchQuery: string): Promise<PropertyServiceResponse> {
    try {
      console.log('🔍 PropertyService: Searching properties for:', searchQuery);

      const db = await getDb();
      const propertiesRef = collection(db, this.PROPERTIES_COLLECTION);
      
      // Get all properties and filter client-side for better search
      const querySnapshot = await getDocs(propertiesRef);
      const properties: Property[] = [];

      const searchLower = searchQuery.toLowerCase();

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Search in name, address, and description
        const searchableText = [
          data.name || '',
          data.address || '',
          data.description || '',
          data.city || '',
          data.location?.city || '',
          data.location?.address || ''
        ].join(' ').toLowerCase();

        if (searchableText.includes(searchLower)) {
          const property = this.mapFirestoreDataToProperty(doc.id, data);
          properties.push(property);
        }
      });

      console.log('✅ PropertyService: Found', properties.length, 'matching properties');
      return {
        success: true,
        properties
      };

    } catch (error) {
      console.error('❌ PropertyService: Error searching properties:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search properties'
      };
    }
  }

  /**
   * Map Firestore data to Property interface
   */
  private mapFirestoreDataToProperty(id: string, data: any): Property {
    // Build contacts array from available data
    const contacts: PropertyContact[] = [];
    
    if (data.emergencyContactName && data.emergencyContactPhone) {
      contacts.push({
        name: data.emergencyContactName,
        role: 'Emergency Contact',
        phone: data.emergencyContactPhone,
        email: data.emergencyContactEmail || undefined
      });
    }

    // Add property manager if different from emergency contact
    if (data.managerName && data.managerPhone && data.managerName !== data.emergencyContactName) {
      contacts.push({
        name: data.managerName,
        role: 'Property Manager',
        phone: data.managerPhone,
        email: data.managerEmail || undefined
      });
    }

    // Build location object
    const location: PropertyLocation = {
      address: data.address || data.location?.address || '',
      city: data.city || data.location?.city || '',
      state: data.state || data.location?.state || '',
      zipCode: data.zipCode || data.location?.zipCode || '',
      country: data.country || data.location?.country || '',
      coordinates: {
        latitude: data.coordinates?.latitude || data.location?.coordinates?.latitude || data.googleMapsLocation?.latitude || 0,
        longitude: data.coordinates?.longitude || data.location?.coordinates?.longitude || data.googleMapsLocation?.longitude || 0
      },
      accessInstructions: data.accessDetails || data.location?.accessInstructions || undefined,
      accessCode: data.accessCode || data.location?.accessCode || undefined
    };

    return {
      id,
      name: data.name || 'Unnamed Property',
      address: data.address || '',
      description: data.description || undefined,
      location,
      contacts,
      amenities: data.amenities || [],
      bedrooms: data.bedrooms || 0,
      bathrooms: data.bathrooms || 0,
      maxGuests: data.maxGuests || 0,
      hasPool: data.hasPool || false,
      hasParking: data.hasParking || false,
      hasAirConditioning: data.hasAirConditioning || false,
      hasLaundry: data.hasLaundry || false,
      isActive: data.isActive || false,
      googleMapsLocation: data.googleMapsLocation || undefined
    };
  }
}

// Export singleton instance
export const propertyService = new PropertyService();
export default propertyService;
