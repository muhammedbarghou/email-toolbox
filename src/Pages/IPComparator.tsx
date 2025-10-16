"use client"

import type React from "react"

import { useState } from "react"
import { Network, Copy, Download, ArrowLeftRight, Trash2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"

interface ComparisonStats {
  list1Count: number
  list2Count: number
  missingCount: number
  list1Unique: number
  list2Unique: number
  commonCount: number
}

export default function IPComparator() {
  const [list1, setList1] = useState("")
  const [list2, setList2] = useState("")
  const [missingIPs, setMissingIPs] = useState<string[]>([])
  const [stats, setStats] = useState<ComparisonStats | null>(null)
  const [isDragging1, setIsDragging1] = useState(false)
  const [isDragging2, setIsDragging2] = useState(false)

  const parseIPs = (text: string): string[] => {
    return text
      .split("\n")
      .map((ip) => ip.trim())
      .filter((ip) => ip)
  }

  const validateIP = (ip: string): boolean => {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
    const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/
    return ipv4Regex.test(ip) || ipv6Regex.test(ip)
  }

  const compareIPs = () => {
    const ips1 = parseIPs(list1)
    const ips2 = parseIPs(list2)

    if (ips1.length === 0 || ips2.length === 0) {
      toast.error("Please enter IP addresses in both lists",)
      return
    }

    const set1 = new Set(ips1)
    const set2 = new Set(ips2)
    const missing = ips1.filter((ip) => !set2.has(ip))
    const common = ips1.filter((ip) => set2.has(ip))

    setMissingIPs(missing)
    setStats({
      list1Count: ips1.length,
      list2Count: ips2.length,
      missingCount: missing.length,
      list1Unique: set1.size,
      list2Unique: set2.size,
      commonCount: common.length,
    })

    toast.success(`Found ${missing.length} missing IP${missing.length !== 1 ? "s" : ""}`,)
  }

  const clearAll = () => {
    setList1("")
    setList2("")
    setMissingIPs([])
    setStats(null)
    toast.success("All data has been cleared",)
  }

  const swapLists = () => {
    const temp = list1
    setList1(list2)
    setList2(temp)
    setMissingIPs([])
    setStats(null)
    toast.success("Lists swapped",)
  }

  const copyResults = () => {
    if (missingIPs.length === 0) {
      toast.message("No results")
    }

    navigator.clipboard.writeText(missingIPs.join("\n"))
    toast.success(
       `${missingIPs.length} IP addresses copied to clipboard`)
  }

  const downloadResults = () => {
    if (missingIPs.length === 0) {
      toast.message("No results")
    }

    const blob = new Blob([missingIPs.join("\n")], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `missing-ips-${new Date().toISOString().split("T")[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success("Downloaded")
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, setList: (value: string) => void) => {
    const file = e.target.files?.[0]
    if (!file) return

    const text = await file.text()
    setList(text)
    toast.message(`${file.name} has been loaded`)
  }

  const handleDrop = async (
    e: React.DragEvent,
    setList: (value: string) => void,
    setDragging: (value: boolean) => void,
  ) => {
    e.preventDefault()
    setDragging(false)

    const file = e.dataTransfer.files[0]
    if (!file) return

    const text = await file.text()
    setList(text)
    toast.success(`${file.name} has been loaded`)
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <Network className="w-10 h-10 text-chart-1" />
            <h1 className="text-4xl md:text-5xl font-bold">IP Comparator</h1>
          </div>
          <p className="text-muted-foreground text-lg">Find IP addresses from List 1 that are missing in List 2</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card className="bg-card border-border p-4">
              <div className="text-sm text-muted-foreground">List 1 Total</div>
              <div className="text-2xl font-bold text-chart-1">{stats.list1Count}</div>
            </Card>
            <Card className="bg-card border-border p-4">
              <div className="text-sm text-muted-foreground">List 2 Total</div>
              <div className="text-2xl font-bold text-chart-4">{stats.list2Count}</div>
            </Card>
            <Card className="bg-card border-border p-4">
              <div className="text-sm text-muted-foreground">Missing</div>
              <div className="text-2xl font-bold text-destructive">{stats.missingCount}</div>
            </Card>
            <Card className="bg-card border-border p-4">
              <div className="text-sm text-muted-foreground">Common</div>
              <div className="text-2xl font-bold text-chart-2">{stats.commonCount}</div>
            </Card>
            <Card className="bg-card border-border p-4">
              <div className="text-sm text-muted-foreground">List 1 Unique</div>
              <div className="text-2xl font-bold text-chart-3">{stats.list1Unique}</div>
            </Card>
            <Card className="bg-card border-border p-4">
              <div className="text-sm text-muted-foreground">List 2 Unique</div>
              <div className="text-2xl font-bold text-chart-5">{stats.list2Unique}</div>
            </Card>
          </div>
        )}

        {/* Input Lists */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* List 1 */}
          <Card className="bg-card border-border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-chart-1">List 1 (Source)</h2>
                <p className="text-sm text-muted-foreground mt-1">{parseIPs(list1).length} IP addresses</p>
              </div>
              <label htmlFor="file1">
                <Button variant="outline" size="sm" className="cursor-pointer bg-transparent" asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </span>
                </Button>
                <input
                  id="file1"
                  type="file"
                  accept=".txt,.csv"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, setList1)}
                />
              </label>
            </div>
            <div
              className={`relative ${isDragging1 ? "ring-2 ring-chart-1 ring-offset-2 ring-offset-background" : ""}`}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging1(true)
              }}
              onDragLeave={() => setIsDragging1(false)}
              onDrop={(e) => handleDrop(e, setList1, setIsDragging1)}
            >
              <textarea
                value={list1}
                onChange={(e) => setList1(e.target.value)}
                placeholder="Enter IP addresses (one per line)&#10;192.168.1.1&#10;192.168.1.2&#10;192.168.1.3&#10;&#10;Or drag and drop a file here"
                className="w-full h-96 bg-muted border border-border rounded-lg p-4 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
          </Card>

          {/* List 2 */}
          <Card className="bg-card border-border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-chart-4">List 2 (Reference)</h2>
                <p className="text-sm text-muted-foreground mt-1">{parseIPs(list2).length} IP addresses</p>
              </div>
              <label htmlFor="file2">
                <Button variant="outline" size="sm" className="cursor-pointer bg-transparent" asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </span>
                </Button>
                <input
                  id="file2"
                  type="file"
                  accept=".txt,.csv"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, setList2)}
                />
              </label>
            </div>
            <div
              className={`relative ${isDragging2 ? "ring-2 ring-chart-4 ring-offset-2 ring-offset-background" : ""}`}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging2(true)
              }}
              onDragLeave={() => setIsDragging2(false)}
              onDrop={(e) => handleDrop(e, setList2, setIsDragging2)}
            >
              <textarea
                value={list2}
                onChange={(e) => setList2(e.target.value)}
                placeholder="Enter IP addresses (one per line)&#10;192.168.1.1&#10;192.168.1.2&#10;&#10;Or drag and drop a file here"
                className="w-full h-96 bg-muted border border-border rounded-lg p-4 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button onClick={compareIPs} size="lg">
            <Network className="w-5 h-5 mr-2" />
            Compare Lists
          </Button>
          <Button onClick={swapLists} size="lg" variant="outline">
            <ArrowLeftRight className="w-5 h-5 mr-2" />
            Swap Lists
          </Button>
          <Button onClick={clearAll} size="lg" variant="outline">
            <Trash2 className="w-5 h-5 mr-2" />
            Clear All
          </Button>
        </div>

        {/* Results */}
        {missingIPs.length > 0 && (
          <Card className="bg-card border-border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-destructive">Missing IP Addresses ({missingIPs.length})</h2>
                <p className="text-muted-foreground mt-1">
                  These IP addresses appear in List 1 but are missing in List 2
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={copyResults} variant="outline" size="sm">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                <Button onClick={downloadResults} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
            <div className="bg-muted border border-border rounded-lg p-4 max-h-96 overflow-y-auto">
              <div className="space-y-2">
                {missingIPs.map((ip, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-card rounded border border-border hover:border-destructive/50 transition-colors"
                  >
                    <span className="flex items-center justify-center w-8 h-8 bg-destructive/10 text-destructive rounded-full font-semibold text-xs">
                      {index + 1}
                    </span>
                    <span className="font-mono text-sm">{ip}</span>
                    {!validateIP(ip) && <span className="ml-auto text-xs text-chart-5">Invalid format</span>}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {stats && missingIPs.length === 0 && (
          <Card className="bg-chart-2/10 border-chart-2/50 p-8 text-center">
            <p className="text-chart-2 font-semibold text-xl">All IP addresses from List 1 are present in List 2!</p>
          </Card>
        )}
      </div>
    </div>
  )
}
