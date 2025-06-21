import type { MidiNote } from "./midi"
import type { SynthParams } from "../utils/synthesizer"

export interface Clip {
  id: string
  name: string
  startTime: number
  duration: number
  notes: MidiNote[]
  color: string
}

export interface Track {
  id: string
  name: string
  color: string
  volume: number
  pan: number
  muted: boolean
  soloed: boolean
  clips: Clip[]
  synthParams: SynthParams
  isSelected: boolean
}

export interface TrackViewState {
  tracks: Track[]
  selectedTrackId: string | null
  selectedClipId: string | null
  isPlaying: boolean
  currentTime: number
  bpm: number
  zoom: number
  viewMode: "tracks" | "pianoroll"
  timelineLength: number
}
