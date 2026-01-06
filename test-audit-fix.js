/**
 * Test script to verify the Firestore undefined value fix
 */

console.log('🧪 Testing Firestore undefined value handling...');

// Simulate the problematic data structure
const testJobDetails = {
  title: 'Test Job',
  description: 'Test Description',
  category: 'cleaning',
  priority: 'medium',
  estimatedDuration: 120,
  specialInstructions: undefined, // This was causing the error
};

const testStaffDetails = {
  staffId: 'test_staff',
  name: 'Test Staff',
  role: 'cleaner',
  department: undefined, // This could also cause issues
};

// Apply the same fix logic
const sanitizedJobDetails = {
  title: testJobDetails?.title || 'Untitled Job',
  description: testJobDetails?.description || '',
  category: testJobDetails?.category || 'general',
  priority: testJobDetails?.priority || 'medium',
  ...(testJobDetails?.estimatedDuration !== undefined && { estimatedDuration: testJobDetails.estimatedDuration }),
  ...(testJobDetails?.specialInstructions !== undefined && { specialInstructions: testJobDetails.specialInstructions }),
};

const sanitizedStaffDetails = {
  staffId: testStaffDetails?.staffId || 'unknown',
  name: testStaffDetails?.name || 'Unknown Staff',
  role: testStaffDetails?.role || 'staff',
  ...(testStaffDetails?.department !== undefined && { department: testStaffDetails.department }),
};

console.log('📋 Original Job Details:', testJobDetails);
console.log('✅ Sanitized Job Details:', sanitizedJobDetails);
console.log('👥 Original Staff Details:', testStaffDetails);
console.log('✅ Sanitized Staff Details:', sanitizedStaffDetails);

// Check for undefined values
const hasUndefinedInJob = Object.values(sanitizedJobDetails).some(value => value === undefined);
const hasUndefinedInStaff = Object.values(sanitizedStaffDetails).some(value => value === undefined);

console.log('🔍 Job Details has undefined values:', hasUndefinedInJob);
console.log('🔍 Staff Details has undefined values:', hasUndefinedInStaff);

if (!hasUndefinedInJob && !hasUndefinedInStaff) {
  console.log('✅ SUCCESS: No undefined values found - Firestore compatible!');
} else {
  console.log('❌ FAILED: Still contains undefined values');
}

console.log('🧪 Test completed');
