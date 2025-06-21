export const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

export function getMidiNoteName(midiNote: number): string {
  const octave = Math.floor(midiNote / 12) - 1
  const noteIndex = midiNote % 12
  return `${NOTES[noteIndex]}${octave}`
}

export function isBlackKey(midiNote: number): boolean {
  const noteIndex = midiNote % 12
  return [1, 3, 6, 8, 10].includes(noteIndex)
}

export function snapToGrid(position: number, gridSize: number): number {
  return Math.round(position / gridSize) * gridSize
}

export function timeToPixels(time: number, pixelsPerBeat: number, beatsPerMeasure = 4): number {
  return time * pixelsPerBeat
}

export function pixelsToTime(pixels: number, pixelsPerBeat: number, beatsPerMeasure = 4): number {
  return pixels / pixelsPerBeat
}
