"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Play } from "lucide-react"
import Link from "next/link"

export function HeroSection() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#FF6B9D]/10 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <div
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-foreground/5 border border-border/50 mb-8 
            transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <span className="w-2 h-2 rounded-full bg-[#6BCB77] animate-pulse" />
          <span className="text-sm text-muted-foreground">AI-Powered Video Memories</span>
        </div>

        <h1
          className={`text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-balance
            transition-all duration-700 delay-100 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <span className="text-foreground">Your Videos.</span>
          <br />
          <span className="bg-gradient-to-r from-primary via-[#FF6B9D] to-[#FFD93D] bg-clip-text text-transparent">
            Your Story.
          </span>
        </h1>

        <p
          className={`text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed text-pretty
            transition-all duration-700 delay-200 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          Search your memories with natural language. Ask {'"'}when was mom happiest{'"'} and find the exact moment.
        </p>

        <div
          className={`flex flex-col sm:flex-row items-center justify-center gap-4 
            transition-all duration-700 delay-300 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <Link href="/upload">
            <Button
              size="lg"
              className="bg-foreground text-background hover:bg-foreground/90 px-8 h-12 text-base 
                hover:scale-105 transition-transform group"
            >
              Start Uploading
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link href="/library">
            <Button size="lg" variant="ghost" className="text-foreground hover:bg-foreground/5 px-8 h-12 text-base">
              <Play className="w-4 h-4 mr-2" />
              See Demo
            </Button>
          </Link>
        </div>

        <div
          className={`mt-16 relative mx-auto max-w-3xl
            transition-all duration-700 delay-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-[#FF6B9D]/20 to-[#FFD93D]/20 rounded-2xl blur-2xl" />
          <div className="relative bg-card/80 backdrop-blur border border-border/50 rounded-2xl p-4 shadow-2xl">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border/50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#FF6B9D]/60" />
                <div className="w-3 h-3 rounded-full bg-[#FFD93D]/60" />
                <div className="w-3 h-3 rounded-full bg-[#6BCB77]/60" />
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-muted/50 rounded-full h-7 max-w-xs mx-auto flex items-center px-3">
                  <span className="text-xs text-muted-foreground">Search your memories...</span>
                </div>
              </div>
            </div>

            {/* Video grid preview */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { color: "from-[#FFD93D]/30 to-[#FFD93D]/10", label: "Joy" },
                { color: "from-[#FF6B9D]/30 to-[#FF6B9D]/10", label: "Love" },
                { color: "from-[#6BCB77]/30 to-[#6BCB77]/10", label: "Calm" },
              ].map((item, i) => (
                <div
                  key={i}
                  className={`aspect-video rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center`}
                >
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Play className="w-4 h-4 text-white/80 fill-white/80" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
