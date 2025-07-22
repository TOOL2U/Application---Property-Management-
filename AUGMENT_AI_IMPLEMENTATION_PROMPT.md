# 🤖 AUGMENT AI IMPLEMENTATION PROMPT

## Project: Property-Based Job Requirements System - Webapp Implementation

### **Context & Background**
You are implementing a job requirements management system for a property management webapp. The mobile team has already completed their side - they have a job completion wizard that automatically validates requirements. Your task is to build the webapp interface that allows property managers to define and manage job requirements templates for each property.

---

## 🎯 **PRIMARY OBJECTIVE**

Build a **"Job Requirements Template"** management interface within the existing property management system that allows property managers to:

1. Define standardized job requirements for each property
2. Categorize requirements by type (Safety, Cleaning, Maintenance, etc.)
3. Set time estimates and priority levels
4. Save requirements templates to Firestore
5. Manage requirements through an intuitive UI

---

## 📋 **TECHNICAL SPECIFICATIONS**

### **Data Structure to Implement:**
```typescript
export interface PropertyRequirementTemplate {
  id: string;                    // Unique identifier (generate with timestamp or UUID)
  description: string;           // "Clean all bathrooms thoroughly"
  isRequired: boolean;          // true = required, false = optional
  category: 'safety' | 'cleaning' | 'maintenance' | 'inspection' | 'photo' | 'other';
  estimatedTime?: number;       // minutes (optional field)
  notes?: string;              // additional instructions (optional field)
  photos?: string[];           // array of photo URLs/references (for photo category)
}

// Add this field to your existing Property interface:
export interface Property {
  // ... your existing property fields (keep all existing)
  requirementsTemplate?: PropertyRequirementTemplate[]; // NEW FIELD
}
```

### **Firestore Integration Requirements:**
- **Collection:** `properties` (existing collection)
- **Field to Add:** `requirementsTemplate` (array of PropertyRequirementTemplate objects)
- **Operation:** Update existing property documents with the new `requirementsTemplate` field
- **Validation:** Ensure description is not empty, category is valid

---

## 🎨 **UI/UX REQUIREMENTS**

### **Location:** 
Add to the existing Property Edit/Management page (wherever properties are currently managed)

### **Section Layout:**
```
Property Details
├── Basic Information (existing)
├── Location Details (existing)  
├── Amenities (existing)
└── 📋 Job Requirements Template (NEW SECTION)
    ├── Section Header: "Job Requirements Template"
    ├── Description: "These requirements will be applied to all jobs created for this property."
    ├── Requirements List (dynamic)
    ├── Add Requirement Button
    └── Save/Cancel Actions
```

### **Individual Requirement Form Fields:**
For each requirement in the list, provide these input fields:

1. **Description** (Required)
   - Type: Text input
   - Placeholder: "Enter requirement description..."
   - Validation: Must not be empty
   - Example: "Clean all bathrooms thoroughly"

2. **Category** (Required)
   - Type: Dropdown/Select
   - Options: Safety, Cleaning, Maintenance, Inspection, Photo Documentation, Other
   - Default: "Other"

3. **Required Checkbox** (Required)
   - Type: Checkbox
   - Label: "Required"
   - Default: true (checked)

4. **Estimated Time** (Optional)
   - Type: Number input
   - Placeholder: "Minutes"
   - Min: 1, Max: 480 (8 hours)
   - Default: empty

5. **Notes** (Optional)
   - Type: Text area
   - Placeholder: "Additional instructions..."
   - Max length: 500 characters

6. **Delete Button**
   - Type: Button
   - Style: Red/danger styling
   - Confirmation: "Are you sure you want to delete this requirement?"

7. **Photo Upload Button** (For Photo Documentation Category Only)
   - Type: Button
   - Label: "📸 Upload Photos (Min. 3 required)"
   - Style: Blue/primary styling
   - Function: Opens file picker for multiple photo selection
   - Validation: Must select at least 3 photos
   - Display: Only shown when category is "photo"

### **Action Buttons:**
- **"+ Add Requirement"** - Adds a new empty requirement to the list
- **"Save Template"** - Saves all requirements to Firestore
- **"Cancel"** - Discards unsaved changes and reverts to last saved state

---

