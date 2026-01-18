/**
 * Search Routes
 * Handles video search functionality via TwelveLabs
 */

const express = require('express');
const twelveLabs = require('../config/twelvelabs');
const { db } = require('../config/firebase');
const { asyncHandler, ValidationError } = require('../utils/errors');

const router = express.Router();

const INDEX_NAME = 'My Index (Default)';
const MIN_SCORE_THRESHOLD = 50; // Only show results with 50%+ match

/**
 * POST /api/search
 * Search videos using natural language query
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { query, limit = 10 } = req.body;

    console.log(`[Search] Received search request: "${query}"`);

    // Validate query exists
    if (!query || typeof query !== 'string') {
      throw new ValidationError('Search query is required');
    }

    try {
      // Get the TwelveLabs index
      const indexes = await twelveLabs.index.list();
      const index = indexes.data.find(idx => idx.index_name === INDEX_NAME);

      // If no index exists, return empty results
      if (!index) {
        console.log(`[Search] Index "${INDEX_NAME}" not found, returning empty results`);
        return res.json({
          query,
          results: [],
          total: 0,
        });
      }

      // Get index details to determine supported search options
      const indexDetails = await twelveLabs.index.get(index._id);
      const searchOptions = indexDetails.models?.[0]?.model_options || ['visual'];
      console.log(`[Search] Using search options: ${searchOptions.join(', ')}`);

      // Search with TwelveLabs
      const searchResults = await twelveLabs.search.query(index._id, query, {
        search_options: searchOptions,
        page_limit: limit,
      });

      // TwelveLabs API v1.3 returns clips directly with: rank, start, end, video_id, thumbnail_url
      // Group by video_id and collect clips
      const videoMap = new Map();

      for (const result of searchResults.data || []) {
        const videoId = result.video_id;
        // Convert rank to score (rank 1 = 100%, rank 10 = ~60%)
        const score = Math.max(0, 100 - (result.rank - 1) * 5);

        const clip = {
          start: result.start,
          end: result.end,
          score: score,
          thumbnailUrl: result.thumbnail_url || null,
        };

        if (videoMap.has(videoId)) {
          // Add clip to existing video
          const existing = videoMap.get(videoId);
          existing.clips.push(clip);
          // Keep the best (lowest) rank
          if (result.rank < existing.bestRank) {
            existing.bestRank = result.rank;
            existing.score = score;
          }
        } else {
          // First occurrence - fetch video data from Firestore
          const videosSnapshot = await db
            .collection('videos')
            .where('twelveLabsVideoId', '==', videoId)
            .limit(1)
            .get();

          let videoData = null;
          if (!videosSnapshot.empty) {
            const doc = videosSnapshot.docs[0];
            videoData = {
              id: doc.id,
              ...doc.data(),
              uploadedAt: doc.data().uploadedAt?.toDate?.() || doc.data().uploadedAt,
            };
          }

          videoMap.set(videoId, {
            videoId,
            score: score,
            confidence: score,
            bestRank: result.rank,
            video: videoData,
            clips: [clip],
          });
        }
      }

      // Convert to array and sort by best rank (highest score first)
      const results = Array.from(videoMap.values())
        .filter(result => result.score >= MIN_SCORE_THRESHOLD)
        .sort((a, b) => b.score - a.score);

      console.log(`[Search] Found ${results.length} results for query: "${query}"`);

      // Save search to Firestore
      await db.collection('searches').add({
        query,
        resultCount: results.length,
        timestamp: new Date(),
      });

      res.json({
        query,
        results,
        total: results.length,
      });

    } catch (error) {
      console.error(`[Search] Error searching for "${query}":`, error.message);
      throw error;
    }
  })
);

/**
 * GET /api/search/by-emotion
 * Search videos by emotion tag
 */
router.get(
  '/by-emotion',
  asyncHandler(async (req, res) => {
    const { emotion, limit = 20 } = req.query;

    console.log(`[Search] Searching by emotion tag: "${emotion}"`);

    // Validate emotion parameter
    if (!emotion || typeof emotion !== 'string') {
      throw new ValidationError('Emotion parameter is required');
    }

    const normalizedEmotion = emotion.toLowerCase().trim();

    try {
      // Query Firestore for videos with the specified emotion tag
      const snapshot = await db
        .collection('videos')
        .where('indexingStatus', '==', 'completed')
        .where('emotionTags', 'array-contains', normalizedEmotion)
        .limit(parseInt(limit))
        .get();

      const videos = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        videos.push({
          id: doc.id,
          ...data,
          uploadedAt: data.uploadedAt?.toDate?.() || data.uploadedAt,
        });
      });

      console.log(`[Search] Found ${videos.length} videos with emotion tag: "${emotion}"`);

      // Save search to Firestore
      await db.collection('searches').add({
        type: 'emotion',
        emotion: normalizedEmotion,
        resultCount: videos.length,
        timestamp: new Date(),
      });

      res.json({
        emotion: normalizedEmotion,
        results: videos,
        total: videos.length,
      });

    } catch (error) {
      console.error(`[Search] Error searching by emotion "${emotion}":`, error.message);
      throw error;
    }
  })
);

/**
 * GET /api/search/emotions
 * Get all unique emotion tags and video counts per tag
 */
router.get(
  '/emotions',
  asyncHandler(async (req, res) => {
    console.log('[Search] Getting emotion tag statistics');

    try {
      const snapshot = await db
        .collection('videos')
        .where('indexingStatus', '==', 'completed')
        .get();

      const emotionCounts = {};

      snapshot.forEach((doc) => {
        const data = doc.data();
        const tags = data.emotionTags || [];
        tags.forEach((tag) => {
          if (typeof tag === 'string') {
            const normalizedTag = tag.toLowerCase().trim();
            emotionCounts[normalizedTag] = (emotionCounts[normalizedTag] || 0) + 1;
          }
        });
      });

      // Sort emotions by count (descending)
      const sortedEmotions = Object.entries(emotionCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([emotion]) => emotion);

      res.json({
        emotions: sortedEmotions,
        counts: emotionCounts,
        totalVideos: snapshot.size,
      });

    } catch (error) {
      console.error('[Search] Error getting emotion statistics:', error.message);
      throw error;
    }
  })
);

module.exports = router;
