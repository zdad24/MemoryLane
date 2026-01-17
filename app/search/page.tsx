"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { SearchBar } from "@/components/search/search-bar"
import { SearchResults } from "@/components/search/search-results"
import { SearchHistory } from "@/components/search/search-history"
import { mockVideos, mockMoments, type VideoMetadata, type Moment } from "@/lib/mock-data"

interface SearchResult {
  video: VideoMetadata
  relevanceScore: number
  matchingMoments: Moment[]
}

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])

  // Load search history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("searchHistory")
    if (saved) {
      setSearchHistory(JSON.parse(saved))
    }
  }, [])

  const saveToHistory = (q: string) => {
    const updated = [q, ...searchHistory.filter((h) => h !== q)].slice(0, 10)
    setSearchHistory(updated)
    localStorage.setItem("searchHistory", JSON.stringify(updated))
  }

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery)
    setIsLoading(true)
    setHasSearched(true)

    // Simulate API call
    setTimeout(() => {
      // Mock search - filter videos by tags, title, or summary
      const filtered = mockVideos.filter((video) => {
        const searchLower = searchQuery.toLowerCase()
        return (
          video.title.toLowerCase().includes(searchLower) ||
          video.summary.toLowerCase().includes(searchLower) ||
          video.tags.some((tag) => tag.toLowerCase().includes(searchLower)) ||
          video.emotion.toLowerCase().includes(searchLower)
        )
      })

      // Create search results with relevance scores
      const searchResults: SearchResult[] = filtered.map((video) => ({
        video,
        relevanceScore: 0.7 + Math.random() * 0.3,
        matchingMoments: mockMoments.filter((m) => m.videoId === video.id),
      }))

      // Sort by relevance
      searchResults.sort((a, b) => b.relevanceScore - a.relevanceScore)

      setResults(searchResults)
      setIsLoading(false)
      saveToHistory(searchQuery)
    }, 1500)
  }

  const clearHistory = () => {
    setSearchHistory([])
    localStorage.removeItem("searchHistory")
  }

  const removeFromHistory = (q: string) => {
    const updated = searchHistory.filter((h) => h !== q)
    setSearchHistory(updated)
    localStorage.setItem("searchHistory", JSON.stringify(updated))
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1
              className="text-3xl md:text-5xl font-bold mb-4 text-foreground"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              Search Your Memories
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Use natural language to find any moment in your video collection
            </p>
          </div>

          {/* Search bar */}
          <SearchBar onSearch={handleSearch} isLoading={isLoading} initialQuery={query} />

          {/* Results or history */}
          <div className="mt-12">
            {hasSearched ? (
              <SearchResults results={results} query={query} />
            ) : (
              <SearchHistory
                history={searchHistory}
                onSelect={handleSearch}
                onClear={clearHistory}
                onRemove={removeFromHistory}
              />
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
