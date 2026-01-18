"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { SearchBar } from "@/components/search/search-bar"
import { SearchResults } from "@/components/search/search-results"
import { SearchHistory } from "@/components/search/search-history"
import { api, type SearchResult as ApiSearchResult, type Video, type SearchClip } from "@/lib/api"

interface SearchResult {
  video: Video
  relevanceScore: number
  clips: SearchClip[]
}

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

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

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery)
    setIsLoading(true)
    setHasSearched(true)
    setError(null)

    try {
      const response = await api.search(searchQuery)

      // Map API response to component's expected format
      const searchResults: SearchResult[] = response.results
        .filter((result) => result.video !== null)
        .map((result) => ({
          video: result.video as Video,
          relevanceScore: result.score,
          clips: result.clips,
        }))

      // Sort by relevance
      searchResults.sort((a, b) => b.relevanceScore - a.relevanceScore)

      setResults(searchResults)
      saveToHistory(searchQuery)
    } catch (err) {
      console.error("Search error:", err)
      setError(err instanceof Error ? err.message : "Search failed. Please try again.")
      setResults([])
    } finally {
      setIsLoading(false)
    }
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
            {error && (
              <div className="text-center py-8 mb-8 bg-destructive/10 border border-destructive/20 rounded-xl">
                <p className="text-destructive">{error}</p>
              </div>
            )}
            {hasSearched && !error ? (
              <SearchResults results={results} query={query} />
            ) : !error && (
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
