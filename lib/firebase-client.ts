/**
 * Firebase Client SDK for direct browser uploads
 * Bypasses Vercel's 4.5MB payload limit by uploading directly to Firebase Storage
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  UploadTaskSnapshot,
} from 'firebase/storage';
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';

// Firebase client configuration (public keys - safe for client-side)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase (singleton pattern)
let app: FirebaseApp;

function getFirebaseApp(): FirebaseApp {
  if (!app) {
    const existingApps = getApps();
    if (existingApps.length > 0) {
      app = existingApps[0];
    } else {
      app = initializeApp(firebaseConfig);
    }
  }
  return app;
}

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progress: number; // 0-100
  state: 'running' | 'paused' | 'success' | 'canceled' | 'error';
}

export interface UploadResult {
  videoId: string;
  storageUrl: string;
  storagePath: string;
}

/**
 * Upload a video file directly to Firebase Storage with progress tracking
 * @param file - The video file to upload
 * @param onProgress - Optional callback for upload progress updates
 * @returns Promise with videoId and storage URL
 */
export async function uploadVideoToFirebase(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  const firebaseApp = getFirebaseApp();
  const storage = getStorage(firebaseApp);
  const firestore = getFirestore(firebaseApp);

  // Generate unique filename with timestamp
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileName = `${Date.now()}_${sanitizedName}`;
  const storagePath = `videos/${fileName}`;

  // Create storage reference
  const storageRef = ref(storage, storagePath);

  // Create upload task with resumable upload
  const uploadTask = uploadBytesResumable(storageRef, file, {
    contentType: file.type,
    customMetadata: {
      originalName: file.name,
    },
  });

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot: UploadTaskSnapshot) => {
        // Calculate progress
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;

        // Map Firebase state to our state type
        let state: UploadProgress['state'] = 'running';
        switch (snapshot.state) {
          case 'paused':
            state = 'paused';
            break;
          case 'running':
            state = 'running';
            break;
        }

        if (onProgress) {
          onProgress({
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            progress: Math.round(progress),
            state,
          });
        }
      },
      (error) => {
        // Handle upload errors
        console.error('[Firebase] Upload error:', error);
        if (onProgress) {
          onProgress({
            bytesTransferred: 0,
            totalBytes: file.size,
            progress: 0,
            state: 'error',
          });
        }
        reject(new Error(error.message || 'Upload failed'));
      },
      async () => {
        // Upload completed successfully
        try {
          // Get download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          // Create Firestore document with video metadata
          const videoData = {
            fileName,
            originalName: file.name,
            storageUrl: downloadURL,
            storagePath,
            uploadedAt: serverTimestamp(),
            fileSize: file.size,
            mimeType: file.type,
            status: 'uploaded',
            indexingStatus: 'pending' as const,
          };

          const docRef = await addDoc(collection(firestore, 'videos'), videoData);

          console.log(`[Firebase] Video uploaded successfully: ${docRef.id}`);

          if (onProgress) {
            onProgress({
              bytesTransferred: file.size,
              totalBytes: file.size,
              progress: 100,
              state: 'success',
            });
          }

          resolve({
            videoId: docRef.id,
            storageUrl: downloadURL,
            storagePath,
          });
        } catch (error) {
          console.error('[Firebase] Error creating Firestore document:', error);
          reject(error);
        }
      }
    );
  });
}

/**
 * Check if Firebase is properly configured
 */
export function isFirebaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  );
}
