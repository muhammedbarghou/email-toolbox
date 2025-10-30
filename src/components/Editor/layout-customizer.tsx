import { Slider } from "@/components/ui/slider"
import type { LayoutSettings } from "@/lib/types"

interface LayoutCustomizerProps {
  layout: LayoutSettings
  onLayoutChange: (layout: LayoutSettings) => void
}

export default function LayoutCustomizer({ layout, onLayoutChange }: LayoutCustomizerProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-200 block mb-2">Spacing: {layout.spacing}px</label>
        <Slider
          value={[layout.spacing]}
          onValueChange={(value) => onLayoutChange({ ...layout, spacing: value[0] })}
          min={0}
          max={100}
          step={5}
          className="w-full"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-200 block mb-2">Alignment</label>
        <select
          value={layout.alignment}
          onChange={(e) => onLayoutChange({ ...layout, alignment: e.target.value as "center" | "left" | "right" })}
          className="w-full bg-slate-700 text-white rounded px-3 py-2 border border-slate-600"
        >
          <option value="center">Center</option>
          <option value="left">Left</option>
          <option value="right">Right</option>
        </select>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-200 block mb-2">Background Color</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={layout.backgroundColor}
            onChange={(e) => onLayoutChange({ ...layout, backgroundColor: e.target.value })}
            className="w-12 h-10 rounded cursor-pointer"
          />
          <input
            type="text"
            value={layout.backgroundColor}
            onChange={(e) => onLayoutChange({ ...layout, backgroundColor: e.target.value })}
            className="flex-1 bg-slate-700 text-white rounded px-3 py-2 border border-slate-600"
          />
        </div>
      </div>
    </div>
  )
}
