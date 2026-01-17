import Link from "next/link"
import { Github, Twitter, Linkedin } from "lucide-react"
import { Logo } from "@/components/ui/logo"

export function Footer() {
  return (
    <footer className="py-12 px-6 border-t border-border/50 bg-background">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-3">
            <Logo className="w-8 h-8" />
            <span className="text-lg font-semibold text-foreground">MemoryLane</span>
          </Link>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/library" className="hover:text-foreground transition-colors">
              Library
            </Link>
            <Link href="/search" className="hover:text-foreground transition-colors">
              Search
            </Link>
            <Link href="/timeline" className="hover:text-foreground transition-colors">
              Timeline
            </Link>
            <Link href="/chat" className="hover:text-foreground transition-colors">
              Ask AI
            </Link>
          </div>

          {/* Social */}
          <div className="flex items-center gap-4">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <Github className="w-4 h-4" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <Twitter className="w-4 h-4" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <Linkedin className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border/50 text-center text-xs text-muted-foreground">
          <p>Built for UofTHacks 13 - TwelveLabs Challenge</p>
          <p className="mt-1">&copy; {new Date().getFullYear()} MemoryLane AI</p>
        </div>
      </div>
    </footer>
  )
}
