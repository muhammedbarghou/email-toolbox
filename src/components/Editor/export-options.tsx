import { useState } from "react"
import { Download } from "lucide-react"

interface ExportOptionsProps {
  generatePreview: () => Promise<string | null>
}

export default function ExportOptions({ generatePreview }: ExportOptionsProps) {
  const [format, setFormat] = useState<"png" | "jpg" | "webp">("png")
  const [quality, setQuality] = useState<number>(95)

  const handleDownload = async () => {
    const preview = await generatePreview()
    if (!preview) {
      alert("Please upload all images first")
      return
    }

    const link = document.createElement("a")
    link.download = `combined-image.${format}`
    link.href = preview
    link.click()
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <h2 className="text-xl font-bold text-white mb-4">Export</h2>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-200 block mb-2">Format</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as "png" | "jpg" | "webp")}
            className="w-full bg-slate-700 text-white rounded px-3 py-2 border border-slate-600"
          >
            <option value="png">PNG</option>
            <option value="jpg">JPG</option>
            <option value="webp">WebP</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-200 block mb-2">Quality: {quality}%</label>
          <input
            type="range"
            value={quality}
            onChange={(e) => setQuality(Number.parseInt(e.target.value))}
            min={10}
            max={100}
            step={5}
            className="w-full"
          />
        </div>

        <button
          onClick={handleDownload}
          className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <Download size={20} />
          Download Image
        </button>
      </div>
    </div>
  )
}
