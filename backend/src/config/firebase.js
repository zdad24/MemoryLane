require('dotenv').config();
const admin = require('firebase-admin');

// Prefer serviceAccountKey.json if present, otherwise fall back to env vars.
let serviceAccount;
try {
  serviceAccount = require('../../serviceAccountKey.json');
} catch (error) {
  const {
    FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY,
  } = process.env;

  if (FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
    serviceAccount = {
      project_id: FIREBASE_PROJECT_ID,
      client_email: FIREBASE_CLIENT_EMAIL,
      private_key: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
  } else {
    console.error('❌ Firebase credentials not found.');
    console.error('   Provide serviceAccountKey.json at repo root OR set env vars:');
    console.error('   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
    process.exit(1);
  }
}

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
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
