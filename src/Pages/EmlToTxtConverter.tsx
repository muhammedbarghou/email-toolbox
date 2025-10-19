"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { Upload, Download, FileText, X, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { useFileUpload, formatBytes } from "@/hooks/use-file-upload"

interface ProcessedFile {
  id: string
  name: string
  content: string
  size: number
  status: "pending" | "processing" | "completed" | "error"
  error?: string
}

export default function EmlToTxtConverter() {
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([])

  const maxSize = 10 * 1024 * 1024 // 10MB
  const maxFiles = 50

  const [
    { files, isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      clearFiles,
      getInputProps,
    },
  ] = useFileUpload({
    multiple: true,
    maxFiles,
    maxSize,
    accept: ".eml,.txt,text/plain,message/rfc822",
    onFilesChange: (newFiles) => {
      processFiles(newFiles)
    },
  })

  const processFiles = useCallback(
    async (filesToProcess: typeof files) => {
      const newProcessedFiles: ProcessedFile[] = []

      for (const fileWrapper of filesToProcess) {
        const file = fileWrapper.file instanceof File ? fileWrapper.file : null
        if (!file) continue

        const processedFile: ProcessedFile = {
          id: fileWrapper.id,
          name: file.name.replace(/\.(eml|txt)$/, ""),
          content: "",
          size: file.size,
          status: "processing",
        }

        newProcessedFiles.push(processedFile)
      }

      setProcessedFiles(newProcessedFiles)

      // Process each file
      for (let i = 0; i < filesToProcess.length; i++) {
        const fileWrapper = filesToProcess[i]
        const file = fileWrapper.file instanceof File ? fileWrapper.file : null
        if (!file) continue

        try {
          const text = await file.text()
          setProcessedFiles((prev) =>
            prev.map((pf) => (pf.id === fileWrapper.id ? { ...pf, content: text, status: "completed" } : pf)),
          )
        } catch (error) {
          setProcessedFiles((prev) =>
            prev.map((pf) =>
              pf.id === fileWrapper.id
                ? {
                    ...pf,
                    status: "error",
                    error: "Failed to read file",
                  }
                : pf,
            ),
          )
        }
      }

      if (filesToProcess.length > 0) {
        toast.success(`${filesToProcess.length} file(s) converted successfully`,)
      }
    },
    [toast],
  )

  const getTimestamp = () => {
    const now = new Date()
    const date = now.toISOString().split("T")[0]
    const time = now.toTimeString().split(" ")[0].replace(/:/g, "-")
    return `${date}_${time}`
  }

  const handleDownloadSingle = (processedFile: ProcessedFile) => {
    if (!processedFile.content.trim()) {
      toast.error("This file has no content to download")
      return
    }

    const timestamp = getTimestamp()
    const blob = new Blob([processedFile.content], {
      type: "text/plain;charset=utf-8",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${processedFile.name}_${timestamp}.txt`
    link.click()
    URL.revokeObjectURL(url)

    toast.loading(`${processedFile.name}_${timestamp}.txt`,)
  }
const handleDownloadAll = () => {
  const completedFiles = processedFiles.filter((f) => f.status === "completed" && f.content.trim())

  if (completedFiles.length === 0) {
    toast.message("Process some files first")
    return
  }

  const timestamp = getTimestamp()

  completedFiles.forEach((file, index) => {
    setTimeout(() => {
      const blob = new Blob([file.content], {
        type: "text/plain;charset=utf-8",
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${file.name}_${timestamp}.txt`
      link.click()
      URL.revokeObjectURL(url)
    }, index * 200) // 200ms delay between each download
  })

  toast.success(`${completedFiles.length} file(s) downloaded`)
}


  const handleClearAll = () => {
    clearFiles()
    setProcessedFiles([])
    toast.success("All files have been removed",)
  }

  const getTotalStats = () => {
    const completedFiles = processedFiles.filter((f) => f.status === "completed")
    const totalChars = completedFiles.reduce((sum, f) => sum + f.content.length, 0)
    const totalLines = completedFiles.reduce((sum, f) => sum + (f.content ? f.content.split("\n").length : 0), 0)
    const totalWords = completedFiles.reduce(
      (sum, f) => sum + (f.content.trim() ? f.content.trim().split(/\s+/).length : 0),
      0,
    )

    return { totalChars, totalLines, totalWords, fileCount: completedFiles.length }
  }

  const stats = getTotalStats()

  const getStatusIcon = (status: ProcessedFile["status"]) => {
    switch (status) {
      case "processing":
        return <Loader2 className="size-4 animate-spin text-blue-500" />
      case "completed":
        return <CheckCircle2 className="size-4 text-green-500" />
      case "error":
        return <AlertCircle className="size-4 text-red-500" />
      default:
        return <FileText className="size-4 text-muted-foreground" />
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">EML to TXT Converter</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Convert multiple email files to plain text format with timestamp
          </p>
        </div>

        {/* Upload Area */}
        <div
          role="button"
          onClick={openFileDialog}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          data-dragging={isDragging || undefined}
          className="flex min-h-40 flex-col items-center justify-center rounded-xl border-2 border-dashed border-input p-4 transition-colors hover:bg-accent/50 has-disabled:pointer-events-none has-disabled:opacity-50 has-[input:focus]:border-ring has-[input:focus]:ring-[3px] has-[input:focus]:ring-ring/50 data-[dragging=true]:bg-accent/50 cursor-pointer"
        >
          <input {...getInputProps()} className="sr-only" aria-label="Upload files" />

          <div className="flex flex-col items-center justify-center text-center">
            <div
              className="mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border bg-background"
              aria-hidden="true"
            >
              <Upload className="size-4 opacity-60" />
            </div>
            <p className="mb-1.5 text-sm font-medium">Upload EML files</p>
            <p className="mb-2 text-xs text-muted-foreground">Drag & drop or click to browse</p>
            <div className="flex flex-wrap justify-center gap-1 text-xs text-muted-foreground/70">
              <span>.eml and .txt files</span>
              <span>∙</span>
              <span>Max {maxFiles} files</span>
              <span>∙</span>
              <span>Up to {formatBytes(maxSize)}</span>
            </div>
          </div>
        </div>

        {errors.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-destructive" role="alert">
            <AlertCircle className="size-3 shrink-0" />
            <span>{errors[0]}</span>
          </div>
        )}

        {/* File List */}
        {processedFiles.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Processed Files ({processedFiles.length})</h2>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleDownloadAll} disabled={stats.fileCount === 0}>
                  <Download className="w-4 h-4 mr-2" />
                  Download All
                </Button>
                <Button size="sm" variant="outline" onClick={handleClearAll}>
                  Clear All
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {processedFiles.map((file) => (
                <Card key={file.id} className="flex items-center justify-between gap-2 p-4">
                  <div className="flex items-center gap-3 overflow-hidden flex-1">
                    <div className="flex aspect-square size-10 shrink-0 items-center justify-center rounded border">
                      {getStatusIcon(file.status)}
                    </div>
                    <div className="flex min-w-0 flex-col gap-0.5 flex-1">
                      <p className="truncate text-[13px] font-medium">{file.name}.eml</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatBytes(file.size)}</span>
                        {file.status === "completed" && (
                          <>
                            <span>∙</span>
                            <span>{file.content.length.toLocaleString()} chars</span>
                          </>
                        )}
                        {file.error && (
                          <>
                            <span>∙</span>
                            <span className="text-destructive">{file.error}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {file.status === "completed" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownloadSingle(file)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8 text-muted-foreground/80 hover:bg-transparent hover:text-foreground"
                      onClick={() => {
                        removeFile(file.id)
                        setProcessedFiles((prev) => prev.filter((f) => f.id !== file.id))
                      }}
                      aria-label="Remove file"
                    >
                      <X className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        {stats.fileCount > 0 && (
          <Card className="bg-muted/30 border-border">
            <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{stats.fileCount}</p>
                <p className="text-xs text-muted-foreground">Files</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalChars.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Characters</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalWords.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Words</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalLines.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Lines</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
