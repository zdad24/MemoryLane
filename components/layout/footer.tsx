export function Footer() {
  return (
    <footer className="py-6 px-6 border-t border-border/50 bg-background">
      <div className="max-w-5xl mx-auto text-center text-xs text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} MemoryLane AI - Built for UofTHacks 13 - TwelveLabs Challenge</p>
      </div>
    </footer>
  )
}
