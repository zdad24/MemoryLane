/**
 * TwelveLabs Indexing Service
 * Handles video indexing and data extraction via TwelveLabs API
 * Uses Gemini for video content analysis (summary + emotion tags)
 */

const client = require('../config/twelvelabs');
const { db } = require('../config/firebase');
const { generateText } = require('./gemini.service');

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

    // Get video document from Firestore for the original filename
    let originalName = 'video';
    try {
      const doc = await db.collection('videos').doc(videoId).get();
      if (doc.exists) {
        originalName = doc.data().originalName || doc.data().fileName || 'video';
      }
    } catch (error) {
      console.error('[TwelveLabs] Failed to get video document:', error.message);
    }

    // Get video info from TwelveLabs
    let videoInfo = null;
    try {
      videoInfo = await client.index.video.retrieve(indexId, tlVideoId);
      console.log(`[TwelveLabs] Video info retrieved`);
    } catch (error) {
      console.error('[TwelveLabs] Failed to retrieve video info:', error.message);
    }

    // Analyze video content using TwelveLabs AI (with Gemini fallback)
    let summary = null;
    let emotionTags = [];
    try {
      console.log(`[TwelveLabs] Analyzing video content for: ${videoId}`);
      const analysis = await analyzeVideoContent(tlVideoId, originalName);
      if (analysis) {
        summary = analysis.summary;
        emotionTags = analysis.emotionTags;
        console.log(`[TwelveLabs] Video analyzed - tags: ${emotionTags.join(', ')}`);
      }
    } catch (error) {
      console.error('[TwelveLabs] Failed to analyze video content:', error.message);
    }

    // Fallback summary if analysis failed
    if (!summary) {
      summary = 'A video memory has been saved to your collection.';
      console.log('[TwelveLabs] Using fallback summary');
    }

    // Attempt transcript generation via TwelveLabs (best-effort, for future use)
    let transcript = null;
    try {
      transcript = await generateTranscript(tlVideoId);
      if (transcript) {
        console.log(`[TwelveLabs] Transcript generated: ${transcript.length} chars`);
      }
    } catch (error) {
      console.error('[TwelveLabs] Failed to generate transcript:', error.message);
    }

    // Update Firestore with extracted data
    const updateData = {
      twelveLabsProcessed: true,
      processedAt: new Date(),
      summary: summary,
      emotionTags: emotionTags,
      indexingStatus: 'completed'
    };

    if (transcript) {
      updateData.transcript = transcript.slice(0, 20000);
    }

    // Only add metadata fields if they have actual values
    // Check multiple possible locations for duration
    let videoDuration = null;
    if (videoInfo) {
      // Try metadata.duration first
      if (videoInfo.metadata?.duration !== undefined && videoInfo.metadata?.duration !== null) {
        videoDuration = videoInfo.metadata.duration;
      }
      // Try root-level duration
      else if (videoInfo.duration !== undefined && videoInfo.duration !== null) {
        videoDuration = videoInfo.duration;
      }
      // Try system_metadata
      else if (videoInfo.system_metadata?.duration !== undefined) {
        videoDuration = videoInfo.system_metadata.duration;
      }
    }

    if (videoDuration !== null) {
      updateData.duration = videoDuration;
      console.log(`[TwelveLabs] Video duration: ${videoDuration} seconds`);
    } else {
      console.log('[TwelveLabs] Warning: Could not extract video duration');
    }

    // Build metadata object with only defined values
    if (videoInfo?.metadata || videoInfo?.system_metadata) {
      const metadata = videoInfo.metadata || videoInfo.system_metadata || {};
      const tlMetadata = {};
      if (metadata.width !== undefined) tlMetadata.width = metadata.width;
      if (metadata.height !== undefined) tlMetadata.height = metadata.height;
      if (metadata.fps !== undefined) tlMetadata.fps = metadata.fps;
      if (videoDuration !== null) tlMetadata.duration = videoDuration;

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

/**
 * Extract text from TwelveLabs generate response
 * @param {Object} result - TwelveLabs generate API response
 * @returns {string} Extracted text
 */
function extractGenerateText(result) {
  // Handle various response formats from TwelveLabs API
  if (!result) return '';

  // Direct text field
  if (typeof result.text === 'string') return result.text;
  if (typeof result.data === 'string') return result.data;

  // Nested text field
  if (result.data?.text) return result.data.text;
  if (result.response?.text) return result.response.text;

  // Array format (some API versions return array of results)
  if (Array.isArray(result.data) && result.data[0]?.text) {
    return result.data[0].text;
  }

  // Fallback - try to stringify if object
  if (typeof result === 'object') {
    console.log('[TwelveLabs] Unexpected response format:', JSON.stringify(result).slice(0, 200));
  }

  return '';
}

/**
 * Generate a transcript for a video
 * Note: TwelveLabs generate API is not available in v1.3, skipping transcript generation
 * @param {string} tlVideoId - TwelveLabs video ID
 * @returns {Promise<string|null>} Transcript text
 */
async function generateTranscript(tlVideoId) {
  // TwelveLabs generate endpoint doesn't exist in v1.3
  // Transcript generation is skipped
  console.log('[TwelveLabs] Transcript generation skipped (generate API not available in v1.3)');
  return null;
}

/**
 * Analyze video content using TwelveLabs /analyze API to generate summary and emotion tags
 * Falls back to Gemini-based analysis if TwelveLabs fails
 * @param {string} tlVideoId - TwelveLabs video ID
 * @param {string} videoName - Original video filename for context (used in fallback)
 * @returns {Promise<{summary: string, emotionTags: string[]}|null>} Analysis result
 */
async function analyzeVideoContent(tlVideoId, videoName = 'video') {
  try {
    console.log(`[TwelveLabs] Analyzing video content: ${tlVideoId}`);

    // Use TwelveLabs /analyze endpoint to analyze actual video content
    const prompt = `Analyze this video and provide a JSON response with:
1. "summary": A 2-3 sentence description of what happens in the video, including people, actions, setting, and mood. Make it warm and personal.
2. "emotionTags": An array of 2-4 single-word emotion tags that capture the feeling of this video.

Choose emotion tags from: joyful, nostalgic, peaceful, energetic, heartwarming, adventurous, tender, playful, bittersweet, triumphant, cozy, serene, intimate, festive, melancholic, excited, relaxed, loving

Respond with ONLY a valid JSON object.`;

    const result = await client.analyze.analyze(tlVideoId, prompt, {
      temperature: 0.3,
      response_format: {
        type: 'json_schema',
        json_schema: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            emotionTags: {
              type: 'array',
              items: { type: 'string' }
            }
          },
          required: ['summary', 'emotionTags']
        }
      },
      max_tokens: 500
    });

    console.log('[TwelveLabs] Analyze API response received');

    // Parse the response - handle different response formats
    let data = result;
    if (typeof result === 'string') {
      data = JSON.parse(result);
    } else if (result.data) {
      data = typeof result.data === 'string' ? JSON.parse(result.data) : result.data;
    }

    // Extract summary and emotionTags from response
    const summary = data.summary || data.text || null;
    const emotionTags = Array.isArray(data.emotionTags)
      ? data.emotionTags.map(tag => tag.toLowerCase().trim()).slice(0, 4)
      : [];

    if (summary && summary.length >= 10) {
      console.log(`[TwelveLabs] Video analyzed - summary: ${summary.length} chars, tags: ${emotionTags.join(', ')}`);
      return { summary, emotionTags };
    }

    throw new Error('Invalid response from TwelveLabs analyze API');

  } catch (error) {
    console.error('[TwelveLabs] Analyze API error:', error.message);
    console.log('[TwelveLabs] Falling back to Gemini analysis...');

    // Fallback to Gemini-based analysis
    return analyzeVideoContentWithGemini(videoName);
  }
}

