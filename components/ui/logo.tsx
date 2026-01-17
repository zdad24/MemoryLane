export function Logo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Outer ring - represents the timeline/journey */}
      <circle
        cx="20"
        cy="20"
        r="18"
        stroke="url(#gradient-ring)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="4 6"
      />

      {/* Memory lane path - winding road */}
      <path
        d="M12 28C14 24 16 26 18 22C20 18 22 20 24 16C26 12 28 14 30 10"
        stroke="url(#gradient-path)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Memory nodes/moments */}
      <circle cx="12" cy="28" r="2.5" fill="#4ECDC4" />
      <circle cx="18" cy="22" r="2" fill="#FF6B9D" />
      <circle cx="24" cy="16" r="2" fill="#FFD93D" />
      <circle cx="30" cy="10" r="2.5" fill="#6BCB77" />

      {/* Play symbol in center - video aspect */}
      <path d="M17 17L17 23L23 20L17 17Z" fill="white" fillOpacity="0.9" />

      <defs>
        <linearGradient id="gradient-ring" x1="0" y1="0" x2="40" y2="40">
          <stop offset="0%" stopColor="#4ECDC4" />
          <stop offset="50%" stopColor="#FF6B9D" />
          <stop offset="100%" stopColor="#FFD93D" />
        </linearGradient>
        <linearGradient id="gradient-path" x1="12" y1="28" x2="30" y2="10">
          <stop offset="0%" stopColor="#4ECDC4" />
          <stop offset="100%" stopColor="#6BCB77" />
        </linearGradient>
      </defs>
    </svg>
  )
}
