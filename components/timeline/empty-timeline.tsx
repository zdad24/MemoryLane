"use client"

import { Film, Upload } from "lucide-react"
import Link from "next/link"

export function EmptyTimelineState() {
    return (
        <div className="max-w-md mx-auto text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-secondary flex items-center justify-center">
                <Film className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">
                No Memories Yet
            </h2>
            <p className="text-muted-foreground mb-8">
                Upload your first video to start building your emotional timeline.
            </p>
            <Link
                href="/upload"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
            >
                <Upload className="w-5 h-5" />
                Upload Video
            </Link>
        </div>
    );
}
