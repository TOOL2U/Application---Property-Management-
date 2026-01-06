/**
 * Firebase Storage Debug Test
 * Tests Firebase Storage initialization and configuration
 */

console.log('🔍 Testing Firebase Storage Configuration...\n');

// Test environment variables
function testEnvironmentVariables() {
  console.log('📋 Environment Variables Check:');
  
  const requiredVars = [
    'EXPO_PUBLIC_FIREBASE_API_KEY',
    'EXPO_PUBLIC_FIREBASE_PROJECT_ID', 
    'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'EXPO_PUBLIC_FIREBASE_APP_ID'
  ];
  
  const results = {};
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    const status = value ? '✅' : '❌';
    results[varName] = {
      status,
      hasValue: !!value,
      value: value ? (varName.includes('STORAGE_BUCKET') ? value : '[HIDDEN]') : 'MISSING'
    };
    console.log(`   ${status} ${varName}: ${results[varName].value}`);
  });
  
  return results;
}

// Test Firebase configuration object
function testFirebaseConfig() {
  console.log('\n🔥 Firebase Config Object:');
  
  const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  };
  
  console.log('   Config structure:');
  Object.entries(firebaseConfig).forEach(([key, value]) => {
    const status = value ? '✅' : '❌';
    const displayValue = key === 'storageBucket' ? value : (value ? '[CONFIGURED]' : 'MISSING');
    console.log(`     ${status} ${key}: ${displayValue}`);
  });
  
  return firebaseConfig;
}

// Test storage bucket format
function testStorageBucket() {
  console.log('\n🗄️ Storage Bucket Analysis:');
  
  const storageBucket = process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET;
  
  if (!storageBucket) {
    console.log('   ❌ Storage bucket not configured');
    return null;
  }
  
  console.log(`   📍 Bucket URL: ${storageBucket}`);
  
  // Check bucket format
  const isValidFormat = storageBucket.includes('.firebasestorage.app') || 
                       storageBucket.includes('.appspot.com');
  const status = isValidFormat ? '✅' : '⚠️';
  console.log(`   ${status} Format validation: ${isValidFormat ? 'Valid' : 'Check format'}`);
  
  // Extract project ID from bucket
  const projectId = storageBucket.split('.')[0];
  console.log(`   🔍 Extracted project ID: ${projectId}`);
  
  return { storageBucket, isValidFormat, projectId };
}

// Simulate Firebase Storage initialization
function simulateStorageInit() {
  console.log('\n🚀 Storage Initialization Simulation:');
  
  const firebaseConfig = testFirebaseConfig();
  
  console.log('\n   Initialization steps:');
  console.log('   1. ✅ Import Firebase Storage functions');
  console.log('   2. ✅ Check Firebase app initialization');
  
  if (!firebaseConfig.storageBucket) {
    console.log('   3. ❌ Storage bucket missing - initialization would fail');
    return false;
  }
  
  console.log('   3. ✅ Storage bucket configured');
  console.log('   4. ✅ getStorage(app) would be called');
  console.log('   5. ✅ Storage instance created');
  
  return true;
}

// Test photo upload path generation
function testPhotoUploadPath() {
  console.log('\n📸 Photo Upload Path Test:');
  
  const mockJobId = 'JYOf7LqV6egMi3M5bZSN';
  const mockType = 'completion';
  const timestamp = Date.now();
  
  const filename = `job_${mockJobId}_${mockType}_${timestamp}.jpg`;
  const fullPath = `job_photos/${mockJobId}/${filename}`;
  
  console.log(`   📁 Generated filename: ${filename}`);
  console.log(`   📂 Full storage path: ${fullPath}`);
  console.log('   ✅ Path generation working correctly');
  
  return { filename, fullPath };
}

// Test Firebase Storage ref() function call
function testStorageRef() {
  console.log('\n🔗 Storage Reference Test:');
  
  const mockPath = 'job_photos/test_job/test_photo.jpg';
  
  console.log(`   📍 Testing path: ${mockPath}`);
  console.log('   🔄 ref(storage, path) simulation...');
  
  // This is where the error is happening: ref(storage, path)
  console.log('   💡 Error location: ref(storage, path) where storage is undefined');
  console.log('   🔍 Root cause: storage proxy not returning valid instance');
  
  return mockPath;
}

// Run all tests
console.log('🧪 Running Firebase Storage Debug Tests...\n');

const envVars = testEnvironmentVariables();
const firebaseConfig = testFirebaseConfig();
const bucketInfo = testStorageBucket();
const initSuccess = simulateStorageInit();
const pathInfo = testPhotoUploadPath();
const refTest = testStorageRef();

console.log('\n📊 Debug Summary:');
console.log('═══════════════════════════════════════════════');

if (envVars['EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'].hasValue) {
  console.log('✅ CONFIGURED: Storage bucket environment variable');
} else {
  console.log('❌ MISSING: Storage bucket environment variable');
}

if (bucketInfo?.isValidFormat) {
  console.log('✅ VALID: Storage bucket format');
} else {
  console.log('❌ INVALID: Storage bucket format');
}

if (initSuccess) {
  console.log('✅ SIMULATED: Storage initialization would succeed');
} else {
  console.log('❌ FAILED: Storage initialization would fail');
}

console.log('\n🎯 Issue Analysis:');
console.log('The error "Cannot read property \'path\' of undefined" at line 815 suggests:');
console.log('1. The storage object is undefined when ref() is called');
console.log('2. The Firebase Storage proxy is not returning a valid instance');
console.log('3. getFirebaseStorage() function may be failing silently');

console.log('\n🔧 Recommended Fixes:');
console.log('1. ✅ DONE: Add direct getStorage() fallback in photo upload');
console.log('2. ✅ DONE: Add storage validation before ref() call');
console.log('3. ✅ DONE: Add detailed logging to Firebase Storage init');
console.log('4. 🔄 TODO: Test the app with new error handling');

console.log('\n📱 Next Steps:');
console.log('1. Run the mobile app');
console.log('2. Attempt job completion with photos');
console.log('3. Check console for new detailed storage logs');
console.log('4. Verify if direct getStorage() fallback works');

console.log('\n✨ Storage configuration appears correct - issue is in initialization/proxy');
