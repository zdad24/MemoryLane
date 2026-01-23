/**
 * TwelveLabs Webhook Handler
 * POST /api/webhooks/twelvelabs - Receive indexing completion notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, admin } from '@/lib/services/firebase-admin';
import { twelvelabs } from '@/lib/services/twelvelabs';
import { analyzeVideoContent } from '@/lib/services/gemini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, data } = body;

    // Handle different webhook events
    switch (event) {
      case 'task.ready':
      case 'task.completed':
        await handleTaskCompleted(data);
        break;

      case 'task.failed':
        await handleTaskFailed(data);
        break;

      default:
        // Unhandled event type
        break;
    }

    return NextResponse.json({ success: true, message: 'Webhook processed' });
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

/**
 * Handle task completion webhook
 */
async function handleTaskCompleted(data: {
  task_id?: string;
  video_id?: string;
  index_id?: string;
}) {
  const { task_id, video_id: tlVideoId, index_id: indexId } = data;

  if (!tlVideoId || !indexId) {
    return;
  }

  // Find the video document by TwelveLabs video ID
  const snapshot = await db
    .collection('videos')
    .where('twelveLabsVideoId', '==', tlVideoId)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return;
  }

  const doc = snapshot.docs[0];
  const videoId = doc.id;
  const videoData = doc.data();

  // Extract video data
  await extractVideoData(videoId, tlVideoId, indexId, videoData.originalName || 'video');
}

/**
 * Handle task failure webhook
 */
async function handleTaskFailed(data: {
  task_id?: string;
  video_id?: string;
  error_message?: string;
}) {
  const { task_id, video_id: tlVideoId, error_message } = data;

  if (!tlVideoId) {
    return;
  }

  // Find the video document
  const snapshot = await db
    .collection('videos')
    .where('twelveLabsVideoId', '==', tlVideoId)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return;
  }

  const doc = snapshot.docs[0];

  // Update video status to failed
  await db.collection('videos').doc(doc.id).update({
    indexingStatus: 'failed',
    indexingError: error_message || 'Indexing failed via webhook',
    indexingFailedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

/**
 * Extract video data after indexing completes
 */
async function extractVideoData(
  videoId: string,
  tlVideoId: string,
  indexId: string,
  originalName: string
) {
  try {
    // Get video info from TwelveLabs
    let videoInfo = null;
    try {
      videoInfo = await twelvelabs.index.video.retrieve(indexId, tlVideoId);
    } catch {
      // Failed to retrieve video info
    }

    // Analyze video content
    let summary: string | null = null;
    let emotionTags: string[] = [];

    try {
      const prompt = `Analyze this video and provide a JSON response with:
1. "summary": A 2-3 sentence description of what happens in the video, including people, actions, setting, and mood. Make it warm and personal.
2. "emotionTags": An array of 2-4 single-word emotion tags that capture the feeling of this video.

Choose emotion tags from: joyful, nostalgic, peaceful, energetic, heartwarming, adventurous, tender, playful, bittersweet, triumphant, cozy, serene, intimate, festive, melancholic, excited, relaxed, loving

Respond with ONLY a valid JSON object.`;

      const result = await twelvelabs.analyze.analyze(tlVideoId, prompt, {
        temperature: 0.3,
        max_tokens: 500,
      });

      // Parse response
      let data = result as { summary?: string; emotionTags?: string[]; data?: string };
      if (typeof result.data === 'string') {
        data = JSON.parse(result.data);
      }

      summary = data.summary || null;
      emotionTags = Array.isArray(data.emotionTags)
        ? data.emotionTags.map((tag: string) => tag.toLowerCase().trim()).slice(0, 4)
        : [];
    } catch {
      // Fallback to Gemini
      const geminiResult = await analyzeVideoContent(originalName);
      if (geminiResult) {
        summary = geminiResult.summary;
        emotionTags = geminiResult.emotionTags;
      }
    }

    // Fallback summary
    if (!summary) {
      summary = 'A video memory has been saved to your collection.';
    }

    // Extract duration
    let duration: number | null = null;
    if (videoInfo) {
      duration =
        videoInfo.metadata?.duration ??
        videoInfo.duration ??
        videoInfo.system_metadata?.duration ??
        null;
    }

    // Update Firestore
    const updateData: Record<string, unknown> = {
      twelveLabsProcessed: true,
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      summary,
      emotionTags,
      indexingStatus: 'completed',
      indexingCompletedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (duration !== null) {
      updateData.duration = duration;
    }

    await db.collection('videos').doc(videoId).update(updateData);
  } catch (error) {
    await db.collection('videos').doc(videoId).update({
      indexingStatus: 'failed',
      indexingError: error instanceof Error ? error.message : 'Unknown error',
      indexingFailedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}

// Also handle GET for webhook verification (some services require this)
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'TwelveLabs webhook endpoint is active',
  });
}
