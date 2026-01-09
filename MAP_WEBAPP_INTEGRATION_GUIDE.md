# 🗺️ Property Map - Web App Integration Guide
## Connecting Webapp Properties to Mobile Map Feature

**Created:** January 6, 2026  
**For:** Web Application Development Team  
**Mobile Feature:** Interactive Property Map (Snapchat-style)

---

## 🎯 What The Mobile App Needs

The mobile app's new **interactive map feature** displays all properties with real-time job status. To make this work, we need property data from your webapp with GPS coordinates.

### Current Status
- ✅ Map screen built and ready
- ✅ Job integration complete
- ⏳ **NEEDS: Property data from webapp**

---

## 📊 Required Data Structure

### Firebase Collection: `properties`

**Path:** `/properties/{propertyId}`

This collection should contain ALL properties managed by your webapp.

```typescript
{
  // Document ID: Use property's unique ID from your system
  
  // ===== REQUIRED FOR MAP =====
  id: string;                    // Property unique identifier
  name: string;                  // Property display name
  
  location: {
    address: string;             // ✅ CRITICAL - Full street address
    city: string;
    state: string;
    country: string;
    zipCode: string;
    
    coordinates: {               // ✅ CRITICAL FOR MAP
      latitude: number;          // GPS latitude (e.g., 13.7563)
      longitude: number;         // GPS longitude (e.g., 100.5018)
    }
  },
  
  // ===== OPTIONAL BUT RECOMMENDED =====
  type: string;                  // "villa", "condo", "apartment", "house"
  status: string;                // "active", "inactive", "maintenance"
  photos?: string[];             // Array of photo URLs
  description?: string;          // Property description
  
  // ===== METADATA =====
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;             // Admin user who added property
}
```

---

## 🔑 Critical Fields Explained

### 1. **Location Coordinates** (MOST IMPORTANT)
```typescript
location: {
  coordinates: {
    latitude: 13.7563,    // Must be valid GPS latitude
    longitude: 100.5018   // Must be valid GPS longitude
  }
}
```

**How to get coordinates:**
- Use Google Maps API
- Use Mapbox Geocoding API
- Use address geocoding service
- Manual entry during property creation

**Validation:**
- Latitude: -90 to 90
- Longitude: -180 to 180
- Thailand typical range:
  - Lat: 5.6 to 20.5
  - Lng: 97.3 to 105.6

### 2. **Property Name**
```typescript
name: "Ocean View Villa"  // Clear, identifiable name
```

### 3. **Full Address**
```typescript
location: {
  address: "123 Beach Road, Patong",
  city: "Phuket",
  state: "Phuket",
  country: "Thailand",
  zipCode: "83150"
}
```

---

## 🏗️ Webapp Implementation Steps

### Step 1: Create Properties Collection

In your webapp's Firebase setup:

```javascript
// Example: Adding a property with coordinates
const addProperty = async (propertyData) => {
  const propertyRef = firestore.collection('properties').doc();
  
  await propertyRef.set({
    id: propertyRef.id,
    name: propertyData.name,
    
    location: {
      address: propertyData.address,
      city: propertyData.city,
      state: propertyData.state,
      country: propertyData.country || 'Thailand',
      zipCode: propertyData.zipCode,
      
      // CRITICAL: Add GPS coordinates
      coordinates: {
        latitude: propertyData.latitude,  // From Google Maps
        longitude: propertyData.longitude
      }
    },
    
    type: propertyData.type,
    status: 'active',
    photos: propertyData.photos || [],
    description: propertyData.description || '',
    
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    createdBy: currentUserId
  });
  
  return propertyRef.id;
};
```

### Step 2: Add Coordinates to Existing Properties

If you already have properties without coordinates:

```javascript
// Batch update existing properties with coordinates
const updatePropertyCoordinates = async (propertyId, lat, lng) => {
  await firestore.collection('properties').doc(propertyId).update({
    'location.coordinates': {
      latitude: lat,
      longitude: lng
    },
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
};
```

### Step 3: Link Jobs to Properties

In your job creation, ensure each job has a valid `propertyId`:

```javascript
const createJob = async (jobData) => {
  await firestore.collection('jobs').doc().set({
    // ... other job fields
    
    propertyId: jobData.propertyId,  // ✅ MUST match property document ID
    propertyName: jobData.propertyName,
    
    // Mobile app will fetch property details from properties/{propertyId}
  });
};
```

---

## 🔄 How The Mobile App Uses This Data

