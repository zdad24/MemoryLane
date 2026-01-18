/**
 * MemoryLane Backend API Server
 * Main entry point
 */

require('dotenv').config();

// Polyfill fetch for Node versions that don't provide it natively
if (typeof fetch === 'undefined') {
  const nodeFetch = require('node-fetch');
  global.fetch = nodeFetch;
  global.Headers = nodeFetch.Headers;
  global.Request = nodeFetch.Request;
  global.Response = nodeFetch.Response;
}

const express = require('express');
const cors = require('cors');
const { errorHandler, NotFoundError } = require('./utils/errors');

// Initialize services
require('./config/firebase');
require('./config/twelvelabs');
require('./services/gemini.service');

// Import routes
const videosRouter = require('./routes/videos');
const searchRouter = require('./routes/search');
const timelineRouter = require('./routes/timeline');
const chatRouter = require('./routes/chat');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use('/api/videos', videosRouter);
app.use('/api/search', searchRouter);
app.use('/api/timeline', timelineRouter);
app.use('/api/chat', chatRouter);

// 404 handler for unmatched routes
app.use((req, res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.path} not found`));
});

// Global error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`MemoryLane Backend API Server`);
  console.log('='.repeat(50));
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('='.repeat(50));
});

module.exports = app;
