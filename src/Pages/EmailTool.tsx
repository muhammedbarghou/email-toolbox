"use client"

import type React from "react"
import { useState, useCallback, useMemo, useEffect } from "react"
import {
  Copy,
  Check,
  X,
  Download,
  Upload,
  RefreshCw,
  Search,
  Settings,
  FileText,
  Trash2,
  History,
  Zap,
  Code2,
  FolderOpen,
  Command,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"

// Custom Hooks
const useClipboard = () => {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = useCallback(async (text: string) => {
    if (!text) return false
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success("Copied to clipboard")
      return true
    } catch (err) {
      toast.error("Failed to copy to clipboard")
      return false
    }
  }, [])

  return { copied, copyToClipboard }
}

const useFileReader = () => {
  const [loading, setLoading] = useState(false)

  const readFile = useCallback((file: File) => {
    return new Promise<string>((resolve, reject) => {
      setLoading(true)
      const reader = new FileReader()
      reader.onload = (e) => {
        setLoading(false)
        resolve(e.target?.result as string)
      }
      reader.onerror = () => {
        setLoading(false)
        reject(new Error("Failed to read file"))
      }
      reader.readAsText(file)
    })
  }, [])

  return { readFile, loading }
}

const useEmailProcessor = () => {
  const [processing, setProcessing] = useState(false)

  const processEmail = useCallback((input: string, config: any) => {
    setProcessing(true)

    return new Promise<string>((resolve) => {
      setTimeout(() => {
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
              outputLines.push("Date: [D=>%a, %d %b %Y %H:%M:%S] +0000")
            } else if (line.startsWith("To:")) {
              if (currentHeader.length > 0) {
                outputLines.push(...currentHeader)
                currentHeader = []
              }
              outputLines.push("To: [*to]")
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

        setProcessing(false)
        resolve(outputLines.join("\n"))
      }, 100)
    })
  }, [])

  return { processEmail, processing }
}



// Preset configurations
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
};

