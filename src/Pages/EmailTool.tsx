import { useState, useCallback, useMemo } from "react"
import {
  Copy,
  Check,
  X,
  Download,
  Upload,
  RefreshCw,
  Settings,
  FileText,
  Trash2,
  Zap,
  Code2,
  FolderOpen,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface FileItem {
  id: string
  name: string
  originalContent: string
  processedContent: string
  status: 'pending' | 'processing' | 'completed' | 'error'
}

const PRESETS = {
  standard: {
    name: "Standard",
    description: "Remove common tracking and authentication headers",
    fieldsToRemove: {
      "Delivered-To:": true,
      "Received: by": true,
      "X-Google-Smtp-Source:": true,
      "X-Received:": true,
      "X-original-To": true,
      "ARC-Seal:": true,
      "ARC-Message-Signature:": true,
      "ARC-Authentication-Results:": true,
      "Return-Path:": true,
      "Received-SPF:": true,
      References: true,
      "Authentication-Results:": true,
      "DKIM-Signature:": true,
      "X-SG-EID:": true,
      "Cc:": false,
      "X-Entity-ID:": true,
    },
  },
  minimal: {
    name: "Minimal",
    description: "Keep only essential headers",
    fieldsToRemove: {
      "Delivered-To:": true,
      "Received: by": true,
      "X-Google-Smtp-Source:": true,
      "X-Received:": true,
      "X-original-To": true,
      "ARC-Seal:": true,
      "ARC-Message-Signature:": true,
      "ARC-Authentication-Results:": true,
      "Return-Path:": true,
      "Received-SPF:": true,
      References: true,
      "Authentication-Results:": true,
      "DKIM-Signature:": true,
      "X-SG-EID:": true,
      "Cc:": true,
      "X-Entity-ID:": true,
    },
  },
  custom: {
    name: "Custom",
    description: "Configure your own settings",
    fieldsToRemove: {},
  },
}

function processEmail(input: string, config: any): string {
  const lines = input.split("\n")
  const outputLines: string[] = []
  let inHeader = true
  let boundary = ""
  let currentHeader: string[] = []
  let hasListUnsubscribe = false

  const contentTypeMatch = input.match(/boundary=["']?([^"'\s]+)["']?/i)
  if (contentTypeMatch) {
    boundary = contentTypeMatch[1]
  }

  const fieldsToRemove = [
    "Delivered-To:",
    "Received: by",
    "X-Google-Smtp-Source:",
    "X-Received:",
    "X-original-To",
    "ARC-Seal:",
    "ARC-Message-Signature:",
    "ARC-Authentication-Results:",
    "Return-Path:",
    "Received-SPF:",
    "References",
    "Authentication-Results:",
    "DKIM-Signature:",
    "X-SG-EID:",
    "Cc:",
    "X-Entity-ID:",
  ].filter((field) => config.fieldsToRemove[field])

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    const line = rawLine.trimEnd()

    if (boundary && line.startsWith("--") && line.includes(boundary)) {
      inHeader = false
      outputLines.push(line)
      continue
    }

    if (inHeader && line === "" && outputLines.length > 0) {
      inHeader = false
      outputLines.push("")
      continue
    }

    if (inHeader) {
      if (fieldsToRemove.some((field) => line.startsWith(field))) {
        continue
      }

      if (line.startsWith("Received: from")) {
        if (currentHeader.length > 0) {
          outputLines.push(...currentHeader)
          currentHeader = []
        }
        currentHeader.push(line)
        while (i + 1 < lines.length && (lines[i + 1].startsWith("\t") || lines[i + 1].startsWith(" "))) {
          i++
          currentHeader.push(lines[i].trimEnd())
        }
      } else if (line.startsWith("Date:")) {
        if (currentHeader.length > 0) {
          outputLines.push(...currentHeader)
          currentHeader = []
        }
        outputLines.push(line)
      } else if (line.startsWith("To:")) {
        if (currentHeader.length > 0) {
          outputLines.push(...currentHeader)
          currentHeader = []
        }
        outputLines.push("To: [*to]")
        outputLines.push("Cc: [*to]")
      } else if (line.startsWith("From:")) {
        if (currentHeader.length > 0) {
          outputLines.push(...currentHeader)
          currentHeader = []
        }
        const fromMatch = line.match(/From:\s*(?:"([^"]*)"|([^<]*))\s*<(.+?)>/i)
        if (fromMatch) {
          const namePart = (fromMatch[1] || fromMatch[2] || "").trim()
          let cleanName = namePart

          if (namePart.includes("@")) {
            const domainPart = namePart.split("@")[1] || ""
            if (domainPart.includes(".")) {
              const domainParts = domainPart.split(".")
              cleanName = domainParts[domainParts.length - 2]
            } else {
              cleanName = domainPart
            }
          } else if (namePart.includes(".")) {
            const domainParts = namePart.split(".")
            cleanName = domainParts[domainParts.length - 2]
          }

          if (cleanName) {
            cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1)
          }

          outputLines.push(`From: "${cleanName}" <noreply@[P_RPATH]>`)
        } else {
          outputLines.push("From: <noreply@[P_RPATH]>")
        }
      } else if (line.toLowerCase().startsWith("message-id:")) {
        if (currentHeader.length > 0) {
          outputLines.push(...currentHeader)
          currentHeader = []
        }
        const m = line.match(/^Message-Id:\s*(<)?([^>]+?)(>)?\s*$/i)
        let idVal = m ? m[2] : line.replace(/Message-Id:/i, "").trim()
        idVal = idVal.trim()

        let domain = "[RNDS]"
        let localPart = idVal

        if (idVal.includes("@")) {
          const parts = idVal.split("@")
          localPart = parts[0]
          domain = parts[1]
        }

        if (!localPart.includes("[EID]")) {
          const mid = Math.floor(localPart.length / 2) || 0
          localPart = localPart.slice(0, mid) + "[EID]" + localPart.slice(mid)
        }

        const newMsgId = `<${localPart}@${domain}>`
        outputLines.push(`Message-ID: ${newMsgId}`)
      } else if (line.startsWith("List-Unsubscribe:")) {
        if (currentHeader.length > 0) {
          outputLines.push(...currentHeader)
          currentHeader = []
        }
        outputLines.push("List-Unsubscribe: <mailto:unsubscribe@[P_RPATH]>, <http://[P_RPATH]/[OPTDOWN]>")
        hasListUnsubscribe = true
      } else if (line.startsWith("Content-Type:")) {
        if (currentHeader.length > 0) {
          outputLines.push(...currentHeader)
          currentHeader = []
        }
        outputLines.push(line)
        while (i + 1 < lines.length && (lines[i + 1].startsWith("\t") || lines[i + 1].startsWith(" "))) {
          i++
          outputLines.push(lines[i].trimEnd())
        }
      } else if (line.startsWith("MIME-Version:")) {
        if (currentHeader.length > 0) {
          outputLines.push(...currentHeader)
          currentHeader = []
        }
        outputLines.push(line)
      } else if (line.startsWith("Subject:")) {
        if (currentHeader.length > 0) {
          outputLines.push(...currentHeader)
          currentHeader = []
        }
        outputLines.push(line)
      } else if (line.startsWith("List-Unsubscribe-Post:")) {
        if (currentHeader.length > 0) {
          outputLines.push(...currentHeader)
          currentHeader = []
        }
      } else if (
        line.startsWith("Reply-To:") ||
        line.startsWith("Feedback-ID:") ||
        line.startsWith("X-SES-Outgoing:")
      ) {
        if (currentHeader.length > 0) {
          outputLines.push(...currentHeader)
          currentHeader = []
        }
        outputLines.push(line)
      } else if (line.startsWith("Content-Transfer-Encoding:")) {
        if (currentHeader.length > 0) {
          outputLines.push(...currentHeader)
          currentHeader = []
        }
        outputLines.push(line)
      }
    } else {
      outputLines.push(line)
    }
  }

  if (currentHeader.length > 0) {
    outputLines.push(...currentHeader)
  }

  const fromIndex = outputLines.findIndex((line) => line.startsWith("From:"))

  if (!hasListUnsubscribe) {
    const senderIndex = outputLines.findIndex((line) => line.startsWith("Sender:"))
    const insertIndex =
      senderIndex !== -1 ? senderIndex + 1 : fromIndex !== -1 ? fromIndex + 1 : outputLines.length
    outputLines.splice(
      insertIndex,
      0,
      "List-Unsubscribe: <mailto:unsubscribe@[P_RPATH]>, <http://[P_RPATH]/[OPTDOWN]>",
      "List-Unsubscribe-Post: List-Unsubscribe=One-Click",
    )
  } else {
    const listUnsubIndex = outputLines.findIndex((line) => line.startsWith("List-Unsubscribe:"))
    if (listUnsubIndex !== -1) {
      outputLines.splice(listUnsubIndex + 1, 0, "List-Unsubscribe-Post: List-Unsubscribe=One-Click")
    }
  }

  return outputLines.join("\n")
}

