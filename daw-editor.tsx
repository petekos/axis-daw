"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { TrackView } from "./components/track-view"
import { PianoKeyboard } from "./components/piano-keyboard"
import { NoteGrid } from "./components/note-grid"
import { Toolbar } from "./components/toolbar"
import { TransportControls } from "./components/transport-controls"
import { SynthesizerControls } from "./components/synthesizer-controls"
import { Synthesizer, type SynthParams } from "./utils/synthesizer"
import type { MidiNote, PianoRollState } from "./types/midi"
import type { TrackViewState } from "./types/track"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save, FolderOpen } from "lucide-react"

const defaultSynthParams: SynthParams = {
  waveform: "sawtooth",
  detune: 0,
  osc2Enabled: false,
  osc2Waveform: "square",
  osc2Detune: -7,
  osc2Level: 0.5,
  phaseModAmount: 0,
  attackTime: 0.01,
  decayTime: 0.3,
  sustainLevel: 0.7,
  releaseTime: 0.5,
  filterType: "lowpass",
  filterFrequency: 2000,
  filterResonance: 1,
  filterAttackTime: 0.01,
  filterDecayTime: 0.3,
  filterSustainLevel: 0.5,
  filterReleaseTime: 0.8,
  filterEnvelopeAmount: 1.5,
  lfoEnabled: false,
  lfoWaveform: "sine",
  lfoRate: 2,
  lfoBpmSync: false,
  lfoBpmDivision: "1/4",
  lfoToPitch: 0,
  lfoToFilter: 0,
  lfoToVolume: 0,
  lfoToPhaserRate: 0,
  lfoToDelayTime: 0,
  distortionEnabled: false,
  distortionAmount: 20,
  distortionGain: 0.5,
  delayEnabled: false,
  delayTime: 0.25,
  delayBpmSync: false,
  delayBpmDivision: "1/4",
  delayFeedback: 0.3,
  delayWetLevel: 0.3,
  phaserEnabled: false,
  phaserRate: 0.5,
  phaserDepth: 1000,
  phaserFeedback: 5,
  masterVolume: 0.3,
}

