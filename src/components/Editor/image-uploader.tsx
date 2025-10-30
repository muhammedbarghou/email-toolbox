import { Upload, X } from "lucide-react"
import type React from "react"

import type { ImageState } from "@/lib/types"

interface ImageUploaderProps {
  onUpload: (type: keyof ImageState, file: File) => void
  onRemove: (type: keyof ImageState) => void
  images: ImageState
}

interface ImageBoxProps {
  type: keyof ImageState
  label: string
  image: string | null
  onUpload: (type: keyof ImageState, e: React.ChangeEvent<HTMLInputElement>) => void
  onRemove: (type: keyof ImageState) => void
}

function ImageBox({ type, label, image, onUpload, onRemove }: ImageBoxProps) {
  return (
    <div className="bg-slate-700 border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
      <input
        type="file"
        accept="image/*"
        onChange={(e) => onUpload(type, e)}
        className="hidden"
        id={`upload-${type}`}
      />
      {!image ? (
        <label htmlFor={`upload-${type}`} className="cursor-pointer block">
          <Upload className="mx-auto mb-2 text-slate-400" size={32} />
          <p className="text-sm font-medium text-slate-200">{label}</p>
          <p className="text-xs text-slate-400 mt-1">Click to upload</p>
        </label>
      ) : (
        <div className="relative">
          <img src={image || "/placeholder.svg"} alt={label} className="max-h-32 mx-auto rounded" />
          <button
            onClick={() => onRemove(type)}
            className="absolute top-0 right-0 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
          >
            <X size={16} />
          </button>
          <p className="text-xs text-green-400 mt-2 font-medium">✓ {label} uploaded</p>
        </div>
      )}
    </div>
  )
}

export default function ImageUploader({ onUpload, onRemove, images }: ImageUploaderProps) {
  const handleFileChange = (type: keyof ImageState, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      onUpload(type, file)
    }
  }

  return (
    <div className="space-y-4">
      <ImageBox type="offer" label="Email Offer" image={images.offer} onUpload={handleFileChange} onRemove={onRemove} />
      <ImageBox
        type="footer1"
        label="Footer 1"
        image={images.footer1}
        onUpload={handleFileChange}
        onRemove={onRemove}
      />
      <ImageBox
        type="footer2"
        label="Footer 2"
        image={images.footer2}
        onUpload={handleFileChange}
        onRemove={onRemove}
      />
    </div>
  )
}
