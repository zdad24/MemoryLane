/**
 * TwelveLabs Indexing Service
 * Handles video indexing and data extraction via TwelveLabs API
 */

const client = require('../config/twelvelabs');
const { db } = require('../config/firebase');
const { generateSummary, analyzeEmotions } = require('./gemini.service');

const INDEX_NAME = 'My Index (Default)';

/**
 * Get or create the TwelveLabs index for MemoryLane
 * @returns {Promise<string>} Index ID
 */
async function getOrCreateIndex() {
  try {
    console.log('[TwelveLabs] Checking for existing index...');

    // List existing indexes
    const indexesResponse = await client.index.list();
    const indexes = indexesResponse.data || [];

    // Check if our index exists
    const existingIndex = indexes.find(idx => idx.index_name === INDEX_NAME);

    if (existingIndex) {
      console.log(`[TwelveLabs] Found existing index: ${existingIndex._id}`);
      return existingIndex._id;
    }

    // Create new index
    console.log(`[TwelveLabs] Creating new index: ${INDEX_NAME}`);
    const newIndex = await client.index.create({
      index_name: INDEX_NAME,
      engines: [{
        engine_name: 'marengo2.7',
        engine_options: ['visual', 'audio']
      }]
    });

    console.log(`[TwelveLabs] Created new index: ${newIndex._id}`);
    return newIndex._id;

  } catch (error) {
    console.error('[TwelveLabs] getOrCreateIndex error:', error.message);
    throw error;
  }
}

/**
 * Index a video in TwelveLabs
 * @param {string} videoId - Firestore video document ID
 * @param {string} videoUrl - Public URL of the video
 * @returns {Promise<Object>} { success, taskId, videoId }
 */
async function indexVideo(videoId, videoUrl) {
  try {
    console.log(`[TwelveLabs] Starting indexing for video: ${videoId}`);
    console.log(`[TwelveLabs] Video URL: ${videoUrl}`);

    // Get or create index
    const indexId = await getOrCreateIndex();

    // Update Firestore: indexing started
    await db.collection('videos').doc(videoId).update({
      indexingStatus: 'indexing',
      twelveLabsIndexId: indexId,
      indexingStartedAt: new Date()
    });
    console.log(`[TwelveLabs] Updated Firestore status to 'indexing'`);

    // Create indexing task using URL
    console.log(`[TwelveLabs] Creating indexing task...`);
    const task = await client.task.create({
      index_id: indexId,
      url: videoUrl,
    });

    const taskId = task._id;
    const tlVideoId = task.video_id;

    console.log(`[TwelveLabs] Task created: ${taskId}`);
    console.log(`[TwelveLabs] TwelveLabs Video ID: ${tlVideoId}`);

    // Update Firestore with task info
    await db.collection('videos').doc(videoId).update({
      twelveLabsTaskId: taskId,
      twelveLabsVideoId: tlVideoId
    });

    // Start polling (async, don't wait)
    pollIndexingStatus(videoId, taskId, indexId, tlVideoId);

    return {
      success: true,
      taskId: taskId,
      videoId: tlVideoId
    };

  } catch (error) {
    console.error(`[TwelveLabs] indexVideo error for ${videoId}:`, error.message);

    // Update Firestore with error
    try {
      await db.collection('videos').doc(videoId).update({
        indexingStatus: 'failed',
        indexingError: error.message,
        indexingFailedAt: new Date()
      });
    } catch (dbError) {
      console.error('[TwelveLabs] Failed to update error status:', dbError.message);
    }

    throw error;
  }
}

/**
 * Poll TwelveLabs for indexing status
 * @param {string} videoId - Firestore video document ID
 * @param {string} taskId - TwelveLabs task ID
 * @param {string} indexId - TwelveLabs index ID
 * @param {string} tlVideoId - TwelveLabs video ID
 */
async function pollIndexingStatus(videoId, taskId, indexId, tlVideoId) {
  console.log(`[TwelveLabs] Starting polling for task: ${taskId}`);

  let attempts = 0;
  const maxAttempts = 60; // 5 minutes at 5-second intervals
  const pollInterval = 5000; // 5 seconds

  const poll = async () => {
    attempts++;

    try {
      // Log progress every 10 attempts
      if (attempts % 10 === 0) {
        console.log(`[TwelveLabs] Polling attempt ${attempts}/${maxAttempts} for task ${taskId}`);
      }

      // Get task status
      const task = await client.task.get(taskId);
      const status = task.status;

      console.log(`[TwelveLabs] Task ${taskId} status: ${status}`);

      if (status === 'ready') {
        console.log(`[TwelveLabs] ✅ Indexing completed for video: ${videoId}`);

        // Extract video data
        await extractVideoData(videoId, tlVideoId, indexId);

        // Update Firestore
        await db.collection('videos').doc(videoId).update({
          indexingStatus: 'completed',
          indexingCompletedAt: new Date()
        });

        console.log(`[TwelveLabs] Video data extracted and saved for: ${videoId}`);
        return; // Stop polling

      } else if (status === 'failed') {
        console.error(`[TwelveLabs] ❌ Indexing failed for video: ${videoId}`);

        await db.collection('videos').doc(videoId).update({
          indexingStatus: 'failed',
          indexingError: task.error_message || 'Indexing failed',
          indexingFailedAt: new Date()
        });

        return; // Stop polling

      } else if (attempts >= maxAttempts) {
        console.error(`[TwelveLabs] ❌ Polling timeout for video: ${videoId}`);

        await db.collection('videos').doc(videoId).update({
          indexingStatus: 'timeout',
          indexingError: 'Polling timeout after 5 minutes',
          indexingFailedAt: new Date()
        });

        return; // Stop polling
      }

      // Continue polling
      setTimeout(poll, pollInterval);

    } catch (error) {
      console.error(`[TwelveLabs] Polling error for ${videoId}:`, error.message);

      if (attempts >= maxAttempts) {
        await db.collection('videos').doc(videoId).update({
          indexingStatus: 'failed',
          indexingError: `Polling error: ${error.message}`,
          indexingFailedAt: new Date()
        });
        return;
      }

      // Retry on error
      setTimeout(poll, pollInterval);
    }
  };

  // Start polling
  setTimeout(poll, pollInterval);
}

