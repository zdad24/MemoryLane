"use client"

import { Sparkles } from "lucide-react"
import { exampleQuestions } from "@/lib/chat-data"

interface SuggestionChipsProps {
  onSelect: (question: string) => void
}

export function SuggestionChips({ onSelect }: SuggestionChipsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Sparkles className="w-4 h-4 text-primary" />
        <span>Try asking:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {exampleQuestions.map((question) => (
          <button
            key={question}
            onClick={() => onSelect(question)}
            className="px-4 py-2 rounded-full text-sm bg-secondary text-secondary-foreground 
              hover:bg-secondary/80 hover:text-foreground transition-all duration-200
              border border-transparent hover:border-primary/30"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  )
}
