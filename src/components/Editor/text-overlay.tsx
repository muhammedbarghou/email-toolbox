import { Plus, X } from "lucide-react"
import type { TextOverlay } from "@/lib/types"

interface TextOverlayProps {
  overlays: TextOverlay[]
  onAdd: () => void
  onUpdate: (id: number, updates: Partial<TextOverlay>) => void
  onRemove: (id: number) => void
}

export default function TextOverlayComponent({ overlays, onAdd, onUpdate, onRemove }: TextOverlayProps) {
  return (
    <div className="space-y-4">
      <button
        onClick={onAdd}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center justify-center gap-2"
      >
        <Plus size={18} />
        Add Text
      </button>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {overlays.map((overlay) => (
          <div key={overlay.id} className="bg-slate-700 rounded p-3 space-y-2">
            <div className="flex justify-between items-start">
              <input
                type="text"
                value={overlay.text}
                onChange={(e) => onUpdate(overlay.id, { text: e.target.value })}
                className="flex-1 bg-slate-600 text-white rounded px-2 py-1 text-sm"
              />
              <button onClick={() => onRemove(overlay.id)} className="text-red-400 hover:text-red-300 ml-2">
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-400">Size</label>
                <input
                  type="number"
                  value={overlay.fontSize}
                  onChange={(e) => onUpdate(overlay.id, { fontSize: Number.parseInt(e.target.value) })}
                  className="w-full bg-slate-600 text-white rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Color</label>
                <input
                  type="color"
                  value={overlay.color}
                  onChange={(e) => onUpdate(overlay.id, { color: e.target.value })}
                  className="w-full h-8 rounded cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-400">X</label>
                <input
                  type="number"
                  value={overlay.x}
                  onChange={(e) => onUpdate(overlay.id, { x: Number.parseInt(e.target.value) })}
                  className="w-full bg-slate-600 text-white rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Y</label>
                <input
                  type="number"
                  value={overlay.y}
                  onChange={(e) => onUpdate(overlay.id, { y: Number.parseInt(e.target.value) })}
                  className="w-full bg-slate-600 text-white rounded px-2 py-1 text-sm"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
