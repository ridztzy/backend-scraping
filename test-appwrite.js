// Test Appwrite connection
require('dotenv').config();
const appwriteStorage = require('./lib/appwriteStorage');

console.log('🔍 Testing Appwrite Configuration...\n');

console.log('Environment Variables:');
console.log('- ENABLE_APPWRITE:', process.env.ENABLE_APPWRITE);
console.log('- APPWRITE_ENDPOINT:', process.env.APPWRITE_ENDPOINT);
console.log('- APPWRITE_PROJECT_ID:', process.env.APPWRITE_PROJECT_ID);
console.log('- APPWRITE_BUCKET_ID:', process.env.APPWRITE_BUCKET_ID);
console.log('- API Key length:', process.env.APPWRITE_API_KEY ? process.env.APPWRITE_API_KEY.length : 0);

console.log('\n✨ Appwrite Status:');
console.log('- Enabled:', appwriteStorage.isEnabled());

if (appwriteStorage.isEnabled()) {
  console.log('\n✅ Appwrite is configured and ready!');
  console.log('\n💡 Next: Restart server and test scraping endpoint');
} else {
  console.log('\n⚠️ Appwrite is disabled or not configured properly');
  console.log('Check your .env file and make sure:');
  console.log('1. ENABLE_APPWRITE=true');
  console.log('2. All credentials are filled in');
}