/**
 * Extract video data from TwelveLabs after indexing
 * @param {string} videoId - Firestore video document ID
 * @param {string} tlVideoId - TwelveLabs video ID
 * @param {string} indexId - TwelveLabs index ID
 */
async function extractVideoData(videoId, tlVideoId, indexId) {
  try {
    console.log(`[TwelveLabs] Extracting data for video: ${tlVideoId}`);

    // Get video info
    let videoInfo = null;
    try {
      videoInfo = await client.index.video.retrieve(indexId, tlVideoId);
      console.log(`[TwelveLabs] Video info retrieved`);
    } catch (error) {
      console.error('[TwelveLabs] Failed to retrieve video info:', error.message);
    }

    // Use Gemini to generate summary
    let summary = 'Video uploaded and indexed successfully.';
    try {
      summary = await generateSummary('A video has been uploaded. Please provide a generic summary indicating the video is ready for viewing.');
      console.log(`[TwelveLabs] Summary generated: ${summary.length} chars`);
    } catch (error) {
      console.error('[TwelveLabs] Failed to generate summary:', error.message);
    }

    // Analyze emotions from the summary
    let emotionData = null;
    try {
      console.log(`[TwelveLabs] Analyzing emotions for video: ${videoId}`);
      emotionData = await analyzeEmotions(summary);
      console.log(`[TwelveLabs] Emotion analysis complete: dominant=${emotionData.dominantEmotion}`);
    } catch (error) {
      console.error('[TwelveLabs] Failed to analyze emotions:', error.message);
    }

    // Update Firestore with extracted data - only include defined values
    const updateData = {
      twelveLabsProcessed: true,
      processedAt: new Date(),
      summary: summary,
      indexingStatus: 'completed'
    };

    // Add emotion fields if analysis was successful
    if (emotionData) {
      updateData.emotions = emotionData.emotions;
      updateData.dominantEmotion = emotionData.dominantEmotion;
      updateData.emotionConfidence = emotionData.emotionConfidence;
      updateData.emotionAnalyzedAt = new Date();
    }

    // Only add metadata fields if they have actual values
    if (videoInfo?.metadata) {
      const metadata = videoInfo.metadata;
      if (metadata.duration !== undefined && metadata.duration !== null) {
        updateData.duration = metadata.duration;
      }
      // Build metadata object with only defined values
      const tlMetadata = {};
      if (metadata.width !== undefined) tlMetadata.width = metadata.width;
      if (metadata.height !== undefined) tlMetadata.height = metadata.height;
      if (metadata.fps !== undefined) tlMetadata.fps = metadata.fps;
      if (metadata.duration !== undefined) tlMetadata.duration = metadata.duration;

      if (Object.keys(tlMetadata).length > 0) {
        updateData.twelveLabsMetadata = tlMetadata;
      }
    }

    await db.collection('videos').doc(videoId).update(updateData);
    console.log(`[TwelveLabs] Video data saved to Firestore: ${videoId}`);

  } catch (error) {
    console.error(`[TwelveLabs] extractVideoData error for ${videoId}:`, error.message);
    throw error;
  }
}

/**
 * Search videos using natural language query
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Promise<Object>} Search results
 */
async function searchVideos(query, options = {}) {
  try {
    console.log(`[TwelveLabs] Searching for: "${query}"`);

    const indexId = await getOrCreateIndex();

    // Get index details to determine supported search options
    const indexDetails = await client.index.get(indexId);
    const searchOptions = indexDetails.models?.[0]?.model_options || ['visual'];
    console.log(`[TwelveLabs] Using search options: ${searchOptions.join(', ')}`);

    const results = await client.search.query(indexId, query, {
      search_options: searchOptions,
      ...options
    });

    console.log(`[TwelveLabs] Found ${results.data?.length || 0} results`);
    return results;

  } catch (error) {
    console.error('[TwelveLabs] Search error:', error.message);
    throw error;
  }
}

module.exports = {
  getOrCreateIndex,
  indexVideo,
  pollIndexingStatus,
  extractVideoData,
  searchVideos
};
