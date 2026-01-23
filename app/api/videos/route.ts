/**
 * Videos API Route - List all videos
 * GET /api/videos
 */

import { NextResponse } from 'next/server';
import { db, docToVideo } from '@/lib/services/firebase-admin';

export async function GET() {
  console.log('[Videos API] Fetching video list...');

  try {
    const snapshot = await db
      .collection('videos')
      .orderBy('uploadedAt', 'desc')
      .limit(50)
      .get();

    const videos = snapshot.docs
      .map((doc) => docToVideo(doc))
      .filter((v) => v !== null);

    console.log(`[Videos API] Found ${videos.length} videos`);

    return NextResponse.json({
      success: true,
      videos,
      count: videos.length,
    });
  } catch (error) {
    console.error('[Videos API] List error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { message: error instanceof Error ? error.message : 'Unknown error' },
      },
      { status: 500 }
    );
  }
}