export default function EmailHeaderProcessor() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<keyof typeof PRESETS>("standard")
  const [config, setConfig] = useState(PRESETS.standard)
  const [processing, setProcessing] = useState(false)
  const [copied, setCopied] = useState(false)

  const selectedFile = useMemo(() => {
    return files.find(f => f.id === selectedFileId)
  }, [files, selectedFileId])

  const handleFilesUpload = useCallback(async (fileList: FileList) => {
    const fileArray = Array.from(fileList).filter(file => file.name.endsWith('.eml'))
    
    if (fileArray.length === 0) {
      alert("Please upload .eml files only")
      return
    }

    if (files.length + fileArray.length > 20) {
      alert("Maximum 20 files allowed")
      return
    }

    const newFiles: FileItem[] = []
    
    for (const file of fileArray) {
      try {
        const content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.onerror = () => reject(new Error("Failed to read file"))
          reader.readAsText(file)
        })

        newFiles.push({
          id: `${Date.now()}-${Math.random()}`,
          name: file.name,
          originalContent: content,
          processedContent: '',
          status: 'pending'
        })
      } catch (err) {
        console.error(`Failed to read ${file.name}`)
      }
    }

    setFiles(prev => [...prev, ...newFiles])
    if (newFiles.length > 0 && !selectedFileId) {
      setSelectedFileId(newFiles[0].id)
    }
  }, [files.length, selectedFileId])

  const handleProcessAll = useCallback(async () => {
    if (files.length === 0) {
      alert("Please upload files first")
      return
    }

    setProcessing(true)

    const updatedFiles = [...files]
    
    for (let i = 0; i < updatedFiles.length; i++) {
      if (updatedFiles[i].status === 'completed') continue
      
      updatedFiles[i].status = 'processing'
      setFiles([...updatedFiles])
      
      await new Promise(resolve => setTimeout(resolve, 50))
      
      try {
        const processed = processEmail(updatedFiles[i].originalContent, config)
        updatedFiles[i].processedContent = processed
        updatedFiles[i].status = 'completed'
      } catch (err) {
        updatedFiles[i].status = 'error'
      }
      
      setFiles([...updatedFiles])
    }

    setProcessing(false)
  }, [files, config])

  const handleDownloadAll = useCallback(() => {
    const completedFiles = files.filter(f => f.status === 'completed')
    
    if (completedFiles.length === 0) {
      alert("No processed files to download")
      return
    }

    completedFiles.forEach(file => {
      const blob = new Blob([file.processedContent], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `processed-${file.name}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    })
  }, [files])

  const handleDownloadSingle = useCallback((fileId: string) => {
    const file = files.find(f => f.id === fileId)
    if (!file || file.status !== 'completed') {
      return
    }

    const blob = new Blob([file.processedContent], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `processed-${file.name}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [files])

  const handleRemoveFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
    if (selectedFileId === fileId) {
      const remainingFiles = files.filter(f => f.id !== fileId)
      setSelectedFileId(remainingFiles.length > 0 ? remainingFiles[0].id : null)
    }
  }, [files, selectedFileId])

  const handleClearAll = useCallback(() => {
    setFiles([])
    setSelectedFileId(null)
  }, [])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files) {
      handleFilesUpload(e.dataTransfer.files)
    }
  }, [handleFilesUpload])

  const handlePresetChange = useCallback((preset: keyof typeof PRESETS) => {
    setSelectedPreset(preset)
    setConfig(PRESETS[preset] as any)
  }, [])

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy")
    }
  }, [])

  const stats = useMemo(() => {
    const total = files.length
    const completed = files.filter(f => f.status === 'completed').length
    const pending = files.filter(f => f.status === 'pending').length
    const processingCount = files.filter(f => f.status === 'processing').length
    const error = files.filter(f => f.status === 'error').length
    
    return { total, completed, pending, processing: processingCount, error }
  }, [files])

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-card rounded-lg border border-border">
              <FileText className="text-foreground" size={24} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Email Header Processor - Batch Mode</h1>
              <p className="text-sm text-muted-foreground mt-1">Process up to 20 email files at once</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)} className="gap-2">
            <Settings size={16} />
            <span className="hidden sm:inline">Settings</span>
          </Button>
        </div>

        {showSettings && (
          <Card className="mb-6 p-6 border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Processing Configuration</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>
                <X size={16} />
              </Button>
            </div>

            <div className="mb-6">
              <label className="text-sm font-medium text-foreground mb-2 block">Presets</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {Object.entries(PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => handlePresetChange(key as keyof typeof PRESETS)}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      selectedPreset === key
                        ? "border-primary bg-accent"
                        : "border-border hover:border-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Zap size={16} className={selectedPreset === key ? "text-primary" : "text-muted-foreground"} />
                      <span className="font-semibold text-sm">{preset.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{preset.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {selectedPreset === "custom" && (
              <div>
                <label className="text-sm font-medium text-foreground mb-3 block">Fields to Remove</label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {Object.keys(PRESETS.standard.fieldsToRemove).map((field) => (
                    <label
                      key={field}
                      className="flex items-center gap-2 text-sm text-foreground cursor-pointer p-2 rounded hover:bg-accent"
                    >
                      <input
                        type="checkbox"
                        checked={config.fieldsToRemove[field as keyof typeof config.fieldsToRemove]}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            fieldsToRemove: { ...config.fieldsToRemove, [field]: e.target.checked },
                          })
                        }
                        className="rounded"
                      />
                      <span className="text-xs">{field}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        {files.length > 0 && (
          <Card className="mb-4 p-4 border-border">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Total:</span>
                  <strong className="text-foreground">{stats.total} files</strong>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-400" />
                  <strong className="text-green-400">{stats.completed} completed</strong>
                </div>
                {stats.pending > 0 && (
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-yellow-400" />
                    <strong className="text-yellow-400">{stats.pending} pending</strong>
                  </div>
                )}
                {stats.processing > 0 && (
                  <div className="flex items-center gap-2">
                    <RefreshCw size={16} className="text-blue-400 animate-spin" />
                    <strong className="text-blue-400">{stats.processing} processing</strong>
                  </div>
                )}
                {stats.error > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="text-red-400" />
                    <strong className="text-red-400">{stats.error} errors</strong>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        <div className="grid lg:grid-cols-[350px_1fr] gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <FolderOpen size={20} />
                Files ({files.length}/20)
              </h2>
              <div className="flex gap-2">
                <label className="cursor-pointer">
                  <Button variant="outline" size="sm" className="gap-2" asChild>
                    <span>
                      <Upload size={16} />
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept=".eml"
                    multiple
                    onChange={(e) => e.target.files && handleFilesUpload(e.target.files)}
                    className="hidden"
                  />
                </label>
                <Button variant="outline" size="sm" onClick={handleClearAll} disabled={files.length === 0}>
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>

            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive ? 'border-primary bg-primary/10' : 'border-border bg-card'
              }`}
            >
              <FolderOpen size={48} className="mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-foreground font-medium mb-1">Drop .eml files here</p>
              <p className="text-xs text-muted-foreground">or click the upload button above</p>
              <p className="text-xs text-muted-foreground mt-2">Maximum 20 files</p>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {files.map((file) => (
                <Card
                  key={file.id}
                  className={`p-3 cursor-pointer transition-all ${
                    selectedFileId === file.id ? 'border-primary bg-accent' : 'border-border hover:border-muted-foreground'
                  }`}
                  onClick={() => setSelectedFileId(file.id)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {file.status === 'completed' && <CheckCircle2 size={16} className="text-green-400 flex-shrink-0" />}
                      {file.status === 'pending' && <Clock size={16} className="text-yellow-400 flex-shrink-0" />}
                      {file.status === 'processing' && <RefreshCw size={16} className="text-blue-400 animate-spin flex-shrink-0" />}
                      {file.status === 'error' && <AlertCircle size={16} className="text-red-400 flex-shrink-0" />}
                      <span className="text-sm truncate">{file.name}</span>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {file.status === 'completed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDownloadSingle(file.id)
                          }}
                          className="h-7 w-7 p-0"
                        >
                          <Download size={14} />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveFile(file.id)
                        }}
                        className="h-7 w-7 p-0"
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                <Button
                  onClick={handleProcessAll}
                  disabled={processing || stats.pending === 0}
                  className="w-full gap-2"
                >
                  {processing ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Zap size={16} />
                      Process All Files
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleDownloadAll}
                  disabled={stats.completed === 0}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <Download size={16} />
                  Download All ({stats.completed})
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Code2 size={20} />
                {selectedFile ? selectedFile.name : 'Preview'}
              </h2>
              {selectedFile && selectedFile.status === 'completed' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(selectedFile.processedContent)}
                  className="gap-2"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Original</h3>
                <pre className="w-full h-[600px] p-4 font-mono text-xs bg-card border border-border rounded-lg overflow-auto whitespace-pre-wrap break-words">
                  {selectedFile ? (
                    <code className="text-foreground">{selectedFile.originalContent}</code>
                  ) : (
                    <span className="text-muted-foreground">Select a file to view content</span>
                  )}
                </pre>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Processed</h3>
                <pre className="w-full h-[600px] p-4 font-mono text-xs bg-card border border-border rounded-lg overflow-auto whitespace-pre-wrap break-words">
                  {selectedFile && selectedFile.status === 'completed' ? (
                    <code className="text-foreground">{selectedFile.processedContent}</code>
                  ) : selectedFile && selectedFile.status === 'processing' ? (
                    <span className="text-blue-400">Processing...</span>
                  ) : selectedFile && selectedFile.status === 'error' ? (
                    <span className="text-red-400">Error processing file</span>
                  ) : (
                    <span className="text-muted-foreground">Processed content will appear here...</span>
                  )}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
