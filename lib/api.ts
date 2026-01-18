/**
 * API Client for MemoryLane Backend
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Types
export interface Video {
  id: string;
  fileName: string;
  originalName: string;
  storageUrl: string;
  storagePath: string;
  uploadedAt: string | Date;
  fileSize: number;
  mimeType: string;
  status: string;
  indexingStatus: 'pending' | 'indexing' | 'completed' | 'failed';
  twelveLabsVideoId?: string;
  summary?: string;
  transcript?: string;
  duration?: number;
  emotionTags?: string[];
}

export interface UploadResponse {
  success: boolean;
  videoId: string;
  url: string;
  message: string;
}

export interface IndexResponse {
  success: boolean;
  message: string;
  taskId: string;
  twelveLabsVideoId: string;
}

export interface VideosResponse {
  success: boolean;
  videos: Video[];
  count: number;
}

export interface SearchClip {
  start: number;
  end: number;
  score: number;
  thumbnailUrl: string | null;
}

export interface SearchResult {
  videoId: string;
  score: number;
  confidence: number;
  video: Video | null;
  clips: SearchClip[];
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  total: number;
}

export interface TimelineDataPoint {
  date: string;
  emotionTags: Record<string, number>;
  videoCount: number;
  totalDuration: number;
}

export interface Milestone {
  date: string;
  type: 'birthday' | 'vacation' | 'graduation';
  title: string;
  videoId: string;
  thumbnailUrl: string | null;
}

export interface TimelineSummary {
  totalVideos: number;
  totalDuration: number;
  topEmotionTags: string[];
  emotionBreakdown: Record<string, number>;
}

export interface TimelineResponse {
  dataPoints: TimelineDataPoint[];
  milestones: Milestone[];
  summary: TimelineSummary;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string | Date;
}

export interface AttachedVideo {
  id: string;
  summary: string;
  uploadedAt: string | Date;
  storageUrl: string;
  originalName?: string;
  duration?: number | null;
  thumbnailUrl?: string | null;
  emotionTags?: string[];
  intent?: 'search' | 'show_video' | 'followup' | 'generate';
}

export interface ChatResponse {
  conversationId: string;
  message: {
    role: 'assistant';
    content: string;
  };
  attachedVideos: AttachedVideo[];
}

export interface ChatHistoryResponse {
  conversationId: string;
  messages: ChatMessage[];
  createdAt?: string | Date;
}

// API Error class
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Helper function for fetch with error handling
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        ...options?.headers,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      throw new ApiError(
        data?.error?.message || data?.message || 'Request failed',
        res.status,
        data
      );
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Network error'
    );
  }
}

// API Client
export const api = {
  /**
   * Upload a video file
   */
  uploadVideo: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('video', file);

    const res = await fetch(`${API_URL}/api/videos/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new ApiError(
        data?.error?.message || 'Upload failed',
        res.status,
        data
      );
    }

    return data;
  },

  /**
   * Trigger video indexing with TwelveLabs
   */
  indexVideo: async (videoId: string): Promise<IndexResponse> => {
    return fetchApi<IndexResponse>(`/api/videos/${videoId}/index`, {
      method: 'POST',
    });
  },

  /**
   * Get all videos
   */
  getVideos: async (): Promise<VideosResponse> => {
    return fetchApi<VideosResponse>('/api/videos');
  },

  /**
   * Get a single video by ID
   */
  getVideo: async (videoId: string): Promise<Video & { success: boolean }> => {
    return fetchApi<Video & { success: boolean }>(`/api/videos/${videoId}`);
  },

  /**
   * Delete a video
   */
  deleteVideo: async (videoId: string): Promise<{ success: boolean; message: string }> => {
    return fetchApi<{ success: boolean; message: string }>(`/api/videos/${videoId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Search videos using natural language
   */
  search: async (query: string, limit = 10): Promise<SearchResponse> => {
    return fetchApi<SearchResponse>('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, limit }),
    });
  },

  /**
   * Get timeline data
   */
  getTimeline: async (): Promise<TimelineResponse> => {
    return fetchApi<TimelineResponse>('/api/timeline');
  },

  /**
   * Send a chat message
   */
  chat: async (message: string, conversationId?: string): Promise<ChatResponse> => {
    return fetchApi<ChatResponse>('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, conversationId }),
    });
  },

  /**
   * Get chat history for a conversation
   */
  getChatHistory: async (conversationId: string, limit = 50): Promise<ChatHistoryResponse> => {
    return fetchApi<ChatHistoryResponse>(
      `/api/chat/history?conversationId=${conversationId}&limit=${limit}`
    );
  },

  /**
   * Get videos by emotion tag
   */
  getVideosByEmotion: async (
    emotion: string,
    options?: { limit?: number }
  ): Promise<{ emotion: string; results: Video[]; total: number }> => {
    const params = new URLSearchParams({ emotion });
    if (options?.limit) params.append('limit', String(options.limit));
    return fetchApi(`/api/search/by-emotion?${params.toString()}`);
  },

  /**
   * Get emotion statistics
   */
  getEmotionStats: async (): Promise<{
    emotions: string[];
    counts: Record<string, number>;
    totalVideos: number;
  }> => {
    return fetchApi('/api/search/emotions');
  },
};

export default api;