// Main App Component
export default function EmailHeaderProcessor() {
  const [inputEmail, setInputEmail] = useState("")
  const [outputEmail, setOutputEmail] = useState("")
  const [showSettings, setShowSettings] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [history, setHistory] = useState<any[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [dragActive, setDragActive] = useState(false)
  const [splitView, setSplitView] = useState(true)
  const [selectedPreset, setSelectedPreset] = useState<keyof typeof PRESETS>("standard")

  const [config, setConfig] = useState(PRESETS.standard)

  const { copied, copyToClipboard } = useClipboard()
  const { readFile } = useFileReader()
  const { processEmail, processing } = useEmailProcessor()



  const handleProcess = useCallback(async () => {
    if (!inputEmail.trim()) {
      toast.message("Please enter email content")
      return
    }

    const result = await processEmail(inputEmail, config)
    setOutputEmail(result)

    const newHistory = [...history.slice(0, historyIndex + 1), { input: inputEmail, output: result }]
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)

    toast.success("Email processed successfully!")
  }, [inputEmail, processEmail, config, history, historyIndex])

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!file) return

      if (!file.name.endsWith(".eml")) {
        toast.message("Please upload a .eml file")
        return
      }

      try {
        const content = await readFile(file)
        setInputEmail(content)
        toast.message("File loaded successfully!")
      } catch (err) {
        toast.error("Failed to read file")
      }
    },
    [readFile],
  )

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileUpload(e.dataTransfer.files[0])
      }
    },
    [handleFileUpload],
  )

  const handleDownload = useCallback(() => {
    if (!outputEmail) {
      toast.error("Nothing to download")
      return
    }

    const blob = new Blob([outputEmail], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `processed-email-${Date.now()}.eml`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("Downloaded successfully!")
  }, [outputEmail])

  const handleCopy = useCallback(async () => {
    const success = await copyToClipboard(outputEmail)
    if (success) {
      toast.success("Copied to clipboard!")
    } else {
      toast.error("Failed to copy")
    }
  }, [outputEmail, copyToClipboard])

  const handleClear = useCallback(() => {
    setInputEmail("")
    setOutputEmail("")
    setSearchTerm("")
    toast.message("Cleared successfully!")
  }, [])

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setInputEmail(history[newIndex].input)
      setOutputEmail(history[newIndex].output)
      toast.message("Undo successful!")
    }
  }, [history, historyIndex])

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setInputEmail(history[newIndex].input)
      setOutputEmail(history[newIndex].output)
      toast.message("Redo successful!")
    }
  }, [history, historyIndex])

  const handlePresetChange = useCallback(
    (preset: keyof typeof PRESETS) => {
      setSelectedPreset(preset)
      setConfig(PRESETS[preset] as any)
      toast.message(`Preset changed to ${PRESETS[preset].name}`)
    },
    [],
  )

  const filteredOutput = useMemo(() => {
    if (!searchTerm) return outputEmail
    return outputEmail
      .split("\n")
      .filter((line) => line.toLowerCase().includes(searchTerm.toLowerCase()))
      .join("\n")
  }, [outputEmail, searchTerm])

  const stats = useMemo(() => {
    const inputLines = inputEmail.split("\n").filter((l) => l.trim()).length
    const outputLines = outputEmail.split("\n").filter((l) => l.trim()).length
    const reduction = inputLines > 0 ? (((inputLines - outputLines) / inputLines) * 100).toFixed(1) : 0
    return { inputLines, outputLines, reduction }
  }, [inputEmail, outputEmail])

  const highlightedOutput = useMemo(() => {
    if (!outputEmail) return ""

    return outputEmail.split("\n").map((line, idx) => {
      let className = "block"
      if (line.startsWith("From:") || line.startsWith("To:") || line.startsWith("Subject:")) {
        className += " text-blue-400 font-semibold"
      } else if (line.startsWith("Date:") || line.startsWith("Message-ID:")) {
        className += " text-green-400"
      } else if (line.startsWith("List-Unsubscribe") || line.startsWith("MIME-Version:")) {
        className += " text-purple-400"
      } else if (line.startsWith("Content-Type:")) {
        className += " text-orange-400"
      } else {
        className += " text-muted-foreground"
      }

      return (
        <span key={idx} className={className}>
          {line || "\n"}
        </span>
      )
    })
  }, [outputEmail])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault()
        handleProcess()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setShowSettings((prev) => !prev)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleProcess])

  return (
    <div className="min-h-screen ">
      <div className="max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-card rounded-lg border border-border">
              <FileText className="text-foreground" size={24} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Email Header Processor</h1>
              <p className="text-sm text-muted-foreground mt-1">Clean and standardize email headers with ease</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)} className="gap-2">
              <Settings size={16} />
              <span className="hidden sm:inline">Settings</span>
              <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                <Command size={10} />K
              </kbd>
            </Button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <Card className="mb-6 p-6 animate-fade-in border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Processing Configuration</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>
                <X size={16} />
              </Button>
            </div>

            {/* Presets */}
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

            {/* Custom Fields */}
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

            {/* View Options */}
            <div className="mt-6 pt-6 border-t border-border">
              <label className="text-sm font-medium text-foreground mb-3 block">View Options</label>
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={splitView}
                  onChange={(e) => setSplitView(e.target.checked)}
                  className="rounded"
                />
                Split view (side-by-side)
              </label>
            </div>
          </Card>
        )}

        {/* Stats Bar */}
        {outputEmail && (
          <Card className="mb-4 p-4 border-border animate-fade-in">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Input:</span>
                  <strong className="text-foreground">{stats.inputLines} lines</strong>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Output:</span>
                  <strong className="text-foreground">{stats.outputLines} lines</strong>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Reduction:</span>
                  <strong className="text-green-400">{stats.reduction}%</strong>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  title="Undo (Ctrl+Z)"
                >
                  <History size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  title="Redo (Ctrl+Y)"
                  className="rotate-180"
                >
                  <History size={16} />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Main Content */}
        <div className={`grid ${splitView ? "lg:grid-cols-2" : "grid-cols-1"} gap-6`}>
          {/* Input Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Code2 size={20} />
                Input Email
              </h2>
              <div className="flex gap-2">
                <label className="cursor-pointer">
                  <Button variant="outline" size="sm" className="gap-2 bg-transparent" asChild>
                    <span>
                      <Upload size={16} />
                      <span className="hidden sm:inline">Upload</span>
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept=".eml"
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
                    className="hidden"
                  />
                </label>
                <Button variant="outline" size="sm" onClick={handleClear} className="gap-2 bg-transparent">
                  <Trash2 size={16} />
                  <span className="hidden sm:inline">Clear</span>
                </Button>
              </div>
            </div>

            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className="relative"
            >
              <textarea
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                placeholder="Paste email source here or drag & drop .eml file..."
                className="w-full h-[500px] p-4 font-mono text-sm bg-card border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent resize-none text-foreground placeholder:text-muted-foreground"
              />
              {dragActive && (
                <div className="absolute inset-0 bg-primary/10 flex items-center justify-center rounded-lg pointer-events-none border-2 border-primary border-dashed">
                  <div className="text-primary font-semibold text-lg flex items-center gap-2">
                    <FolderOpen size={24} />
                    Drop .eml file here
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={handleProcess}
              disabled={processing || !inputEmail.trim()}
              className="w-full gap-2 h-12 text-base font-semibold"
            >
              {processing ? (
                <>
                  <RefreshCw size={20} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap size={20} />
                  Process Email
                  <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-background/20 px-1.5 font-mono text-[10px] font-medium ml-auto">
                    <Command size={10} />↵
                  </kbd>
                </>
              )}
            </Button>
          </div>

          {/* Output Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Check size={20} />
                Processed Output
              </h2>
              <div className="flex gap-2">
                <div className="relative hidden sm:block">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search..."
                    className="w-40 pl-9 pr-3 py-1.5 bg-card border border-border rounded-md text-sm focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  disabled={!outputEmail}
                  className="gap-2 bg-transparent"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  disabled={!outputEmail}
                  className="gap-2 bg-transparent"
                >
                  <Download size={16} />
                  <span className="hidden sm:inline">Download</span>
                </Button>
              </div>
            </div>

            <div className="relative">
              <pre className="w-full h-[500px] p-4 font-mono text-sm bg-card border border-border rounded-lg overflow-auto whitespace-pre-wrap break-words">
                {searchTerm ? (
                  <code className="text-foreground">
                    {filteredOutput || <span className="text-muted-foreground">No matches found</span>}
                  </code>
                ) : highlightedOutput.length > 0 ? (
                  highlightedOutput
                ) : (
                  <span className="text-muted-foreground">Processed output will appear here...</span>
                )}
              </pre>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