### Current Flow (Job-Only Mode)
```
1. Staff opens map
2. App fetches staff's assigned jobs
3. For each job, extracts location from job.location.coordinates
4. Groups jobs by propertyId
5. Shows markers only for properties with jobs
```

### Enhanced Flow (With Properties Collection)
```
1. Staff opens map
2. App fetches ALL properties from properties collection
3. Shows ALL properties on map (with or without jobs)
4. Overlays job status on properties that have jobs:
   🟢 Green flashing = Active jobs
   🟡 Yellow = Pending jobs  
   ⚪ Grey = No current jobs (but property exists)
```

---

## 📱 Mobile App Services to Create

I'll create these services for you:

### 1. **Property Service** (`services/propertyService.ts`)
```typescript
class PropertyService {
  async getAllProperties(): Promise<Property[]>
  async getPropertyById(id: string): Promise<Property>
  async getPropertiesNearLocation(lat: number, lng: number, radiusKm: number): Promise<Property[]>
  async searchProperties(query: string): Promise<Property[]>
}
```

### 2. **Enhanced Map Service** (`services/mapService.ts`)
```typescript
class MapService {
  async getMapData(): Promise<MapData> {
    // Combines properties + jobs
    // Returns markers with status
  }
  
  async getPropertyJobs(propertyId: string): Promise<Job[]>
}
```

---

## 🚀 Quick Start Integration

### Option A: Minimum Viable (5 Minutes)

**Add coordinates to existing job creation:**

```javascript
// In your webapp's "Create Job" function
const job = {
  // ... existing fields
  
  location: {
    address: propertyAddress,
    city: propertyCity,
    
    // ADD THIS:
    coordinates: {
      latitude: 13.7563,   // Get from Google Maps
      longitude: 100.5018
    }
  }
};
```

**Result:** Map shows properties with jobs ✅

### Option B: Full Integration (1 Hour)

1. **Create properties collection** with all your properties
2. **Add geocoding** to property creation form
3. **Link jobs** to properties via propertyId
4. **Enable property browsing** in mobile app

**Result:** Map shows ALL properties + job overlay ✅✅✅

---

## 🧪 Testing Your Integration

### Test Data Example

Add this test property to Firebase Console:

```json
{
  "id": "test-property-001",
  "name": "Patong Beach Villa",
  "location": {
    "address": "123 Beach Road",
    "city": "Phuket",
    "state": "Phuket",
    "country": "Thailand",
    "zipCode": "83150",
    "coordinates": {
      "latitude": 7.8965,
      "longitude": 98.3018
    }
  },
  "type": "villa",
  "status": "active",
  "photos": ["https://example.com/photo1.jpg"],
  "description": "Beautiful beachfront villa",
  "createdAt": "2026-01-06T12:00:00Z"
}
```

### Verification Steps

1. **Check Firebase Console**
   - Navigate to `properties` collection
   - Verify document exists
   - Confirm `location.coordinates` has numbers

2. **Mobile App Test**
   - Open mobile app
   - Go to Map tab
   - Marker should appear at coordinates
   - Tap marker to see property card

3. **Create Test Job**
   - Create job with `propertyId: "test-property-001"`
   - Set job status to "accepted"
   - Map should show **green flashing marker** 🟢

---

## 🔧 Geocoding Solutions

### Google Maps Geocoding API

```javascript
const getCoordinatesFromAddress = async (address) => {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=YOUR_API_KEY`
  );
  
  const data = await response.json();
  if (data.results.length > 0) {
    const { lat, lng } = data.results[0].geometry.location;
    return { latitude: lat, longitude: lng };
  }
  
  throw new Error('Address not found');
};

