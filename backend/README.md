# MemoryLane Backend API

Node.js Express backend server for the MemoryLane AI application.

## Setup

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Firebase project with Firestore enabled
- TwelveLabs API key
- Google Gemini API key

### Installation

1. Install dependencies:

```bash
cd backend
npm install
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Configure environment variables in `.env`:

```
PORT=3001
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="your-private-key"
FIREBASE_DATABASE_URL=https://your-project-id.firebaseio.com
TWELVELABS_API_KEY=your-twelvelabs-api-key
GEMINI_API_KEY=your-gemini-api-key
```

### Running the Server

Development mode (with hot reload):

```bash
npm run dev
```

Production mode:

```bash
npm start
```

## API Endpoints

### Health Check

- `GET /health` - Server health status

### Videos

- `POST /api/videos` - Upload a new video
- `GET /api/videos` - List all videos
- `GET /api/videos/:id` - Get a specific video
- `DELETE /api/videos/:id` - Delete a video

### Search

- `POST /api/search` - Search videos with natural language query

### Timeline

- `GET /api/timeline` - Get timeline data for videos

### Chat

- `POST /api/chat` - Send a chat message
- `GET /api/chat/history` - Get chat history

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── firebase.js      # Firebase Admin SDK setup
│   │   └── twelvelabs.js    # TwelveLabs client setup
│   ├── routes/
│   │   ├── videos.js        # Video endpoints
│   │   ├── search.js        # Search endpoints
│   │   ├── timeline.js      # Timeline endpoints
│   │   └── chat.js          # Chat endpoints
│   ├── services/
│   │   ├── twelvelabs.service.js  # TwelveLabs API integration
│   │   └── gemini.service.js      # Gemini AI integration
│   ├── utils/
│   │   └── errors.js        # Error handling utilities
│   └── index.js             # Main server entry point
├── .env.example             # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3001) |
| `CORS_ORIGIN` | Allowed CORS origin (default: http://localhost:3000) |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email |
| `FIREBASE_PRIVATE_KEY` | Firebase service account private key |
| `FIREBASE_DATABASE_URL` | Firebase Realtime Database URL |
| `TWELVELABS_API_KEY` | TwelveLabs API key |
| `GEMINI_API_KEY` | Google Gemini API key |
