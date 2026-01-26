/**
 * Search API Route
 * POST /api/search - Search videos using natural language
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, docToVideo } from '@/lib/services/firebase-admin';
import { twelvelabs, confidenceToScore, ConfidenceLevel, ConfidenceThreshold } from '@/lib/services/twelvelabs';

// Minimum score threshold for displaying results (after confidence-based scoring)
const MIN_SCORE_THRESHOLD = 50;

// Default threshold for filtering at API level (excludes low-confidence results)
const DEFAULT_CONFIDENCE_THRESHOLD: ConfidenceThreshold = 'medium';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, limit = 10 } = body;

    console.log(`[Search API] Received search request: "${query}"`);

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { success: false, error: { message: 'Search query is required' } },
        { status: 400 }
      );
    }

    // Get the TwelveLabs index
    const indexes = await twelvelabs.index.list();
    const index = indexes.data.find((idx) => idx.index_name === 'My Index (Default)');

    // If no index exists, return empty results
    if (!index) {
      console.log('[Search API] Index not found, returning empty results');
      return NextResponse.json({
        query,
        results: [],
        total: 0,
      });
    }

    // Get index details for search options
    const indexDetails = await twelvelabs.index.get(index._id);
    const searchOptions = indexDetails.models?.[0]?.model_options || ['visual'];
    console.log(`[Search API] Using search options: ${searchOptions.join(', ')}, threshold: ${DEFAULT_CONFIDENCE_THRESHOLD}`);

    // Search with TwelveLabs - using threshold to filter low-confidence results at API level
    const searchResults = await twelvelabs.search.query(index._id, query, {
      search_options: searchOptions,
      page_limit: limit,
      threshold: DEFAULT_CONFIDENCE_THRESHOLD,
    });

    // Group by video_id and collect clips
    const videoMap = new Map<
      string,
      {
        videoId: string;
        score: number;
        confidenceLevel: ConfidenceLevel;
        bestRank: number;
        video: ReturnType<typeof docToVideo>;
        clips: Array<{
          start: number;
          end: number;
          score: number;
          confidence: ConfidenceLevel;
          thumbnailUrl: string | null;
        }>;
      }
    >();

    for (const result of searchResults.data || []) {
      const videoId = result.video_id;
      // Use actual confidence from TwelveLabs API to calculate meaningful score
      const confidence = result.confidence || 'low';
      const score = confidenceToScore(confidence, result.rank);

      const clip = {
        start: result.start,
        end: result.end,
        score,
        confidence,
        thumbnailUrl: result.thumbnail_url || null,
      };

      if (videoMap.has(videoId)) {
        const existing = videoMap.get(videoId)!;
        existing.clips.push(clip);
        // Update video score if this clip has better confidence or rank
        if (score > existing.score) {
          existing.bestRank = result.rank;
          existing.score = score;
          existing.confidenceLevel = confidence;
        }
      } else {
        // Fetch video data from Firestore
        const videosSnapshot = await db
          .collection('videos')
          .where('twelveLabsVideoId', '==', videoId)
          .limit(1)
          .get();

        let videoData = null;
        if (!videosSnapshot.empty) {
          videoData = docToVideo(videosSnapshot.docs[0]);
        }

        videoMap.set(videoId, {
          videoId,
          score,
          confidenceLevel: confidence,
          bestRank: result.rank,
          video: videoData,
          clips: [clip],
        });
      }
    }

    // Convert to array and sort by score
    const results = Array.from(videoMap.values())
      .filter((result) => result.score >= MIN_SCORE_THRESHOLD)
      .sort((a, b) => b.score - a.score);

    console.log(`[Search API] Found ${results.length} results for query: "${query}" (filtered from ${videoMap.size} videos)`);
    
    // Log confidence distribution for debugging
    if (results.length > 0) {
      const confidenceCounts = results.reduce((acc, r) => {
        acc[r.confidenceLevel] = (acc[r.confidenceLevel] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log(`[Search API] Confidence distribution:`, confidenceCounts);
    }

    // Save search to Firestore
    await db.collection('searches').add({
      query,
      resultCount: results.length,
      timestamp: new Date(),
    });

    return NextResponse.json({
      query,
      results,
      total: results.length,
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
