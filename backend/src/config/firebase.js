/**
 * Firebase Admin SDK Configuration
 */

const admin = require('firebase-admin');

let firebaseApp = null;
let db = null;

/**
 * Initialize Firebase Admin SDK
 * @returns {Object} Firebase app instance
 */
const initializeFirebase = () => {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });

    db = admin.firestore();
    console.log('[Firebase] Successfully initialized');

    return firebaseApp;
  } catch (error) {
    console.error('[Firebase] Initialization error:', error.message);
    throw error;
  }
};

/**
 * Get Firestore database instance
 * @returns {Object} Firestore instance
 */
const getDb = () => {
  if (!db) {
    initializeFirebase();
  }
  return db;
};

/**
 * Get Firebase Auth instance
 * @returns {Object} Firebase Auth instance
 */
const getAuth = () => {
  if (!firebaseApp) {
    initializeFirebase();
  }
  return admin.auth();
};

module.exports = {
  initializeFirebase,
  getDb,
  getAuth,
  admin,
};
