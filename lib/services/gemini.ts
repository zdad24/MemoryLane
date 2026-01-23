/**
 * Google Gemini AI client for text generation
 * Server-side only (API routes)
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY;

// Initialize Gemini client (lazy initialization)
let genAI: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
  if (!genAI) {
    if (!API_KEY) {
      throw new Error(
        'GEMINI_API_KEY not found. Set the GEMINI_API_KEY environment variable.'
      );
    }
    genAI = new GoogleGenerativeAI(API_KEY);
  }
  return genAI;
}

/**
 * Generate text based on a prompt
 */
export async function generateText(prompt: string): Promise<string> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const result = await model.generateContent(prompt);
  return result.response.text();
}

/**
 * Generate chat response with history
 */
export async function generateChatResponse(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  context: { videoResults?: unknown } = {}
): Promise<string> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const chat = model.startChat({
    history: history.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    })),
  });

  let prompt = message;
  if (context.videoResults) {
    prompt = `Based on these video search results:\n${JSON.stringify(context.videoResults)}\n\nUser question: ${message}`;
  }

  const result = await chat.sendMessage(prompt);
  return result.response.text();
}

/**
 * Analyze video content and generate summary + emotion tags
 * Used as fallback when TwelveLabs analyze fails
 */
export async function analyzeVideoContent(
  videoName: string
): Promise<{ summary: string; emotionTags: string[] } | null> {
  try {
    const prompt = `You are analyzing a personal video memory. Based on the video filename "${videoName}", generate:

1. SUMMARY: A 2-3 sentence description suggesting what might be happening in this video (people, actions, setting, mood). Make educated guesses based on the filename but keep it warm and personal.

2. EMOTION_TAGS: 2-4 single-word emotion tags that likely capture the feeling of this video. Choose from: joyful, nostalgic, peaceful, energetic, heartwarming, adventurous, tender, playful, bittersweet, triumphant, cozy, serene, intimate, festive, melancholic, excited, relaxed, loving

Respond with ONLY a valid JSON object (no markdown, no code blocks):
{
  "summary": "Your 2-3 sentence summary here",
  "emotionTags": ["tag1", "tag2", "tag3"]
}`;

    const text = await generateText(prompt);

    if (!text) {
      console.error('[Gemini] Empty response from video analysis');
      return null;
    }

    // Parse JSON response, handling potential markdown code blocks
    let jsonStr = text.trim();
    if (jsonStr.includes('```')) {
      const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) {
        jsonStr = match[1].trim();
      }
    }

    const parsed = JSON.parse(jsonStr);

    const summary =
      typeof parsed.summary === 'string' ? parsed.summary.trim() : null;
    const emotionTags = Array.isArray(parsed.emotionTags)
      ? parsed.emotionTags
          .filter((tag: unknown) => typeof tag === 'string')
          .map((tag: string) => tag.toLowerCase().trim())
          .slice(0, 4)
      : [];

    if (!summary || summary.length < 10) {
      console.error('[Gemini] Invalid summary in response');
      return null;
    }

    console.log(
      `[Gemini] Video analyzed - summary: ${summary.length} chars, tags: ${emotionTags.join(', ')}`
    );
    return { summary, emotionTags };
  } catch (error) {
    console.error('[Gemini] Video analysis error:', error);
    return null;
  }
}

/**
 * Analyze emotions in text content
 */
export async function analyzeEmotions(summary: string): Promise<{
  emotions: Record<string, number>;
  dominantEmotion: string;
  emotionConfidence: number;
}> {
  const defaultEmotions = {
    emotions: {
      joy: 0.5,
      love: 0.5,
      calm: 0.5,
      excitement: 0.5,
      nostalgia: 0.5,
      sadness: 0.5,
    },
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

Each score should be between 0.0 and 1.0.`;

    const responseText = await generateText(prompt);

    // Extract JSON from response
    let jsonStr = responseText.trim();
    if (jsonStr.includes('```')) {
      const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) {
        jsonStr = match[1].trim();
      }
    }

    const emotions = JSON.parse(jsonStr);

    // Validate and clamp scores
    const validEmotions: Record<string, number> = {};
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

    return {
      emotions: validEmotions,
      dominantEmotion,
      emotionConfidence: maxScore,
    };
  } catch (error) {
    console.error('[Gemini] Emotion analysis error:', error);
    return defaultEmotions;
  }
}

/**
 * Check if Gemini is configured
 */
export function isGeminiConfigured(): boolean {
  return !!API_KEY;
}
