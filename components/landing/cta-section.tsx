"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export function CTASection() {
  return (
    <section className="py-32 px-6">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground text-balance">
          Ready to explore your memories?
        </h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Upload your videos and let AI transform them into a searchable autobiography.
        </p>
        <Link href="/upload">
          <Button
            size="lg"
            className="bg-foreground text-background hover:bg-foreground/90 h-12 px-8 
              hover:scale-105 transition-transform group"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>
    </section>
  )
}
