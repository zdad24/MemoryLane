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

module.exports = {
  model,
  generateChatResponse,
  generateText,
  summarizeVideoContent,
  generateTimelineNarrative,
  generateSummary,
};
