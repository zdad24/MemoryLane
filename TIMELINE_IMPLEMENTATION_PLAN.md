# Timeline Feature Implementation Plan

## Overview
Connect the existing Timeline UI to the backend API, replacing mock data with real video emotion data.

---

## Current State Analysis

### What Works
- ✅ Beautiful stacked area chart (Recharts)
- ✅ Emotion legend with toggle filtering
- ✅ Milestone markers on chart
- ✅ Milestone detail modals
- ✅ Timeline stats display
- ✅ Backend API `/api/timeline` returns real data

### What's Broken
- ❌ Frontend uses hardcoded mock data (`lib/timeline-data.ts`)
- ❌ No API calls to backend
- ❌ No loading/error states
- ❌ Data structure mismatch between frontend and backend

---

## Data Structure Mismatches

### TimelineDataPoint

**Frontend expects** (`lib/timeline-data.ts`):
```typescript
{
  date: string        // "2023-01"
  month: string       // "Jan"
  year: number        // 2023
  joy: number         // 0-100 (percentage)
  love: number
  calm: number
  excitement: number
  nostalgia: number
  sadness: number
  videoCount: number
}
```

**Backend returns** (`routes/timeline.js`):
```javascript
{
  date: string        // "2023-01-01"
  emotions: {         // nested object!
    joy: number       // 0-1 (decimal)
    love: number
    ...
  }
  videoCount: number
  totalDuration: number
}
```

### Milestone

**Frontend expects**:
```typescript
{
  id: string
  date: string
  type: "birthday" | "wedding" | "graduation" | "vacation" | "birth" | "holiday"
  title: string
  description: string
  videoId?: string
  emotion: EmotionType  // Required for coloring!
}
```

**Backend returns**:
```javascript
{
  date: string
  type: string          // Only 3 types: birthday, vacation, graduation
  title: string
  videoId: string
  thumbnailUrl: string
  // Missing: id, description, emotion
}
```

---

## Implementation Steps

### Phase 1: Update Backend Response Format
**File:** `backend/src/routes/timeline.js`

#### 1.1 Add more milestone types and keywords
```javascript
const MILESTONE_KEYWORDS = {
  birthday: ['birthday', 'cake', 'celebration', 'party', 'candles'],
  vacation: ['trip', 'travel', 'vacation', 'beach', 'holiday trip', 'getaway'],
  graduation: ['graduation', 'degree', 'graduate', 'diploma', 'commencement'],
  wedding: ['wedding', 'married', 'bride', 'groom', 'ceremony', 'vows'],
  birth: ['baby', 'born', 'newborn', 'first steps', 'infant'],
  holiday: ['christmas', 'thanksgiving', 'easter', 'new year', 'halloween'],
};

const MILESTONE_TITLES = {
  birthday: 'Birthday Celebration',
  vacation: 'Vacation Memory',
  graduation: 'Graduation Day',
  wedding: 'Wedding Moment',
  birth: 'New Addition',
  holiday: 'Holiday Memory',
};
```

#### 1.2 Update dataPoints format to flatten emotions
```javascript
// Change from:
dataPoints.push({
  date: `${monthKey}-01`,
  emotions,  // nested object
  videoCount: monthVideos.length,
  totalDuration: monthDuration,
});

// To:
const [year, monthNum] = monthKey.split('-');
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
dataPoints.push({
  date: monthKey,
  month: monthNames[parseInt(monthNum) - 1],
  year: parseInt(year),
  joy: Math.round(emotions.joy * 100),
  love: Math.round(emotions.love * 100),
  calm: Math.round(emotions.calm * 100),
  excitement: Math.round(emotions.excitement * 100),
  nostalgia: Math.round(emotions.nostalgia * 100),
  sadness: Math.round(emotions.sadness * 100),
  videoCount: monthVideos.length,
  totalDuration: monthDuration,
});
```

