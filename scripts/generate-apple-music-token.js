/**
 * Apple Music API JWT Developer Token Generator
 * 
 * Prerequisites:
 * 1. Apple Developer Program membership
 * 2. MusicKit Private Key (.p8 file) from Apple Developer Portal
 * 3. Team ID and Key ID from Apple Developer Portal
 * 
 * Usage:
 * 1. Place your AuthKey_XXXXXXXXXX.p8 file in the keys/ folder
 * 2. Update the variables below with your Team ID and Key ID
 * 3. Run: node scripts/generate-apple-music-token.js
 * 4. The token will be saved to .env.local
 * 
 * Note: Tokens expire after max 180 days. Set a reminder to regenerate.
 */

const fs = require('fs');
const jwt = require('jsonwebtoken');
const path = require('path');

// ============================================
// CONFIGURATION - Update these values
// ============================================

const TEAM_ID = 'D6J2XPFHHW';     // 10-character team ID from Apple Developer Portal
const KEY_ID = 'JW4AQ69B9T';       // 10-character key ID from your MusicKit key
const KEY_FILE = 'keys/AuthKey_JW4AQ69B9T.p8'; // Your .p8 key file in keys/ folder

// Token expiration (max 180 days = 15552000 seconds)
const EXPIRATION = '180d'; // Options: '180d', '90d', '30d', etc.

// ============================================
// Generate Token
// ============================================

try {
  // Read the private key file
  const keyPath = path.join(__dirname, '..', KEY_FILE);
  
  if (!fs.existsSync(keyPath)) {
    console.error('❌ Error: Key file not found!');
    console.error(`   Expected: ${keyPath}`);
    console.error('   Please place your .p8 file in the keys/ folder and update KEY_FILE variable.');
    process.exit(1);
  }
  
  const privateKey = fs.readFileSync(keyPath, 'utf8');
  
  // Validate configuration
  if (TEAM_ID === 'YOUR_TEAM_ID' || KEY_ID === 'YOUR_KEY_ID') {
    console.error('❌ Error: Please update TEAM_ID and KEY_ID in the script!');
    console.error('   Get these from: https://developer.apple.com/account');
    process.exit(1);
  }
  
  // Generate JWT token
  const token = jwt.sign({}, privateKey, {
    algorithm: 'ES256',
    expiresIn: EXPIRATION,
    issuer: TEAM_ID,
    header: {
      alg: 'ES256',
      kid: KEY_ID
    }
  });
  
  // Calculate expiration date
  const expirationMs = EXPIRATION.endsWith('d') 
    ? parseInt(EXPIRATION) * 24 * 60 * 60 * 1000 
    : 180 * 24 * 60 * 60 * 1000;
  const expiryDate = new Date(Date.now() + expirationMs);
  
  console.log('✅ Apple Music Developer Token generated successfully!\n');
  console.log('Token:', token.substring(0, 50) + '...');
  console.log('\nExpires:', expiryDate.toLocaleDateString());
  console.log('Set reminder to regenerate before:', expiryDate.toLocaleDateString());
  
  // Save to .env.local
  const envPath = path.join(__dirname, '..', '.env.local');
  const envContent = `
# Apple Music API Configuration
# Generated: ${new Date().toISOString()}
# Expires: ${expiryDate.toISOString()}

# Server-side only (API routes)
APPLE_MUSIC_DEV_TOKEN=${token}
APPLE_MUSIC_KEY_ID=${KEY_ID}
APPLE_MUSIC_TEAM_ID=${TEAM_ID}

# Client-side (MusicKit JS)
NEXT_PUBLIC_APPLE_MUSIC_DEV_TOKEN=${token}
`;
  
  // Check if .env.local exists
  if (fs.existsSync(envPath)) {
    console.log('\n⚠️  Warning: .env.local already exists!');
    console.log('   Append the following to your .env.local manually:\n');
    console.log(envContent);
  } else {
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ Token saved to .env.local');
  }
  
  console.log('\n📝 Next steps:');
  console.log('1. Add .env.local to .gitignore (if not already)');
  console.log('2. Test the token with: curl -H "Authorization: Bearer YOUR_TOKEN" "https://api.music.apple.com/v1/catalog/us/artists/1203816887"');
  console.log('3. Set calendar reminder to regenerate token before', expiryDate.toLocaleDateString());
  
} catch (error) {
  console.error('❌ Error generating token:', error.message);
  process.exit(1);
}