## 🔧 **IMPLEMENTATION REQUIREMENTS**

### **React Component Structure:**
Create a new component called `PropertyRequirementsSection` that:

1. **State Management:**
   - Manages array of requirements in local state
   - Tracks loading/saving states
   - Handles form validation

2. **Core Functions:**
   ```typescript
   const addRequirement = () => {
     // Add new requirement with default values
   };
   
   const updateRequirement = (id: string, updates: Partial<PropertyRequirementTemplate>) => {
     // Update specific requirement in array
   };
   
   const deleteRequirement = (id: string) => {
     // Remove requirement from array with confirmation
   };
   
   const handlePhotoUpload = (id: string, files: FileList) => {
     // Handle photo upload for photo documentation requirements
     // Validate minimum 3 photos
     // Store photos or photo references
   };
   
   const saveRequirements = async () => {
     // Validate and save to Firestore
   };
   ```

3. **Validation Rules:**
   - Description cannot be empty
   - Category must be valid option
   - Estimated time must be positive number if provided
   - Photo requirements must have minimum 3 photos when category is "photo"
   - Show validation errors clearly

### **Firestore Integration:**
```javascript
// Function to update property with requirements
const updatePropertyRequirements = async (propertyId, requirementsTemplate) => {
  try {
    await db.collection('properties').doc(propertyId).update({
      requirementsTemplate,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating property requirements:', error);
    throw error;
  }
};
```

---

## 📱 **EXAMPLE IMPLEMENTATION REFERENCE**

### **Component JSX Structure:**
```jsx
<div className="requirements-section">
  <div className="section-header">
    <h3>📋 Job Requirements Template</h3>
    <p>These requirements will be applied to all jobs created for this property.</p>
  </div>
  
  <div className="requirements-list">
    {requirements.map((req, index) => (
      <div key={req.id} className="requirement-item">
        <div className="requirement-form">
          <input
            type="text"
            placeholder="Enter requirement description..."
            value={req.description}
            onChange={(e) => updateRequirement(req.id, { description: e.target.value })}
            className={`description-input ${!req.description ? 'error' : ''}`}
          />
          
          <select
            value={req.category}
            onChange={(e) => updateRequirement(req.id, { category: e.target.value })}
            className="category-select"
          >
            <option value="safety">🛡️ Safety</option>
            <option value="cleaning">🧹 Cleaning</option>
            <option value="maintenance">🔧 Maintenance</option>
            <option value="inspection">🔍 Inspection</option>
            <option value="photo">📸 Photo Documentation</option>
            <option value="other">📝 Other</option>
          </select>
          
          <label className="required-checkbox">
            <input
              type="checkbox"
              checked={req.isRequired}
              onChange={(e) => updateRequirement(req.id, { isRequired: e.target.checked })}
            />
            Required
          </label>
          
          <input
            type="number"
            placeholder="Minutes"
            min="1"
            max="480"
            value={req.estimatedTime || ''}
            onChange={(e) => updateRequirement(req.id, { estimatedTime: parseInt(e.target.value) || undefined })}
            className="time-input"
          />
          
          <textarea
            placeholder="Additional instructions..."
            value={req.notes || ''}
            onChange={(e) => updateRequirement(req.id, { notes: e.target.value })}
            className="notes-input"
            maxLength={500}
          />
          
          <button
            onClick={() => deleteRequirement(req.id)}
            className="delete-button"
            type="button"
          >
            🗑️ Delete
          </button>
          
          {req.category === 'photo' && (
            <div className="photo-upload-section">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handlePhotoUpload(req.id, e.target.files)}
                className="photo-input"
                id={`photo-${req.id}`}
                style={{ display: 'none' }}
              />
              <label htmlFor={`photo-${req.id}`} className="photo-upload-button">
                📸 Upload Photos (Min. 3 required)
              </label>
              {req.photos && req.photos.length > 0 && (
                <span className="photo-count">
                  {req.photos.length} photo{req.photos.length !== 1 ? 's' : ''} selected
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    ))}
  </div>
  
  <div className="section-actions">
    <button onClick={addRequirement} className="add-button">
      + Add Requirement
    </button>
    <button onClick={saveRequirements} className="save-button" disabled={saving}>
      {saving ? 'Saving...' : 'Save Template'}
    </button>
    <button onClick={cancelChanges} className="cancel-button">
      Cancel
    </button>
  </div>
</div>
```

