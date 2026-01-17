import { Lightbulb, Clock, Shield, Zap } from "lucide-react"

const tips = [
  {
    icon: Clock,
    title: "Best Results",
    description: "Videos between 1-30 minutes work best for AI analysis",
    color: "text-primary",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "Your videos are encrypted and never shared with third parties",
    color: "text-[#6BCB77]",
  },
  {
    icon: Zap,
    title: "Fast Processing",
    description: "AI analysis typically completes within 2-5 minutes per video",
    color: "text-[#FFD93D]",
  },
  {
    icon: Lightbulb,
    title: "Pro Tip",
    description: "Add date metadata to your videos for better timeline organization",
    color: "text-[#FF6B9D]",
  },
]

export function UploadTips() {
  return (
    <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto mt-12">
      {tips.map((tip) => (
        <div key={tip.title} className="flex items-start gap-3 p-4 rounded-xl bg-card/50 border border-border">
          <div className={`${tip.color} mt-1`}>
            <tip.icon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-medium text-foreground text-sm">{tip.title}</h4>
            <p className="text-sm text-muted-foreground">{tip.description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
