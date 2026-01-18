/**
 * Chat Routes
 * Handles AI chat interactions about user's videos
 */

const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { db, admin } = require('../config/firebase');
const { asyncHandler, ValidationError } = require('../utils/errors');

const router = express.Router();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

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

    try {
      // Get recent videos for context (last 10 completed)
      const videosSnapshot = await db
        .collection('videos')
        .where('indexingStatus', '==', 'completed')
        .orderBy('uploadedAt', 'desc')
        .limit(10)
        .get();

      const videos = [];
      videosSnapshot.forEach((doc) => {
        const data = doc.data();
        videos.push({
          id: doc.id,
          summary: data.summary || 'Untitled',
          uploadedAt: data.uploadedAt,
          storageUrl: data.storageUrl,
        });
      });

      // Build context string from videos
      const videoContext = videos.length > 0
        ? videos.map((v) => {
            const dateStr = v.uploadedAt?.toDate?.()
              ? v.uploadedAt.toDate().toLocaleDateString()
              : 'Unknown date';
            return `- Video: ${v.summary}\n  Date: ${dateStr}`;
          }).join('\n')
        : 'No videos available yet.';

      // Create Gemini prompt
      const prompt = `You are MemoryLane AI, a helpful assistant that helps users explore their personal video memories.

User's Videos:
${videoContext}

User Question: ${message}

Instructions:
1. Answer naturally and conversationally
2. Reference specific videos when relevant
3. Be empathetic and nostalgic
4. Keep responses concise (2-3 paragraphs)

Response:`;

      // Generate response with Gemini
      let responseText;
      try {
        const result = await model.generateContent(prompt);
        responseText = result.response.text();
        console.log(`[Chat] Response generated (${responseText.length} chars)`);
      } catch (geminiError) {
        console.error('[Chat] Gemini API error:', geminiError.message);
        responseText = "I'm having trouble processing your request right now. Please try again in a moment.";
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
        await db.collection('conversations').doc(conversationId).update({
          messages: admin.firestore.FieldValue.arrayUnion(
            { role: 'user', content: message, timestamp: new Date() },
            { role: 'assistant', content: responseText, timestamp: new Date() }
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
        attachedVideos: videos.map((v) => ({
          id: v.id,
          summary: v.summary,
          uploadedAt: v.uploadedAt?.toDate?.() || v.uploadedAt,
          storageUrl: v.storageUrl,
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
