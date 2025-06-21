"use client"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, Square, SkipBack, Repeat, Clock, Zap } from "lucide-react"

interface TransportControlsProps {
  isPlaying: boolean
  currentTime: number
  bpm: number
  zoom: number
  isLooping: boolean
  loopStart: number
  loopEnd: number
  onPlay: () => void
  onPause: () => void
  onStop: () => void
  onBpmChange: (bpm: number) => void
  onZoomChange: (zoom: number) => void
  onLoopToggle: () => void
  onLoopStartChange: (start: number) => void
  onLoopEndChange: (end: number) => void
}

export function TransportControls({
  isPlaying,
  currentTime,
  bpm,
  zoom,
  isLooping,
  loopStart,
  loopEnd,
  onPlay,
  onPause,
  onStop,
  onBpmChange,
  onZoomChange,
  onLoopToggle,
  onLoopStartChange,
  onLoopEndChange,
}: TransportControlsProps) {
  return (
    <div className="flex items-center gap-6 px-6 py-4 bg-gradient-to-r from-slate-800 to-slate-700">
      {/* Transport buttons with modern styling */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onStop}
          className="bg-slate-700 border-slate-600 hover:bg-slate-600 text-slate-200 hover:text-white transition-all duration-200"
        >
          <SkipBack className="w-4 h-4" />
        </Button>
        <Button
          variant={isPlaying ? "default" : "outline"}
          size="sm"
          onClick={isPlaying ? onPause : onPlay}
          className={
            isPlaying
              ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-0 shadow-lg"
              : "bg-slate-700 border-slate-600 hover:bg-slate-600 text-slate-200 hover:text-white"
          }
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onStop}
          className="bg-slate-700 border-slate-600 hover:bg-slate-600 text-slate-200 hover:text-white transition-all duration-200"
        >
          <Square className="w-4 h-4" />
        </Button>
      </div>

      {/* Time display with modern styling */}
      <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 rounded-lg border border-slate-600">
        <Clock className="w-4 h-4 text-slate-400" />
        <span className="text-slate-200 font-mono text-sm font-medium">
          {Math.floor(currentTime / 4)}:{Math.floor(currentTime % 4) + 1}
        </span>
      </div>

      {/* Loop controls with enhanced styling */}
      <div className="flex items-center gap-3">
        <Button
          variant={isLooping ? "default" : "outline"}
          size="sm"
          onClick={onLoopToggle}
          className={
            isLooping
              ? "bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 border-0 shadow-lg"
              : "bg-slate-700 border-slate-600 hover:bg-slate-600 text-slate-200 hover:text-white"
          }
        >
          <Repeat className="w-4 h-4" />
        </Button>

        {isLooping && (
          <div className="flex items-center gap-3 px-3 py-2 bg-slate-900 rounded-lg border border-slate-600">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 font-medium">Start:</label>
              <input
                type="number"
                value={loopStart.toFixed(2)}
                onChange={(e) => {
                  const value = Number.parseFloat(e.target.value)
                  if (!isNaN(value) && value >= 0 && value < loopEnd) {
                    onLoopStartChange(value)
                  }
                }}
                className="w-16 px-2 py-1 text-xs bg-slate-800 border border-slate-600 rounded text-slate-200 text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                step="0.25"
                min="0"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 font-medium">End:</label>
              <input
                type="number"
                value={loopEnd.toFixed(2)}
                onChange={(e) => {
                  const value = Number.parseFloat(e.target.value)
                  if (!isNaN(value) && value > loopStart) {
                    onLoopEndChange(value)
                  }
                }}
                className="w-16 px-2 py-1 text-xs bg-slate-800 border border-slate-600 rounded text-slate-200 text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                step="0.25"
                min={loopStart + 0.25}
              />
            </div>
          </div>
        )}
      </div>

      {/* BPM control with modern styling */}
      <div className="flex items-center gap-3 px-3 py-2 bg-slate-900 rounded-lg border border-slate-600">
        <Zap className="w-4 h-4 text-slate-400" />
        <label className="text-sm text-slate-400 font-medium">BPM:</label>
        <input
          type="number"
          value={bpm}
          onChange={(e) => {
            const value = Number.parseInt(e.target.value)
            if (!isNaN(value) && value >= 60 && value <= 200) {
              onBpmChange(value)
            }
          }}
          onBlur={(e) => {
            const value = Number.parseInt(e.target.value)
            if (isNaN(value) || value < 60) {
              onBpmChange(60)
            } else if (value > 200) {
              onBpmChange(200)
            }
          }}
          className="w-16 px-2 py-1 text-sm bg-slate-800 border border-slate-600 rounded text-slate-200 text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          min="60"
          max="200"
        />
      </div>

      {/* Zoom control with modern styling */}
      <div className="flex items-center gap-3 px-3 py-2 bg-slate-900 rounded-lg border border-slate-600">
        <label className="text-sm text-slate-400 font-medium">Zoom:</label>
        <div className="w-24">
          <Slider
            value={[zoom]}
            onValueChange={(value) => onZoomChange(value[0])}
            min={0.5}
            max={3}
            step={0.1}
            className="[&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-blue-500 [&_[role=slider]]:to-purple-600 [&_[role=slider]]:border-0"
          />
        </div>
        <span className="text-sm text-slate-300 font-mono w-8">{zoom.toFixed(1)}x</span>
      </div>
    </div>
  )
}
