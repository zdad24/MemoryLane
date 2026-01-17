import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { UploadZone } from "@/components/upload/upload-zone"
import { UploadTips } from "@/components/upload/upload-tips"

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          {/* Header */}
          <div className="text-center mb-12 w-full">
            <h1
              className="text-3xl md:text-5xl font-bold mb-4 text-foreground"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              Upload Your Memories
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Drop your videos below and let AI transform them into searchable, organized memories
            </p>
          </div>

          {/* Upload zone */}
          <div className="w-full flex justify-center">
            <UploadZone />
          </div>

          {/* Tips */}
          <UploadTips />
        </div>
      </main>
      <Footer />
    </div>
  )
}
