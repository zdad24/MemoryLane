/**
 * Firebase Admin SDK for server-side operations
 * Used in Next.js API routes (runs on server only)
 *
 * Uses lazy initialization to prevent build-time errors when
 * environment variables aren't set.
 */

import admin from 'firebase-admin';

// Lazy initialization - only init when first accessed
let _db: admin.firestore.Firestore | null = null;
let _storage: ReturnType<typeof admin.storage.prototype.bucket> | null = null;
let _initialized = false;

function initializeFirebaseAdmin() {
  if (_initialized) return;

  if (admin.apps.length > 0) {
    _initialized = true;
    return;
  }

  // Get credentials from environment variables
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase Admin credentials not found. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables.'
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    storageBucket,
  });

  _initialized = true;
}

// Lazy getter for Firestore
export const db = new Proxy({} as admin.firestore.Firestore, {
  get(target, prop) {
    if (!_db) {
      initializeFirebaseAdmin();
      _db = admin.firestore();
    }
    return (_db as Record<string | symbol, unknown>)[prop];
  },
});

// Lazy getter for Storage
export const storage = new Proxy({} as ReturnType<typeof admin.storage.prototype.bucket>, {
  get(target, prop) {
    if (!_storage) {
      initializeFirebaseAdmin();
      _storage = admin.storage().bucket();
    }
    return (_storage as Record<string | symbol, unknown>)[prop];
  },
});

// Export admin for FieldValue access
export { admin };

/**
 * Helper to convert Firestore Timestamp to Date
 */
export function timestampToDate(
  timestamp: admin.firestore.Timestamp | Date | string | undefined | null
): Date | null {
  if (!timestamp) return null;

  // Check if it's a Firestore Timestamp (has toDate method)
  if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }

  if (timestamp instanceof Date) {
    return timestamp;
  }

  if (typeof timestamp === 'string') {
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? null : date;
  }

  return null;
}

/**
 * Video document interface
 */
export interface VideoDocument {
  id: string;
  fileName: string;
  originalName: string;
  storageUrl: string;
  storagePath: string;
  uploadedAt: Date | null;
  fileSize: number;
  mimeType: string;
  status: string;
  indexingStatus: 'pending' | 'indexing' | 'completed' | 'failed' | 'timeout';
  twelveLabsVideoId?: string;
  twelveLabsTaskId?: string;
  twelveLabsIndexId?: string;
  summary?: string;
  transcript?: string;
  duration?: number;
  emotionTags?: string[];
  dominantEmotion?: string;
  indexingError?: string;
}

/**
 * Convert Firestore document to VideoDocument
 */
export function docToVideo(
  doc: admin.firestore.DocumentSnapshot
): VideoDocument | null {
  if (!doc.exists) return null;
  const data = doc.data()!;
  return {
    id: doc.id,
    fileName: data.fileName || '',
    originalName: data.originalName || '',
    storageUrl: data.storageUrl || '',
    storagePath: data.storagePath || '',
    uploadedAt: timestampToDate(data.uploadedAt),
    fileSize: data.fileSize || 0,
    mimeType: data.mimeType || '',
    status: data.status || 'uploaded',
    indexingStatus: data.indexingStatus || 'pending',
    twelveLabsVideoId: data.twelveLabsVideoId,
    twelveLabsTaskId: data.twelveLabsTaskId,
    twelveLabsIndexId: data.twelveLabsIndexId,
    summary: data.summary,
    transcript: data.transcript,
    duration: data.duration,
    emotionTags: data.emotionTags,
    dominantEmotion: data.dominantEmotion,
    indexingError: data.indexingError,
  };
}
