export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 animate-pulse">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-8 w-56 bg-secondary rounded-lg mb-2" />
        <div className="h-4 w-80 bg-secondary rounded-lg" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 rounded-xl bg-card border border-border">
            <div className="h-4 w-20 bg-secondary rounded mb-2" />
            <div className="h-8 w-16 bg-secondary rounded" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="rounded-2xl bg-card border border-border p-6 mb-8">
        <div className="h-6 w-40 bg-secondary rounded mb-4" />
        <div className="h-64 w-full bg-secondary rounded-lg" />
      </div>

      {/* Milestones section skeleton */}
      <div className="rounded-2xl bg-card border border-border p-6">
        <div className="h-6 w-32 bg-secondary rounded mb-4" />
        
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 p-4 rounded-xl bg-secondary/30">
              <div className="w-12 h-12 bg-secondary rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-48 bg-secondary rounded" />
                <div className="h-4 w-full bg-secondary rounded" />
                <div className="h-3 w-24 bg-secondary rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
