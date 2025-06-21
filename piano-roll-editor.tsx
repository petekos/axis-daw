"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { PianoKeyboard } from "./components/piano-keyboard"
import { NoteGrid } from "./components/note-grid"
import { TransportControls } from "./components/transport-controls"
import { Toolbar } from "./components/toolbar"
import { SynthesizerControls } from "./components/synthesizer-controls"
import { Synthesizer, type SynthParams } from "./utils/synthesizer"
import type { MidiNote, PianoRollState } from "./types/midi"

const defaultSynthParams: SynthParams = {
  waveform: "sawtooth",
  detune: 0,
  osc2Enabled: false,
  osc2Waveform: "square",
  osc2Detune: -7,
  osc2Level: 0.5,
  phaseModAmount: 0,
  // Noise
  noiseEnabled: false,
  noiseLevel: 0.2,
  noiseType: "white",
  // Fixed Pitch
  fixedPitchMode: false,
  fixedPitch: 440,
  // Pitch Envelope
  pitchEnvAttack: 0.01,
  pitchEnvDecay: 0.2,
  pitchEnvSustain: 0.0,
  pitchEnvRelease: 0.2,
  pitchEnvAmount: 0,
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

export default function PianoRollEditor() {
  const [state, setState] = useState<PianoRollState>({
    notes: [
      {
        id: "demo-1",
        pitch: 60, // Middle C
        start: 0,
        duration: 1,
        velocity: 100,
        selected: false,
      },
      {
        id: "demo-2",
        pitch: 64, // E
        start: 1,
        duration: 0.5,
        velocity: 80,
        selected: false,
      },
      {
        id: "demo-3",
        pitch: 67, // G
        start: 2,
        duration: 1.5,
        velocity: 120,
        selected: false,
      },
    ],
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

  const [scrollTop, setScrollTop] = useState(0)
  const [playingNotes, setPlayingNotes] = useState<Set<number>>(new Set())
  const [synthParams, setSynthParams] = useState<SynthParams>(defaultSynthParams)
  const [synthesizer, setSynthesizer] = useState<Synthesizer | null>(null)
  const animationRef = useRef<number>()
  const lastPlayingNotes = useRef<Set<number>>(new Set())

  const startNote = 36 // C2
  const endNote = 96 // C7
  const keyHeight = 20
  const pixelsPerBeat = 100

  // Initialize synthesizer only on client side
  useEffect(() => {
    if (typeof window !== "undefined") {
      const synth = new Synthesizer()
      synth.init()
      setSynthesizer(synth)
    }
  }, [])

  // Update synthesizer master volume and BPM when params change
  useEffect(() => {
    if (synthesizer) {
      synthesizer.setMasterVolume(synthParams.masterVolume)
      synthesizer.setBpm(state.bpm)
    }
  }, [synthesizer, synthParams.masterVolume, state.bpm])

  const handleNotesChange = useCallback((notes: MidiNote[]) => {
    setState((prev) => ({ ...prev, notes }))
  }, [])

  const handlePlay = useCallback(() => {
    setState((prev) => ({ ...prev, isPlaying: true }))
  }, [])

  const handlePause = useCallback(() => {
    setState((prev) => ({ ...prev, isPlaying: false }))
  }, [])

  const handleStop = useCallback(() => {
    setState((prev) => ({ ...prev, isPlaying: false, currentTime: prev.isLooping ? prev.loopStart : 0 }))
    setPlayingNotes(new Set())
    if (synthesizer) {
      synthesizer.stopAll()
    }
  }, [synthesizer])

  const handleLoopToggle = useCallback(() => {
    setState((prev) => ({ ...prev, isLooping: !prev.isLooping }))
  }, [])

  const handleLoopStartChange = useCallback((start: number) => {
    setState((prev) => ({ ...prev, loopStart: start }))
  }, [])

  const handleLoopEndChange = useCallback((end: number) => {
    setState((prev) => ({ ...prev, loopEnd: end }))
  }, [])

  const handleLoopRegionChange = useCallback((start: number, end: number) => {
    setState((prev) => ({ ...prev, loopStart: start, loopEnd: end }))
  }, [])

  const handleNoteClick = useCallback(
    (midiNote: number) => {
      if (!synthesizer) return

      // Preview note sound
      synthesizer.noteOn(midiNote, 100, synthParams)
      setPlayingNotes((prev) => new Set([...prev, midiNote]))
      setTimeout(() => {
        synthesizer.noteOff(midiNote)
        setPlayingNotes((prev) => {
          const newSet = new Set(prev)
          newSet.delete(midiNote)
          return newSet
        })
      }, 500)
    },
    [synthesizer, synthParams],
  )

  const handleTestNote = useCallback(() => {
    if (!synthesizer) return

    const testNote = 60 // Middle C
    synthesizer.noteOn(testNote, 100, synthParams)
    setTimeout(() => {
      synthesizer.noteOff(testNote)
    }, 1000)
  }, [synthesizer, synthParams])

  // Animation loop for playback with loop support
  useEffect(() => {
    if (state.isPlaying && synthesizer) {
      const animate = () => {
        setState((prev) => {
          let newTime = prev.currentTime + (1 / 60) * (prev.bpm / 60) // 60 FPS

          // Handle looping
          if (prev.isLooping && newTime >= prev.loopEnd) {
            newTime = prev.loopStart + (newTime - prev.loopEnd)
            // Stop all notes when looping back
            synthesizer.stopAll()
            lastPlayingNotes.current = new Set()
          }

          // Check which notes should be playing
          const currentlyPlaying = new Set<number>()
          const timeRange = prev.isLooping ? { start: prev.loopStart, end: prev.loopEnd } : null

          prev.notes.forEach((note) => {
            // If looping, only consider notes within the loop region
            if (timeRange) {
              const noteStart = Math.max(note.start, timeRange.start)
              const noteEnd = Math.min(note.start + note.duration, timeRange.end)
              if (noteStart < noteEnd && newTime >= noteStart && newTime < noteEnd) {
                currentlyPlaying.add(note.pitch)
              }
            } else {
              if (newTime >= note.start && newTime < note.start + note.duration) {
                currentlyPlaying.add(note.pitch)
              }
            }
          })

          // Handle note on/off events
          const lastPlaying = lastPlayingNotes.current

          // Start new notes
          currentlyPlaying.forEach((pitch) => {
            if (!lastPlaying.has(pitch)) {
              const note = prev.notes.find((n) => {
                if (timeRange) {
                  const noteStart = Math.max(n.start, timeRange.start)
                  const noteEnd = Math.min(n.start + n.duration, timeRange.end)
                  return n.pitch === pitch && noteStart < noteEnd && newTime >= noteStart && newTime < noteEnd
                } else {
                  return n.pitch === pitch && newTime >= n.start && newTime < n.start + n.duration
                }
              })
              if (note) {
                synthesizer.noteOn(pitch, note.velocity, synthParams)
              }
            }
          })

          // Stop ended notes
          lastPlaying.forEach((pitch) => {
            if (!currentlyPlaying.has(pitch)) {
              synthesizer.noteOff(pitch)
            }
          })

          lastPlayingNotes.current = currentlyPlaying
          setPlayingNotes(currentlyPlaying)

          return { ...prev, currentTime: newTime }
        })
        animationRef.current = requestAnimationFrame(animate)
      }
      animationRef.current = requestAnimationFrame(animate)
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      // Stop all notes when pausing
      if (synthesizer) {
        synthesizer.stopAll()
      }
      lastPlayingNotes.current = new Set()
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [state.isPlaying, state.bpm, state.isLooping, state.loopStart, state.loopEnd, synthesizer, synthParams])

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header with gradient and shadow */}
      <div className="flex-none bg-gradient-to-r from-slate-800 to-slate-700 border-b border-slate-600 shadow-lg">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">♪</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Piano Roll Studio</h1>
                <p className="text-slate-400 text-sm">Professional MIDI Editor</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-slate-700 rounded-full">
                <span className="text-slate-300 text-xs font-medium">v1.0</span>
              </div>
            </div>
          </div>
        </div>

        <TransportControls
          isPlaying={state.isPlaying}
          currentTime={state.currentTime}
          bpm={state.bpm}
          zoom={state.zoom}
          isLooping={state.isLooping}
          loopStart={state.loopStart}
          loopEnd={state.loopEnd}
          onPlay={handlePlay}
          onPause={handlePause}
          onStop={handleStop}
          onBpmChange={(bpm) => setState((prev) => ({ ...prev, bpm }))}
          onZoomChange={(zoom) => setState((prev) => ({ ...prev, zoom }))}
          onLoopToggle={handleLoopToggle}
          onLoopStartChange={handleLoopStartChange}
          onLoopEndChange={handleLoopEndChange}
        />
      </div>

      {/* Main content area with improved layout */}
      <div className="flex-1 flex overflow-hidden bg-slate-900">
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
            notes={state.notes}
            onNotesChange={handleNotesChange}
            startNote={startNote}
            endNote={endNote}
            keyHeight={keyHeight}
            pixelsPerBeat={pixelsPerBeat}
            gridSnap={state.gridSnap}
            snapValue={state.snapValue}
            selectedTool={state.selectedTool}
            currentTime={state.currentTime}
            zoom={state.zoom}
            onScroll={setScrollTop}
            isLooping={state.isLooping}
            loopStart={state.loopStart}
            loopEnd={state.loopEnd}
            onLoopRegionChange={handleLoopRegionChange}
          />
        </div>
      </div>

      {/* Bottom panel with modern styling */}
      <div className="flex-none border-t border-slate-600 bg-slate-800 shadow-lg">
        <Toolbar
          selectedTool={state.selectedTool}
          onToolChange={(tool) => setState((prev) => ({ ...prev, selectedTool: tool }))}
          gridSnap={state.gridSnap}
          onGridSnapChange={(snap) => setState((prev) => ({ ...prev, gridSnap: snap }))}
          snapValue={state.snapValue}
          onSnapValueChange={(value) => setState((prev) => ({ ...prev, snapValue: value }))}
        />
      </div>

      <div className="flex-none">
        <SynthesizerControls
          params={synthParams}
          onParamsChange={setSynthParams}
          onTestNote={handleTestNote}
          currentBpm={state.bpm}
        />
      </div>
    </div>
  )
}
