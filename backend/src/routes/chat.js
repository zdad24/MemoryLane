/**
 * Chat Routes
 * Handles AI chat interactions about user's videos
 */

const express = require('express');
const { db, admin } = require('../config/firebase');
const { asyncHandler, ValidationError } = require('../utils/errors');
const { generateText } = require('../services/gemini.service');
const { searchVideos } = require('../services/twelvelabs.service');

const router = express.Router();

const MAX_CONTEXT_VIDEOS = 5;
const ATTACH_LIMIT = 3;
const MIN_SCORE_THRESHOLD = 75;
const HISTORY_LIMIT = 8;

function formatDate(dateValue) {
  if (!dateValue) return 'Unknown date';
  if (dateValue.toDate) return dateValue.toDate().toLocaleDateString();
  const d = new Date(dateValue);
  return isNaN(d.getTime()) ? 'Unknown date' : d.toLocaleDateString();
}

function isFollowUpMessage(message) {
  return /\b(this|that|it|those|these|that one|this one|the last one)\b/i.test(message);
}

function detectIntent(message) {
  if (/\b(show|open|play|watch)\b/i.test(message)) return 'show_video';
  if (/\b(create|generate|make)\b/i.test(message)) return 'generate';
  return 'search';
}

function isRecentRequest(message) {
  return /\b(last|latest|most recent|newest)\b/i.test(message);
}

async function fetchRecentVideos(limit = MAX_CONTEXT_VIDEOS) {
  const snapshot = await db
    .collection('videos')
    .orderBy('uploadedAt', 'desc')
    .limit(limit)
    .get();

  const videos = [];
  snapshot.forEach((doc) => {
    videos.push({
      id: doc.id,
      ...doc.data(),
      uploadedAt: doc.data().uploadedAt?.toDate?.() || doc.data().uploadedAt,
    });
  });
  return videos;
}

async function fetchVideosByIds(ids) {
  const uniqueIds = [...new Set((ids || []).filter(Boolean))];
  const results = await Promise.all(
    uniqueIds.map(async (id) => {
      const doc = await db.collection('videos').doc(id).get();
      if (!doc.exists) return null;
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        uploadedAt: data.uploadedAt?.toDate?.() || data.uploadedAt,
      };
    })
  );
  return results.filter(Boolean);
}

async function fetchVideosByTwelveLabsIds(videoIds) {
  const ids = (videoIds || []).filter(Boolean);
  if (ids.length === 0) return new Map();

  const chunks = [];
  for (let i = 0; i < ids.length; i += 10) {
    chunks.push(ids.slice(i, i + 10));
  }

  const videoMap = new Map();
  for (const chunk of chunks) {
    const snapshot = await db
      .collection('videos')
      .where('twelveLabsVideoId', 'in', chunk)
      .get();
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.twelveLabsVideoId) {
        videoMap.set(data.twelveLabsVideoId, {
          id: doc.id,
          ...data,
          uploadedAt: data.uploadedAt?.toDate?.() || data.uploadedAt,
        });
      }
    });
  }

  return videoMap;
}

