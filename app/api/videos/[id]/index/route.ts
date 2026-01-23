/**
 * Video Indexing API Route
 * POST /api/videos/:id/index - Trigger TwelveLabs indexing
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, admin } from '@/lib/services/firebase-admin';
import { getOrCreateIndex, twelvelabs } from '@/lib/services/twelvelabs';
import { generateText, analyzeVideoContent } from '@/lib/services/gemini';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const url = new URL(request.url);
  const force = url.searchParams.get('force') === 'true';

  console.log(`[Index API] Index request for video: ${id}${force ? ' (force re-index)' : ''}`);

  try {
    const doc = await db.collection('videos').doc(id).get();

    if (!doc.exists) {
      console.log(`[Index API] Video not found: ${id}`);
      return NextResponse.json(
        { success: false, message: `Video not found: ${id}` },
        { status: 404 }
      );
    }

    const videoData = doc.data()!;

    // Check if already indexing (unless force)
    if (videoData.indexingStatus === 'indexing' && !force) {
      return NextResponse.json(
        { success: false, message: 'Video is already being indexed' },
        { status: 400 }
      );
    }

    if (videoData.indexingStatus === 'completed' && !force) {
      return NextResponse.json(
        {
          success: false,
          message: 'Video has already been indexed. Use ?force=true to re-index.',
        },
        { status: 400 }
      );
    }

    // Reset indexing status for re-indexing
    if (force) {
      await db.collection('videos').doc(id).update({
        indexingStatus: 'pending',
        twelveLabsVideoId: admin.firestore.FieldValue.delete(),
        twelveLabsTaskId: admin.firestore.FieldValue.delete(),
        twelveLabsIndexId: admin.firestore.FieldValue.delete(),
      });
    }

    // Start indexing
    console.log(`[Index API] Starting TwelveLabs indexing for: ${videoData.originalName}`);

    const indexId = await getOrCreateIndex();

    // Update Firestore: indexing started
    await db.collection('videos').doc(id).update({
      indexingStatus: 'indexing',
      twelveLabsIndexId: indexId,
      indexingStartedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create indexing task
    const task = await twelvelabs.task.create({
      index_id: indexId,
      url: videoData.storageUrl,
    });

    console.log(`[Index API] Task created: ${task._id}`);
    console.log(`[Index API] TwelveLabs Video ID: ${task.video_id}`);

    // Update Firestore with task info
    await db.collection('videos').doc(id).update({
      twelveLabsTaskId: task._id,
      twelveLabsVideoId: task.video_id,
    });

    // Start polling in background (non-blocking)
    pollIndexingStatus(id, task._id, indexId, task.video_id, videoData.originalName || 'video');

    return NextResponse.json({
      success: true,
      message: 'Indexing started',
      taskId: task._id,
      twelveLabsVideoId: task.video_id,
    });
  } catch (error) {
    console.error('[Index API] Error:', error);

    // Update Firestore with error
    try {
      await db.collection('videos').doc(id).update({
        indexingStatus: 'failed',
        indexingError: error instanceof Error ? error.message : 'Unknown error',
        indexingFailedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (dbError) {
      console.error('[Index API] Failed to update error status:', dbError);
    }

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
 * Poll TwelveLabs for indexing status
 * This runs in the background and updates Firestore when complete
 */
async function pollIndexingStatus(
  videoId: string,
  taskId: string,
  indexId: string,
  tlVideoId: string,
  originalName: string
) {
  console.log(`[Index API] Starting polling for task: ${taskId}`);

  let attempts = 0;
  const maxAttempts = 60; // 5 minutes at 5-second intervals
  const pollInterval = 5000; // 5 seconds

  const poll = async () => {
    attempts++;

    try {
      if (attempts % 10 === 0) {
        console.log(`[Index API] Polling attempt ${attempts}/${maxAttempts} for task ${taskId}`);
      }

      const task = await twelvelabs.task.get(taskId);
      const status = task.status;

      console.log(`[Index API] Task ${taskId} status: ${status}`);

      if (status === 'ready') {
        console.log(`[Index API] Indexing completed for video: ${videoId}`);
        await extractVideoData(videoId, tlVideoId, indexId, originalName);
        return;
      } else if (status === 'failed') {
        console.error(`[Index API] Indexing failed for video: ${videoId}`);
        await db.collection('videos').doc(videoId).update({
          indexingStatus: 'failed',
          indexingError: task.error_message || 'Indexing failed',
          indexingFailedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return;
      } else if (attempts >= maxAttempts) {
        console.error(`[Index API] Polling timeout for video: ${videoId}`);
        await db.collection('videos').doc(videoId).update({
          indexingStatus: 'timeout',
          indexingError: 'Polling timeout after 5 minutes',
          indexingFailedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return;
      }

      // Continue polling
      setTimeout(poll, pollInterval);
    } catch (error) {
      console.error(`[Index API] Polling error for ${videoId}:`, error);

      if (attempts >= maxAttempts) {
        await db.collection('videos').doc(videoId).update({
          indexingStatus: 'failed',
          indexingError: `Polling error: ${error instanceof Error ? error.message : 'Unknown'}`,
          indexingFailedAt: admin.firestore.FieldValue.serverTimestamp(),
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
 * Extract video data after indexing completes
 */
async function extractVideoData(
  videoId: string,
  tlVideoId: string,
  indexId: string,
  originalName: string
) {
  try {
    console.log(`[Index API] Extracting data for video: ${tlVideoId}`);

    // Get video info from TwelveLabs
    let videoInfo = null;
    try {
      videoInfo = await twelvelabs.index.video.retrieve(indexId, tlVideoId);
      console.log('[Index API] Video info retrieved');
    } catch (error) {
      console.error('[Index API] Failed to retrieve video info:', error);
    }

    // Analyze video content using TwelveLabs
    let summary: string | null = null;
    let emotionTags: string[] = [];

    try {
      console.log(`[Index API] Analyzing video content for: ${videoId}`);
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

      console.log(`[Index API] Video analyzed - tags: ${emotionTags.join(', ')}`);
    } catch (error) {
      console.error('[Index API] TwelveLabs analyze error:', error);
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

    // Extract duration from video info
    let duration: number | null = null;
    if (videoInfo) {
      duration =
        videoInfo.metadata?.duration ??
        videoInfo.duration ??
        videoInfo.system_metadata?.duration ??
        null;
    }

    // Update Firestore with extracted data
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
    console.log(`[Index API] Video data saved to Firestore: ${videoId}`);
  } catch (error) {
    console.error(`[Index API] extractVideoData error for ${videoId}:`, error);
    await db.collection('videos').doc(videoId).update({
      indexingStatus: 'failed',
      indexingError: error instanceof Error ? error.message : 'Unknown error',
      indexingFailedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}
