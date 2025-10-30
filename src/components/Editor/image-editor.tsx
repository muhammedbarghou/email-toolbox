import { Slider } from "@/components/ui/slider"
import type { ImageState, EditsState, ImageEdits } from "@/lib/types"

interface ImageEditorProps {
  images: ImageState
  edits: EditsState
  onEditingChange: (type: string) => void
  onEditsChange: (type: keyof ImageState, edits: ImageEdits) => void
  editingImage: string | null
}

export default function ImageEditor({ images, edits, onEditingChange, onEditsChange, editingImage }: ImageEditorProps) {
  const imageTypes = (Object.keys(images) as Array<keyof ImageState>).filter((key) => images[key])

  const handleEdit = (type: keyof ImageState, key: keyof ImageEdits, value: number | boolean) => {
    onEditsChange(type, { [key]: value })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-200 block mb-2">Select Image to Edit</label>
        <select
          value={editingImage || ""}
          onChange={(e) => onEditingChange(e.target.value)}
          className="w-full bg-slate-700 text-white rounded px-3 py-2 border border-slate-600"
        >
          <option value="">Choose an image...</option>
          {imageTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {editingImage && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-200 block mb-2">
              Brightness: {edits[editingImage as keyof ImageState]?.brightness || 100}%
            </label>
            <Slider
              value={[edits[editingImage as keyof ImageState]?.brightness || 100]}
              onValueChange={(value) => handleEdit(editingImage as keyof ImageState, "brightness", value[0])}
              min={0}
              max={200}
              step={1}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-200 block mb-2">
              Contrast: {edits[editingImage as keyof ImageState]?.contrast || 100}%
            </label>
            <Slider
              value={[edits[editingImage as keyof ImageState]?.contrast || 100]}
              onValueChange={(value) => handleEdit(editingImage as keyof ImageState, "contrast", value[0])}
              min={0}
              max={200}
              step={1}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-200 block mb-2">
              Saturation: {edits[editingImage as keyof ImageState]?.saturation || 100}%
            </label>
            <Slider
              value={[edits[editingImage as keyof ImageState]?.saturation || 100]}
              onValueChange={(value) => handleEdit(editingImage as keyof ImageState, "saturation", value[0])}
              min={0}
              max={200}
              step={1}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-200 block mb-2">
              Rotation: {edits[editingImage as keyof ImageState]?.rotation || 0}°
            </label>
            <Slider
              value={[edits[editingImage as keyof ImageState]?.rotation || 0]}
              onValueChange={(value) => handleEdit(editingImage as keyof ImageState, "rotation", value[0])}
              min={0}
              max={360}
              step={1}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-200 block mb-2">
              Scale: {edits[editingImage as keyof ImageState]?.scale || 100}%
            </label>
            <Slider
              value={[edits[editingImage as keyof ImageState]?.scale || 100]}
              onValueChange={(value) => handleEdit(editingImage as keyof ImageState, "scale", value[0])}
              min={50}
              max={150}
              step={1}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() =>
                handleEdit(editingImage as keyof ImageState, "flipH", !edits[editingImage as keyof ImageState]?.flipH)
              }
              className="bg-slate-600 hover:bg-slate-500 text-white px-3 py-2 rounded text-sm"
            >
              Flip H
            </button>
            <button
              onClick={() =>
                handleEdit(editingImage as keyof ImageState, "flipV", !edits[editingImage as keyof ImageState]?.flipV)
              }
              className="bg-slate-600 hover:bg-slate-500 text-white px-3 py-2 rounded text-sm"
            >
              Flip V
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
