/**
 * Search Routes
 * Handles video search functionality via TwelveLabs
 */

const express = require('express');
const twelveLabs = require('../config/twelvelabs');
const { db } = require('../config/firebase');
const { asyncHandler, ValidationError } = require('../utils/errors');

const router = express.Router();

const INDEX_NAME = 'memorylane-hackathon';
const MIN_SCORE_THRESHOLD = 75; // Only show results with 75%+ match

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

      // Deduplicate results by video_id, merging clips from the same video
      const videoMap = new Map();

      for (const result of searchResults.data || []) {
        const videoId = result.video_id;

        // Format clips from this result, filtering to 75%+ matches only
        const clips = (result.clips || [])
          .filter(clip => clip.score >= MIN_SCORE_THRESHOLD)
          .map(clip => ({
            start: clip.start,
            end: clip.end,
            score: clip.score,
            thumbnailUrl: clip.thumbnail_url || null,
          }));

        if (videoMap.has(videoId)) {
          // Merge clips and keep highest score
          const existing = videoMap.get(videoId);
          existing.clips.push(...clips);
          existing.score = Math.max(existing.score, result.score);
          existing.confidence = Math.max(existing.confidence, result.confidence);
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
            score: result.score,
            confidence: result.confidence,
            video: videoData,
            clips,
          });
        }
      }

      // Filter to only include results meeting minimum score threshold (75%+)
      const results = Array.from(videoMap.values())
        .filter(result => result.score >= MIN_SCORE_THRESHOLD);

      console.log(`[Search] Found ${results.length} results (75%+ match) for query: "${query}"`);

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

module.exports = router;
