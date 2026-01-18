/**
 * Migration Script: Analyze emotions for existing videos
 *
 * This script analyzes emotions for videos that were indexed before
 * the emotion analysis feature was added.
 *
 * Usage: node scripts/migrate-emotions.js
 */

require('dotenv').config();
const { db } = require('../src/config/firebase');
const { analyzeEmotions } = require('../src/services/gemini.service');

const RATE_LIMIT_DELAY = 1000; // 1 second between Gemini API calls

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function migrateEmotions() {
  console.log('='.repeat(50));
  console.log('Emotion Migration Script');
  console.log('='.repeat(50));
  console.log('');

  try {
    // Get all completed videos without emotion data
    console.log('[Migration] Fetching videos without emotion data...');

    const snapshot = await db
      .collection('videos')
      .where('indexingStatus', '==', 'completed')
      .get();

    const videosToProcess = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      // Skip videos that already have emotion data
      if (!data.emotions) {
        videosToProcess.push({
          id: doc.id,
          summary: data.summary,
          fileName: data.originalName || data.fileName,
        });
      }
    });

    console.log(`[Migration] Found ${snapshot.size} completed videos`);
    console.log(`[Migration] ${videosToProcess.length} videos need emotion analysis`);
    console.log('');

    if (videosToProcess.length === 0) {
      console.log('[Migration] All videos already have emotion data. Nothing to do.');
      return;
    }

    // Process each video
    let processed = 0;
    let failed = 0;

    for (const video of videosToProcess) {
      processed++;
      console.log(`[Migration] Processing ${processed}/${videosToProcess.length}: ${video.fileName}`);

      try {
        // Analyze emotions using the summary
        const emotionData = await analyzeEmotions(video.summary);

        // Update Firestore
        await db.collection('videos').doc(video.id).update({
          emotions: emotionData.emotions,
          dominantEmotion: emotionData.dominantEmotion,
          emotionConfidence: emotionData.emotionConfidence,
          emotionAnalyzedAt: new Date(),
        });

        console.log(`  ✅ Success: dominant=${emotionData.dominantEmotion}, confidence=${emotionData.emotionConfidence.toFixed(2)}`);

      } catch (error) {
        failed++;
        console.error(`  ❌ Failed: ${error.message}`);
      }

      // Rate limiting - wait before next API call
      if (processed < videosToProcess.length) {
        await sleep(RATE_LIMIT_DELAY);
      }
    }

    console.log('');
    console.log('='.repeat(50));
    console.log('Migration Complete');
    console.log('='.repeat(50));
    console.log(`Total processed: ${processed}`);
    console.log(`Successful: ${processed - failed}`);
    console.log(`Failed: ${failed}`);

  } catch (error) {
    console.error('[Migration] Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the migration
migrateEmotions()
  .then(() => {
    console.log('');
    console.log('[Migration] Script finished.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('[Migration] Unhandled error:', error);
    process.exit(1);
  });
