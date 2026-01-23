export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 animate-pulse">
      {/* Header skeleton */}
      <div className="mb-8 text-center">
        <div className="h-8 w-64 bg-secondary rounded-lg mb-2 mx-auto" />
        <div className="h-4 w-80 bg-secondary rounded-lg mx-auto" />
      </div>

      <div className="max-w-2xl mx-auto space-y-8">
        {/* Title input skeleton */}
        <div className="space-y-2">
          <div className="h-4 w-24 bg-secondary rounded" />
          <div className="h-10 w-full bg-secondary rounded-lg" />
        </div>

        {/* Duration slider skeleton */}
        <div className="space-y-4">
          <div className="flex justify-between">
            <div className="h-4 w-20 bg-secondary rounded" />
            <div className="h-6 w-12 bg-secondary rounded" />
          </div>
          <div className="h-2 w-full bg-secondary rounded-full" />
        </div>

        {/* Emotions skeleton */}
        <div className="space-y-4">
          <div className="h-4 w-32 bg-secondary rounded" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-9 w-20 bg-secondary rounded-full" />
            ))}
          </div>
        </div>

        {/* Music options skeleton */}
        <div className="space-y-4">
          <div className="h-4 w-36 bg-secondary rounded" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 bg-secondary rounded-xl" />
            ))}
          </div>
        </div>

        {/* Generate button skeleton */}
        <div className="h-14 w-full bg-secondary rounded-xl" />
      </div>
    </div>
  )
}
