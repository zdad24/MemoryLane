"use client"

import { Clock, X, TrendingUp } from "lucide-react"

interface SearchHistoryProps {
  history: string[]
  onSelect: (query: string) => void
  onClear: () => void
  onRemove: (query: string) => void
}

const trendingSearches = [
  "Family reunions",
  "Birthday parties",
  "First day of school",
  "Holiday celebrations",
  "Travel adventures",
]

export function SearchHistory({ history, onSelect, onClear, onRemove }: SearchHistoryProps) {
  return (
    <div className="max-w-3xl mx-auto mt-12 space-y-8">
      {/* Recent searches */}
      {history.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <Clock className="w-5 h-5 text-muted-foreground" />
              Recent Searches
            </h3>
            <button onClick={onClear} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Clear all
            </button>
          </div>
          <div className="space-y-2">
            {history.map((query) => (
              <div
                key={query}
                className="flex items-center justify-between p-3 rounded-lg bg-card border border-border 
                  hover:border-primary/30 transition-colors group"
              >
                <button
                  onClick={() => onSelect(query)}
                  className="flex-1 text-left text-foreground hover:text-primary transition-colors"
                >
                  {query}
                </button>
                <button
                  onClick={() => onRemove(query)}
                  className="p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-secondary transition-all"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trending searches */}
      <div>
        <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          Popular Searches
        </h3>
        <div className="grid sm:grid-cols-2 gap-2">
          {trendingSearches.map((query) => (
            <button
              key={query}
              onClick={() => onSelect(query)}
              className="p-3 rounded-lg bg-card border border-border text-left text-foreground
                hover:border-primary/30 hover:text-primary transition-all"
            >
              {query}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