#### 1.3 Add missing milestone fields
```javascript
milestones.push({
  id: `milestone-${video.id}`,
  date: `${monthKey}-01`,
  type,
  title: video.originalName || MILESTONE_TITLES[type],
  description: video.summary || `A special ${type} moment`,
  videoId: video.id,
  thumbnailUrl: video.storageUrl || null,
  emotion: video.dominantEmotion || 'joy',
});
```

---

### Phase 2: Update Frontend Types
**File:** `lib/api.ts`

#### 2.1 Update TimelineDataPoint interface
```typescript
export interface TimelineDataPoint {
  date: string;
  month: string;
  year: number;
  joy: number;
  love: number;
  calm: number;
  excitement: number;
  nostalgia: number;
  sadness: number;
  videoCount: number;
  totalDuration: number;
}
```

#### 2.2 Add Milestone interface
```typescript
export type MilestoneType = 'birthday' | 'wedding' | 'graduation' | 'vacation' | 'birth' | 'holiday';
export type EmotionType = 'joy' | 'love' | 'calm' | 'excitement' | 'nostalgia' | 'sadness';

export interface Milestone {
  id: string;
  date: string;
  type: MilestoneType;
  title: string;
  description: string;
  videoId?: string;
  thumbnailUrl?: string;
  emotion: EmotionType;
}
```

#### 2.3 Update TimelineResponse
```typescript
export interface TimelineResponse {
  dataPoints: TimelineDataPoint[];
  milestones: Milestone[];
  summary: {
    totalVideos: number;
    totalDuration: number;
    dominantEmotion: EmotionType | null;
    emotionBreakdown: Record<string, number>;
  };
}
```

---

### Phase 3: Create Timeline Data Hook
**New File:** `hooks/use-timeline.ts`

```typescript
import { useState, useEffect } from 'react';
import { api, TimelineResponse } from '@/lib/api';

interface UseTimelineResult {
  data: TimelineResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useTimeline(): UseTimelineResult {
  const [data, setData] = useState<TimelineResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTimeline = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getTimeline();
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load timeline');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, []);

  return { data, isLoading, error, refetch: fetchTimeline };
}
```

---

### Phase 4: Update Timeline Page
**File:** `app/timeline/page.tsx`

#### 4.1 Replace mock imports with hook
```typescript
// Remove:
import { mockTimelineData, mockMilestones, ... } from "@/lib/timeline-data"
import { mockVideos, ... } from "@/lib/mock-data"

// Add:
import { useTimeline } from "@/hooks/use-timeline"
import { Loader2 } from "lucide-react"
```

#### 4.2 Add data fetching
```typescript
export default function TimelinePage() {
  const { data, isLoading, error } = useTimeline();
  const [selectedEmotions, setSelectedEmotions] = useState<EmotionType[]>([...]);
  // ... rest of state

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!data || data.dataPoints.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="flex-1 pt-24 pb-16 px-4">
          <EmptyTimelineState />
        </main>
        <Footer />
      </div>
    );
  }

  // Normal render with data.dataPoints and data.milestones
  return (
    // ... existing JSX but use data.dataPoints instead of mockTimelineData
  );
}
```

#### 4.3 Update component props
```typescript
<EmotionalChart
  data={data.dataPoints}           // was: mockTimelineData
  milestones={data.milestones}     // was: mockMilestones
  selectedEmotions={selectedEmotions}
  onMilestoneClick={setSelectedMilestone}
/>
```

---

### Phase 5: Update TimelineStats Component
**File:** `components/timeline/timeline-stats.tsx`

