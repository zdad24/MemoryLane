"use client"

import { useState, useEffect } from "react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Wand2, Clock, Music, Sparkles } from "lucide-react"
import { getEmotionColor } from "@/lib/mock-data"
import { musicOptions, transitionOptions } from "@/lib/reel-data"
import { api, type Video } from "@/lib/api"
import { cn } from "@/lib/utils"

interface ReelConfigProps {
  onGenerate: (config: ReelConfiguration) => void
  isGenerating: boolean
}

export interface ReelConfiguration {
  title: string
  duration: number
  emotions: string[]
  musicId: string
  transitionId: string
}

export function ReelConfig({ onGenerate, isGenerating }: ReelConfigProps) {
  const [title, setTitle] = useState("")
  const [duration, setDuration] = useState(60)
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([])
  const [selectedMusic, setSelectedMusic] = useState("emotional")
  const [selectedTransition, setSelectedTransition] = useState("crossfade")
  const [availableEmotions, setAvailableEmotions] = useState<string[]>([])
  const [videos, setVideos] = useState<Video[]>([])

  useEffect(() => {
    // Fetch available emotions and videos
    const fetchData = async () => {
      try {
        const [emotionStats, videosResponse] = await Promise.all([
          api.getEmotionStats(),
          api.getVideos(),
        ])
        setAvailableEmotions(emotionStats.emotions.slice(0, 8)) // Show top 8 emotions
        setVideos(videosResponse.videos)
      } catch {
        // Failed to fetch data
      }
    }
    fetchData()
  }, [])

  const handleToggleEmotion = (emotion: string) => {
    setSelectedEmotions((prev) => (prev.includes(emotion) ? prev.filter((e) => e !== emotion) : [...prev, emotion]))
  }

  const handleGenerate = () => {
    onGenerate({
      title: title || `Highlight Reel - ${new Date().toLocaleDateString()}`,
      duration,
      emotions: selectedEmotions,
      musicId: selectedMusic,
      transitionId: selectedTransition,
    })
  }

  // Calculate eligible videos
  const eligibleVideos = videos.filter((v) => {
    if (selectedEmotions.length === 0) return true
    const videoTags = v.emotionTags || []
    return selectedEmotions.some((e) => videoTags.includes(e))
  })

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-foreground">
          Reel Title (Optional)
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="My Highlight Reel"
          className="bg-card border-border"
        />
      </div>

      {/* Duration */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Duration
          </Label>
          <span className="text-lg font-semibold text-foreground font-mono">{formatDuration(duration)}</span>
        </div>
        <Slider
          value={[duration]}
          min={30}
          max={300}
          step={30}
          onValueChange={([value]) => setDuration(value)}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>30s</span>
          <span>1 min</span>
          <span>2 min</span>
          <span>3 min</span>
          <span>5 min</span>
        </div>
      </div>

      {/* Emotions */}
      <div className="space-y-4">
        <Label className="text-foreground flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Emotions to Include
        </Label>
        <div className="flex flex-wrap gap-2">
          {availableEmotions.map((emotion) => {
            const isSelected = selectedEmotions.includes(emotion)
            const colors = getEmotionColor(emotion)
            return (
              <button
                key={emotion}
                onClick={() => handleToggleEmotion(emotion)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 capitalize",
                  isSelected
                    ? `${colors.bg} ${colors.text} shadow-lg ${colors.glow}`
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80",
                )}
              >
                {emotion}
              </button>
            )
          })}
        </div>
        <p className="text-sm text-muted-foreground">
          {eligibleVideos.length} videos match your selection ({selectedEmotions.join(", ") || "all emotions"})
        </p>
      </div>

      {/* Music */}
      <div className="space-y-4">
        <Label className="text-foreground flex items-center gap-2">
          <Music className="w-4 h-4 text-primary" />
          Background Music
        </Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {musicOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedMusic(option.id)}
              className={cn(
                "p-3 rounded-xl text-left transition-all duration-200 border",
                selectedMusic === option.id
                  ? "bg-primary/10 border-primary text-foreground"
                  : "bg-card border-border text-muted-foreground hover:border-primary/30",
              )}
            >
              <p className="font-medium text-sm">{option.name}</p>
              <p className="text-xs opacity-70">{option.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Transitions */}
      <div className="space-y-4">
        <Label className="text-foreground">Transition Style</Label>
        <div className="grid grid-cols-2 gap-3">
          {transitionOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedTransition(option.id)}
              className={cn(
                "p-3 rounded-xl text-left transition-all duration-200 border",
                selectedTransition === option.id
                  ? "bg-primary/10 border-primary text-foreground"
                  : "bg-card border-border text-muted-foreground hover:border-primary/30",
              )}
            >
              <p className="font-medium text-sm">{option.name}</p>
              <p className="text-xs opacity-70">{option.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <Button
        onClick={handleGenerate}
        disabled={isGenerating || eligibleVideos.length === 0}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-6 text-lg rounded-xl"
      >
        {isGenerating ? (
          <>
            <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
            Generating...
          </>
        ) : (
          <>
            <Wand2 className="w-5 h-5 mr-2" />
            Generate Highlight Reel
          </>
        )}
      </Button>
    </div>
  )
}
