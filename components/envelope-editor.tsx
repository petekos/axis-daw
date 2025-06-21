import React, { useRef, useState } from "react"

export interface EnvelopeParams {
  attack: number
  decay: number
  sustain: number
  release: number
  amount?: number // for pitch envelope
}

interface EnvelopeEditorProps {
  params: EnvelopeParams
  onChange: (params: EnvelopeParams) => void
  width?: number
  height?: number
  min?: number
  max?: number
  showAmount?: boolean
}

const PAD = 24 // px padding for axes

export const EnvelopeEditor: React.FC<EnvelopeEditorProps> = ({
  params,
  onChange,
  width = 260,
  height = 120,
  min = 0,
  max = 1,
  showAmount = false,
}) => {
  // Convert envelope params to points in SVG space
  const totalTime = params.attack + params.decay + params.release + 0.0001
  const sustainLevel = params.sustain

  // X positions (normalized)
  const aX = params.attack / totalTime
  const dX = (params.attack + params.decay) / totalTime
  const sX = (params.attack + params.decay) / totalTime
  const rX = 1

  // Y positions (SVG y is inverted)
  const y = (v: number) => PAD + (1 - v) * (height - 2 * PAD)

  // Points
  const points = [
    { x: PAD, y: y(0) }, // Start
    { x: PAD + aX * (width - 2 * PAD), y: y(1) }, // Attack
    { x: PAD + dX * (width - 2 * PAD), y: y(sustainLevel) }, // Decay/Sustain
    { x: width - PAD, y: y(0) }, // Release end
  ]

  // Drag state
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  // Drag logic (simplified for demo)
  const handlePointerDown = (idx: number) => (e: React.PointerEvent) => {
    setDragIdx(idx)
    (e.target as Element).setPointerCapture(e.pointerId)
  }
  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragIdx === null) return
    const rect = svgRef.current!.getBoundingClientRect()
    const x = (e.clientX - rect.left - PAD) / (width - 2 * PAD)
    const yNorm = 1 - (e.clientY - rect.top - PAD) / (height - 2 * PAD)
    let newParams = { ...params }
    if (dragIdx === 1) {
      // Attack handle
      newParams.attack = Math.max(0.001, Math.min(x * totalTime, totalTime - params.decay - params.release))
    } else if (dragIdx === 2) {
      // Decay/Sustain handle
      newParams.decay = Math.max(0.001, Math.min((x - aX) * totalTime, totalTime - params.attack - params.release))
      newParams.sustain = Math.max(min, Math.min(yNorm, max))
    }
    onChange(newParams)
  }
  const handlePointerUp = () => setDragIdx(null)

  // Envelope polyline
  const path = [
    `M ${points[0].x},${points[0].y}`,
    `L ${points[1].x},${points[1].y}`,
    `L ${points[2].x},${points[2].y}`,
    `L ${points[3].x},${points[3].y}`,
  ].join(" ")

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      style={{ touchAction: "none", background: "#18181b", borderRadius: 8, border: "1px solid #334155" }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Envelope curve */}
      <polyline fill="none" stroke="#fbbf24" strokeWidth={2} points={points.map(p => `${p.x},${p.y}`).join(" ")} />
      {/* Handles */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={7}
          fill={dragIdx === i ? "#f59e42" : "#fbbf24"}
          stroke="#fff"
          strokeWidth={1.5}
          style={{ cursor: "pointer" }}
          onPointerDown={handlePointerDown(i)}
        />
      ))}
      {/* Optional: Amount handle for pitch envelope */}
      {showAmount && (
        <circle
          cx={width / 2}
          cy={y(params.amount ?? 0)}
          r={6}
          fill="#60a5fa"
          stroke="#fff"
          strokeWidth={1.5}
          style={{ cursor: "pointer" }}
          // Add drag logic for amount if needed
        />
      )}
    </svg>
  )
}