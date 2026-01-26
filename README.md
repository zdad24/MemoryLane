# MemoryLane

**AI-powered video search and memory exploration**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

**[Live Demo](https://ctrl-f-my-life.tech)**

<!-- TODO: Add demo screenshot or GIF here -->
<!-- ![MemoryLane Demo](./public/demo.gif) -->

## About

MemoryLane transforms how you interact with your video memories. Using advanced AI, it lets you search through your video library using natural language, detect emotions in your footage, and have conversations about your memories. Whether you're looking for "that beach sunset from last summer" or want to create a highlight reel of happy moments, MemoryLane makes it effortless.

## Features

- **Natural Language Video Search** - Find moments by describing them in plain English
- **Emotion Detection & Analysis** - AI identifies and categorizes emotional moments in your videos
- **AI Chat with Memories** - Have conversations about your video library with an intelligent assistant
- **Highlight Reel Generation** - Automatically create compilations based on themes or emotions
- **Video Library Management** - Upload, organize, and manage your video collection
- **Timeline Visualization** - Browse your memories on an interactive timeline with emotion filters

## Tech Stack

| Category | Technologies |
|----------|-------------|
| Frontend | Next.js 16, React 19, TypeScript, TailwindCSS |
| UI | Radix UI, Shadcn/ui components |
| Backend | Next.js API Routes |
| Database | Firebase Firestore |
| Storage | Firebase Cloud Storage |
| AI | TwelveLabs (video understanding), Google Gemini (chat) |
| Deployment | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project with Firestore and Cloud Storage enabled
- TwelveLabs API key
- Google Gemini API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/memorylane.git
cd memorylane
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file with your environment variables (see below)

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Firebase Admin SDK (Server-side)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=your-project.appspot.com

# Firebase Client SDK (Client-side)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# AI Services
TWELVELABS_API_KEY=your-twelvelabs-api-key
GEMINI_API_KEY=your-gemini-api-key
```

## Project Structure

```
MemoryLane/
├── app/           # Next.js App Router (pages + API routes)
├── components/    # React UI components
├── lib/           # Utilities and services
├── hooks/         # Custom React hooks
└── public/        # Static assets
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
