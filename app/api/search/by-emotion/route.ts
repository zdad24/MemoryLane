/**
 * Search by Emotion API Route
 * GET /api/search/by-emotion?emotion=joyful&limit=20
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, docToVideo } from '@/lib/services/firebase-admin';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const emotion = url.searchParams.get('emotion');
  const limit = parseInt(url.searchParams.get('limit') || '20', 10);

  console.log(`[Search API] Searching by emotion tag: "${emotion}"`);

  if (!emotion || typeof emotion !== 'string') {
    return NextResponse.json(
      { success: false, error: { message: 'Emotion parameter is required' } },
      { status: 400 }
    );
  }

  const normalizedEmotion = emotion.toLowerCase().trim();

  try {
    const snapshot = await db
      .collection('videos')
      .where('indexingStatus', '==', 'completed')
      .where('emotionTags', 'array-contains', normalizedEmotion)
      .limit(limit)
      .get();

    const videos = snapshot.docs
      .map((doc) => docToVideo(doc))
      .filter((v) => v !== null);

    console.log(`[Search API] Found ${videos.length} videos with emotion tag: "${emotion}"`);

    // Save search to Firestore
    await db.collection('searches').add({
      type: 'emotion',
      emotion: normalizedEmotion,
      resultCount: videos.length,
      timestamp: new Date(),
    });

    return NextResponse.json({
      emotion: normalizedEmotion,
      results: videos,
      total: videos.length,
    });
  } catch (error) {
    console.error('[Search API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { message: error instanceof Error ? error.message : 'Unknown error' },
      },
      { status: 500 }
    );
  }
}
