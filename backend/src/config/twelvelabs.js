require('dotenv').config();

// Ensure fetch is available for Node.js < 18
if (typeof fetch === 'undefined') {
  const nodeFetch = require('node-fetch');
  global.fetch = nodeFetch;
  global.Headers = nodeFetch.Headers;
  global.Request = nodeFetch.Request;
  global.Response = nodeFetch.Response;
}

const FormData = require('form-data');
const https = require('https');
const http = require('http');

// Check for API key
if (!process.env.TWELVELABS_API_KEY) {
  console.error('❌ TWELVELABS_API_KEY not found in .env');
  console.error('   Get your API key from: https://api.twelvelabs.io');
  process.exit(1);
}

const API_KEY = process.env.TWELVELABS_API_KEY;
const BASE_URL = 'https://api.twelvelabs.io/v1.3';

// Helper to make form-data requests
async function formDataRequest(endpoint, formData) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${endpoint}`);

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        ...formData.getHeaders()
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 400) {
            reject(new Error(`TwelveLabs API error: ${res.statusCode} - ${JSON.stringify(json)}`));
          } else {
            resolve(json);
          }
        } catch (e) {
          reject(new Error(`Invalid JSON response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    formData.pipe(req);
  });
}

// Simple client wrapper for TwelveLabs API v1.3
const client = {
  apiKey: API_KEY,
  baseUrl: BASE_URL,

  async request(endpoint, options = {}) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[TwelveLabs] API error ${response.status}:`, errorBody);
      throw new Error(`TwelveLabs API error: ${response.status} - ${errorBody}`);
    }
    return response.json();
  },

  index: {
    async list() {
      return client.request('/indexes');
    },
    async get(indexId) {
      return client.request(`/indexes/${indexId}`);
    },
    async create(data) {
      return client.request('/indexes', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    video: {
      async retrieve(indexId, videoId) {
        return client.request(`/indexes/${indexId}/videos/${videoId}`);
      },
      async list(indexId) {
        return client.request(`/indexes/${indexId}/videos`);
      },
    },
  },

  task: {
    async create(data) {
      // Use form-data for multipart/form-data request (required by TwelveLabs)
      const formData = new FormData();
      formData.append('index_id', data.index_id);
      // TwelveLabs expects 'video_url' for URL-based uploads
      formData.append('video_url', data.url);

      return formDataRequest('/tasks', formData);
    },
    async retrieve(taskId) {
      return client.request(`/tasks/${taskId}`);
    },
    async get(taskId) {
      return client.request(`/tasks/${taskId}`);
    },
  },

  search: {
    async query(indexId, query, options = {}) {
      // TwelveLabs search API requires multipart/form-data
      const formData = new FormData();
      formData.append('index_id', indexId);
      formData.append('query_text', query);
      if (options.search_options) {
        if (Array.isArray(options.search_options)) {
          options.search_options.forEach(option => {
            formData.append('search_options', option);
          });
        } else {
          formData.append('search_options', options.search_options);
        }
      }
      if (options.page_limit) {
        formData.append('page_limit', options.page_limit.toString());
      }
      return formDataRequest('/search', formData);
    },
  },

  generate: {
    async text(videoId, prompt, options = {}) {
      return client.request('/generate', {
        method: 'POST',
        body: JSON.stringify({ video_id: videoId, prompt, ...options }),
      });
    },
  },

  // Analyze videos endpoint - generates summaries, emotion tags, etc. from video content
  analyze: {
    async analyze(videoId, prompt, options = {}) {
      const body = {
        video_id: videoId,
        prompt,
        temperature: options.temperature || 0.2,
        stream: false,
        ...options
      };
      return client.request('/analyze', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },
  },
};

// Test connection
async function testConnection() {
  try {
    const indexes = await client.index.list();
    console.log('✅ TwelveLabs connected');
    console.log(`   Found ${indexes.data?.length || 0} existing indexes`);
  } catch (error) {
    console.error('❌ TwelveLabs connection failed:', error.message);
  }
}

testConnection();

module.exports = client;
