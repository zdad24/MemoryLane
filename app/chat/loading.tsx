export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 animate-pulse">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-8 w-48 bg-secondary rounded-lg mb-2" />
        <div className="h-4 w-64 bg-secondary rounded-lg" />
      </div>

      {/* Chat messages skeleton */}
      <div className="max-w-4xl mx-auto space-y-4 mb-20">
        {/* User message */}
        <div className="flex justify-end">
          <div className="h-12 w-64 bg-secondary rounded-2xl" />
        </div>
        
        {/* Assistant message with video cards */}
        <div className="flex justify-start">
          <div className="space-y-3">
            <div className="h-20 w-80 bg-secondary rounded-2xl" />
            <div className="flex gap-3">
              <div className="h-24 w-40 bg-secondary rounded-xl" />
              <div className="h-24 w-40 bg-secondary rounded-xl" />
            </div>
          </div>
        </div>

        {/* Another user message */}
        <div className="flex justify-end">
          <div className="h-10 w-48 bg-secondary rounded-2xl" />
        </div>
      </div>

      {/* Input skeleton */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t border-border">
        <div className="max-w-4xl mx-auto">
          <div className="h-12 bg-secondary rounded-xl" />
        </div>
      </div>
    </div>
  )
}
