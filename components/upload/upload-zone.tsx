"use client"

import type React from "react"

import { useState, useCallback, useRef } from "react"
import { Upload, X, CheckCircle2, FileVideo, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { uploadVideoToFirebase, isFirebaseConfigured } from "@/lib/firebase-client"
import { useRouter } from "next/navigation"

interface UploadFile {
  id: string
  file: File
  progress: number
  status: "uploading" | "processing" | "complete" | "error"
  thumbnail?: string
  error?: string
  videoId?: string
}

export function UploadZone() {
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<UploadFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const uploadFile = async (uploadFile: UploadFile) => {
    try {
      // Check if Firebase is configured for direct uploads
      if (!isFirebaseConfigured()) {
        throw new Error("Firebase not configured. Please set NEXT_PUBLIC_FIREBASE_* environment variables.")
      }

      // Upload directly to Firebase with progress tracking
      const result = await uploadVideoToFirebase(uploadFile.file, (progress) => {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? {
                  ...f,
                  progress: progress.progress,
                  status: progress.state === "success" ? "processing" as const : "uploading" as const,
                }
              : f
          )
        )
      })

      // Update to processing state
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? { ...f, progress: 100, status: "processing" as const, videoId: result.videoId }
            : f
        )
      )

      // Trigger indexing via API
      try {
        await api.indexVideo(result.videoId)
      } catch (indexError) {
        console.log("Indexing will be done later:", indexError)
      }

      // Mark as complete
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id ? { ...f, status: "complete" as const } : f
        )
      )
    } catch (error) {
      console.error("Upload error:", error)
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? {
                ...f,
                status: "error" as const,
                error: error instanceof Error ? error.message : "Upload failed",
              }
            : f
        )
      )
    }
  }

  const processFiles = (fileList: FileList | File[]) => {
    const newFiles: UploadFile[] = Array.from(fileList)
      .filter((file) => file.type.startsWith("video/") || file.name.match(/\.(mp4|mov|avi|mkv|webm)$/i))
      .map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        progress: 0,
        status: "uploading" as const,
      }))

    setFiles((prev) => [...prev, ...newFiles])

    // Upload each file
    newFiles.forEach((file) => {
      uploadFile(file)
    })
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files)
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files)
    }
  }

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const completedCount = files.filter((f) => f.status === "complete").length
  const allComplete = files.length > 0 && completedCount === files.length

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Upload zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative rounded-2xl border-2 border-dashed p-12 transition-all duration-300 cursor-pointer",
          "flex flex-col items-center justify-center text-center mx-auto",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-border hover:border-primary/50 hover:bg-card/50",
        )}
      >
        {/* Animated background glow when dragging */}
        {isDragging && (
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/10 via-[#FF6B9D]/10 to-[#FFD93D]/10 animate-gradient" />
        )}

        <div className="relative z-10 flex flex-col items-center justify-center">
          <div
            className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all duration-300 mx-auto",
              isDragging ? "bg-primary/20 scale-110" : "bg-secondary",
            )}
          >
            <Upload
              className={cn("w-10 h-10 transition-colors", isDragging ? "text-primary" : "text-muted-foreground")}
            />
          </div>

          <h3
            className="text-xl font-semibold text-foreground mb-2"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            {isDragging ? "Drop your videos here" : "Drag & drop videos or click to browse"}
          </h3>
          <p className="text-muted-foreground mb-4">Supported formats: MP4, MOV, AVI, MKV, WebM</p>
          <p className="text-sm text-muted-foreground">Maximum file size: 500MB per video</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,.mp4,.mov,.avi,.mkv,.webm"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-8 space-y-4">
          <h4 className="text-lg font-semibold text-foreground" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            {allComplete ? "Upload Complete!" : `Uploading ${files.length} ${files.length === 1 ? "video" : "videos"}`}
          </h4>

          <div className="space-y-3">
            {files.map((file, index) => (
              <div
                key={file.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Thumbnail/Icon */}
                <div className="w-16 h-12 rounded-lg bg-secondary flex items-center justify-center overflow-hidden">
                  {file.thumbnail ? (
                    <img src={file.thumbnail || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <FileVideo className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-foreground truncate">{file.file.name}</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeFile(file.id)
                      }}
                      className="p-1 hover:bg-secondary rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{formatFileSize(file.file.size)}</span>
                    <span className="flex items-center gap-1">
                      {file.status === "uploading" && (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Uploading {Math.round(file.progress)}%
                        </>
                      )}
                      {file.status === "processing" && (
                        <>
                          <span className="w-2 h-2 rounded-full bg-[#FFD93D] animate-pulse" />
                          Processing...
                        </>
                      )}
                      {file.status === "complete" && (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-[#6BCB77]" />
                          Complete
                        </>
                      )}
                      {file.status === "error" && (
                        <>
                          <AlertCircle className="w-4 h-4 text-destructive" />
                          {file.error || "Error"}
                        </>
                      )}
                    </span>
                  </div>
                  {(file.status === "uploading" || file.status === "processing") && (
                    <Progress value={file.status === "processing" ? 100 : file.progress} className="h-1 mt-2" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="text-sm text-muted-foreground">
              {completedCount} of {files.length} complete
            </div>
            <div className="flex gap-2">
              {allComplete && (
                <Button onClick={() => router.push("/library")} className="bg-primary hover:bg-primary/90">
                  View Library
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setFiles([])}
                className="text-muted-foreground hover:text-foreground"
              >
                Clear all
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
