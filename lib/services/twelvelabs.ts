/**
 * TwelveLabs API client for video indexing and search
 * Server-side only (API routes)
 */

const API_KEY = process.env.TWELVELABS_API_KEY;
const BASE_URL = 'https://api.twelvelabs.io/v1.3';
const INDEX_NAME = 'My Index (Default)';

// Confidence threshold levels for search filtering
export type ConfidenceThreshold = 'high' | 'medium' | 'low' | 'none';

// Confidence level returned by TwelveLabs API
export type ConfidenceLevel = 'high' | 'medium' | 'low';

// Search result item with confidence
export interface SearchResultItem {
  video_id: string;
  rank: number;
  start: number;
  end: number;
  confidence: ConfidenceLevel;
  thumbnail_url?: string;
}

// Search options for TwelveLabs API
export interface SearchOptions {
  search_options?: string[];
  page_limit?: number;
  threshold?: ConfidenceThreshold;
}

// Helper to convert confidence level to percentage score
export function confidenceToScore(confidence: ConfidenceLevel, rank: number): number {
  // Base score from confidence level
  const baseScores: Record<ConfidenceLevel, { min: number; max: number }> = {
    high: { min: 85, max: 100 },
    medium: { min: 60, max: 84 },
    low: { min: 30, max: 59 },
  };

  const range = baseScores[confidence];
  // Use rank to differentiate within the confidence range (lower rank = higher score)
  const rankPenalty = Math.min((rank - 1) * 3, range.max - range.min);
  return Math.max(range.min, range.max - rankPenalty);
}

// FormData helper for multipart requests
async function formDataRequest(
  endpoint: string,
  formData: FormData
): Promise<unknown> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY!,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`TwelveLabs API error: ${response.status} - ${errorBody}`);
  }

  return response.json();
}

// JSON request helper
async function jsonRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<unknown> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'x-api-key': API_KEY!,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`TwelveLabs API error: ${response.status} - ${errorBody}`);
  }

  return response.json();
}

/**
 * TwelveLabs client interface
 */
export const twelvelabs = {
  /**
   * Index operations
   */
  index: {
    async list(): Promise<{ data: Array<{ _id: string; index_name: string }> }> {
      return jsonRequest('/indexes') as Promise<{
        data: Array<{ _id: string; index_name: string }>;
      }>;
    },

    async get(
      indexId: string
    ): Promise<{ models?: Array<{ model_options?: string[] }> }> {
      return jsonRequest(`/indexes/${indexId}`) as Promise<{
        models?: Array<{ model_options?: string[] }>;
      }>;
    },

    async create(data: {
      index_name: string;
      engines: Array<{ engine_name: string; engine_options: string[] }>;
    }): Promise<{ _id: string }> {
      return jsonRequest('/indexes', {
        method: 'POST',
        body: JSON.stringify(data),
      }) as Promise<{ _id: string }>;
    },

    video: {
      async retrieve(
        indexId: string,
        videoId: string
      ): Promise<{
        metadata?: { duration?: number; width?: number; height?: number; fps?: number };
        system_metadata?: { duration?: number };
        duration?: number;
      }> {
        return jsonRequest(`/indexes/${indexId}/videos/${videoId}`) as Promise<{
          metadata?: { duration?: number; width?: number; height?: number; fps?: number };
          system_metadata?: { duration?: number };
          duration?: number;
        }>;
      },
    },
  },

  /**
   * Task operations
   */
  task: {
    async create(data: {
      index_id: string;
      url: string;
    }): Promise<{ _id: string; video_id: string }> {
      const formData = new FormData();
      formData.append('index_id', data.index_id);
      formData.append('video_url', data.url);
      return formDataRequest('/tasks', formData) as Promise<{
        _id: string;
        video_id: string;
      }>;
    },

    async get(
      taskId: string
    ): Promise<{ status: string; error_message?: string }> {
      return jsonRequest(`/tasks/${taskId}`) as Promise<{
        status: string;
        error_message?: string;
      }>;
    },
  },

  /**
   * Search operations
   */
  search: {
    async query(
      indexId: string,
      query: string,
      options: SearchOptions = {}
    ): Promise<{
      data: SearchResultItem[];
    }> {
      const formData = new FormData();
      formData.append('index_id', indexId);
      formData.append('query_text', query);
      if (options.search_options) {
        options.search_options.forEach((opt) => {
          formData.append('search_options', opt);
        });
      }
      if (options.page_limit) {
        formData.append('page_limit', options.page_limit.toString());
      }
      // Add threshold parameter to filter low-confidence results at API level
      // Default to 'medium' to exclude low-confidence matches
      const threshold = options.threshold ?? 'medium';
      formData.append('threshold', threshold);
      
      return formDataRequest('/search', formData) as Promise<{
        data: SearchResultItem[];
      }>;
    },
  },

  /**
   * Analyze operations
   */
  analyze: {
    async analyze(
      videoId: string,
      prompt: string,
      options: {
        temperature?: number;
        response_format?: {
          type: string;
          json_schema: Record<string, unknown>;
        };
        max_tokens?: number;
      } = {}
    ): Promise<{ data?: string | Record<string, unknown>; summary?: string; emotionTags?: string[] }> {
      return jsonRequest('/analyze', {
        method: 'POST',
        body: JSON.stringify({
          video_id: videoId,
          prompt,
          temperature: options.temperature || 0.2,
          stream: false,
          ...options,
        }),
      }) as Promise<{ data?: string | Record<string, unknown>; summary?: string; emotionTags?: string[] }>;
    },
  },
};

/**
 * Get or create the TwelveLabs index for MemoryLane
 */
export async function getOrCreateIndex(): Promise<string> {
  console.log('[TwelveLabs] Checking for existing index...');

  const indexesResponse = await twelvelabs.index.list();
  const existingIndex = indexesResponse.data.find(
    (idx) => idx.index_name === INDEX_NAME
  );

  if (existingIndex) {
    console.log(`[TwelveLabs] Found existing index: ${existingIndex._id}`);
    return existingIndex._id;
  }

  console.log(`[TwelveLabs] Creating new index: ${INDEX_NAME}`);
  const newIndex = await twelvelabs.index.create({
    index_name: INDEX_NAME,
    engines: [
      {
        engine_name: 'marengo2.7',
        engine_options: ['visual', 'audio'],
      },
    ],
  });

  console.log(`[TwelveLabs] Created new index: ${newIndex._id}`);
  return newIndex._id;
}

/**
 * Search videos using natural language query
 */
export async function searchVideos(
  query: string,
  options: SearchOptions = {}
): Promise<{
  data: SearchResultItem[];
}> {
  console.log(`[TwelveLabs] Searching for: "${query}"`);

  const indexId = await getOrCreateIndex();
  const indexDetails = await twelvelabs.index.get(indexId);
  const searchOptions = indexDetails.models?.[0]?.model_options || ['visual'];

  console.log(`[TwelveLabs] Using search options: ${searchOptions.join(', ')}, threshold: ${options.threshold ?? 'medium'}`);

  const results = await twelvelabs.search.query(indexId, query, {
    search_options: searchOptions,
    ...options,
  });

  console.log(`[TwelveLabs] Found ${results.data?.length || 0} results`);
  return results;
}

/**
 * Check if TwelveLabs is configured
 */
export function isTwelveLabsConfigured(): boolean {
  return !!API_KEY;
}
