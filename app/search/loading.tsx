export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 animate-pulse">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-8 w-48 bg-secondary rounded-lg mb-2" />
        <div className="h-4 w-72 bg-secondary rounded-lg" />
      </div>

      {/* Search bar skeleton */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="h-12 w-full bg-secondary rounded-xl" />
      </div>

      {/* Results count skeleton */}
      <div className="mb-6">
        <div className="h-4 w-32 bg-secondary rounded" />
      </div>

      {/* Search results skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 p-4 rounded-xl bg-card border border-border">
            {/* Thumbnail */}
            <div className="w-40 h-24 bg-secondary rounded-lg flex-shrink-0" />
            
            {/* Content */}
            <div className="flex-1 space-y-2">
              <div className="h-5 w-3/4 bg-secondary rounded" />
              <div className="h-4 w-full bg-secondary rounded" />
              <div className="h-4 w-2/3 bg-secondary rounded" />
              <div className="flex gap-2 mt-2">
                <div className="h-6 w-16 bg-secondary rounded-full" />
                <div className="h-6 w-20 bg-secondary rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