export default function DAWEditor() {
  const [trackViewState, setTrackViewState] = useState<TrackViewState>({
    tracks: [
      {
        id: "track-1",
        name: "Track 1",
        color: "#3b82f6",
        volume: 0.8,
        pan: 0,
        muted: false,
        soloed: false,
        clips: [
          {
            id: "clip-1",
            name: "Demo Clip",
            startTime: 0,
            duration: 8,
            color: "#3b82f6",
            notes: [
              {
                id: "demo-1",
                pitch: 60,
                start: 0,
                duration: 1,
                velocity: 100,
                selected: false,
              },
              {
                id: "demo-2",
                pitch: 64,
                start: 1,
                duration: 0.5,
                velocity: 80,
                selected: false,
              },
              {
                id: "demo-3",
                pitch: 67,
                start: 2,
                duration: 1.5,
                velocity: 120,
                selected: false,
              },
            ],
          },
        ],
        synthParams: { ...defaultSynthParams },
        isSelected: true,
      },
    ],
    selectedTrackId: "track-1",
    selectedClipId: null,
    isPlaying: false,
    currentTime: 0,
    bpm: 120,
    zoom: 1,
    viewMode: "tracks",
    timelineLength: 128,
  })

  const [pianoRollState, setPianoRollState] = useState<PianoRollState>({
    notes: [],
    isPlaying: false,
    currentTime: 0,
    bpm: 120,
    zoom: 1,
    selectedTool: "pencil",
    gridSnap: true,
    snapValue: 0.25,
    isLooping: false,
    loopStart: 0,
    loopEnd: 4,
  })

  const [currentEditingClip, setCurrentEditingClip] = useState<{
    trackId: string
    clipId: string
  } | null>(null)

  const [scrollTop, setScrollTop] = useState(0)
  const [playingNotes, setPlayingNotes] = useState<Set<number>>(new Set())
  const [synthesizers, setSynthesizers] = useState<Map<string, Synthesizer>>(new Map())
  const animationRef = useRef<number | undefined>(undefined)
  const lastPlayingNotes = useRef<Map<string, Set<number>>>(new Map())
  const pianoRollContainerRef = useRef<HTMLDivElement>(null)

  const startNote = 36
  const endNote = 96
  const keyHeight = 20
  const pixelsPerBeat = 100

  // Initialize synthesizers for each track
  useEffect(() => {
    if (typeof window !== "undefined") {
      const newSynthesizers = new Map<string, Synthesizer>()

      trackViewState.tracks.forEach((track) => {
        if (!synthesizers.has(track.id)) {
          const synth = new Synthesizer()
          synth.init()
          synth.setMasterVolume(track.synthParams.masterVolume * track.volume)
          synth.setBpm(trackViewState.bpm)
          newSynthesizers.set(track.id, synth)
        } else {
          newSynthesizers.set(track.id, synthesizers.get(track.id)!)
        }
      })

      setSynthesizers(newSynthesizers)
    }
  }, [trackViewState.tracks])

  // Update synthesizer parameters when track params change
  useEffect(() => {
    trackViewState.tracks.forEach((track) => {
      const synth = synthesizers.get(track.id)
      if (synth) {
        synth.setMasterVolume(track.synthParams.masterVolume * track.volume)
        synth.setBpm(trackViewState.bpm)
      }
    })
  }, [trackViewState.tracks, trackViewState.bpm, synthesizers])

  // Center piano roll on notes when opening a clip
  const centerPianoRollOnNotes = useCallback(
    (notes: MidiNote[]) => {
      if (notes.length === 0) return

      // Find the pitch range of the notes
      const pitches = notes.map((note) => note.pitch)
      const minPitch = Math.min(...pitches)
      const maxPitch = Math.max(...pitches)
      const centerPitch = (minPitch + maxPitch) / 2

      // Calculate scroll position to center on the notes
      const containerHeight = 400 // Height of the piano roll container
      const totalHeight = (endNote - startNote + 1) * keyHeight
      const centerY = (endNote - centerPitch) * keyHeight
      const scrollPosition = Math.max(0, centerY - containerHeight / 2)

      // Set scroll position after a brief delay to ensure the component is rendered
      setTimeout(() => {
        setScrollTop(scrollPosition)
      }, 100)
    },
    [endNote, startNote, keyHeight],
  )

  const handleEditClip = useCallback(
    (trackId: string, clipId: string) => {
      const track = trackViewState.tracks.find((t) => t.id === trackId)
      if (!track) return

      if (clipId) {
        const clip = track.clips.find((c) => c.id === clipId)
        if (clip) {
          setPianoRollState((prev) => ({
            ...prev,
            notes: clip.notes,
            bpm: trackViewState.bpm,
            zoom: trackViewState.zoom,
            isPlaying: trackViewState.isPlaying,
            currentTime: trackViewState.currentTime,
          }))
          setCurrentEditingClip({ trackId, clipId })
          setTrackViewState((prev) => ({ ...prev, viewMode: "pianoroll" }))

          // Center the piano roll on the notes
          centerPianoRollOnNotes(clip.notes)
        }
      } else {
        // Edit track synthesizer
        setCurrentEditingClip({ trackId, clipId: "" })
        setTrackViewState((prev) => ({ ...prev, viewMode: "pianoroll" }))
      }
    },
    [
      trackViewState.tracks,
      trackViewState.bpm,
      trackViewState.zoom,
      trackViewState.isPlaying,
      trackViewState.currentTime,
      centerPianoRollOnNotes,
    ],
  )

  const handleBackToTracks = useCallback(() => {
    // Save current piano roll state back to clip
    if (currentEditingClip?.clipId) {
      const updatedTracks = trackViewState.tracks.map((track) => {
        if (track.id === currentEditingClip.trackId) {
          return {
            ...track,
            clips: track.clips.map((clip) =>
              clip.id === currentEditingClip.clipId ? { ...clip, notes: pianoRollState.notes } : clip,
            ),
          }
        }
        return track
      })

      setTrackViewState((prev) => ({
        ...prev,
        tracks: updatedTracks,
        viewMode: "tracks",
      }))
    } else {
      setTrackViewState((prev) => ({ ...prev, viewMode: "tracks" }))
    }

    setCurrentEditingClip(null)
  }, [currentEditingClip, trackViewState.tracks, pianoRollState.notes])

  const handleNotesChange = useCallback((notes: MidiNote[]) => {
    setPianoRollState((prev) => ({ ...prev, notes }))
  }, [])

  const handleSynthParamsChange = useCallback(
    (params: SynthParams) => {
      if (!currentEditingClip) return

      const updatedTracks = trackViewState.tracks.map((track) =>
        track.id === currentEditingClip.trackId ? { ...track, synthParams: params } : track,
      )

      setTrackViewState((prev) => ({ ...prev, tracks: updatedTracks }))
    },
    [currentEditingClip, trackViewState.tracks],
  )

  const handleNoteClick = useCallback(
    (midiNote: number) => {
      if (!currentEditingClip) return

      const track = trackViewState.tracks.find((t) => t.id === currentEditingClip.trackId)
      const synth = synthesizers.get(currentEditingClip.trackId)
      if (!track || !synth) return

      synth.noteOn(midiNote, 100, track.synthParams)
      setPlayingNotes((prev) => new Set([...prev, midiNote]))
      setTimeout(() => {
        synth.noteOff(midiNote)
        setPlayingNotes((prev) => {
          const newSet = new Set(prev)
          newSet.delete(midiNote)
          return newSet
        })
      }, 500)
    },
    [currentEditingClip, trackViewState.tracks, synthesizers],
  )

  const handleTestNote = useCallback(() => {
    if (!currentEditingClip) return

    const track = trackViewState.tracks.find((t) => t.id === currentEditingClip.trackId)
    const synth = synthesizers.get(currentEditingClip.trackId)
    if (!track || !synth) return

    const testNote = 60
    synth.noteOn(testNote, 100, track.synthParams)
    setTimeout(() => {
      synth.noteOff(testNote)
    }, 1000)
  }, [currentEditingClip, trackViewState.tracks, synthesizers])

  // Playback animation - sync both track view and piano roll
  useEffect(() => {
    if (trackViewState.isPlaying) {
      const animate = () => {
        const newTime = trackViewState.currentTime + (1 / 60) * (trackViewState.bpm / 60)

        // Update both states
        setTrackViewState((prev) => ({ ...prev, currentTime: newTime }))
        setPianoRollState((prev) => ({ ...prev, currentTime: newTime, isPlaying: trackViewState.isPlaying }))

        // Handle note playback for all tracks
        const currentlyPlayingByTrack = new Map<string, Set<number>>()

        trackViewState.tracks.forEach((track) => {
          if (track.muted) return

          const currentlyPlaying = new Set<number>()

          track.clips.forEach((clip) => {
            const clipStartTime = clip.startTime
            const clipEndTime = clip.startTime + clip.duration

            if (newTime >= clipStartTime && newTime < clipEndTime) {
              const relativeTime = newTime - clipStartTime

              clip.notes.forEach((note) => {
                if (relativeTime >= note.start && relativeTime < note.start + note.duration) {
                  currentlyPlaying.add(note.pitch)
                }
              })
            }
          })

          currentlyPlayingByTrack.set(track.id, currentlyPlaying)

          // Handle note on/off events
          const synth = synthesizers.get(track.id)
          if (synth) {
            const lastPlaying = lastPlayingNotes.current.get(track.id) || new Set()

            // Start new notes
            currentlyPlaying.forEach((pitch) => {
              if (!lastPlaying.has(pitch)) {
                synth.noteOn(pitch, 100, track.synthParams)
              }
            })

            // Stop ended notes
            lastPlaying.forEach((pitch) => {
              if (!currentlyPlaying.has(pitch)) {
                synth.noteOff(pitch)
              }
            })
          }
        })

        lastPlayingNotes.current = currentlyPlayingByTrack

        animationRef.current = requestAnimationFrame(animate)
      }
      animationRef.current = requestAnimationFrame(animate)
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      // Stop all notes when pausing
      synthesizers.forEach((synth) => synth.stopAll())
      lastPlayingNotes.current.clear()
      // Sync piano roll state
      setPianoRollState((prev) => ({ ...prev, isPlaying: false }))
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [trackViewState.isPlaying, trackViewState.bpm, trackViewState.currentTime, synthesizers, trackViewState.tracks])

  const currentTrack = currentEditingClip
    ? trackViewState.tracks.find((t) => t.id === currentEditingClip.trackId)
    : null

  // Check if we're editing synthesizer (no clipId) vs editing a clip
  const isEditingSynthesizer = currentEditingClip && !currentEditingClip.clipId
  const isEditingClip = currentEditingClip && currentEditingClip.clipId

  if (trackViewState.viewMode === "tracks") {
    return (
      <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Header */}
        <div className="flex-none bg-gradient-to-r from-slate-800 to-slate-700 border-b border-slate-600 shadow-lg">
          <div className="px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">♪</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">AXIS</h1>
                </div>
              </div>

            <TransportControls
              isPlaying={trackViewState.isPlaying}
              currentTime={trackViewState.currentTime}
              bpm={trackViewState.bpm}
              isLooping={pianoRollState.isLooping}
              loopStart={pianoRollState.loopStart}
              loopEnd={pianoRollState.loopEnd}
              zoom={trackViewState.zoom}
              onPlay={() =>
                setTrackViewState((prev) => ({ ...prev, isPlaying: true }))
              }
              onPause={() =>
                setTrackViewState((prev) => ({ ...prev, isPlaying: false }))
              }
              onStop={() =>
                setTrackViewState((prev) => ({ ...prev, isPlaying: false, currentTime: 0 }))
              }
              onBpmChange={(bpm: number) =>
                setTrackViewState((prev) => ({ ...prev, bpm }))
              }
              onZoomChange={(zoom: number) =>
                setTrackViewState((prev) => ({ ...prev, zoom }))
              }
              onLoopToggle={() =>
                setPianoRollState((prev) => ({ ...prev, isLooping: !prev.isLooping }))
              }
              onLoopStartChange={(start: number) =>
                setPianoRollState((prev) => ({ ...prev, loopStart: start }))
              }
              onLoopEndChange={(end: number) =>
                setPianoRollState((prev) => ({ ...prev, loopEnd: end }))
              }
            />
              <div className="flex items-center gap-2">
                <Button variant="outline" className="bg-slate-700 border-slate-600 hover:bg-slate-600 text-slate-200">
                  <FolderOpen className="w-4 h-4 mr-2" />
                </Button>
                <Button variant="outline" className="bg-slate-700 border-slate-600 hover:bg-slate-600 text-slate-200">
                  <Save className="w-4 h-4 mr-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <TrackView
          state={trackViewState}
          onStateChange={setTrackViewState}
          onEditClip={handleEditClip}
          defaultSynthParams={defaultSynthParams}
        />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="flex-none bg-gradient-to-r from-slate-800 to-slate-700 border-b border-slate-600 shadow-lg">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                onClick={handleBackToTracks}
                variant="outline"
                className="bg-slate-700 border-slate-600 hover:bg-slate-600 text-slate-200"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />

              </Button>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">♪</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  {currentTrack?.name} - {isEditingClip ? "Piano Roll" : "Synthesizer"}
                </h1>
                <p className="text-slate-400 text-sm">{isEditingClip ? "Edit MIDI Notes" : "Configure Synthesizer"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content - only show piano roll and toolbar when editing a clip */}
      {isEditingClip && (
          <div className="flex-1 flex overflow-hidden bg-slate-900" ref={pianoRollContainerRef}>
            <div className="flex-none border-r border-slate-700 shadow-lg">
              <PianoKeyboard
                startNote={startNote}
                endNote={endNote}
                keyHeight={keyHeight}
                onNoteClick={handleNoteClick}
                playingNotes={playingNotes}
                scrollTop={scrollTop}
              />
            </div>

            <div className="flex-1 bg-slate-800">
              <NoteGrid
                notes={pianoRollState.notes}
                onNotesChange={handleNotesChange}
                startNote={startNote}
                endNote={endNote}
                keyHeight={keyHeight}
                pixelsPerBeat={pixelsPerBeat}
                gridSnap={pianoRollState.gridSnap}
                snapValue={pianoRollState.snapValue}
                selectedTool={pianoRollState.selectedTool}
                currentTime={pianoRollState.currentTime}
                zoom={pianoRollState.zoom}
                onScroll={setScrollTop}
                isLooping={pianoRollState.isLooping}
                loopStart={pianoRollState.loopStart}
                loopEnd={pianoRollState.loopEnd}
                onLoopRegionChange={(start, end) =>
                  setPianoRollState((prev) => ({ ...prev, loopStart: start, loopEnd: end }))
                }
              />
            </div>
            <div className="flex border-t border-slate-600 bg-slate-800 shadow-lg">
              <Toolbar
                selectedTool={pianoRollState.selectedTool}
                onToolChange={(tool) => setPianoRollState((prev) => ({ ...prev, selectedTool: tool }))}
                gridSnap={pianoRollState.gridSnap}
                onGridSnapChange={(snap) => setPianoRollState((prev) => ({ ...prev, gridSnap: snap }))}
                snapValue={pianoRollState.snapValue}
                onSnapValueChange={(value) => setPianoRollState((prev) => ({ ...prev, snapValue: value }))}
              />
            </div>
          </div>

          
      )}

      {/* When editing synthesizer, show a placeholder */}
      {isEditingSynthesizer && (
        <div className="flex-1 bg-slate-900 flex items-center justify-center">
          <div className="text-center text-slate-400">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">🎛️</span>
            </div>
            <h3 className="text-lg font-medium text-slate-300 mb-2">Synthesizer Configuration</h3>
            <p className="text-sm">Configure the synthesizer parameters below</p>
          </div>
        </div>
      )}

      {/* Always show synthesizer controls when in detail view */}
      {currentTrack && (
        <div className="flex-none">
          <SynthesizerControls
            params={currentTrack.synthParams}
            onParamsChange={handleSynthParamsChange}
            onTestNote={handleTestNote}
            currentBpm={trackViewState.bpm}
            isMinimized={!!isEditingClip} // Minimize when editing clip, expand when editing synthesizer
          />
        </div>
      )}
    </div>
  )
}
