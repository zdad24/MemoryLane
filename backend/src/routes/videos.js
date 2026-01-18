/**
 * Videos Routes
 * Handles video upload, listing, and retrieval
 */

const express = require('express');
const multer = require('multer');
const { db, storage } = require('../config/firebase');
const { asyncHandler, NotFoundError, ValidationError } = require('../utils/errors');
const { indexVideo } = require('../services/twelvelabs.service');

const router = express.Router();

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/mpeg', 'application/octet-stream'];
    const allowedExts = ['.mp4', '.mov', '.avi', '.webm', '.mpeg', '.mkv'];
    const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));

    if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new ValidationError(`Invalid file type: ${file.mimetype}. Only video files are allowed.`));
    }
  },
});

/**
 * POST /api/videos/upload
 * Upload a new video to Firebase Storage
 */
router.post(
  '/upload',
  upload.single('video'),
  asyncHandler(async (req, res) => {
    console.log('[Videos] Upload request received');

    // Check if file was provided
    if (!req.file) {
      console.log('[Videos] No file provided in request');
      throw new ValidationError('No video file provided');
    }

    const file = req.file;
    console.log(`[Videos] Processing file: ${file.originalname} (${file.size} bytes, ${file.mimetype})`);

    try {
      // Create unique filename with timestamp
      const fileName = `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const filePath = `videos/${fileName}`;
      console.log(`[Videos] Uploading to Firebase Storage: ${filePath}`);

      // Create blob reference
      const blob = storage.file(filePath);

      // Upload file to Firebase Storage
      await new Promise((resolve, reject) => {
        const blobStream = blob.createWriteStream({
          metadata: {
            contentType: file.mimetype,
          },
        });

        blobStream.on('error', (error) => {
          console.error('[Videos] Upload stream error:', error.message);
          reject(error);
        });

        blobStream.on('finish', () => {
          console.log('[Videos] Upload stream completed');
          resolve();
        });

        blobStream.end(file.buffer);
      });

      // Make the file public
      console.log('[Videos] Making file public...');
      await blob.makePublic();

      // Get public URL
      const publicUrl = `https://storage.googleapis.com/${storage.name}/${filePath}`;
      console.log(`[Videos] Public URL: ${publicUrl}`);

      // Create Firestore document
      const videoData = {
        fileName: fileName,
        originalName: file.originalname,
        storageUrl: publicUrl,
        storagePath: filePath,
        uploadedAt: new Date(),
        fileSize: file.size,
        mimeType: file.mimetype,
        status: 'uploaded',
        indexingStatus: 'pending',
      };

      console.log('[Videos] Creating Firestore document...');
      const docRef = await db.collection('videos').add(videoData);
      console.log(`[Videos] Document created with ID: ${docRef.id}`);

      res.status(201).json({
        success: true,
        videoId: docRef.id,
        url: publicUrl,
        message: 'Video uploaded successfully',
      });

    } catch (error) {
      console.error('[Videos] Upload error:', error.message);
      throw error;
    }
  })
);

/**
 * GET /api/videos
 * List all videos from Firestore
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    console.log('[Videos] Fetching video list...');

    try {
      const snapshot = await db
        .collection('videos')
        .orderBy('uploadedAt', 'desc')
        .limit(50)
        .get();

      const videos = [];
      snapshot.forEach((doc) => {
        videos.push({
          id: doc.id,
          ...doc.data(),
          uploadedAt: doc.data().uploadedAt?.toDate?.() || doc.data().uploadedAt,
        });
      });

      console.log(`[Videos] Found ${videos.length} videos`);

      res.json({
        success: true,
        videos: videos,
        count: videos.length,
      });

    } catch (error) {
      console.error('[Videos] List error:', error.message);
      throw error;
    }
  })
);

/**
 * GET /api/videos/:id
 * Get a single video by ID
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    console.log(`[Videos] Fetching video: ${id}`);

    try {
      const doc = await db.collection('videos').doc(id).get();

      if (!doc.exists) {
        console.log(`[Videos] Video not found: ${id}`);
        throw new NotFoundError(`Video not found: ${id}`);
      }

      const videoData = doc.data();
      console.log(`[Videos] Found video: ${videoData.originalName}`);

      res.json({
        success: true,
        id: doc.id,
        ...videoData,
        uploadedAt: videoData.uploadedAt?.toDate?.() || videoData.uploadedAt,
      });

    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('[Videos] Get error:', error.message);
      throw error;
    }
  })
);

/**
 * DELETE /api/videos/:id
 * Delete a video by ID
 */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    console.log(`[Videos] Deleting video: ${id}`);

    try {
      // Get video document
      const doc = await db.collection('videos').doc(id).get();

      if (!doc.exists) {
        console.log(`[Videos] Video not found: ${id}`);
        throw new NotFoundError(`Video not found: ${id}`);
      }

      const videoData = doc.data();

      // Delete from Firebase Storage
      if (videoData.storagePath) {
        console.log(`[Videos] Deleting from storage: ${videoData.storagePath}`);
        try {
          await storage.file(videoData.storagePath).delete();
          console.log('[Videos] Storage file deleted');
        } catch (storageError) {
          console.error('[Videos] Storage delete error:', storageError.message);
          // Continue with Firestore deletion even if storage fails
        }
      }

      // Delete Firestore document
      await db.collection('videos').doc(id).delete();
      console.log(`[Videos] Firestore document deleted: ${id}`);

      res.json({
        success: true,
        message: 'Video deleted successfully',
      });

    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('[Videos] Delete error:', error.message);
      throw error;
    }
  })
);

/**
 * POST /api/videos/:id/index
 * Trigger TwelveLabs indexing for a video
 */
router.post(
  '/:id/index',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    console.log(`[Videos] Index request for video: ${id}`);

    try {
      // Get video document
      const doc = await db.collection('videos').doc(id).get();

      if (!doc.exists) {
        console.log(`[Videos] Video not found: ${id}`);
        throw new NotFoundError(`Video not found: ${id}`);
      }

      const videoData = doc.data();

      // Check if already indexing or completed
      if (videoData.indexingStatus === 'indexing') {
        return res.status(400).json({
          success: false,
          message: 'Video is already being indexed',
        });
      }

      if (videoData.indexingStatus === 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Video has already been indexed',
        });
      }

      // Start indexing
      console.log(`[Videos] Starting TwelveLabs indexing for: ${videoData.originalName}`);
      const result = await indexVideo(id, videoData.storageUrl);

      res.json({
        success: true,
        message: 'Indexing started',
        taskId: result.taskId,
        twelveLabsVideoId: result.videoId,
      });

    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('[Videos] Index error:', error.message);
      throw error;
    }
  })
);

module.exports = router;
