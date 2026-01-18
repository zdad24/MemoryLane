/**
 * Emotion Mapper Utility
 * Maps dynamic emotion tags from the backend to a consistent set of base emotions
 * for chart visualization while preserving the original tag data.
 */

export type BaseEmotionType = 'joy' | 'love' | 'calm' | 'excitement' | 'nostalgia' | 'sadness';

// Map various emotion tags to base emotion categories
const TAG_TO_BASE_EMOTION: Record<string, BaseEmotionType> = {
  // Joy variants
  'joyful': 'joy',
  'joy': 'joy',
  'playful': 'joy',
  'festive': 'joy',
  'happy': 'joy',
  'cheerful': 'joy',

  // Love variants
  'loving': 'love',
  'love': 'love',
  'tender': 'love',
  'heartwarming': 'love',
  'intimate': 'love',
  'affectionate': 'love',
  'romantic': 'love',

  // Calm variants
  'peaceful': 'calm',
  'calm': 'calm',
  'serene': 'calm',
  'relaxed': 'calm',
  'cozy': 'calm',
  'tranquil': 'calm',
  'content': 'calm',

  // Excitement variants
  'excited': 'excitement',
  'excitement': 'excitement',
  'energetic': 'excitement',
  'adventurous': 'excitement',
  'triumphant': 'excitement',
  'thrilling': 'excitement',
  'exhilarating': 'excitement',

  // Nostalgia variants
  'nostalgic': 'nostalgia',
  'nostalgia': 'nostalgia',
  'bittersweet': 'nostalgia',
  'wistful': 'nostalgia',
  'sentimental': 'nostalgia',
  'reminiscent': 'nostalgia',

  // Sadness variants
  'sad': 'sadness',
  'sadness': 'sadness',
  'melancholic': 'sadness',
  'somber': 'sadness',
  'mournful': 'sadness',
};

export const BASE_EMOTIONS: BaseEmotionType[] = ['joy', 'love', 'calm', 'excitement', 'nostalgia', 'sadness'];

export const BASE_EMOTION_COLORS: Record<BaseEmotionType, string> = {
  joy: '#FFD93D',
  love: '#FF6B9D',
  calm: '#6BCB77',
  excitement: '#FF8C42',
  nostalgia: '#9D84B7',
  sadness: '#4A5568',
};

/**
 * Maps a single emotion tag to its base emotion category
 */
export function mapTagToBaseEmotion(tag: string): BaseEmotionType | null {
  const normalized = tag.toLowerCase().trim();
  return TAG_TO_BASE_EMOTION[normalized] || null;
}

/**
 * Converts emotion tags (Record<string, count>) to base emotion scores (0-100)
 */
export function mapTagsToBaseEmotions(tags: Record<string, number>): Record<BaseEmotionType, number> {
  const baseEmotionCounts: Record<BaseEmotionType, number> = {
    joy: 0,
    love: 0,
    calm: 0,
    excitement: 0,
    nostalgia: 0,
    sadness: 0,
  };

  // Sum up counts for each base emotion
  let totalCount = 0;
  for (const [tag, count] of Object.entries(tags)) {
    const baseEmotion = mapTagToBaseEmotion(tag);
    if (baseEmotion) {
      baseEmotionCounts[baseEmotion] += count;
      totalCount += count;
    }
  }

  // Convert to percentages (0-100)
  const result: Record<BaseEmotionType, number> = {
    joy: 0,
    love: 0,
    calm: 0,
    excitement: 0,
    nostalgia: 0,
    sadness: 0,
  };

  if (totalCount > 0) {
    for (const emotion of BASE_EMOTIONS) {
      result[emotion] = Math.round((baseEmotionCounts[emotion] / totalCount) * 100);
    }
  }

  return result;
}

/**
 * Processes timeline data points to add base emotion scores for chart compatibility
 */
export interface ProcessedTimelineDataPoint {
  date: string;
  month: string;
  year: number;
  emotionTags: Record<string, number>;
  videoCount: number;
  totalDuration: number;
  // Base emotion scores (0-100) for chart compatibility
  joy: number;
  love: number;
  calm: number;
  excitement: number;
  nostalgia: number;
  sadness: number;
}

export function processTimelineDataForChart(
  dataPoints: Array<{ date: string; emotionTags: Record<string, number>; videoCount: number; totalDuration: number }>
): ProcessedTimelineDataPoint[] {
  return dataPoints.map((point) => {
    const date = new Date(point.date);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const baseEmotions = mapTagsToBaseEmotions(point.emotionTags || {});

    return {
      ...point,
      month: monthNames[date.getMonth()],
      year: date.getFullYear(),
      ...baseEmotions,
    };
  });
}

/**
 * Get unique emotion tags from data points, sorted by frequency
 */
export function getUniqueEmotionTags(
  dataPoints: Array<{ emotionTags: Record<string, number> }>
): string[] {
  const tagCounts: Record<string, number> = {};

  for (const point of dataPoints) {
    for (const [tag, count] of Object.entries(point.emotionTags || {})) {
      tagCounts[tag] = (tagCounts[tag] || 0) + count;
    }
  }

  return Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag);
}
