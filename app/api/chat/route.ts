/**
 * Chat API Route
 * POST /api/chat - Send chat message and get AI response
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, admin, docToVideo, timestampToDate, VideoDocument } from '@/lib/services/firebase-admin';
import { generateText } from '@/lib/services/gemini';
import { searchVideos, confidenceToScore, ConfidenceThreshold } from '@/lib/services/twelvelabs';

const MAX_CONTEXT_VIDEOS = 5;
const ATTACH_LIMIT = 3;
// Higher threshold for chat context - only show high-confidence matches
const MIN_SCORE_THRESHOLD = 75;
const HISTORY_LIMIT = 8;
// Use 'high' threshold for chat to ensure only relevant videos are used as context
const CHAT_CONFIDENCE_THRESHOLD: ConfidenceThreshold = 'high';

function formatDate(dateValue: Date | string | null | undefined): string {
  if (!dateValue) return 'Unknown date';
  const d = new Date(dateValue);
  return isNaN(d.getTime()) ? 'Unknown date' : d.toLocaleDateString();
}

function isFollowUpMessage(message: string): boolean {
  return /\b(this|that|it|those|these|that one|this one|the last one)\b/i.test(message);
}

function detectIntent(message: string): 'show_video' | 'generate' | 'search' {
  if (/\b(show|open|play|watch)\b/i.test(message)) return 'show_video';
  if (/\b(create|generate|make)\b/i.test(message)) return 'generate';
  return 'search';
}

function isRecentRequest(message: string): boolean {
  return /\b(last|latest|most recent|newest)\b/i.test(message);
}

async function fetchRecentVideos(limit = MAX_CONTEXT_VIDEOS): Promise<VideoDocument[]> {
  const snapshot = await db.collection('videos').orderBy('uploadedAt', 'desc').limit(limit).get();
  return snapshot.docs.map((doc) => docToVideo(doc)).filter((v): v is VideoDocument => v !== null);
}

async function fetchVideosByIds(ids: string[]): Promise<VideoDocument[]> {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  const results = await Promise.all(
    uniqueIds.map(async (id) => {
      const doc = await db.collection('videos').doc(id).get();
      return docToVideo(doc);
    })
  );
  return results.filter((v): v is VideoDocument => v !== null);
}

async function fetchVideosByTwelveLabsIds(videoIds: string[]): Promise<Map<string, VideoDocument>> {
  const ids = videoIds.filter(Boolean);
  if (ids.length === 0) return new Map();

  const videoMap = new Map<string, VideoDocument>();
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += 10) {
    chunks.push(ids.slice(i, i + 10));
  }

  for (const chunk of chunks) {
    const snapshot = await db.collection('videos').where('twelveLabsVideoId', 'in', chunk).get();
    snapshot.forEach((doc) => {
      const video = docToVideo(doc);
      if (video?.twelveLabsVideoId) {
        videoMap.set(video.twelveLabsVideoId, video);
      }
    });
  }

  return videoMap;
}

function buildVideoContext(videos: VideoDocument[]): string {
  if (!videos || videos.length === 0) return 'No videos available.';
  return videos
    .map((video, index) => {
      const transcript = video.transcript ? video.transcript.slice(0, 800) : null;
      const emotionTags =
        Array.isArray(video.emotionTags) && video.emotionTags.length > 0
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

interface Message {
  role: 'user' | 'assistant';
  content: string;
  attachedVideos?: Array<{ id: string }>;
}

function buildHistoryContext(messages: Message[]): string {
  if (!messages || messages.length === 0) return '';
  const recent = messages.slice(-HISTORY_LIMIT);
  return recent.map((msg) => `${msg.role === 'assistant' ? 'Assistant' : 'User'}: ${msg.content}`).join('\n');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationId: inputConversationId } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, error: { message: 'Message is required' } },
        { status: 400 }
      );
    }

    let conversationId = inputConversationId;
    let conversationMessages: Message[] = [];
    let lastAttachedVideos: Array<{ id: string }> = [];

    // Load conversation history
    if (conversationId) {
      const doc = await db.collection('conversations').doc(conversationId).get();
      if (doc.exists) {
        const data = doc.data()!;
        conversationMessages = data.messages || [];
        const lastAssistant = [...conversationMessages].reverse().find((m) => m.role === 'assistant');
        lastAttachedVideos = lastAssistant?.attachedVideos || [];
      }
    }

    const intent = detectIntent(message);
    const followUp = isFollowUpMessage(message);
    let candidateVideos: VideoDocument[] = [];

    // Find relevant videos
    if (followUp && lastAttachedVideos.length > 0) {
      const ids = lastAttachedVideos.map((v) => v.id).filter(Boolean);
      candidateVideos = await fetchVideosByIds(ids);
    } else if (intent === 'show_video' && isRecentRequest(message)) {
      candidateVideos = await fetchRecentVideos(1);
    } else {
      try {
        // Use high confidence threshold for chat to ensure relevant context
        const searchResults = await searchVideos(message, { 
          page_limit: 10,
          threshold: CHAT_CONFIDENCE_THRESHOLD 
        });
        const videoIds = searchResults.data.map((r) => r.video_id);
        const videoMap = await fetchVideosByTwelveLabsIds(videoIds);

        // Use confidence-based scoring instead of rank-based
        const merged = searchResults.data
          .map((result) => {
            const video = videoMap.get(result.video_id);
            if (!video) return null;
            // Use actual confidence from TwelveLabs to calculate meaningful score
            const confidence = result.confidence || 'low';
            const score = confidenceToScore(confidence, result.rank);
            return { ...video, searchScore: score };
          })
          .filter((v): v is VideoDocument & { searchScore: number } => v !== null && v.searchScore >= MIN_SCORE_THRESHOLD)
          .sort((a, b) => b.searchScore - a.searchScore);

        candidateVideos = merged.slice(0, MAX_CONTEXT_VIDEOS);
      } catch {
        // Search failed, will use fallback
      }
    }

    // Fallback to recent videos
    if (candidateVideos.length === 0) {
      candidateVideos = await fetchRecentVideos(MAX_CONTEXT_VIDEOS);
    }

    const videoContext = buildVideoContext(candidateVideos);
    const historyContext = buildHistoryContext(conversationMessages);

    // Build prompt
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

    // Generate response
    let responseText = "I'm having trouble processing your request right now. Please try again in a moment.";
    try {
      responseText = await generateText(prompt);
    } catch (geminiError) {
      const errorMsg = geminiError instanceof Error ? geminiError.message : '';
      if (errorMsg.includes('429') || errorMsg.includes('quota')) {
        responseText =
          "I'm currently experiencing high demand. Based on your videos, I found some matches - you can view them below. Please try your question again in a minute.";
      }
    }

    // Save conversation
    try {
      if (!conversationId) {
        const convDoc = await db.collection('conversations').add({
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          messages: [],
        });
        conversationId = convDoc.id;
      }

      const attachedVideos = candidateVideos.slice(0, ATTACH_LIMIT).map((v) => ({
        id: v.id,
        summary: v.summary || v.originalName || v.fileName || 'Untitled',
        originalName: v.originalName || v.fileName || 'Untitled',
        uploadedAt: v.uploadedAt,
        storageUrl: v.storageUrl,
        duration: v.duration || null,
        thumbnailUrl: null,
        emotionTags: v.emotionTags || [],
        intent,
      }));

      await db.collection('conversations').doc(conversationId).update({
        messages: admin.firestore.FieldValue.arrayUnion(
          { role: 'user', content: message, timestamp: new Date() },
          { role: 'assistant', content: responseText, timestamp: new Date(), attachedVideos }
        ),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch {
      // Firestore save failed, continue with response
    }

    return NextResponse.json({
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
        thumbnailUrl: null,
        emotionTags: v.emotionTags || [],
        intent,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: { message: error instanceof Error ? error.message : 'Unknown error' },
      },
      { status: 500 }
    );
  }
}
