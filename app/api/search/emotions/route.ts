/**
 * Emotion Statistics API Route
 * GET /api/search/emotions - Get all unique emotion tags and counts
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/services/firebase-admin';

export async function GET() {
  console.log('[Search API] Getting emotion tag statistics');

  try {
    const snapshot = await db
      .collection('videos')
      .where('indexingStatus', '==', 'completed')
      .get();

    const emotionCounts: Record<string, number> = {};

    snapshot.forEach((doc) => {
      const data = doc.data();
      const tags = data.emotionTags || [];
      tags.forEach((tag: unknown) => {
        if (typeof tag === 'string') {
          const normalizedTag = tag.toLowerCase().trim();
          emotionCounts[normalizedTag] = (emotionCounts[normalizedTag] || 0) + 1;
        }
      });
    });

    // Sort emotions by count (descending)
    const sortedEmotions = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([emotion]) => emotion);

    return NextResponse.json({
      emotions: sortedEmotions,
      counts: emotionCounts,
      totalVideos: snapshot.size,
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
