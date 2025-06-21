"use client"

import type React from "react"

import { useRef, useEffect, useState, useCallback } from "react"
import type { MidiNote } from "../types/midi"
import { snapToGrid, timeToPixels, pixelsToTime } from "../utils/midi"

interface NoteGridProps {
  notes: MidiNote[]
  onNotesChange: (notes: MidiNote[]) => void
  startNote: number
  endNote: number
  keyHeight: number
  pixelsPerBeat: number
  gridSnap: boolean
  snapValue: number
  selectedTool: "select" | "pencil" | "eraser"
  currentTime: number
  zoom: number
  onScroll?: (scrollTop: number) => void
  // Add loop props
  isLooping: boolean
  loopStart: number
  loopEnd: number
  onLoopRegionChange?: (start: number, end: number) => void
}

interface ResizeState {
  isResizing: boolean
  noteId: string | null
  startX: number
  originalDuration: number
}

interface SelectionBox {
  isSelecting: boolean
  startX: number
  startY: number
  currentX: number
  currentY: number
}

interface DragState {
  isDragging: boolean
  startX: number
  startY: number
  originalNotes: Map<string, { start: number; pitch: number }>
}

export function NoteGrid({
  notes,
  onNotesChange,
  startNote,
  endNote,
  keyHeight,
  pixelsPerBeat,
  gridSnap,
  snapValue,
  selectedTool,
  currentTime,
  zoom,
  onScroll,
  isLooping,
  loopStart,
  loopEnd,
  onLoopRegionChange,
}: NoteGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set())
  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    noteId: null,
    startX: 0,
    originalDuration: 0,
  })
  const [selectionBox, setSelectionBox] = useState<SelectionBox>({
    isSelecting: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  })
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    originalNotes: new Map(),
  })
  const [cursorStyle, setCursorStyle] = useState("cursor-crosshair")

  const gridWidth = 2000 * zoom
  const gridHeight = (endNote - startNote + 1) * keyHeight

  // Handle keyboard events for deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedNotes.size > 0) {
          const updatedNotes = notes.filter((note) => !selectedNotes.has(note.id))
          onNotesChange(updatedNotes)
          setSelectedNotes(new Set())
        }
      }
      if (e.key === "Escape") {
        setSelectedNotes(new Set())
      }
    }

    // Make sure the container can receive focus
    const container = containerRef.current
    if (container) {
      container.setAttribute("tabindex", "0")
      container.addEventListener("keydown", handleKeyDown)

      return () => {
        container.removeEventListener("keydown", handleKeyDown)
      }
    }
  }, [selectedNotes, notes, onNotesChange])

  const drawGrid = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      ctx.clearRect(0, 0, gridWidth, gridHeight)

      // Draw loop region background
      if (isLooping) {
        const loopStartX = timeToPixels(loopStart, pixelsPerBeat) * zoom
        const loopEndX = timeToPixels(loopEnd, pixelsPerBeat) * zoom
        const loopWidth = loopEndX - loopStartX

        ctx.fillStyle = "rgba(34, 197, 94, 0.1)"
        ctx.fillRect(loopStartX, 0, loopWidth, gridHeight)

        // Loop region borders
        ctx.strokeStyle = "#22c55e"
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(loopStartX, 0)
        ctx.lineTo(loopStartX, gridHeight)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(loopEndX, 0)
        ctx.lineTo(loopEndX, gridHeight)
        ctx.stroke()
      }

      // Draw horizontal lines (for each note)
      ctx.strokeStyle = "#e5e7eb"
      ctx.lineWidth = 1
      for (let i = 0; i <= endNote - startNote; i++) {
        const y = i * keyHeight
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(gridWidth, y)
        ctx.stroke()
      }

      // Draw vertical lines (for beats)
      const beatWidth = pixelsPerBeat * zoom
      for (let i = 0; i * beatWidth < gridWidth; i++) {
        const x = i * beatWidth
        ctx.strokeStyle = i % 4 === 0 ? "#9ca3af" : "#e5e7eb"
        ctx.lineWidth = i % 4 === 0 ? 2 : 1
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, gridHeight)
        ctx.stroke()
      }

      // Draw playhead
      const playheadX = timeToPixels(currentTime, pixelsPerBeat) * zoom
      ctx.strokeStyle = "#ef4444"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(playheadX, 0)
      ctx.lineTo(playheadX, gridHeight)
      ctx.stroke()

      // Draw notes
      notes.forEach((note) => {
        const x = timeToPixels(note.start, pixelsPerBeat) * zoom
        const y = (endNote - note.pitch) * keyHeight
        const width = timeToPixels(note.duration, pixelsPerBeat) * zoom
        const height = keyHeight - 2

        // Note body
        ctx.fillStyle = selectedNotes.has(note.id) ? "#3b82f6" : "#8b5cf6"
        ctx.fillRect(x, y + 1, width, height)

        // Note border
        ctx.strokeStyle = selectedNotes.has(note.id) ? "#1d4ed8" : "#6d28d9"
        ctx.lineWidth = selectedNotes.has(note.id) ? 2 : 1
        ctx.strokeRect(x, y + 1, width, height)

        // Velocity indicator (left edge)
        const velocityHeight = (note.velocity / 127) * height
        ctx.fillStyle = "#fbbf24"
        ctx.fillRect(x, y + 1 + (height - velocityHeight), 3, velocityHeight)

        // Resize handle (right edge)
        if (width > 10) {
          ctx.fillStyle = selectedNotes.has(note.id) ? "#1e40af" : "#4c1d95"
          ctx.fillRect(x + width - 4, y + 1, 4, height)
        }
      })

      // Draw selection box
      if (selectionBox.isSelecting) {
        const startX = Math.min(selectionBox.startX, selectionBox.currentX) * zoom
        const startY = Math.min(selectionBox.startY, selectionBox.currentY)
        const width = Math.abs(selectionBox.currentX - selectionBox.startX) * zoom
        const height = Math.abs(selectionBox.currentY - selectionBox.startY)

        ctx.strokeStyle = "#3b82f6"
        ctx.fillStyle = "rgba(59, 130, 246, 0.1)"
        ctx.lineWidth = 1
        ctx.fillRect(startX, startY, width, height)
        ctx.strokeRect(startX, startY, width, height)
      }
    },
    [
      notes,
      gridWidth,
      gridHeight,
      keyHeight,
      pixelsPerBeat,
      zoom,
      currentTime,
      endNote,
      selectedNotes,
      selectionBox,
      isLooping,
      loopStart,
      loopEnd,
    ],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    drawGrid(ctx)
  }, [drawGrid])

  const getNoteAtPosition = useCallback(
    (x: number, y: number) => {
      return notes.find((note) => {
        const noteX = timeToPixels(note.start, pixelsPerBeat) * zoom
        const noteY = (endNote - note.pitch) * keyHeight
        const noteWidth = timeToPixels(note.duration, pixelsPerBeat) * zoom

        return x >= noteX && x <= noteX + noteWidth && y >= noteY && y <= noteY + keyHeight
      })
    },
    [notes, pixelsPerBeat, zoom, endNote, keyHeight],
  )

  const getNotesInSelection = useCallback(
    (startX: number, startY: number, endX: number, endY: number) => {
      const minX = Math.min(startX, endX)
      const maxX = Math.max(startX, endX)
      const minY = Math.min(startY, endY)
      const maxY = Math.max(startY, endY)

      return notes.filter((note) => {
        const noteX = timeToPixels(note.start, pixelsPerBeat) * zoom
        const noteY = (endNote - note.pitch) * keyHeight
        const noteWidth = timeToPixels(note.duration, pixelsPerBeat) * zoom

        return noteX >= minX && noteX + noteWidth <= maxX && noteY >= minY && noteY + keyHeight <= maxY
      })
    },
    [notes, pixelsPerBeat, zoom, endNote, keyHeight],
  )

  const isNearRightEdge = useCallback(
    (x: number, y: number, note: MidiNote) => {
      const noteX = timeToPixels(note.start, pixelsPerBeat) * zoom
      const noteWidth = timeToPixels(note.duration, pixelsPerBeat) * zoom
      const noteY = (endNote - note.pitch) * keyHeight

      const rightEdge = noteX + noteWidth
      return x >= rightEdge - 8 && x <= rightEdge + 4 && y >= noteY && y <= noteY + keyHeight && noteWidth > 10
    },
    [pixelsPerBeat, zoom, endNote, keyHeight],
  )

  const checkNoteCollision = useCallback(
    (newNote: { pitch: number; start: number; duration: number }, excludeIds: Set<string> = new Set()) => {
      return notes.some((existingNote) => {
        // Skip notes that are being moved
        if (excludeIds.has(existingNote.id)) return false

        // Check if notes are on the same pitch
        if (existingNote.pitch !== newNote.pitch) return false

        // Check if time ranges overlap
        const newEnd = newNote.start + newNote.duration
        const existingEnd = existingNote.start + existingNote.duration

        return newNote.start < existingEnd && newEnd > existingNote.start
      })
    },
    [notes],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (resizeState.isResizing || dragState.isDragging) return

      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const x = (e.clientX - rect.left) / zoom
      const y = e.clientY - rect.top

      // Update selection box if selecting
      if (selectionBox.isSelecting) {
        setSelectionBox((prev) => ({
          ...prev,
          currentX: x,
          currentY: y,
        }))
        return
      }

      const noteAtPosition = getNoteAtPosition(x, y)

      if (selectedTool === "select" && noteAtPosition && isNearRightEdge(x, y, noteAtPosition)) {
        setCursorStyle("cursor-ew-resize")
      } else if (selectedTool === "select" && noteAtPosition && selectedNotes.has(noteAtPosition.id)) {
        setCursorStyle("cursor-move")
      } else if (selectedTool === "select") {
        setCursorStyle("cursor-pointer")
      } else {
        setCursorStyle("cursor-crosshair")
      }
    },
    [
      getNoteAtPosition,
      isNearRightEdge,
      resizeState.isResizing,
      dragState.isDragging,
      zoom,
      selectedTool,
      selectionBox.isSelecting,
      selectedNotes,
    ],
  )

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Focus the container to enable keyboard events
    containerRef.current?.focus()

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) / zoom
    const y = e.clientY - rect.top

    setDragStart({ x, y })

    const noteAtPosition = getNoteAtPosition(x, y)
    const isCtrlPressed = e.ctrlKey || e.metaKey

    if (selectedTool === "select") {
      // Check if we're trying to resize a note
      if (noteAtPosition && isNearRightEdge(x, y, noteAtPosition)) {
        setResizeState({
          isResizing: true,
          noteId: noteAtPosition.id,
          startX: x,
          originalDuration: noteAtPosition.duration,
        })
        return
      }

      // Check if we're clicking on a selected note to start dragging
      if (noteAtPosition && selectedNotes.has(noteAtPosition.id)) {
        const originalNotes = new Map()
        selectedNotes.forEach((noteId) => {
          const note = notes.find((n) => n.id === noteId)
          if (note) {
            originalNotes.set(noteId, { start: note.start, pitch: note.pitch })
          }
        })

        setDragState({
          isDragging: true,
          startX: x,
          startY: y,
          originalNotes,
        })
        return
      }

      // Handle note selection
      if (noteAtPosition) {
        if (isCtrlPressed) {
          // Toggle selection
          setSelectedNotes((prev) => {
            const newSet = new Set(prev)
            if (newSet.has(noteAtPosition.id)) {
              newSet.delete(noteAtPosition.id)
            } else {
              newSet.add(noteAtPosition.id)
            }
            return newSet
          })
        } else {
          // Single selection
          setSelectedNotes(new Set([noteAtPosition.id]))
        }
      } else {
        // Start selection box
        if (!isCtrlPressed) {
          setSelectedNotes(new Set())
        }
        setSelectionBox({
          isSelecting: true,
          startX: x,
          startY: y,
          currentX: x,
          currentY: y,
        })
      }
    } else {
      // Clear selection when using other tools
      setSelectedNotes(new Set())
      setIsDragging(true)

      if (selectedTool === "pencil") {
        // Add new note
        const time = gridSnap ? snapToGrid(pixelsToTime(x, pixelsPerBeat), snapValue) : pixelsToTime(x, pixelsPerBeat)
        const pitch = endNote - Math.floor(y / keyHeight)
        const duration = gridSnap ? snapValue : 0.25

        const newNote = {
          pitch,
          start: Math.max(0, time),
          duration,
        }

        // Check for collision before adding the note
        if (!checkNoteCollision(newNote)) {
          const noteToAdd: MidiNote = {
            id: `note-${Date.now()}-${Math.random()}`,
            ...newNote,
            velocity: 100,
            selected: false,
          }

          onNotesChange([...notes, noteToAdd])
        }
      } else if (selectedTool === "eraser") {
        // Remove note at position
        if (noteAtPosition) {
          onNotesChange(notes.filter((note) => note.id !== noteAtPosition.id))
        }
      }
    }
  }

  const handleMouseMoveWhileDragging = useCallback(
    (e: MouseEvent) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const currentX = (e.clientX - rect.left) / zoom
      const currentY = e.clientY - rect.top

      if (resizeState.isResizing && resizeState.noteId) {
        const deltaX = currentX - resizeState.startX
        const deltaTime = pixelsToTime(deltaX, pixelsPerBeat)
        let newDuration = resizeState.originalDuration + deltaTime

        // Apply grid snapping if enabled
        if (gridSnap) {
          newDuration = snapToGrid(newDuration, snapValue)
        }

        // Minimum duration
        newDuration = Math.max(gridSnap ? snapValue : 0.125, newDuration)

        // Update the note
        const updatedNotes = notes.map((note) =>
          note.id === resizeState.noteId ? { ...note, duration: newDuration } : note,
        )

        onNotesChange(updatedNotes)
      } else if (dragState.isDragging) {
        const deltaX = currentX - dragState.startX
        const deltaY = currentY - dragState.startY
        const deltaTime = pixelsToTime(deltaX, pixelsPerBeat)
        const deltaPitch = -Math.round(deltaY / keyHeight) // Negative because Y increases downward

        // Calculate new positions for all selected notes
        const updatedNotes = notes.map((note) => {
          if (!selectedNotes.has(note.id)) return note

          const originalPos = dragState.originalNotes.get(note.id)
          if (!originalPos) return note

          let newStart = originalPos.start + deltaTime
          let newPitch = originalPos.pitch + deltaPitch

          // Apply grid snapping if enabled
          if (gridSnap) {
            newStart = snapToGrid(newStart, snapValue)
          }

          // Clamp values to valid ranges
          newStart = Math.max(0, newStart)
          newPitch = Math.max(startNote, Math.min(endNote, newPitch))

          return {
            ...note,
            start: newStart,
            pitch: newPitch,
          }
        })

        // Check for collisions with the new positions
        let hasCollision = false
        for (const note of updatedNotes) {
          if (selectedNotes.has(note.id)) {
            if (checkNoteCollision(note, selectedNotes)) {
              hasCollision = true
              break
            }
          }
        }

        // Only update if there are no collisions
        if (!hasCollision) {
          onNotesChange(updatedNotes)
        }
      }
    },
    [
      resizeState,
      dragState,
      zoom,
      pixelsToTime,
      pixelsPerBeat,
      gridSnap,
      snapValue,
      notes,
      onNotesChange,
      selectedNotes,
      keyHeight,
      startNote,
      endNote,
      checkNoteCollision,
    ],
  )

  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      if (selectionBox.isSelecting) {
        // Complete selection box
        const canvas = canvasRef.current
        if (!canvas) return

        const rect = canvas.getBoundingClientRect()
        const endX = (e.clientX - rect.left) / zoom
        const endY = e.clientY - rect.top

        const notesInSelection = getNotesInSelection(selectionBox.startX, selectionBox.startY, endX, endY)
        const isCtrlPressed = e.ctrlKey || e.metaKey

        if (isCtrlPressed) {
          // Add to existing selection
          setSelectedNotes((prev) => {
            const newSet = new Set(prev)
            notesInSelection.forEach((note) => newSet.add(note.id))
            return newSet
          })
        } else {
          // Replace selection
          setSelectedNotes(new Set(notesInSelection.map((note) => note.id)))
        }

        setSelectionBox({
          isSelecting: false,
          startX: 0,
          startY: 0,
          currentX: 0,
          currentY: 0,
        })
      }

      setIsDragging(false)
      setResizeState({
        isResizing: false,
        noteId: null,
        startX: 0,
        originalDuration: 0,
      })
      setDragState({
        isDragging: false,
        startX: 0,
        startY: 0,
        originalNotes: new Map(),
      })
    },
    [selectionBox, getNotesInSelection, zoom],
  )

  // Add global mouse event listeners for dragging
  useEffect(() => {
    if (resizeState.isResizing || selectionBox.isSelecting || dragState.isDragging) {
      document.addEventListener("mousemove", handleMouseMoveWhileDragging)
      document.addEventListener("mouseup", handleMouseUp)

      return () => {
        document.removeEventListener("mousemove", handleMouseMoveWhileDragging)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [
    resizeState.isResizing,
    selectionBox.isSelecting,
    dragState.isDragging,
    handleMouseMoveWhileDragging,
    handleMouseUp,
  ])

  return (
    <div
      ref={containerRef}
      className="relative overflow-auto bg-white border border-gray-300 outline-none"
      style={{ height: "400px" }}
      onScroll={(e) => {
        const target = e.target as HTMLDivElement
        onScroll?.(target.scrollTop)
      }}
    >
      <canvas
        ref={canvasRef}
        width={gridWidth}
        height={gridHeight}
        className={cursorStyle}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      />
    </div>
  )
}
