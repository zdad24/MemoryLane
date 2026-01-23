export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 animate-pulse">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-8 w-40 bg-secondary rounded-lg mb-2" />
        <div className="h-4 w-56 bg-secondary rounded-lg" />
      </div>

      {/* Filter bar skeleton */}
      <div className="flex gap-3 mb-6">
        <div className="h-10 w-32 bg-secondary rounded-lg" />
        <div className="h-10 w-32 bg-secondary rounded-lg" />
        <div className="h-10 w-24 bg-secondary rounded-lg" />
      </div>

      {/* Video grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-xl overflow-hidden bg-card border border-border">
            {/* Thumbnail */}
            <div className="aspect-video bg-secondary" />
            
            {/* Content */}
            <div className="p-4 space-y-3">
              <div className="h-5 w-3/4 bg-secondary rounded" />
              <div className="h-4 w-full bg-secondary rounded" />
              <div className="flex gap-2">
                <div className="h-6 w-16 bg-secondary rounded-full" />
                <div className="h-6 w-16 bg-secondary rounded-full" />
              </div>
              <div className="flex justify-between">
                <div className="h-3 w-20 bg-secondary rounded" />
                <div className="h-3 w-12 bg-secondary rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
