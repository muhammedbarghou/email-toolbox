"use client"

import React, { useState, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ImageUploader from "@/components/Editor/image-uploader"
import ImageEditor from "@/components/Editor/image-editor"
import LayoutCustomizer from "@/components/Editor/layout-customizer"
import TextOverlay from "@/components/Editor/text-overlay"
import ExportOptions from "@/components/Editor/export-options"
import type { ImageState, EditsState, LayoutSettings, TextOverlay as TextOverlayType } from "@/lib/types"

export default function PhotoEditor() {
  const [images, setImages] = useState<ImageState>({
    offer: null,
    footer1: null,
    footer2: null,
  })
  const [editingImage, setEditingImage] = useState<string | null>(null)
  const [edits, setEdits] = useState<EditsState>({
    offer: {},
    footer1: {},
    footer2: {},
  })
  const [layout, setLayout] = useState<LayoutSettings>({
    spacing: 0,
    alignment: "center",
    backgroundColor: "#ffffff",
  })
  const [textOverlays, setTextOverlays] = useState<TextOverlayType[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleImageUpload = (type: keyof ImageState, file: File) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      setImages((prev) => ({ ...prev, [type]: event.target?.result as string }))
    }
    reader.readAsDataURL(file)
  }

  const removeImage = (type: keyof ImageState) => {
    setImages((prev) => ({ ...prev, [type]: null }))
    setEdits((prev) => ({ ...prev, [type]: {} }))
  }

  const updateEdits = (type: keyof ImageState, newEdits: any) => {
    setEdits((prev) => ({ ...prev, [type]: { ...prev[type], ...newEdits } }))
  }

  const addTextOverlay = () => {
    setTextOverlays((prev) => [
      ...prev,
      {
        id: Date.now(),
        text: "New Text",
        x: 50,
        y: 50,
        fontSize: 24,
        color: "#000000",
        fontFamily: "Arial",
      },
    ])
  }

  const updateTextOverlay = (id: number, updates: Partial<TextOverlayType>) => {
    setTextOverlays((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)))
  }

  const removeTextOverlay = (id: number) => {
    setTextOverlays((prev) => prev.filter((t) => t.id !== id))
  }

  const generatePreview = async (): Promise<string | null> => {
    if (!images.offer || !images.footer1 || !images.footer2) {
      return null
    }

    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = src
      })
    }

    try {
      const [offerImg, footer1Img, footer2Img] = await Promise.all([
        loadImage(images.offer),
        loadImage(images.footer1),
        loadImage(images.footer2),
      ])

      const maxWidth = Math.max(offerImg.width, footer1Img.width, footer2Img.width)
      const totalHeight = offerImg.height + footer1Img.height + footer2Img.height + layout.spacing * 2

      const canvas = canvasRef.current
      if (!canvas) return null

      canvas.width = maxWidth
      canvas.height = totalHeight

      const ctx = canvas.getContext("2d")
      if (!ctx) return null

      ctx.fillStyle = layout.backgroundColor
      ctx.fillRect(0, 0, maxWidth, totalHeight)

      let currentY = layout.spacing

      // Draw offer image
      const offerX = layout.alignment === "center" ? (maxWidth - offerImg.width) / 2 : 0
      ctx.drawImage(offerImg, offerX, currentY, offerImg.width, offerImg.height)
      currentY += offerImg.height + layout.spacing

      // Draw footer 1
      const footer1X = layout.alignment === "center" ? (maxWidth - footer1Img.width) / 2 : 0
      ctx.drawImage(footer1Img, footer1X, currentY, footer1Img.width, footer1Img.height)
      currentY += footer1Img.height + layout.spacing

      // Draw footer 2
      const footer2X = layout.alignment === "center" ? (maxWidth - footer2Img.width) / 2 : 0
      ctx.drawImage(footer2Img, footer2X, currentY, footer2Img.width, footer2Img.height)

      // Draw text overlays
      textOverlays.forEach((overlay) => {
        ctx.font = `${overlay.fontSize}px ${overlay.fontFamily}`
        ctx.fillStyle = overlay.color
        ctx.fillText(overlay.text, overlay.x, overlay.y)
      })

      return canvas.toDataURL("image/png")
    } catch (error) {
      console.error("Error generating preview:", error)
      return null
    }
  }

  return (
    <div className="min-h-screen  p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold  mb-2">Advanced Photo Editor</h1>
          <p className="text-slate-400">Combine, edit, customize images, and generate image maps</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-1 space-y-6">
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid w-full grid-cols-5 bg-slate-700">
                <TabsTrigger value="upload" className="text-xs">
                  Upload
                </TabsTrigger>
                <TabsTrigger value="edit" className="text-xs">
                  Edit
                </TabsTrigger>
                <TabsTrigger value="layout" className="text-xs">
                  Layout
                </TabsTrigger>
                <TabsTrigger value="text" className="text-xs">
                  Text
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-4">
                <ImageUploader onUpload={handleImageUpload} onRemove={removeImage} images={images} />
              </TabsContent>

              <TabsContent value="edit" className="space-y-4">
                <ImageEditor
                  images={images}
                  edits={edits}
                  onEditingChange={setEditingImage}
                  onEditsChange={updateEdits}
                  editingImage={editingImage}
                />
              </TabsContent>

              <TabsContent value="layout" className="space-y-4">
                <LayoutCustomizer layout={layout} onLayoutChange={setLayout} />
              </TabsContent>

              <TabsContent value="text" className="space-y-4">
                <TextOverlay
                  overlays={textOverlays}
                  onAdd={addTextOverlay}
                  onUpdate={updateTextOverlay}
                  onRemove={removeTextOverlay}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Panel - Preview & Export */}
          <div className="lg:col-span-2 space-y-6">
            <PreviewPanel generatePreview={generatePreview} />
            <ExportOptions generatePreview={generatePreview} />
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}

function PreviewPanel({ generatePreview }: { generatePreview: () => Promise<string | null> }) {
  const [preview, setPreview] = React.useState<string | null>(null)

  React.useEffect(() => {
    const updatePreview = async () => {
      const img = await generatePreview()
      setPreview(img)
    }
    updatePreview()
  }, [generatePreview])

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <h2 className="text-xl font-bold text-white mb-4">Preview</h2>
      {preview ? (
        <div className="bg-slate-900 rounded-lg p-4 overflow-auto max-h-96">
          <img src={preview || "/placeholder.svg"} alt="Preview" className="w-full rounded shadow-lg" />
        </div>
      ) : (
        <div className="bg-slate-900 rounded-lg p-8 text-center text-slate-400">Upload images to see preview</div>
      )}
    </div>
  )
}
