"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Plus, Play, Pause, Square, Volume2, VolumeX, Headphones, Trash2, Copy, Music, Settings } from "lucide-react"
import type { Track, Clip, TrackViewState } from "../types/track"
import type { SynthParams } from "../utils/synthesizer"

interface TrackViewProps {
  state: TrackViewState
  onStateChange: (state: TrackViewState) => void
  onEditClip: (trackId: string, clipId: string) => void
  defaultSynthParams: SynthParams
}

const TRACK_COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#f97316", // orange
  "#84cc16", // lime
  "#ec4899", // pink
  "#6366f1", // indigo
]

export function TrackView({ state, onStateChange, onEditClip, defaultSynthParams }: TrackViewProps) {
  const [draggedClip, setDraggedClip] = useState<{ trackId: string; clipId: string } | null>(null)

  const updateState = useCallback(
    (updates: Partial<TrackViewState>) => {
      onStateChange({ ...state, ...updates })
    },
    [state, onStateChange],
  )

  const addTrack = useCallback(() => {
    const newTrack: Track = {
      id: `track-${Date.now()}`,
      name: `Track ${state.tracks.length + 1}`,
      color: TRACK_COLORS[state.tracks.length % TRACK_COLORS.length],
      volume: 0.8,
      pan: 0,
      muted: false,
      soloed: false,
      clips: [],
      synthParams: { ...defaultSynthParams },
      isSelected: false,
    }

    updateState({
      tracks: [...state.tracks, newTrack],
      selectedTrackId: newTrack.id,
    })
  }, [state.tracks, defaultSynthParams, updateState])

  const deleteTrack = useCallback(
    (trackId: string) => {
      const updatedTracks = state.tracks.filter((t) => t.id !== trackId)
      updateState({
        tracks: updatedTracks,
        selectedTrackId: updatedTracks.length > 0 ? updatedTracks[0].id : null,
      })
    },
    [state.tracks, updateState],
  )

  const updateTrack = useCallback(
    (trackId: string, updates: Partial<Track>) => {
      const updatedTracks = state.tracks.map((track) => (track.id === trackId ? { ...track, ...updates } : track))
      updateState({ tracks: updatedTracks })
    },
    [state.tracks, updateState],
  )

  const selectTrack = useCallback(
    (trackId: string) => {
      const updatedTracks = state.tracks.map((track) => ({
        ...track,
        isSelected: track.id === trackId,
      }))
      updateState({
        tracks: updatedTracks,
        selectedTrackId: trackId,
      })
    },
    [state.tracks, updateState],
  )

  const addClip = useCallback(
    (trackId: string, startTime: number) => {
      const newClip: Clip = {
        id: `clip-${Date.now()}`,
        name: "New Clip",
        startTime,
        duration: 4, // 4 beats
        notes: [],
        color: state.tracks.find((t) => t.id === trackId)?.color || "#3b82f6",
      }

      const updatedTracks = state.tracks.map((track) =>
        track.id === trackId ? { ...track, clips: [...track.clips, newClip] } : track,
      )

      updateState({
        tracks: updatedTracks,
        selectedClipId: newClip.id,
      })
    },
    [state.tracks, updateState],
  )

  const deleteClip = useCallback(
    (trackId: string, clipId: string) => {
      const updatedTracks = state.tracks.map((track) =>
        track.id === trackId ? { ...track, clips: track.clips.filter((c) => c.id !== clipId) } : track,
      )
      updateState({ tracks: updatedTracks })
    },
    [state.tracks, updateState],
  )

  const duplicateClip = useCallback(
    (trackId: string, clipId: string) => {
      const track = state.tracks.find((t) => t.id === trackId)
      const clip = track?.clips.find((c) => c.id === clipId)
      if (!clip) return

      const newClip: Clip = {
        ...clip,
        id: `clip-${Date.now()}`,
        name: `${clip.name} Copy`,
        startTime: clip.startTime + clip.duration,
      }

      const updatedTracks = state.tracks.map((t) => (t.id === trackId ? { ...t, clips: [...t.clips, newClip] } : t))

      updateState({ tracks: updatedTracks })
    },
    [state.tracks, updateState],
  )

  const handleClipDragStart = useCallback((trackId: string, clipId: string) => {
    setDraggedClip({ trackId, clipId })
  }, [])

  const handleClipDrop = useCallback(
    (targetTrackId: string, dropTime: number) => {
      if (!draggedClip) return

      const sourceTrack = state.tracks.find((t) => t.id === draggedClip.trackId)
      const clip = sourceTrack?.clips.find((c) => c.id === draggedClip.clipId)
      if (!clip) return

      // Remove from source track
      const updatedTracks = state.tracks.map((track) => {
        if (track.id === draggedClip.trackId) {
          return { ...track, clips: track.clips.filter((c) => c.id !== draggedClip.clipId) }
        }
        if (track.id === targetTrackId) {
          return {
            ...track,
            clips: [...track.clips, { ...clip, startTime: dropTime }],
          }
        }
        return track
      })

      updateState({ tracks: updatedTracks })
      setDraggedClip(null)
    },
    [draggedClip, state.tracks, updateState],
  )

  const pixelsPerBeat = 50
  const trackHeight = 80
  const timelineWidth = state.timelineLength * pixelsPerBeat

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Track List */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Track Headers */}
        <div className="flex-none w-64 bg-slate-800 border-r border-slate-600 overflow-y-auto ">
          <Button
          size= "icon"
          onClick={addTrack}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 border-0"
        >
          <Plus className="w-4 h-4 mr-2" />
        </Button>
          <div className="p-2 space-y-1 pt-0 pl-0 pr-0">
            {state.tracks.map((track) => (
              <div
                key={track.id}
                className={`p-3 border cursor-pointer transition-all h-50 px-0 py-0 h-[77px] rounded-none ${track.isSelected ? "border-blue-500 bg-slate-700" : "border-slate-600 bg-slate-800 hover:bg-slate-700"
                  }`}
                onClick={() => selectTrack(track.id)}
              >
                <div className="flex mb-0 justify-start items-start flex-row rounded-none">
                  <div className="w-3 px-0 mx-0 mr-1.5 rounded-none h-[75px]" style={{ backgroundColor: track.color }} />
                  <div className="flex flex-col">
                    <div className="flex flex-row items-stretch justify-start">
                      <Input
                        value={track.name}
                        onChange={(e) => updateTrack(track.id, { name: e.target.value })}
                        className="text-sm bg-transparent border-none p-0 text-slate-200 font-medium h-6"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEditClip(track.id, "")
                        }}
                        className="h-6 w-6 p-0 text-slate-400 hover:text-white"
                      >
                        <Settings className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteTrack(track.id)
                        }}
                        className="h-6 w-6 p-0 text-slate-400 hover:text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                      <Button
                        variant={track.muted ? "default" : "ghost"}
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          updateTrack(track.id, { muted: !track.muted })
                        }}
                        className={`h-6 text-xs px-1 ${track.muted ? "bg-red-600 hover:bg-red-700" : "text-slate-400 hover:text-white"
                          }`}
                      >
                        {track.muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                      </Button>
                      <Button
                        variant={track.soloed ? "default" : "ghost"}
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          updateTrack(track.id, { soloed: !track.soloed })
                        }}
                        className={`h-6 text-xs px-1 ${track.soloed ? "bg-yellow-600 hover:bg-yellow-700" : "text-slate-400 hover:text-white"
                          }`}
                      >
                        <Headphones className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="flex justify-start bg-transparent flex-row w-45 my-1.5 pr-1.5">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-slate-400 mx-0 mr-1.5">{Math.round(track.volume * 100)}%</span>
                      </div>
                      <Slider
                        value={[track.volume]}
                        onValueChange={(value) => updateTrack(track.id, { volume: value[0] })}
                        min={0}
                        max={1}
                        step={0.01}
                        className="h-2 my-1 opacity-100 opacity-50"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-auto bg-slate-900 py-0">
          <div className="relative" style={{ width: timelineWidth, minHeight: state.tracks.length * trackHeight }}>
            {/* Timeline ruler */}
            <div className="sticky top-0 z-10 h-8 bg-slate-800 border-b border-slate-600 flex items-center">
              {Array.from({ length: Math.ceil(state.timelineLength / 4) }, (_, i) => (
                <div key={i} className="absolute flex items-center" style={{ left: i * 4 * pixelsPerBeat }}>
                  <div className="w-px h-4 bg-slate-500" />
                  <span className="ml-1 text-xs text-slate-400">{i + 1}</span>
                </div>
              ))}
            </div>

            {/* Playhead */}
            <div
              className="absolute top-0 bottom-0 w-px bg-red-500 z-20 pointer-events-none"
              style={{ left: state.currentTime * pixelsPerBeat }}
            />

            {/* Track lanes */}
            {state.tracks.map((track, trackIndex) => (
              <div
                key={track.id}
                className="relative border-b border-slate-700"
                style={{ height: trackHeight }}
                onDoubleClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const clickX = e.clientX - rect.left
                  const time = Math.floor(clickX / pixelsPerBeat)
                  addClip(track.id, time)
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  const rect = e.currentTarget.getBoundingClientRect()
                  const dropX = e.clientX - rect.left
                  const dropTime = Math.floor(dropX / pixelsPerBeat)
                  handleClipDrop(track.id, dropTime)
                }}
                onDragOver={(e) => e.preventDefault()}
              >
                {/* Grid lines */}
                {Array.from({ length: Math.ceil(state.timelineLength) }, (_, i) => (
                  <div
                    key={i}
                    className="absolute top-0 bottom-0 w-px bg-slate-700 opacity-30"
                    style={{ left: i * pixelsPerBeat }}
                  />
                ))}

                {/* Clips */}
                {track.clips.map((clip) => (
                  <div
                    key={clip.id}
                    className="absolute top-2 bottom-2 rounded cursor-pointer shadow-lg border-2 border-opacity-50 hover:border-opacity-100 transition-all"
                    style={{
                      left: clip.startTime * pixelsPerBeat,
                      width: clip.duration * pixelsPerBeat,
                      backgroundColor: clip.color,
                      borderColor: clip.color,
                    }}
                    draggable
                    onDragStart={() => handleClipDragStart(track.id, clip.id)}
                    onClick={(e) => {
                      e.stopPropagation()
                      onEditClip(track.id, clip.id)
                    }}
                  >
                    <div className="p-2 h-full flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-white truncate">{clip.name}</span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              duplicateClip(track.id, clip.id)
                            }}
                            className="h-4 w-4 p-0 text-white hover:bg-white hover:bg-opacity-20"
                          >
                            <Copy className="w-2 h-2" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteClip(track.id, clip.id)
                            }}
                            className="h-4 w-4 p-0 text-white hover:bg-red-500"
                          >
                            <Trash2 className="w-2 h-2" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Music className="w-3 h-3 text-white opacity-60" />
                        <span className="text-xs text-white opacity-60">{clip.notes.length} notes</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
