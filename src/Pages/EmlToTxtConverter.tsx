"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Upload, Download, Copy, FileText, X } from "lucide-react"
import { toast } from "sonner"

export default function EmlToTxtConverter() {
  const [content, setContent] = useState("")
  const [fileName, setFileName] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (file: File) => {
    if (!file) return

    const validTypes = [".eml", ".txt", "text/plain", "message/rfc822"]
    const isValid = validTypes.some((type) => file.name.endsWith(type)) || validTypes.includes(file.type)

    if (!isValid) {
      toast.error("Invalid file type", {
        description: "Please upload a .eml or .txt file",
      })
      return
    }

    setFileName(file.name.replace(/\.(eml|txt)$/, ""))

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setContent(text)
      toast.success("File loaded",  {
        description: `${file.name} has been loaded successfully`,
      })
    }
    reader.onerror = () => {
      toast.error("Error reading file", {
        description: "Failed to read the file. Please try again.",
      })
    }
    reader.readAsText(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const getTimestamp = () => {
    const now = new Date()
    const date = now.toISOString().split("T")[0]
    const time = now.toTimeString().split(" ")[0].replace(/:/g, "-")
    return `${date}_${time}`
  }

  const handleDownload = () => {
    if (!content.trim()) {
      toast.error("No content", {
          description: "Please add some content before downloading",
        })
      return
    }

    const timestamp = getTimestamp()
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${fileName || "text"}_${timestamp}.txt`
    link.click()
    URL.revokeObjectURL(url)

    toast.success("Downloaded", {
      description: `File saved as ${fileName || "text"}_${timestamp}.txt`,
    })
  }

  const handleCopy = async () => {
    if (!content.trim()) {
      toast.error("No content", {
        description: "Please add some content before copying",
      })
      return
    }

    try {
      await navigator.clipboard.writeText(content)
      toast.success("Copied", {
        description: "Content copied to clipboard",
      })
    } catch (err) {
      toast.error("Failed to copy", {
        description: "Please try again",
      })
    }
  }

  const handleClear = () => {
    setContent("")
    setFileName("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    toast.success("Cleared",  {
      description: "All content has been cleared",
    })
  }

  const getStats = () => {
    const chars = content.length
    const lines = content ? content.split("\n").length : 0
    const words = content.trim() ? content.trim().split(/\s+/).length : 0

    return { chars, lines, words }
  }

  const stats = getStats()

  return (
    <div className="min-h-screen  p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">EML to TXT Converter</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Convert email files to plain text format with timestamp
          </p>
        </div>

        {/* Upload Area */}
        <Card
          className={`border-2 border-dashed transition-all duration-200 ${
            isDragging ? "border-white bg-white/5" : "border-border bg-card hover:border-muted-foreground/50"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="p-8 md:p-12 text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-muted">
                <Upload className="w-8 h-8 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium">Drop your .eml file here, or click to browse</p>
              <p className="text-sm text-muted-foreground">Supports .eml and .txt files</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".eml,.txt"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(file)
              }}
              className="hidden"
              id="file-upload"
            />
            <Button onClick={() => fileInputRef.current?.click()} variant="secondary" size="lg">
              <FileText className="w-4 h-4 mr-2" />
              Select File
            </Button>
          </div>
        </Card>

        {/* File Info */}
        {fileName && (
          <Card className="bg-muted/50 border-border">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{fileName}.eml</p>
                  <p className="text-xs text-muted-foreground">{stats.chars.toLocaleString()} characters</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* Content Editor */}
        <Card className="bg-card border-border">
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="content" className="text-sm font-medium">
                Content
              </label>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  disabled={!content.trim()}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                <Button variant="default" size="sm" onClick={handleDownload} disabled={!content.trim()}>
                  <Download className="w-4 h-4 mr-2" />
                  Download TXT
                </Button>
              </div>
            </div>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your email content or text here, or upload a file above..."
              rows={16}
              className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
            />
          </div>
        </Card>

        {/* Stats */}
        {content && (
          <Card className="bg-muted/30 border-border">
            <div className="p-4 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{stats.chars.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Characters</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.words.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Words</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.lines.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Lines</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
