"use client"
import { useState, useRef, useEffect } from "react"
import type React from "react"
import { Upload, X, Copy, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import type { MapArea, ImageMapState } from "@/lib/types"

interface AreaRow extends MapArea {
  target?: string
}

interface DrawingState {
  isDrawing: boolean
  startX: number
  startY: number
  currentX: number
  currentY: number
}

export default function ImageMapGenerator() {
  const [state, setState] = useState<ImageMapState>({
    image: null,
    areas: [],
    selectedAreaId: null,
  })
  const [areas, setAreas] = useState<AreaRow[]>([])
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null)
  const [drawing, setDrawing] = useState<DrawingState>({
    isDrawing: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  })
  const [isDrawingMode, setIsDrawingMode] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setState((prev) => ({
          ...prev,
          image: event.target?.result as string,
        }))
        setAreas([])
        setSelectedRowId(null)
        setIsDrawingMode(false)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingMode || !canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setDrawing({
      isDrawing: true,
      startX: x,
      startY: y,
      currentX: x,
      currentY: y,
    })
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing.isDrawing || !canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setDrawing((prev) => ({
      ...prev,
      currentX: x,
      currentY: y,
    }))

    redrawCanvas()
  }

  const handleCanvasMouseUp = () => {
    if (!drawing.isDrawing) return

    const width = Math.abs(drawing.currentX - drawing.startX)
    const height = Math.abs(drawing.currentY - drawing.startY)

    if (width > 10 && height > 10) {
      const newArea: AreaRow = {
        id: Date.now(),
        x: Math.min(drawing.startX, drawing.currentX),
        y: Math.min(drawing.startY, drawing.currentY),
        width,
        height,
        href: "",
        alt: "",
        target: "_blank",
      }
      setAreas((prev) => [...prev, newArea])
      setSelectedRowId(newArea.id)
    }

    setDrawing({
      isDrawing: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
    })
    setIsDrawingMode(false)
    redrawCanvas()
  }

  const redrawCanvas = () => {
    if (!canvasRef.current || !imageRef.current) return

    const ctx = canvasRef.current.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    ctx.drawImage(imageRef.current, 0, 0)

    areas.forEach((area) => {
      ctx.strokeStyle = selectedRowId === area.id ? "#3b82f6" : "#10b981"
      ctx.lineWidth = 2
      ctx.strokeRect(area.x, area.y, area.width, area.height)

      ctx.fillStyle = selectedRowId === area.id ? "rgba(59, 130, 246, 0.1)" : "rgba(16, 185, 129, 0.1)"
      ctx.fillRect(area.x, area.y, area.width, area.height)
    })

    if (drawing.isDrawing) {
      const width = drawing.currentX - drawing.startX
      const height = drawing.currentY - drawing.startY

      ctx.strokeStyle = "#f59e0b"
      ctx.lineWidth = 2
      ctx.strokeRect(drawing.startX, drawing.startY, width, height)

      ctx.fillStyle = "rgba(245, 158, 11, 0.1)"
      ctx.fillRect(drawing.startX, drawing.startY, width, height)
    }
  }

  useEffect(() => {
    if (state.image && imageRef.current) {
      imageRef.current.onload = () => {
        if (canvasRef.current) {
          canvasRef.current.width = imageRef.current!.width
          canvasRef.current.height = imageRef.current!.height
          redrawCanvas()
        }
      }
    }
  }, [state.image, areas, selectedRowId, drawing.isDrawing])

  const addNewArea = (): void => {
    setIsDrawingMode(true)
  }

  const updateArea = (id: number, updates: Partial<AreaRow>): void => {
    setAreas((prev) => prev.map((area) => (area.id === id ? { ...area, ...updates } : area)))
  }

  const removeArea = (id: number): void => {
    setAreas((prev) => prev.filter((area) => area.id !== id))
    if (selectedRowId === id) {
      setSelectedRowId(null)
    }
  }

  const generateCode = (): string => {
    if (!state.image) return ""

    let code = `<img src="[IMG]" usemap="#MGA" alt="Creative-Image">\n`
    code += `<map name="MGA">\n`

    areas.forEach((area) => {
      const coords = `${area.x},${area.y},${area.x + area.width},${area.y + area.height}`
      code += `  <area href="${area.href}" coords="${coords}" shape="rect" alt="${area.alt}">\n`
    })

    code += `</map>`
    return code
  }

  const copyToClipboard = (): void => {
    const code = generateCode()
    navigator.clipboard.writeText(code)
    alert("Code copied to clipboard!")
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      {!state.image ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-12 text-center hover:border-blue-400 hover:bg-blue-50 transition-all w-full max-w-md">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="cursor-pointer block mx-auto w-full">
              <Upload className="mx-auto mb-3 text-slate-400" size={48} />
              <p className="text-base font-semibold text-slate-700">Upload Image for Mapping</p>
              <p className="text-sm text-slate-500 mt-2">Click to select an image</p>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6 flex-1 flex flex-col">
          <div className="flex-1 bg-white rounded-lg p-4 border border-slate-200 relative overflow-auto">
            <img
              ref={imageRef}
              src={state.image || "/placeholder.svg"}
              alt="Preview"
              className="w-full object-contain mx-auto hidden"
            />
            <div className="flex items-center justify-center h-full">
              <canvas
                ref={canvasRef}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                className={`max-w-full max-h-full object-contain border border-slate-200 rounded ${
                  isDrawingMode ? "cursor-crosshair" : "cursor-default"
                }`}
              />
            </div>
            {isDrawingMode && (
              <div className="absolute top-4 right-4 bg-amber-100 border border-amber-300 text-amber-800 px-4 py-2 rounded-lg text-sm font-medium">
                Draw area on image
              </div>
            )}
          </div>

          <Card className="p-4">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-12">Active</TableHead>
                  <TableHead className="w-24">Shape</TableHead>
                  <TableHead className="flex-1">Link</TableHead>
                  <TableHead className="flex-1">Title</TableHead>
                  <TableHead className="w-24">Target</TableHead>
                  <TableHead className="w-12 text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {areas.map((area) => (
                  <TableRow
                    key={area.id}
                    className={`hover:bg-slate-50 transition-colors ${selectedRowId === area.id ? "bg-blue-50" : ""}`}
                  >
                    <TableCell>
                      <input
                        type="radio"
                        name="active-area"
                        checked={selectedRowId === area.id}
                        onChange={() => setSelectedRowId(area.id)}
                        className="cursor-pointer"
                      />
                    </TableCell>

                    <TableCell>
                      <Select value="rect" disabled>
                        <SelectTrigger className="w-20 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rect">Rect</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>

                    <TableCell>
                      <Input
                        type="text"
                        placeholder="Link"
                        value={area.href}
                        onChange={(e) => updateArea(area.id, { href: e.target.value })}
                        className="text-xs"
                      />
                    </TableCell>

                    <TableCell>
                      <Input
                        type="text"
                        placeholder="Title"
                        value={area.alt}
                        onChange={(e) => updateArea(area.id, { alt: e.target.value })}
                        className="text-xs"
                      />
                    </TableCell>

                    <TableCell>
                      <Select
                        value={area.target || "_blank"}
                        onValueChange={(value) => updateArea(area.id, { target: value })}
                      >
                        <SelectTrigger className="w-20 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_blank">---</SelectItem>
                          <SelectItem value="_self">_self</SelectItem>
                          <SelectItem value="_parent">_parent</SelectItem>
                          <SelectItem value="_top">_top</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>

                    <TableCell className="text-center">
                      <button
                        onClick={() => removeArea(area.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200">
              <Button
                onClick={addNewArea}
                disabled={isDrawingMode}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300"
              >
                <Plus size={16} className="mr-2" />
                {isDrawingMode ? "Drawing..." : "Add New Area"}
              </Button>
              {areas.length > 0 && (
                <Button
                  onClick={() => {
                    setState({ image: null, areas: [], selectedAreaId: null })
                    setAreas([])
                    setSelectedRowId(null)
                  }}
                  variant="destructive"
                  className="ml-auto"
                >
                  <Trash2 size={16} className="mr-2" />
                  Clear All
                </Button>
              )}
            </div>
          </Card>

          {areas.length > 0 && (
            <Card className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-slate-700">Generated Code</h3>
                <Button onClick={copyToClipboard} size="sm" className="bg-blue-500 hover:bg-blue-600">
                  <Copy size={14} className="mr-1" />
                  Copy Code
                </Button>
              </div>
              <pre className="bg-slate-50 text-slate-700 p-3 rounded text-xs overflow-x-auto max-h-48 overflow-y-auto border border-slate-200 font-mono">
                {generateCode()}
              </pre>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
