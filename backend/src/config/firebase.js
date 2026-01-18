require('dotenv').config();
const admin = require('firebase-admin');

// Load service account key with error handling
let serviceAccount;
try {
  serviceAccount = require('../../serviceAccountKey.json');
} catch (error) {
  console.error('❌ serviceAccountKey.json not found!');
  console.error('   Please download it from Firebase Console:');
  console.error('   Project Settings > Service Accounts > Generate New Private Key');
  process.exit(1);
}

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});

// Set up Firestore database connection
const db = admin.firestore();

// Set up Storage bucket connection
const storage = admin.storage().bucket();

// Connection test
db.collection('_test').doc('test').set({
  test: true,
  timestamp: admin.firestore.FieldValue.serverTimestamp()
})
  .then(() => console.log('✅ Firestore connected'))
  .catch(err => console.error('❌ Firestore error:', err.message));

// Log storage bucket
console.log('✅ Storage bucket:', process.env.FIREBASE_STORAGE_BUCKET || 'not configured');

/*
 * FIRESTORE COLLECTIONS:
 * - videos: video metadata
 * - searches: search history
 * - conversations: AI chat history
 * - timeline_cache: cached timeline data
 */

module.exports = { db, storage, admin };