function buildVideoContext(videos) {
  if (!videos || videos.length === 0) return 'No videos available.';
  return videos
    .map((video, index) => {
      const transcript = video.transcript ? video.transcript.slice(0, 800) : null;
      const emotionTags = Array.isArray(video.emotionTags) && video.emotionTags.length > 0
        ? video.emotionTags.join(', ')
        : null;
      return [
        `[${index + 1}] id: ${video.id}`,
        `title: ${video.originalName || video.fileName || 'Untitled'}`,
        `uploadedAt: ${formatDate(video.uploadedAt)}`,
        `summary: ${video.summary || 'No summary available.'}`,
        emotionTags ? `emotions: ${emotionTags}` : null,
        transcript ? `transcript: ${transcript}` : null,
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n\n');
}

function rankSearchResults(rawResults = []) {
  const videoMap = new Map();

  for (const result of rawResults) {
    const videoId = result.video_id;
    const clips = (result.clips || [])
      .filter((clip) => clip.score >= MIN_SCORE_THRESHOLD)
      .map((clip) => ({
        start: clip.start,
        end: clip.end,
        score: clip.score,
        thumbnail_url: clip.thumbnail_url || null,
      }));

    if (videoMap.has(videoId)) {
      const existing = videoMap.get(videoId);
      existing.clips.push(...clips);
      existing.score = Math.max(existing.score, result.score);
      existing.confidence = Math.max(existing.confidence, result.confidence);
    } else {
      videoMap.set(videoId, {
        videoId,
        score: result.score,
        confidence: result.confidence,
        clips,
      });
    }
  }

  return Array.from(videoMap.values()).filter((result) => result.score >= MIN_SCORE_THRESHOLD);
}

function buildHistoryContext(messages) {
  if (!messages || messages.length === 0) return '';
  const recent = messages.slice(-HISTORY_LIMIT);
  return recent
    .map((msg) => `${msg.role === 'assistant' ? 'Assistant' : 'User'}: ${msg.content}`)
    .join('\n');
}

/**
 * POST /api/chat
 * Send a chat message and get AI response
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { message, conversationId: inputConversationId } = req.body;

    console.log(`[Chat] Message received: "${message?.slice(0, 50)}..."`);

    // Validate message exists
    if (!message || typeof message !== 'string') {
      throw new ValidationError('Message is required');
    }

    let conversationId = inputConversationId;
    let conversationMessages = [];
    let lastAttachedVideos = [];

    try {
      if (conversationId) {
        const doc = await db.collection('conversations').doc(conversationId).get();
        if (doc.exists) {
          const data = doc.data();
          conversationMessages = data.messages || [];
          const lastAssistant = [...conversationMessages].reverse().find((m) => m.role === 'assistant');
          lastAttachedVideos = lastAssistant?.attachedVideos || [];
        }
      }

      const intent = detectIntent(message);
      const followUp = isFollowUpMessage(message);
      let candidateVideos = [];

      if (followUp && lastAttachedVideos.length > 0) {
        const ids = lastAttachedVideos.map((v) => v.id).filter(Boolean);
        candidateVideos = await fetchVideosByIds(ids);
      } else if (intent === 'show_video' && isRecentRequest(message)) {
        candidateVideos = await fetchRecentVideos(1);
      } else {
        try {
          const searchResults = await searchVideos(message, { page_limit: 10 });
          const ranked = rankSearchResults(searchResults.data || []);
          const videoIds = ranked.map((r) => r.videoId);
          const videoMap = await fetchVideosByTwelveLabsIds(videoIds);

          const merged = ranked
            .map((result) => {
              const video = videoMap.get(result.videoId);
              if (!video) return null;
              return {
                ...video,
                searchScore: result.score,
                confidence: result.confidence,
                clips: result.clips || [],
              };
            })
            .filter(Boolean)
            .sort((a, b) => b.searchScore - a.searchScore);

          candidateVideos = merged.slice(0, MAX_CONTEXT_VIDEOS);
        } catch (searchError) {
          console.error('[Chat] Search error:', searchError.message);
        }
      }

      if (candidateVideos.length === 0) {
        candidateVideos = await fetchRecentVideos(MAX_CONTEXT_VIDEOS);
      }

      const videoContext = buildVideoContext(candidateVideos);
      const historyContext = buildHistoryContext(conversationMessages);

      const prompt = `You are MemoryLane AI, a warm and helpful assistant that helps users explore and reminisce about their personal video memories.

Rules:
1. Only use details from the provided video context (summaries, emotions, transcripts).
2. If you are unsure or the answer is not in the context, say you don't know.
3. Do not mention internal IDs, filenames, or storage URLs.
4. When referencing a video, use its summary or describe it in a friendly way.
5. If the user asks to show/play/open a video, choose the best matching video.
6. Use the emotion tags to understand the mood of videos and help users find videos by feeling.
7. Be conversational and empathetic - these are personal memories.

Conversation so far:
${historyContext || 'No prior messages.'}

Video Context:
${videoContext}

User Question: ${message}

Response:`;

      let responseText = "I'm having trouble processing your request right now. Please try again in a moment.";
      try {
        responseText = await generateText(prompt);
        console.log(`[Chat] Response generated (${responseText.length} chars)`);
      } catch (geminiError) {
        console.error('[Chat] Gemini API error:', geminiError.message);
        // Check if rate limited
        if (geminiError.message.includes('429') || geminiError.message.includes('quota')) {
          responseText = "I'm currently experiencing high demand. Based on your videos, I found some matches - you can view them below. Please try your question again in a minute.";
        }
      }

      // Save conversation to Firestore
      try {
        if (!conversationId) {
          // Create new conversation
          const convDoc = await db.collection('conversations').add({
            createdAt: new Date(),
            messages: [],
          });
          conversationId = convDoc.id;
          console.log(`[Chat] New conversation created: ${conversationId}`);
        }

        // Append messages to conversation
        const attachedVideos = candidateVideos.slice(0, ATTACH_LIMIT).map((v) => ({
          id: v.id,
          summary: v.summary || v.originalName || v.fileName || 'Untitled',
          originalName: v.originalName || v.fileName || 'Untitled',
          uploadedAt: v.uploadedAt,
          storageUrl: v.storageUrl,
          duration: v.duration || null,
          thumbnailUrl: v.clips?.[0]?.thumbnail_url || v.thumbnailUrl || null,
          emotionTags: v.emotionTags || [],
          intent,
        }));

        await db.collection('conversations').doc(conversationId).update({
          messages: admin.firestore.FieldValue.arrayUnion(
            { role: 'user', content: message, timestamp: new Date() },
            { role: 'assistant', content: responseText, timestamp: new Date(), attachedVideos }
          ),
          updatedAt: new Date(),
        });
        console.log(`[Chat] Conversation saved: ${conversationId}`);
      } catch (firestoreError) {
        console.error('[Chat] Firestore error:', firestoreError.message);
        // Continue and return response even if save fails
      }

      res.json({
        conversationId,
        message: {
          role: 'assistant',
          content: responseText,
        },
        attachedVideos: candidateVideos.slice(0, ATTACH_LIMIT).map((v) => ({
          id: v.id,
          summary: v.summary || v.originalName || v.fileName || 'Untitled',
          originalName: v.originalName || v.fileName || 'Untitled',
          uploadedAt: v.uploadedAt,
          storageUrl: v.storageUrl,
          duration: v.duration || null,
          thumbnailUrl: v.clips?.[0]?.thumbnail_url || v.thumbnailUrl || null,
          emotionTags: v.emotionTags || [],
          intent,
        })),
      });

    } catch (error) {
      console.error('[Chat] Error processing message:', error.message);
      throw error;
    }
  })
);

/**
 * GET /api/chat/history
 * Get chat history for a conversation
 */
router.get(
  '/history',
  asyncHandler(async (req, res) => {
    const { conversationId, limit = 50 } = req.query;

    if (!conversationId) {
      throw new ValidationError('conversationId is required');
    }

    console.log(`[Chat] Fetching history for conversation: ${conversationId}`);

    try {
      const doc = await db.collection('conversations').doc(conversationId).get();

      if (!doc.exists) {
        return res.json({
          conversationId,
          messages: [],
        });
      }

      const data = doc.data();
      const messages = (data.messages || []).slice(-parseInt(limit, 10));

      res.json({
        conversationId,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp?.toDate?.() || m.timestamp,
        })),
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
      });

    } catch (error) {
      console.error('[Chat] Error fetching history:', error.message);
      throw error;
    }
  })
);

module.exports = router;
