"use client"

import { Button } from "@/components/ui/button"
import { MousePointer, Edit3, Eraser, Grid3X3, Zap } from "lucide-react"

interface ToolbarProps {
  selectedTool: "select" | "pencil" | "eraser"
  onToolChange: (tool: "select" | "pencil" | "eraser") => void
  gridSnap: boolean
  onGridSnapChange: (snap: boolean) => void
  snapValue: number
  onSnapValueChange: (value: number) => void
}

export function Toolbar({
  selectedTool,
  onToolChange,
  gridSnap,
  onGridSnapChange,
  snapValue,
  onSnapValueChange,
}: ToolbarProps) {
  const snapOptions = [
    { value: 1, label: "1/1" },
    { value: 0.5, label: "1/2" },
    { value: 0.25, label: "1/4" },
    { value: 0.125, label: "1/8" },
    { value: 0.0625, label: "1/16" },
  ]

  return (
    <div className="flex items-center gap-6 p-4 bg-gradient-to-r from-slate-800 to-slate-700">
      {/* Tool selection with modern styling */}
      <div className="flex items-center gap-2 p-1 bg-slate-900 rounded-lg border border-slate-600">
        <Button
          variant={selectedTool === "select" ? "default" : "ghost"}
          size="sm"
          onClick={() => onToolChange("select")}
          className={
            selectedTool === "select"
              ? "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 border-0 shadow-lg"
              : "text-slate-300 hover:text-white hover:bg-slate-700"
          }
        >
          <MousePointer className="w-4 h-4" />
        </Button>
        <Button
          variant={selectedTool === "pencil" ? "default" : "ghost"}
          size="sm"
          onClick={() => onToolChange("pencil")}
          className={
            selectedTool === "pencil"
              ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-0 shadow-lg"
              : "text-slate-300 hover:text-white hover:bg-slate-700"
          }
        >
          <Edit3 className="w-4 h-4" />
        </Button>
        <Button
          variant={selectedTool === "eraser" ? "default" : "ghost"}
          size="sm"
          onClick={() => onToolChange("eraser")}
          className={
            selectedTool === "eraser"
              ? "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 border-0 shadow-lg"
              : "text-slate-300 hover:text-white hover:bg-slate-700"
          }
        >
          <Eraser className="w-4 h-4" />
        </Button>
      </div>

      {/* Snap controls with modern styling */}
      <div className="flex items-center gap-3 px-3 py-2 bg-slate-900 rounded-lg border border-slate-600">
        <Button
          variant={gridSnap ? "default" : "ghost"}
          size="sm"
          onClick={() => onGridSnapChange(!gridSnap)}
          className={
            gridSnap
              ? "bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 border-0 shadow-lg"
              : "text-slate-300 hover:text-white hover:bg-slate-700"
          }
        >
          <Grid3X3 className="w-4 h-4 mr-2" />
          Snap
        </Button>
        <select
          value={snapValue}
          onChange={(e) => onSnapValueChange(Number(e.target.value))}
          className="px-3 py-1 text-sm bg-slate-800 border border-slate-600 rounded text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          disabled={!gridSnap}
        >
          {snapOptions.map((option) => (
            <option key={option.value} value={option.value} className="bg-slate-800">
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