// Usage in property form
const handlePropertySubmit = async (formData) => {
  const coordinates = await getCoordinatesFromAddress(formData.address);
  
  await addProperty({
    ...formData,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude
  });
};
```

### Alternative: Mapbox Geocoding

```javascript
const getCoordinates = async (address) => {
  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=YOUR_TOKEN`
  );
  
  const data = await response.json();
  const [lng, lat] = data.features[0].center;
  
  return { latitude: lat, longitude: lng };
};
```

---

## 🛡️ Security Rules Update

Add to your `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Properties - Read-only for staff
    match /properties/{propertyId} {
      // Staff can read all properties
      allow read: if request.auth != null;
      
      // Only admins can create/update/delete
      allow write: if request.auth != null 
                   && get(/databases/$(database)/documents/staff_accounts/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

---

## 📊 Database Schema Overview

```
Firebase Structure:

├── staff_accounts/          (Existing)
│   └── {staffId}
│       ├── firebaseUid
│       ├── name
│       └── email
│
├── jobs/                    (Existing) 
│   └── {jobId}
│       ├── propertyId       ← Links to property
│       ├── assignedTo       ← Links to staff
│       └── status
│
└── properties/              (NEW - Need to Create)
    └── {propertyId}
        ├── name
        ├── location
        │   ├── address
        │   └── coordinates   ← CRITICAL FOR MAP
        │       ├── latitude
        │       └── longitude
        └── photos[]
```

---

## 🎨 Map Features That Benefit

Once you add the `properties` collection with coordinates:

### Immediate Benefits
- ✅ Show ALL properties on map (not just ones with jobs)
- ✅ Staff can browse all available properties
- ✅ Grey markers for inactive properties
- ✅ Property details card with photos

### Future Enhancements (Easy to Add)
- 🔮 **Property Search**: Filter by location, type, status
- 🔮 **Nearby Properties**: Show properties near staff location
- 🔮 **Route Planning**: Suggest optimal route for multiple jobs
- 🔮 **Property Analytics**: Heat map of property activity
- 🔮 **Booking Calendar**: Show property availability
- 🔮 **Photo Gallery**: Swipe through property photos
- 🔮 **Navigation**: Tap property → Open Google Maps

---

## 📞 What I Need From You

### Minimum Required:
1. ✅ **Confirm property storage location**
   - Do you have a `properties` collection?
   - Or do you store properties elsewhere?

2. ✅ **Property data structure**
   - Send me 1-2 example property documents
   - Show me current field names

3. ✅ **Geocoding capability**
   - Can you add GPS coordinates to properties?
   - Do you have Google Maps API key?

### Optional (Makes It Better):
4. 🎁 Property photos/thumbnails
5. 🎁 Property amenities/features
6. 🎁 Property manager contact info
7. 🎁 Property booking platform integration

---

## 🚀 Action Items

### For Mobile App (I'll Do This):
- [x] Create Property type definition
- [ ] Create PropertyService class
- [ ] Create Enhanced Map Service
- [ ] Update Map screen to fetch properties
- [ ] Add property detail modal
- [ ] Add property search/filter
- [ ] Add offline caching for properties

### For Webapp (You Need To Do):
1. **Immediate (Required for Basic Map)**
   - [ ] Add `location.coordinates` to job documents
   - [ ] Test with 1-2 jobs that have coordinates

2. **Phase 1 (Full Map Experience)**
   - [ ] Create `properties` collection in Firestore
   - [ ] Add geocoding to property creation
   - [ ] Migrate existing properties with coordinates

3. **Phase 2 (Enhanced Features)**  
   - [ ] Add property photos
   - [ ] Add property metadata
   - [ ] Create property management UI

---

## 📝 Example API Endpoints (If Needed)

If you want to keep properties in your backend:

```typescript
// GET /api/properties
// Returns all properties with coordinates
{
  "properties": [
    {
      "id": "prop-001",
      "name": "Beach Villa",
      "coordinates": { "lat": 13.7563, "lng": 100.5018 },
      "address": "123 Beach Rd",
      "photos": ["url1", "url2"]
    }
  ]
}

// GET /api/properties/:propertyId
// Returns single property details
{
  "id": "prop-001",
  "name": "Beach Villa",
  "location": { ... },
  "photos": [ ... ],
  "amenities": [ ... ]
}

// GET /api/properties/:propertyId/jobs
// Returns all jobs for a property
{
  "jobs": [ ... ]
}
```

---

## 🎯 Summary

**What You Need To Provide:**
1. Property data with GPS coordinates
2. Property collection in Firebase (or API endpoint)
3. Link between jobs and properties (propertyId)

**What You'll Get:**
- Beautiful interactive map with ALL properties
- Real-time job status overlays
- Professional property management experience
- Staff navigation and routing
- Property search and filtering

**Timeline:**
- **Day 1**: Add coordinates to jobs → Basic map works
- **Week 1**: Create properties collection → Full map works
- **Week 2**: Enhanced features (search, photos, routing)

---

## 📞 Questions?

**Mobile App Lead:** [Your Name]  
**Document:** `MAP_WEBAPP_INTEGRATION_GUIDE.md`  
**Date:** January 6, 2026

Let me know:
1. Current property data structure
2. Where properties are stored
3. Can you add GPS coordinates?
4. Any existing geocoding setup?

**I'm ready to create all the mobile services once I know your property structure!** 🚀

