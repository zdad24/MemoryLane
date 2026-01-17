"use client"

import type React from "react"

import { useState } from "react"
import { Search, Mic, Sparkles, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SearchBarProps {
  onSearch: (query: string) => void
  isLoading?: boolean
  initialQuery?: string
}

const suggestions = [
  "Moments of laughter",
  "Birthday celebrations",
  "Beach vacations",
  "Kids growing up",
  "Family gatherings",
  "Outdoor adventures",
  "Holiday dinners",
  "Wedding moments",
]

export function SearchBar({ onSearch, isLoading = false, initialQuery = "" }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery)
  const [isFocused, setIsFocused] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    onSearch(suggestion)
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Search input */}
      <form onSubmit={handleSubmit} className="relative">
        {/* Animated glow effect */}
        <div
          className={cn(
            "absolute -inset-1 rounded-2xl transition-all duration-500",
            "bg-gradient-to-r from-primary via-[#FF6B9D] to-[#FFD93D]",
            isFocused ? "opacity-50 blur-xl" : "opacity-0",
          )}
        />

        <div className="relative flex gap-2 p-2 rounded-2xl bg-card border border-border backdrop-blur-sm">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder='Ask about your memories... (e.g., "beach trips with friends")'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="pl-12 pr-10 py-6 bg-transparent border-none text-lg placeholder:text-muted-foreground/60 focus-visible:ring-0"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-secondary transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-12 w-12 text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            <Mic className="w-5 h-5" />
          </Button>

          <Button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-6 rounded-xl"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Search
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Suggestions */}
      <div className="flex flex-wrap gap-2 justify-center mt-6">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => handleSuggestionClick(suggestion)}
            className="px-4 py-2 rounded-full text-sm bg-secondary text-secondary-foreground 
              hover:bg-secondary/80 hover:text-foreground transition-all duration-200
              hover:scale-105"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  )
}