/**
 * Fallback: Analyze video using Gemini based on video filename
 * @param {string} videoName - Original video filename for context
 * @returns {Promise<{summary: string, emotionTags: string[]}|null>} Analysis result
 */
async function analyzeVideoContentWithGemini(videoName) {
  try {
    const prompt = `You are analyzing a personal video memory. Based on the video filename "${videoName}", generate:

1. SUMMARY: A 2-3 sentence description suggesting what might be happening in this video (people, actions, setting, mood). Make educated guesses based on the filename but keep it warm and personal.

2. EMOTION_TAGS: 2-4 single-word emotion tags that likely capture the feeling of this video. Choose from: joyful, nostalgic, peaceful, energetic, heartwarming, adventurous, tender, playful, bittersweet, triumphant, cozy, serene, intimate, festive, melancholic, excited, relaxed, loving

Respond with ONLY a valid JSON object (no markdown, no code blocks):
{
  "summary": "Your 2-3 sentence summary here",
  "emotionTags": ["tag1", "tag2", "tag3"]
}`;

    const text = await generateText(prompt);

    if (!text) {
      console.error('[Gemini] Empty response from video analysis');
      return null;
    }

    // Parse JSON response, handling potential markdown code blocks
    let jsonStr = text.trim();
    if (jsonStr.includes('```')) {
      const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) {
        jsonStr = match[1].trim();
      }
    }

    const parsed = JSON.parse(jsonStr);

    // Validate and normalize the response
    const summary = typeof parsed.summary === 'string' ? parsed.summary.trim() : null;
    const emotionTags = Array.isArray(parsed.emotionTags)
      ? parsed.emotionTags
        .filter(tag => typeof tag === 'string')
        .map(tag => tag.toLowerCase().trim())
        .slice(0, 4)
      : [];

    if (!summary || summary.length < 10) {
      console.error('[Gemini] Invalid summary in response');
      return null;
    }

    console.log(`[Gemini] Video analyzed (fallback) - summary: ${summary.length} chars, tags: ${emotionTags.join(', ')}`);
    return { summary, emotionTags };

  } catch (error) {
    console.error('[Gemini] Video analysis error:', error.message);
    return null;
  }
}

module.exports = {
  getOrCreateIndex,
  indexVideo,
  pollIndexingStatus,
  extractVideoData,
  searchVideos,
  generateTranscript,
  analyzeVideoContent
};
