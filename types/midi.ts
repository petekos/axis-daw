export interface MidiNote {
  id: string
  pitch: number // MIDI note number (0-127)
  start: number // Start time in beats
  duration: number // Duration in beats
  velocity: number // Velocity (0-127)
  selected: boolean
}

export interface PianoRollState {
  notes: MidiNote[]
  isPlaying: boolean
  currentTime: number
  bpm: number
  zoom: number
  selectedTool: "select" | "pencil" | "eraser"
  gridSnap: boolean
  snapValue: number // Snap to 1/4, 1/8, 1/16 notes
  // Loop functionality
  isLooping: boolean
  loopStart: number
  loopEnd: number
}
