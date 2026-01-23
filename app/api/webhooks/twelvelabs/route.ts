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
    console.log('[Webhook] TwelveLabs webhook received:', JSON.stringify(body).slice(0, 500));

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
        console.log(`[Webhook] Unhandled event type: ${event}`);
    }

    return NextResponse.json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('[Webhook] Error processing webhook:', error);
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

  console.log(`[Webhook] Task completed: ${task_id}, video: ${tlVideoId}`);

  if (!tlVideoId || !indexId) {
    console.error('[Webhook] Missing video_id or index_id in webhook data');
    return;
  }

  // Find the video document by TwelveLabs video ID
  const snapshot = await db
    .collection('videos')
    .where('twelveLabsVideoId', '==', tlVideoId)
    .limit(1)
    .get();

  if (snapshot.empty) {
    console.error(`[Webhook] Video not found for TwelveLabs ID: ${tlVideoId}`);
    return;
  }

  const doc = snapshot.docs[0];
  const videoId = doc.id;
  const videoData = doc.data();

  console.log(`[Webhook] Processing video: ${videoId} (${videoData.originalName})`);

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

  console.error(`[Webhook] Task failed: ${task_id}, video: ${tlVideoId}, error: ${error_message}`);

  if (!tlVideoId) {
    console.error('[Webhook] Missing video_id in webhook data');
    return;
  }

  // Find the video document
  const snapshot = await db
    .collection('videos')
    .where('twelveLabsVideoId', '==', tlVideoId)
    .limit(1)
    .get();

  if (snapshot.empty) {
    console.error(`[Webhook] Video not found for TwelveLabs ID: ${tlVideoId}`);
    return;
  }

  const doc = snapshot.docs[0];

  // Update video status to failed
  await db.collection('videos').doc(doc.id).update({
    indexingStatus: 'failed',
    indexingError: error_message || 'Indexing failed via webhook',
    indexingFailedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`[Webhook] Video marked as failed: ${doc.id}`);
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
    console.log(`[Webhook] Extracting data for video: ${tlVideoId}`);

    // Get video info from TwelveLabs
    let videoInfo = null;
    try {
      videoInfo = await twelvelabs.index.video.retrieve(indexId, tlVideoId);
      console.log('[Webhook] Video info retrieved');
    } catch (error) {
      console.error('[Webhook] Failed to retrieve video info:', error);
    }

    // Analyze video content
    let summary: string | null = null;
    let emotionTags: string[] = [];

    try {
      console.log(`[Webhook] Analyzing video content for: ${videoId}`);
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

      console.log(`[Webhook] Video analyzed - tags: ${emotionTags.join(', ')}`);
    } catch (error) {
      console.error('[Webhook] TwelveLabs analyze error:', error);
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
    console.log(`[Webhook] Video data saved: ${videoId}`);
  } catch (error) {
    console.error(`[Webhook] extractVideoData error for ${videoId}:`, error);
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