#### 5.1 Accept props instead of using mock data
```typescript
interface TimelineStatsProps {
  summary: {
    totalVideos: number;
    totalDuration: number;
    dominantEmotion: string | null;
    emotionBreakdown: Record<string, number>;
  };
  dataPoints: TimelineDataPoint[];
}

export function TimelineStats({ summary, dataPoints }: TimelineStatsProps) {
  const totalMinutes = Math.round(summary.totalDuration / 60);

  // Calculate time span from data points
  const months = dataPoints.length;

  const stats = [
    {
      icon: Film,
      label: "Videos",
      value: summary.totalVideos,
      color: "text-primary",
    },
    {
      icon: Clock,
      label: "Minutes",
      value: totalMinutes,
      color: "text-[#FFD93D]",
    },
    {
      icon: Smile,
      label: "Top Emotion",
      value: summary.dominantEmotion
        ? summary.dominantEmotion.charAt(0).toUpperCase() + summary.dominantEmotion.slice(1)
        : "N/A",
      color: summary.dominantEmotion
        ? emotionColors[summary.dominantEmotion].bg.replace("bg-", "text-")
        : "text-muted",
    },
    {
      icon: Calendar,
      label: "Time Span",
      value: `${months} months`,
      color: "text-[#6BCB77]",
    },
  ];

  // ... rest of component
}
```

#### 5.2 Update page to pass props
```typescript
<TimelineStats
  summary={data.summary}
  dataPoints={data.dataPoints}
/>
```

---

### Phase 6: Create Empty State Component
**New File:** `components/timeline/empty-timeline.tsx`

```typescript
import { Film, Upload } from "lucide-react"
import Link from "next/link"

export function EmptyTimelineState() {
  return (
    <div className="max-w-md mx-auto text-center py-16">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-secondary flex items-center justify-center">
        <Film className="w-10 h-10 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-3">
        No Memories Yet
      </h2>
      <p className="text-muted-foreground mb-8">
        Upload your first video to start building your emotional timeline.
      </p>
      <Link
        href="/upload"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
      >
        <Upload className="w-5 h-5" />
        Upload Video
      </Link>
    </div>
  );
}
```

---

### Phase 7: Handle Video Playback
**File:** `app/timeline/page.tsx`

Update the handleViewVideo function to fetch video from API:

```typescript
const handleViewVideo = async (videoId: string) => {
  try {
    const video = await api.getVideo(videoId);
    if (video) {
      setSelectedMilestone(null);
      setSelectedVideo({
        id: video.id,
        title: video.originalName,
        thumbnailUrl: video.storageUrl,
        videoUrl: video.storageUrl,
        durationSeconds: video.duration || 0,
        date: video.uploadedAt as string,
        emotion: video.dominantEmotion || 'joy',
        summary: video.summary || '',
        tags: [],
      });
    }
  } catch (error) {
    console.error('Failed to load video:', error);
  }
};
```

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `backend/src/routes/timeline.js` | Modify | Add milestone types, flatten emotions, add missing fields |
| `lib/api.ts` | Modify | Update TimelineDataPoint, add Milestone interface |
| `hooks/use-timeline.ts` | Create | Data fetching hook with loading/error states |
| `app/timeline/page.tsx` | Modify | Replace mock data with API, add states |
| `components/timeline/timeline-stats.tsx` | Modify | Accept props instead of mock data |
| `components/timeline/empty-timeline.tsx` | Create | Empty state when no videos |
| `lib/timeline-data.ts` | Keep | Keep for type definitions and icons only |

---

## Testing Checklist

1. [ ] With 0 videos: Shows empty state with upload CTA
2. [ ] With videos but no emotions: Shows neutral emotion scores
3. [ ] With fully indexed videos: Shows real emotion data
4. [ ] Loading state: Spinner shows while fetching
5. [ ] Error state: Error message with retry button
6. [ ] Chart filtering: Toggle emotions works
7. [ ] Milestone click: Opens detail modal
8. [ ] Video playback: Video player modal opens
9. [ ] Stats accuracy: Numbers match actual data

---

## Optional Enhancements (Future)

1. **Date range filtering** - Filter timeline to specific date range
2. **Refresh button** - Manual data refresh
3. **Real-time updates** - WebSocket for new video notifications
4. **Export timeline** - Download as image/PDF
5. **Share timeline** - Generate shareable link
6. **Emotion trends** - Show trend arrows (up/down from last month)
