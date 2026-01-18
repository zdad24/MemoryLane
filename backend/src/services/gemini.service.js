require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Check for API key
if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not found in .env');
  console.error('   Get your API key from: https://aistudio.google.com/apikey');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// Test connection (skip actual API call to avoid rate limits)
console.log('✅ Gemini configured (model: gemini-2.5-flash)');

/**
 * Generate a chat response
 * @param {string} message - User message
 * @param {Array} history - Chat history
 * @param {Object} context - Additional context (e.g., video search results)
 * @returns {Promise<string>} Generated response
 */
async function generateChatResponse(message, history = [], context = {}) {
  const chat = model.startChat({
    history: history.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    })),
  });

  // Build prompt with context
  let prompt = message;
  if (context.videoResults) {
    prompt = `Based on these video search results:\n${JSON.stringify(context.videoResults)}\n\nUser question: ${message}`;
  }

  const result = await chat.sendMessage(prompt);
  return result.response.text();
}

/**
 * Generate text based on a prompt
 * @param {string} prompt - Text prompt
 * @returns {Promise<string>} Generated text
 */
async function generateText(prompt) {
  const result = await model.generateContent(prompt);
  return result.response.text();
}

/**
 * Summarize video content based on search results
 * @param {Object} searchResults - TwelveLabs search results
 * @param {string} query - Original user query
 * @returns {Promise<string>} Summary
 */
async function summarizeVideoContent(searchResults, query) {
  const prompt = `Based on these video search results for the query "${query}":\n${JSON.stringify(searchResults)}\n\nProvide a helpful summary of what was found in the videos.`;
  const result = await model.generateContent(prompt);
  return result.response.text();
}

/**
 * Generate timeline narrative from video data
 * @param {Array} videos - Array of video metadata
 * @returns {Promise<Object>} Timeline narrative data
 */
async function generateTimelineNarrative(videos) {
  const prompt = `Given these videos and their dates:\n${JSON.stringify(videos)}\n\nCreate a brief narrative describing the memories and moments captured.`;
  const result = await model.generateContent(prompt);
  return { narrative: result.response.text() };
}

/**
 * Generate a summary for a video based on its transcript
 * @param {string} text - Video transcript text
 * @returns {Promise<string>} Generated summary
 */
async function generateSummary(text) {
  try {
    const truncatedText = (text || '').slice(0, 2000);
    const prompt = `Summarize this video transcript in 2-3 sentences, focusing on key moments and emotions:\n\n${truncatedText}`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('[Gemini] Summary generation error:', error.message);
    return 'Unable to generate summary at this time.';
  }
}

/**
 * Analyze emotions in video content based on summary text
 * @param {string} summary - Video summary text
 * @returns {Promise<Object>} Emotion analysis results
 */
async function analyzeEmotions(summary) {
  const defaultEmotions = {
    emotions: { joy: 0.5, love: 0.5, calm: 0.5, excitement: 0.5, nostalgia: 0.5, sadness: 0.5 },
    dominantEmotion: 'calm',
    emotionConfidence: 0.5,
  };

  try {
    if (!summary || summary.length < 10) {
      console.log('[Gemini] Summary too short for emotion analysis, using defaults');
      return defaultEmotions;
    }

    const truncatedSummary = summary.slice(0, 1500);
    const prompt = `Analyze the emotional content of this video summary and provide emotion scores.

Video Summary:
${truncatedSummary}

Respond with ONLY a valid JSON object (no markdown, no code blocks) in this exact format:
{
  "joy": 0.0,
  "love": 0.0,
  "calm": 0.0,
  "excitement": 0.0,
  "nostalgia": 0.0,
  "sadness": 0.0
}

Each score should be between 0.0 and 1.0, where:
- 0.0 = emotion not present
- 1.0 = emotion strongly present

Consider:
- joy: happiness, laughter, fun moments
- love: affection, family bonds, romantic moments
- calm: peaceful, relaxing, serene scenes
- excitement: action, adventure, high energy
- nostalgia: memories, past events, sentimental value
- sadness: melancholy, tearful, bittersweet moments`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    // Extract JSON from response (handle potential markdown code blocks)
    let jsonStr = responseText;
    if (responseText.includes('```')) {
      const match = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) {
        jsonStr = match[1].trim();
      }
    }

    const emotions = JSON.parse(jsonStr);

    // Validate and clamp scores
    const validEmotions = {};
    const emotionKeys = ['joy', 'love', 'calm', 'excitement', 'nostalgia', 'sadness'];

    for (const key of emotionKeys) {
      const value = parseFloat(emotions[key]);
      validEmotions[key] = isNaN(value) ? 0.5 : Math.max(0, Math.min(1, value));
    }

    // Find dominant emotion
    let dominantEmotion = 'calm';
    let maxScore = 0;
    for (const [emotion, score] of Object.entries(validEmotions)) {
      if (score > maxScore) {
        maxScore = score;
        dominantEmotion = emotion;
      }
    }

    console.log(`[Gemini] Emotion analysis complete: dominant=${dominantEmotion}, confidence=${maxScore.toFixed(2)}`);

    return {
      emotions: validEmotions,
      dominantEmotion,
      emotionConfidence: maxScore,
    };

  } catch (error) {
    console.error('[Gemini] Emotion analysis error:', error.message);
    return defaultEmotions;
  }
}

module.exports = {
  model,
  generateChatResponse,
  generateText,
  summarizeVideoContent,
  generateTimelineNarrative,
  generateSummary,
  analyzeEmotions,
};
