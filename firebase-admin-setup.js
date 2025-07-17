#!/usr/bin/env node

/**
 * FIREBASE-ADMIN-SETUP.JS - Quick Firebase Admin Setup
 * 
 * This script helps you set up Firebase Admin credentials quickly
 * It will guide you through the process step by step
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function setupFirebaseAdmin() {
  console.log('🔧 FIREBASE ADMIN SETUP WIZARD\n' + '='.repeat(50));
  console.log('This will help you set up Firebase Admin credentials for the staff-fix script.\n');

  const method = await askQuestion(
    'Choose setup method:\n' +
    '1. Download service account key (Recommended)\n' +
    '2. Use environment variables\n' +
    '3. Skip setup (manual configuration)\n' +
    'Select option (1-3): '
  );

  switch (method) {
    case '1':
      await setupServiceAccountFile();
      break;
    case '2':
      await setupEnvironmentVariables();
      break;
    case '3':
      await showManualInstructions();
      break;
    default:
      console.log('❌ Invalid option selected.');
      process.exit(1);
  }

  rl.close();
}

async function setupServiceAccountFile() {
  console.log('\n📋 SERVICE ACCOUNT KEY SETUP\n' + '='.repeat(40));
  
  console.log('Step 1: Download Firebase Service Account Key');
  console.log('1. Go to: https://console.firebase.google.com/');
  console.log('2. Select your project: operty-b54dc');
  console.log('3. Click gear icon → Project Settings');
  console.log('4. Go to Service Accounts tab');
  console.log('5. Click "Generate new private key"');
  console.log('6. Download the JSON file');
  
  await askQuestion('\nPress Enter when you have downloaded the service account key...');
  
  const filePath = await askQuestion('\nEnter the path to your downloaded service account key file: ');
  
  if (!fs.existsSync(filePath)) {
    console.log('❌ File not found. Please check the path and try again.');
    return;
  }

  try {
    // Read and validate the service account file
    const serviceAccountContent = fs.readFileSync(filePath, 'utf8');
    const serviceAccount = JSON.parse(serviceAccountContent);
    
    if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
      console.log('❌ Invalid service account file. Please download a fresh one.');
      return;
    }

    // Copy to project directory as firebase-admin-key.json
    const targetPath = path.join(process.cwd(), 'firebase-admin-key.json');
    fs.copyFileSync(filePath, targetPath);
    
    console.log('✅ Service account key copied to: firebase-admin-key.json');
    
    // Add to .gitignore if it exists
    const gitignorePath = path.join(process.cwd(), '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
      if (!gitignoreContent.includes('firebase-admin-key.json')) {
        fs.appendFileSync(gitignorePath, '\n# Firebase Admin Key\nfirebase-admin-key.json\n');
        console.log('✅ Added firebase-admin-key.json to .gitignore');
      }
    }

    console.log('\n🎉 Setup Complete!');
    console.log('You can now run: node staff-fix.js');
    
  } catch (error) {
    console.error('❌ Error setting up service account:', error.message);
  }
}

async function setupEnvironmentVariables() {
  console.log('\n🌍 ENVIRONMENT VARIABLES SETUP\n' + '='.repeat(40));
  
  console.log('You need to set these environment variables:');
  console.log('');
  console.log('export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"');
  console.log('');
  console.log('Or add to your shell profile:');
  console.log('echo \'export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"\' >> ~/.zshrc');
  console.log('source ~/.zshrc');
  
  const filePath = await askQuestion('\nEnter the full path to your service account key file: ');
  
  if (!fs.existsSync(filePath)) {
    console.log('❌ File not found. Please check the path.');
    return;
  }

  console.log('\n📋 Run this command in your terminal:');
  console.log(`export GOOGLE_APPLICATION_CREDENTIALS="${filePath}"`);
  console.log('\n🎉 After setting the environment variable, you can run: node staff-fix.js');
}

async function showManualInstructions() {
  console.log('\n📖 MANUAL SETUP INSTRUCTIONS\n' + '='.repeat(40));
  
  console.log('Option 1: Service Account Key File');
  console.log('1. Download service account key from Firebase Console');
  console.log('2. Save as: firebase-admin-key.json in project root');
  console.log('3. Add to .gitignore: firebase-admin-key.json');
  
  console.log('\nOption 2: Environment Variable');
  console.log('1. Set GOOGLE_APPLICATION_CREDENTIALS to path of service account key');
  console.log('2. Example: export GOOGLE_APPLICATION_CREDENTIALS="/path/to/key.json"');
  
  console.log('\nOption 3: Use existing client credentials (Alternative)');
  console.log('1. Use the manual Firebase Console approach');
  console.log('2. Create Firebase Auth accounts manually');
  console.log('3. Update staff documents manually in Firestore Console');
  
  console.log('\n🔗 Firebase Console Links:');
  console.log('- Project: https://console.firebase.google.com/project/operty-b54dc');
  console.log('- Authentication: https://console.firebase.google.com/project/operty-b54dc/authentication/users');
  console.log('- Firestore: https://console.firebase.google.com/project/operty-b54dc/firestore/data');
}

// Test current Firebase setup
async function testFirebaseSetup() {
  console.log('\n🧪 TESTING CURRENT FIREBASE SETUP\n' + '='.repeat(40));
  
  try {
    const admin = require('firebase-admin');
    
    // Check if admin is already initialized
    if (admin.apps.length > 0) {
      console.log('✅ Firebase Admin already initialized');
      return true;
    }

    // Try different initialization methods
    if (fs.existsSync('./firebase-admin-key.json')) {
      console.log('✅ Found firebase-admin-key.json');
      return true;
    }

    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.log('✅ Found GOOGLE_APPLICATION_CREDENTIALS environment variable');
      return true;
    }

    console.log('❌ No Firebase Admin credentials found');
    return false;
    
  } catch (error) {
    console.log('❌ Firebase Admin not available:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Firebase Admin Setup...\n');
  
  const isSetup = await testFirebaseSetup();
  
  if (isSetup) {
    console.log('\n🎉 Firebase Admin is already configured!');
    console.log('You can run: node staff-fix.js');
    
    const runNow = await askQuestion('\nDo you want to run staff-fix.js now? (y/n): ');
    if (runNow.toLowerCase() === 'y') {
      rl.close();
      require('./staff-fix.js');
      return;
    }
  } else {
    await setupFirebaseAdmin();
  }
}

// Handle script termination
process.on('SIGINT', () => {
  console.log('\n\n👋 Setup cancelled by user');
  rl.close();
  process.exit(0);
});

// Run the setup
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Setup failed:', error.message);
    rl.close();
    process.exit(1);
  });
}

module.exports = { setupFirebaseAdmin, testFirebaseSetup };