---

## 🎨 **STYLING REQUIREMENTS**

### **Visual Design:**
- **Clean, professional interface** that matches your existing property management UI
- **Card-based layout** for each requirement
- **Clear visual hierarchy** with proper spacing
- **Responsive design** that works on desktop and tablet
- **Loading states** during save operations
- **Error states** with clear validation messages

### **Color Coding by Category:**
- 🛡️ **Safety:** Red accent (#EF4444)
- 🧹 **Cleaning:** Blue accent (#3B82F6)
- 🔧 **Maintenance:** Orange accent (#F97316)
- 🔍 **Inspection:** Purple accent (#8B5CF6)
- 📸 **Photo:** Green accent (#10B981)
- 📝 **Other:** Gray accent (#6B7280)

### **CSS Classes Needed:**
```css
.requirements-section { /* Main container */ }
.section-header { /* Title and description */ }
.requirements-list { /* Container for all requirements */ }
.requirement-item { /* Individual requirement card */ }
.requirement-form { /* Form layout within each card */ }
.description-input { /* Requirement description field */ }
.category-select { /* Category dropdown */ }
.required-checkbox { /* Required checkbox styling */ }
.time-input { /* Time estimation field */ }
.notes-input { /* Notes textarea */ }
.delete-button { /* Delete requirement button */ }
.photo-upload-section { /* Photo upload container */ }
.photo-input { /* Hidden file input */ }
.photo-upload-button { /* Photo upload button styling */ }
.photo-count { /* Photo count display */ }
.section-actions { /* Bottom action buttons */ }
.add-button { /* Add new requirement */ }
.save-button { /* Save template */ }
.cancel-button { /* Cancel changes */ }
.error { /* Error state styling */ }
```

---

## 📊 **EXAMPLE DATA FOR TESTING**

### **Sample Requirements Templates:**

**For Cleaning Properties:**
```typescript
[
  {
    id: 'clean_01',
    description: 'Complete safety walkthrough of property',
    isRequired: true,
    category: 'safety',
    estimatedTime: 10,
    notes: 'Check for hazards, wet floors, broken items'
  },
  {
    id: 'clean_02',
    description: 'Take before photos of all rooms',
    isRequired: true,
    category: 'photo',
    estimatedTime: 5,
    notes: 'Document current state before cleaning',
    photos: [] // Will be populated when photos are uploaded
  },
  {
    id: 'clean_03',
    description: 'Clean all bathrooms thoroughly',
    isRequired: true,
    category: 'cleaning',
    estimatedTime: 30,
    notes: 'Include toilet, shower, sink, mirror, floor'
  },
  {
    id: 'clean_04',
    description: 'Vacuum all carpeted areas',
    isRequired: true,
    category: 'cleaning',
    estimatedTime: 20
  },
  {
    id: 'clean_05',
    description: 'Take after photos of completed work',
    isRequired: true,
    category: 'photo',
    estimatedTime: 5
  }
]
```

**For Maintenance Properties:**
```typescript
[
  {
    id: 'maint_01',
    description: 'Check all safety equipment (smoke detectors, fire extinguishers)',
    isRequired: true,
    category: 'safety',
    estimatedTime: 15,
    notes: 'Test functionality and replace batteries if needed'
  },
  {
    id: 'maint_02',
    description: 'Document any damage or issues found',
    isRequired: true,
    category: 'inspection',
    estimatedTime: 10,
    notes: 'Take photos and detailed notes'
  },
  {
    id: 'maint_03',
    description: 'Test all plumbing fixtures',
    isRequired: false,
    category: 'maintenance',
    estimatedTime: 20,
    notes: 'Check water pressure, leaks, and drainage'
  }
]
```

---

## ✅ **VALIDATION & ERROR HANDLING**

### **Form Validation:**
1. **Required Fields:**
   - Description cannot be empty
   - Category must be selected

2. **Data Validation:**
   - Estimated time must be positive integer (1-480)
   - Notes cannot exceed 500 characters
   - Photo requirements must have minimum 3 photos uploaded
   - At least one requirement should exist before saving

3. **Error Messages:**
   - "Description is required"
   - "Please select a category"
   - "Estimated time must be between 1 and 480 minutes"
   - "Notes cannot exceed 500 characters"
   - "Photo requirements must have at least 3 photos uploaded"

### **Error Display:**
- Show validation errors inline near the problematic field
- Use red border/text for error states
- Display success message after successful save
- Handle network errors gracefully

---

## 🔄 **USER WORKFLOW**

### **Expected User Journey:**
1. **Property Manager** opens property edit page
2. **Scrolls to** "Job Requirements Template" section
3. **Clicks** "Add Requirement" to create new requirements
4. **Fills out** description, category, time estimate, notes
5. **Marks** requirements as required/optional
6. **Adds multiple** requirements as needed
7. **Clicks** "Save Template" to persist to Firestore
8. **Sees confirmation** that template was saved successfully

### **Editing Existing Requirements:**
1. **Loads** existing requirements from property data
2. **Modifies** any field in existing requirements
3. **Adds/removes** requirements as needed
4. **Saves** changes to update Firestore

---

## 🎯 **SUCCESS CRITERIA**

### **Functional Requirements:**
- [ ] Can add new requirements with all fields
- [ ] Can edit existing requirements
- [ ] Can delete requirements with confirmation
- [ ] Can save requirements to Firestore
- [ ] Form validation works correctly
- [ ] Loading states are shown during operations
- [ ] Error handling works for network failures

### **Technical Requirements:**
- [ ] Uses PropertyRequirementTemplate interface structure exactly
- [ ] Integrates seamlessly with existing property management page
- [ ] Maintains existing property data (no data loss)
- [ ] Works with your current authentication/permissions system
- [ ] Responsive design works on desktop and tablet

### **User Experience Requirements:**
- [ ] Intuitive interface that's easy to understand
- [ ] Fast performance with smooth interactions
- [ ] Clear visual feedback for all actions
- [ ] Professional appearance matching existing UI

---

## 🚀 **IMPLEMENTATION STRATEGY**

### **Phase 1: Basic Implementation**
1. Create PropertyRequirementsSection component
2. Add basic CRUD operations (Create, Read, Update, Delete)
3. Implement Firestore integration
4. Add to property management page

### **Phase 2: Enhanced Features**
1. Add form validation and error handling
2. Implement loading states and user feedback
3. Add styling and responsive design
4. Test with sample data

### **Phase 3: Integration & Testing**
1. Test with real property data
2. Verify mobile app integration works
3. Handle edge cases and error scenarios
4. Performance optimization

---

## 📞 **INTEGRATION WITH MOBILE**

### **How This Connects to Mobile App:**
- Property requirements you create will automatically be applied to new jobs
- Mobile completion wizard will validate these requirements
- Staff will see structured checklists based on your templates
- Rich completion data will flow back to your system

### **No Mobile Changes Needed:**
- Mobile team has already implemented their side
- Your webapp interface is the missing piece
- Once you implement this, the full system will work end-to-end

---

## 💡 **ADDITIONAL CONSIDERATIONS**

### **Performance:**
- Load requirements efficiently (don't re-fetch unnecessarily)
- Debounce save operations to avoid excessive Firestore writes
- Cache property data locally during editing

### **Accessibility:**
- Proper ARIA labels for screen readers
- Keyboard navigation support
- Focus management for dynamic forms

### **Future Enhancements:**
- Template duplication between properties
- Bulk import/export of requirements
- Analytics on requirement completion rates
- Property type-based default templates

---

## 🎉 **EXPECTED IMPACT**

Once implemented, this system will provide:

### **For Property Managers:**
- ✅ Standardized job quality across all properties
- ✅ Easy template management for different property types  
- ✅ Consistent service delivery standards

### **For Field Staff:**
- ✅ Clear, structured job requirements on mobile
- ✅ Step-by-step completion guidance
- ✅ Professional workflow with rich data capture

### **For Business:**
- ✅ Quality control and consistency
- ✅ Rich job completion analytics
- ✅ Scalable property management system

---

## 🚀 **READY TO IMPLEMENT!**

You have all the technical specifications, examples, and requirements needed to build this feature. The mobile team is standing by to test integration once you complete the webapp interface.

**Build something awesome!** 🎯
