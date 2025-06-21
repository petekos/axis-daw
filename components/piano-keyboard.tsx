"use client"

import { getMidiNoteName, isBlackKey } from "../utils/midi"

interface PianoKeyboardProps {
  startNote: number
  endNote: number
  keyHeight: number
  onNoteClick: (midiNote: number) => void
  playingNotes: Set<number>
  scrollTop?: number
}

export function PianoKeyboard({
  startNote,
  endNote,
  keyHeight,
  onNoteClick,
  playingNotes,
  scrollTop = 0,
}: PianoKeyboardProps) {
  const notes = []
  for (let i = endNote; i >= startNote; i--) {
    notes.push(i)
  }

  return (
    <div
      className="relative bg-gradient-to-r from-slate-800 to-slate-700 border-r border-slate-600 overflow-hidden shadow-lg"
      style={{ width: "120px", height: "400px" }}
    >
      <div
        className="relative"
        style={{
          transform: `translateY(-${scrollTop}px)`,
          height: `${(endNote - startNote + 1) * keyHeight}px`,
        }}
      >
        {notes.map((midiNote) => {
          const isBlack = isBlackKey(midiNote)
          const isPlaying = playingNotes.has(midiNote)

          return (
            <div
              key={midiNote}
              className={`
                absolute cursor-pointer border-b flex items-center justify-end pr-2 text-xs font-mono transition-all duration-150
                ${
                  isBlack
                    ? `bg-gradient-to-r from-slate-900 to-slate-800 text-slate-300 border-slate-700 z-10 hover:from-slate-800 hover:to-slate-700
                     ${isPlaying ? "from-blue-600 to-blue-700 text-white shadow-lg" : ""}`
                    : `bg-gradient-to-r from-slate-100 to-white text-slate-700 border-slate-300 hover:from-slate-50 hover:to-slate-100
                     ${isPlaying ? "from-blue-200 to-blue-300 text-blue-900 shadow-lg" : ""}`
                }
              `}
              style={{
                top: `${(endNote - midiNote) * keyHeight}px`,
                height: `${keyHeight}px`,
                width: isBlack ? "80px" : "120px",
                right: isBlack ? "40px" : "0px",
              }}
              onClick={() => onNoteClick(midiNote)}
            >
              {!isBlack && (
                <span className={`font-medium ${isPlaying ? "text-blue-900" : "text-slate-600"}`}>
                  {getMidiNoteName(midiNote)}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
