"use client"

import { Search, Heart, Sparkles, MessageSquare } from "lucide-react"

const features = [
  {
    icon: Search,
    title: "Natural Search",
    description: 'Find moments by describing them. "Beach trips with friends" or "birthday celebrations" — just ask.',
  },
  {
    icon: Heart,
    title: "Emotion Detection",
    description:
      "AI understands the feelings in your videos. Track joy, love, excitement across your entire collection.",
  },
  {
    icon: Sparkles,
    title: "Auto Highlights",
    description: "Generate highlight reels from your best moments. Perfect for sharing with family and friends.",
  },
  {
    icon: MessageSquare,
    title: "Chat with Memories",
    description: 'Ask questions about your life. "What was I like in 2019?" — get answers with video proof.',
  },
]

export function FeaturesSection() {
  return (
    <section className="py-32 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground text-balance">
            Every memory, instantly findable
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            AI that understands context, emotions, and meaning behind your videos.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          {features.map((feature) => (
            <div key={feature.title} className="group flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-foreground/5 flex items-center justify-center group-hover:bg-foreground/10 transition-colors">
                <feature.icon className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
