/**
 * Timeline API Route
 * GET /api/timeline - Get timeline data for videos
 */

import { NextResponse } from 'next/server';
import { db, timestampToDate } from '@/lib/services/firebase-admin';

const MILESTONE_KEYWORDS: Record<string, string[]> = {
  birthday: ['birthday', 'cake', 'celebration', 'party', 'candles'],
  vacation: ['trip', 'travel', 'vacation', 'beach', 'holiday trip', 'getaway'],
  graduation: ['graduation', 'degree', 'graduate', 'diploma', 'commencement'],
  wedding: ['wedding', 'married', 'bride', 'groom', 'ceremony', 'vows'],
  birth: ['baby', 'born', 'newborn', 'first steps', 'infant'],
  holiday: ['christmas', 'thanksgiving', 'easter', 'new year', 'halloween'],
};

const MILESTONE_TITLES: Record<string, string> = {
  birthday: 'Birthday Celebration',
  vacation: 'Vacation Memory',
  graduation: 'Graduation Day',
  wedding: 'Wedding Moment',
  birth: 'New Addition',
  holiday: 'Holiday Memory',
};

export async function GET() {
  console.log('[Timeline API] Generating timeline data...');

  try {
    const snapshot = await db
      .collection('videos')
      .where('indexingStatus', '==', 'completed')
      .orderBy('uploadedAt', 'asc')
      .get();

    interface VideoData {
      id: string;
      uploadedAt: Date | null;
      emotionTags: string[];
      duration: number;
      summary: string;
      transcript: string;
      originalName: string;
      storageUrl: string;
      dominantEmotion: string;
    }

    const videos: VideoData[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      videos.push({
        id: doc.id,
        uploadedAt: timestampToDate(data.uploadedAt),
        emotionTags: data.emotionTags || [],
        duration: data.duration || 0,
        summary: data.summary || '',
        transcript: data.transcript || '',
        originalName: data.originalName || '',
        storageUrl: data.storageUrl || '',
        dominantEmotion: data.dominantEmotion || 'joy',
      });
    });

    console.log(`[Timeline API] Found ${videos.length} completed videos`);

    // If no videos, return empty data
    if (videos.length === 0) {
      return NextResponse.json({
        dataPoints: [],
        milestones: [],
        summary: {
          totalVideos: 0,
          totalDuration: 0,
          topEmotionTags: [],
          emotionBreakdown: {},
        },
      });
    }

    // Group videos by month
    const videosByMonth: Record<string, VideoData[]> = {};
    videos.forEach((video) => {
      const date = video.uploadedAt || new Date();
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!videosByMonth[monthKey]) {
        videosByMonth[monthKey] = [];
      }
      videosByMonth[monthKey].push(video);
    });

    console.log(`[Timeline API] Grouped into ${Object.keys(videosByMonth).length} months`);

    // Generate data points
    interface DataPoint {
      date: string;
      emotionTags: Record<string, number>;
      videoCount: number;
      totalDuration: number;
    }

    interface Milestone {
      id: string;
      date: string;
      type: string;
      title: string;
      description: string;
      videoId: string;
      thumbnailUrl: string | null;
      emotion: string;
    }

    const dataPoints: DataPoint[] = [];
    const milestones: Milestone[] = [];
    let totalDuration = 0;
    const aggregatedEmotionTags: Record<string, number> = {};

    for (const [monthKey, monthVideos] of Object.entries(videosByMonth)) {
      const monthEmotionTags: Record<string, number> = {};

      for (const video of monthVideos) {
        const tags = video.emotionTags || [];
        tags.forEach((tag) => {
          if (typeof tag === 'string') {
            const normalizedTag = tag.toLowerCase().trim();
            monthEmotionTags[normalizedTag] = (monthEmotionTags[normalizedTag] || 0) + 1;
            aggregatedEmotionTags[normalizedTag] = (aggregatedEmotionTags[normalizedTag] || 0) + 1;
          }
        });
      }

      const monthDuration = monthVideos.reduce((sum, v) => sum + (v.duration || 0), 0);
      totalDuration += monthDuration;

      dataPoints.push({
        date: `${monthKey}-01`,
        emotionTags: monthEmotionTags,
        videoCount: monthVideos.length,
        totalDuration: monthDuration,
      });

      // Detect milestones
      for (const video of monthVideos) {
        const text = `${video.summary || ''} ${video.transcript || ''}`.toLowerCase();

        for (const [type, keywords] of Object.entries(MILESTONE_KEYWORDS)) {
          const found = keywords.some((keyword) => text.includes(keyword));
          if (found) {
            milestones.push({
              id: `milestone-${video.id}`,
              date: `${monthKey}-01`,
              type,
              title: video.originalName || MILESTONE_TITLES[type],
              description: video.summary || `A special ${type} moment`,
              videoId: video.id,
              thumbnailUrl: video.storageUrl || null,
              emotion: video.dominantEmotion || 'joy',
            });
            break;
          }
        }
      }
    }

    // Sort data points
    dataPoints.sort((a, b) => a.date.localeCompare(b.date));

    // Get top emotion tags
    const sortedEmotionTags = Object.entries(aggregatedEmotionTags).sort((a, b) => b[1] - a[1]);
    const topEmotionTags = sortedEmotionTags.slice(0, 6).map(([tag]) => tag);

    // Calculate emotion breakdown
    const totalTagCount = sortedEmotionTags.reduce((sum, [, count]) => sum + count, 0);
    const emotionBreakdown: Record<string, number> = {};
    sortedEmotionTags.slice(0, 10).forEach(([tag, count]) => {
      emotionBreakdown[tag] = totalTagCount > 0 ? Math.round((count / totalTagCount) * 100) : 0;
    });

    console.log(`[Timeline API] Generated ${dataPoints.length} data points, ${milestones.length} milestones`);

    return NextResponse.json({
      dataPoints,
      milestones,
      summary: {
        totalVideos: videos.length,
        totalDuration,
        topEmotionTags,
        emotionBreakdown,
      },
    });
  } catch (error) {
    console.error('[Timeline API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { message: error instanceof Error ? error.message : 'Unknown error' },
      },
      { status: 500 }
    );
  }
}
