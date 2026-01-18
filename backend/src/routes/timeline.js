/**
 * Timeline Routes
 * Handles timeline data generation and retrieval
 */

const express = require('express');
const { db } = require('../config/firebase');
const { asyncHandler } = require('../utils/errors');

const router = express.Router();

const EMOTIONS = ['joy', 'love', 'excitement', 'calm', 'nostalgia', 'sadness'];

const MILESTONE_KEYWORDS = {
  birthday: ['birthday', 'cake', 'celebration', 'party', 'candles'],
  vacation: ['trip', 'travel', 'vacation', 'beach', 'holiday trip', 'getaway'],
  graduation: ['graduation', 'degree', 'graduate', 'diploma', 'commencement'],
  wedding: ['wedding', 'married', 'bride', 'groom', 'ceremony', 'vows'],
  birth: ['baby', 'born', 'newborn', 'first steps', 'infant'],
  holiday: ['christmas', 'thanksgiving', 'easter', 'new year', 'halloween'],
};

const MILESTONE_TITLES = {
  birthday: 'Birthday Celebration',
  vacation: 'Vacation Memory',
  graduation: 'Graduation Day',
  wedding: 'Wedding Moment',
  birth: 'New Addition',
  holiday: 'Holiday Memory',
};

/**
 * GET /api/timeline
 * Get timeline data for the user's videos
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    console.log('[Timeline] Generating timeline data...');

    try {
      // Get all completed videos from Firestore
      const snapshot = await db
        .collection('videos')
        .where('indexingStatus', '==', 'completed')
        .orderBy('uploadedAt', 'asc')
        .get();

      const videos = [];
      snapshot.forEach((doc) => {
        videos.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      console.log(`[Timeline] Found ${videos.length} completed videos`);

      // If no videos, return empty data
      if (videos.length === 0) {
        return res.json({
          dataPoints: [],
          milestones: [],
          summary: {
            totalVideos: 0,
            totalDuration: 0,
            dominantEmotion: null,
            emotionBreakdown: {},
          },
        });
      }

      // Group videos by month
      const videosByMonth = {};
      videos.forEach((video) => {
        const date = video.uploadedAt?.toDate?.() || new Date(video.uploadedAt) || new Date();
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!videosByMonth[monthKey]) {
          videosByMonth[monthKey] = [];
        }
        videosByMonth[monthKey].push(video);
      });

      console.log(`[Timeline] Grouped into ${Object.keys(videosByMonth).length} months`);

      // Generate data points for each month
      const dataPoints = [];
      const milestones = [];
      let totalDuration = 0;
      const aggregatedEmotions = {};
      EMOTIONS.forEach((e) => (aggregatedEmotions[e] = 0));

      for (const [monthKey, monthVideos] of Object.entries(videosByMonth)) {
        // Aggregate real emotion scores from videos in this month
        const emotions = {};
        EMOTIONS.forEach((e) => (emotions[e] = 0));

        let videosWithEmotions = 0;
        for (const video of monthVideos) {
          if (video.emotions) {
            videosWithEmotions++;
            EMOTIONS.forEach((emotion) => {
              emotions[emotion] += video.emotions[emotion] || 0;
            });
          }
        }

        // Calculate average emotions for the month
        if (videosWithEmotions > 0) {
          EMOTIONS.forEach((emotion) => {
            emotions[emotion] = emotions[emotion] / videosWithEmotions;
          });
        } else {
          // Fallback to neutral scores if no videos have emotion data
          EMOTIONS.forEach((emotion) => {
            emotions[emotion] = 0.5;
          });
        }

        // Calculate totals for this month
        const monthDuration = monthVideos.reduce((sum, v) => sum + (v.duration || 0), 0);
        totalDuration += monthDuration;

        // Aggregate emotions for summary
        EMOTIONS.forEach((e) => {
          aggregatedEmotions[e] += emotions[e];
        });

        // Parse month and year for frontend
        const [year, monthNum] = monthKey.split('-');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        dataPoints.push({
          date: monthKey,
          month: monthNames[parseInt(monthNum) - 1],
          year: parseInt(year),
          joy: Math.round(emotions.joy * 100),
          love: Math.round(emotions.love * 100),
          calm: Math.round(emotions.calm * 100),
          excitement: Math.round(emotions.excitement * 100),
          nostalgia: Math.round(emotions.nostalgia * 100),
          sadness: Math.round(emotions.sadness * 100),
          videoCount: monthVideos.length,
          totalDuration: monthDuration,
        });

        // Detect milestones for each video in this month
        for (const video of monthVideos) {
          const text = (video.summary || video.transcript || '').toLowerCase();

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
              break; // Only one milestone per video
            }
          }
        }
      }

      // Sort data points by date
      dataPoints.sort((a, b) => a.date.localeCompare(b.date));

      // Calculate summary statistics
      const monthCount = Object.keys(videosByMonth).length;

      // Normalize aggregated emotions to percentages
      const emotionBreakdown = {};
      let emotionTotal = 0;
      EMOTIONS.forEach((e) => {
        emotionTotal += aggregatedEmotions[e];
      });
      EMOTIONS.forEach((e) => {
        emotionBreakdown[e] = Math.round((aggregatedEmotions[e] / emotionTotal) * 100);
      });

      // Find dominant emotion
      let dominantEmotion = EMOTIONS[0];
      let maxScore = aggregatedEmotions[EMOTIONS[0]];
      EMOTIONS.forEach((e) => {
        if (aggregatedEmotions[e] > maxScore) {
          maxScore = aggregatedEmotions[e];
          dominantEmotion = e;
        }
      });

      const summary = {
        totalVideos: videos.length,
        totalDuration,
        dominantEmotion,
        emotionBreakdown,
      };

      console.log(`[Timeline] Generated ${dataPoints.length} data points, ${milestones.length} milestones`);

      res.json({
        dataPoints,
        milestones,
        summary,
      });

    } catch (error) {
      console.error('[Timeline] Error generating timeline:', error.message);
      throw error;
    }
  })
);

module.exports = router;
