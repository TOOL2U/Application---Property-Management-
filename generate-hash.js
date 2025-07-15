/**
 * Generate Fresh Password Hash
 * Generate a new bcrypt hash for the password "admin123"
 */

const bcrypt = require('bcryptjs');

async function generatePasswordHash() {
  console.log('🔐 Generating fresh password hash...');
  
  const password = 'admin123';
  const saltRounds = 12;
  
  console.log(`🔑 Password: ${password}`);
  console.log(`🧂 Salt rounds: ${saltRounds}`);
  
  try {
    const hash = await bcrypt.hash(password, saltRounds);
    console.log(`🔐 Generated hash: ${hash}`);
    
    // Test the hash
    const isValid = await bcrypt.compare(password, hash);
    console.log(`✅ Hash verification: ${isValid ? 'PASS' : 'FAIL'}`);
    
    if (isValid) {
      console.log('\n🎉 Hash generated successfully!');
      console.log('📋 Use this hash in your user document:');
      console.log(`"passwordHash": "${hash}"`);
    } else {
      console.log('❌ Hash verification failed');
    }
    
  } catch (error) {
    console.error('❌ Error generating hash:', error);
  }
}

generatePasswordHash();
