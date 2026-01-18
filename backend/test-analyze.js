/**
 * Test script for TwelveLabs analyze API
 */
require('dotenv').config();

const client = require('./src/config/twelvelabs');

async function testAnalyzeAPI() {
    // Use an existing indexed video ID
    const testVideoId = '696c96b6058486b3c418e8cd';

    console.log('Testing TwelveLabs /analyze API...');
    console.log('Video ID:', testVideoId);

    try {
        const prompt = `Analyze this video and provide a JSON response with:
1. "summary": A 2-3 sentence description of what happens in the video, including people, actions, setting, and mood.
2. "emotionTags": An array of 2-4 single-word emotion tags that capture the feeling of this video.

Choose emotion tags from: joyful, nostalgic, peaceful, energetic, heartwarming, adventurous, tender, playful, bittersweet, triumphant, cozy, serene, intimate, festive, melancholic, excited, relaxed, loving

Respond with ONLY a valid JSON object.`;

        // Call the analyze method we added to the client
        const result = await client.analyze.analyze(testVideoId, prompt, {
            temperature: 0.3,
            max_tokens: 500
        });

        console.log('\n✅ Analysis successful!');
        console.log('Result:', JSON.stringify(result, null, 2));

    } catch (error) {
        console.error('\n❌ Analysis failed:', error.message);
        if (error.response) {
            console.log('Response status:', error.response.status);
        }
    }
}

testAnalyzeAPI();
