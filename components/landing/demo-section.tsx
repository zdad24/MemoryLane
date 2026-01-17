"use client"

import { useState } from "react"
import { Search, Play, ArrowRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const sampleQueries = ["Moments of laughter", "Beach vacations", "Birthday celebrations"]

const mockResults = [
  {
    id: 1,
    thumbnail: "/family-laughing-at-dinner.jpg",
    emotion: "joy",
    time: "2:34",
    title: "Family Dinner",
    date: "Summer 2023",
  },
  {
    id: 2,
    thumbnail: "/kids-playing-at-beach.jpg",
    emotion: "excitement",
    time: "1:15",
    title: "Beach Day",
    date: "July 2023",
  },
  {
    id: 3,
    thumbnail: "/birthday-party.png",
    emotion: "love",
    time: "3:45",
    title: "Birthday Party",
    date: "March 2023",
  },
]

const emotionColors: Record<string, string> = {
  joy: "#FFD93D",
  love: "#FF6B9D",
  excitement: "#FF8C42",
}

export function DemoSection() {
  const [query, setQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const handleSearch = () => {
    if (!query.trim()) return
    setIsSearching(true)
    setTimeout(() => {
      setIsSearching(false)
      setShowResults(true)
    }, 1000)
  }

  return (
    <section className="py-32 px-6 bg-muted/30">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Try it yourself</h2>
          <p className="text-muted-foreground">Search memories using natural language</p>
        </div>

        <div className="max-w-xl mx-auto mb-6">
          <div className="relative flex gap-2 p-1.5 rounded-xl bg-card border border-border shadow-sm">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Describe a memory..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10 pr-4 h-11 bg-transparent border-none text-base placeholder:text-muted-foreground focus-visible:ring-0"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isSearching}
              className="bg-foreground text-background hover:bg-foreground/90 h-11 px-5"
            >
              {isSearching ? (
                <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {sampleQueries.map((q) => (
              <button
                key={q}
                onClick={() => {
                  setQuery(q)
                  setShowResults(false)
                }}
                className="px-3 py-1.5 rounded-full text-sm bg-foreground/5 text-muted-foreground 
                  hover:bg-foreground/10 hover:text-foreground transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {showResults && (
          <div className="grid md:grid-cols-3 gap-4 animate-slide-up">
            {mockResults.map((result) => (
              <div
                key={result.id}
                className="group rounded-xl overflow-hidden bg-card border border-border 
                  hover:border-border/80 hover:shadow-lg transition-all duration-300"
              >
                <div className="relative aspect-video">
                  <img
                    src={result.thumbnail || "/placeholder.svg"}
                    alt={result.title}
                    className="w-full h-full object-cover"
                  />
                  <div
                    className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 
                    transition-opacity flex items-center justify-center"
                  >
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Play className="w-4 h-4 text-white fill-white" />
                    </div>
                  </div>
                  <div
                    className="absolute bottom-0 left-0 right-0 h-1"
                    style={{ backgroundColor: emotionColors[result.emotion] }}
                  />
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/60 text-white text-xs font-mono">
                    {result.time}
                  </div>
                </div>
                <div className="p-3">
                  <h4 className="font-medium text-foreground text-sm">{result.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{result.date}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
