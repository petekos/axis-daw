"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { ChevronDown, ChevronUp, Clock, Music, Settings, Zap } from "lucide-react"
import type { SynthParams } from "../utils/synthesizer"
import { PresetManagerComponent } from "./preset-manager"
import { MUSICAL_DIVISIONS, bpmToSeconds, bpmToHz } from "../utils/synthesizer"
import { EnvelopeEditor, EnvelopeParams } from "./envelope-editor"

interface SynthesizerControlsProps {
  params: SynthParams
  onParamsChange: (params: SynthParams) => void
  onTestNote: () => void
  currentBpm: number
  isMinimized?: boolean
}

export function SynthesizerControls({
  params,
  onParamsChange,
  onTestNote,
  currentBpm,
  isMinimized = true,
}: SynthesizerControlsProps) {
  const [isExpanded, setIsExpanded] = useState(!isMinimized)
  const [isPresetsExpanded, setIsPresetsExpanded] = useState(false)
  const [isFxExpanded, setIsFxExpanded] = useState(false)
  const [isLfoExpanded, setIsLfoExpanded] = useState(false)

  const updateParam = <K extends keyof SynthParams>(key: K, value: SynthParams[K]) => {
    onParamsChange({ ...params, [key]: value })
  }

  const divisionOptions = Object.entries(MUSICAL_DIVISIONS).map(([key, value]) => ({
    value: key,
    label: `${key} (${value.name})`,
  }))

  const formatDelayTime = (time: number, isSync: boolean, division: string, bpm: number) => {
    if (isSync) {
      const syncedTime = bpmToSeconds(bpm, division)
      return `${division} (${(syncedTime * 1000).toFixed(0)}ms)`
    }
    return `${(time * 1000).toFixed(0)}ms`
  }

  const formatLfoRate = (rate: number, isSync: boolean, division: string, bpm: number) => {
    if (isSync) {
      const syncedRate = bpmToHz(bpm, division)
      return `${division} (${syncedRate.toFixed(2)}Hz)`
    }
    return `${rate.toFixed(2)}Hz`
  }

  return (
    <div className="bg-gradient-to-r from-slate-800 to-slate-700 border-t border-slate-600">
      {/* Synthesizer Header with modern styling */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-600">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded flex items-center justify-center">
            <Settings className="w-3 h-3 text-white" />
          </div>
          <h3 className="text-sm font-bold text-white">Synthesizer Engine</h3>
          {!isExpanded && (
            <Button
              size="sm"
              onClick={onTestNote}
              className="h-6 px-2 text-xs bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 border-0"
            >
              <Zap className="w-3 h-3 mr-1" />
              Test
            </Button>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-6 w-6 p-0 text-slate-400 hover:text-white hover:bg-slate-700"
        >
          {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
        </Button>
      </div>

      {/* Synthesizer Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Collapsible Preset Manager */}
          <div className="bg-slate-900 rounded-lg border border-slate-600 shadow-lg">
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-600">
              <span className="text-sm font-medium text-slate-200">Presets</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPresetsExpanded(!isPresetsExpanded)}
                className="h-5 w-5 p-0 text-slate-400 hover:text-white"
              >
                {isPresetsExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
            </div>
            {isPresetsExpanded && (
              <div className="p-3">
                <PresetManagerComponent
                  currentParams={params}
                  onLoadPreset={onParamsChange}
                  onParamsChange={onParamsChange}
                />
              </div>
            )}
          </div>

          {/* Main Controls Grid with modern cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Oscillator 1 */}
            <div className="bg-slate-900 rounded-lg border border-slate-600 p-3 shadow-lg">
              <div className="text-sm font-medium mb-3 flex items-center justify-between text-slate-200">
                <span>Oscillator 1</span>
                <Button
                  size="sm"
                  onClick={onTestNote}
                  className="h-6 px-2 text-xs bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 border-0"
                >
                  <Zap className="w-3 h-3 mr-1" />
                  Test
                </Button>
              </div>
              <div className="space-y-3">
                <div>
                  <select
                    value={params.waveform}
                    onChange={(e) => updateParam("waveform", e.target.value as OscillatorType)}
                    className="w-full px-2 py-1 text-xs bg-slate-800 border border-slate-600 rounded text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="sine">Sine</option>
                    <option value="square">Square</option>
                    <option value="sawtooth">Sawtooth</option>
                    <option value="triangle">Triangle</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium">Detune: {params.detune.toFixed(0)}</label>
                  <Slider
                    value={[params.detune]}
                    onValueChange={(value) => updateParam("detune", value[0])}
                    min={-100}
                    max={100}
                    step={1}
                    className="h-4 [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-blue-500 [&_[role=slider]]:to-purple-600 [&_[role=slider]]:border-0"
                  />
                </div>
              </div>
            </div>

            {/* Oscillator 2 */}
            <div className="bg-slate-900 rounded-lg border border-slate-600 p-3 shadow-lg">
              <div className="text-sm font-medium mb-3 flex items-center justify-between text-slate-200">
                <div className="flex items-center gap-2">
                  <span>Oscillator 2</span>
                  <Button
                    variant={params.osc2Enabled ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateParam("osc2Enabled", !params.osc2Enabled)}
                    className={
                      params.osc2Enabled
                        ? "h-5 px-2 text-xs bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 border-0"
                        : "h-5 px-2 text-xs bg-slate-700 border-slate-600 hover:bg-slate-600 text-slate-300"
                    }
                  >
                    {params.osc2Enabled ? "ON" : "OFF"}
                  </Button>
                </div>
              </div>
              {params.osc2Enabled ? (
                <div className="space-y-2">
                  <div>
                    <select
                      value={params.osc2Waveform}
                      onChange={(e) => updateParam("osc2Waveform", e.target.value as OscillatorType)}
                      className="w-full px-2 py-1 text-xs bg-slate-800 border border-slate-600 rounded text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="sine">Sine</option>
                      <option value="square">Square</option>
                      <option value="sawtooth">Saw</option>
                      <option value="triangle">Tri</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-medium">Detune: {params.osc2Detune.toFixed(0)}</label>
                    <Slider
                      value={[params.osc2Detune]}
                      onValueChange={(value) => updateParam("osc2Detune", value[0])}
                      min={-100}
                      max={100}
                      step={1}
                      className="h-3 [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-teal-500 [&_[role=slider]]:to-cyan-600 [&_[role=slider]]:border-0"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-medium">
                      Level: {(params.osc2Level * 100).toFixed(0)}%
                    </label>
                    <Slider
                      value={[params.osc2Level]}
                      onValueChange={(value) => updateParam("osc2Level", value[0])}
                      min={0}
                      max={1}
                      step={0.01}
                      className="h-3 [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-teal-500 [&_[role=slider]]:to-cyan-600 [&_[role=slider]]:border-0"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-medium">PM: {params.phaseModAmount.toFixed(0)}</label>
                    <Slider
                      value={[params.phaseModAmount]}
                      onValueChange={(value) => updateParam("phaseModAmount", value[0])}
                      min={0}
                      max={1000}
                      step={1}
                      className="h-3 [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-teal-500 [&_[role=slider]]:to-cyan-600 [&_[role=slider]]:border-0"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-20 text-slate-500 text-xs">Enable to configure</div>
              )}
            </div>

            {/* Amplitude Envelope */}
            <div className="bg-slate-900 rounded-lg border border-slate-600 p-3 shadow-lg">
              <div className="text-sm font-medium mb-3 text-slate-200">Amp Envelope</div>
              <EnvelopeEditor
                params={{
                  attack: params.attackTime,
                  decay: params.decayTime,
                  sustain: params.sustainLevel,
                  release: params.releaseTime,
                }}
                onChange={(env: EnvelopeParams) => {
                  updateParam("attackTime", env.attack)
                  updateParam("decayTime", env.decay)
                  updateParam("sustainLevel", env.sustain)
                  updateParam("releaseTime", env.release)
                }}
                width={240}
                height={100}
              />
            </div>

            {/* Filter */}
            <div className="bg-slate-900 rounded-lg border border-slate-600 p-3 shadow-lg">
              <div className="text-sm font-medium mb-3 text-slate-200">Filter</div>
              <div className="space-y-3">
                <div>
                  <select
                    value={params.filterType}
                    onChange={(e) => updateParam("filterType", e.target.value as BiquadFilterType)}
                    className="w-full px-2 py-1 text-xs bg-slate-800 border border-slate-600 rounded text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="lowpass">Low Pass</option>
                    <option value="highpass">High Pass</option>
                    <option value="bandpass">Band Pass</option>
                    <option value="notch">Notch</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium">
                    Freq: {params.filterFrequency.toFixed(0)}Hz
                  </label>
                  <Slider
                    value={[params.filterFrequency]}
                    onValueChange={(value) => updateParam("filterFrequency", value[0])}
                    min={20}
                    max={20000}
                    step={1}
                    className="h-3 [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-orange-500 [&_[role=slider]]:to-red-600 [&_[role=slider]]:border-0"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium">Res: {params.filterResonance.toFixed(1)}</label>
                  <Slider
                    value={[params.filterResonance]}
                    onValueChange={(value) => updateParam("filterResonance", value[0])}
                    min={0.1}
                    max={30}
                    step={0.1}
                    className="h-3 [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-orange-500 [&_[role=slider]]:to-red-600 [&_[role=slider]]:border-0"
                  />
                </div>
              </div>
            </div>

            {/* Filter Envelope */}
            <div className="bg-slate-900 rounded-lg border border-slate-600 p-3 shadow-lg">
              <div className="text-sm font-medium mb-3 text-slate-200">Filter Env</div>
              <EnvelopeEditor
                params={{
                  attack: params.filterAttackTime,
                  decay: params.filterDecayTime,
                  sustain: params.filterSustainLevel,
                  release: params.filterReleaseTime,
                  amount: params.filterEnvelopeAmount,
                }}
                onChange={(env: EnvelopeParams) => {
                  updateParam("filterAttackTime", env.attack)
                  updateParam("filterDecayTime", env.decay)
                  updateParam("filterSustainLevel", env.sustain)
                  updateParam("filterReleaseTime", env.release)
                  updateParam("filterEnvelopeAmount", env.amount ?? params.filterEnvelopeAmount)
                }}
                width={240}
                height={100}
                showAmount={true}
              />
            </div>

            {/* Fixed Pitch Mode */}
            <div className="bg-slate-900 rounded-lg border border-slate-600 p-3 shadow-lg">
              <div className="text-sm font-medium mb-3 flex items-center justify-between text-slate-200">
                <span>Fixed Pitch</span>
                <Button
                  variant={params.fixedPitchMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateParam("fixedPitchMode", !params.fixedPitchMode)}
                  className={
                    params.fixedPitchMode
                      ? "h-5 px-2 text-xs bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 border-0"
                      : "h-5 px-2 text-xs bg-slate-700 border-slate-600 hover:bg-slate-600 text-slate-300"
                  }
                >
                  {params.fixedPitchMode ? "ON" : "OFF"}
                </Button>
              </div>
              {params.fixedPitchMode && (
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 font-medium">Pitch (Hz): {params.fixedPitch.toFixed(1)}</label>
                  <Slider
                    value={[params.fixedPitch]}
                    onValueChange={(value) => updateParam("fixedPitch", value[0])}
                    min={20}
                    max={2000}
                    step={0.1}
                    className="h-3 [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-pink-500 [&_[role=slider]]:to-red-500 [&_[role=slider]]:border-0"
                  />
                </div>
              )}
            </div>

            {/* Pitch Envelope */}
            <div className="bg-slate-900 rounded-lg border border-slate-600 p-3 shadow-lg">
              <div className="text-sm font-medium mb-3 text-slate-200">Pitch Envelope</div>
              <EnvelopeEditor
                params={{
                  attack: params.pitchEnvAttack,
                  decay: params.pitchEnvDecay,
                  sustain: params.pitchEnvSustain,
                  release: params.pitchEnvRelease,
                  amount: params.pitchEnvAmount,
                }}
                onChange={(env: EnvelopeParams) => {
                  updateParam("pitchEnvAttack", env.attack)
                  updateParam("pitchEnvDecay", env.decay)
                  updateParam("pitchEnvSustain", env.sustain)
                  updateParam("pitchEnvRelease", env.release)
                  updateParam("pitchEnvAmount", env.amount ?? params.pitchEnvAmount)
                }}
                width={240}
                height={100}
                showAmount={true}
              />
            </div>

            {/* Noise Source */}
            <div className="bg-slate-900 rounded-lg border border-slate-600 p-3 shadow-lg">
              <div className="text-sm font-medium mb-3 flex items-center justify-between text-slate-200">
                <span>Noise</span>
                <Button
                  variant={params.noiseEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateParam("noiseEnabled", !params.noiseEnabled)}
                  className={
                    params.noiseEnabled
                      ? "h-5 px-2 text-xs bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 border-0"
                      : "h-5 px-2 text-xs bg-slate-700 border-slate-600 hover:bg-slate-600 text-slate-300"
                  }
                >
                  {params.noiseEnabled ? "ON" : "OFF"}
                </Button>
              </div>
              {params.noiseEnabled && (
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-slate-400 font-medium">
                      Level: {(params.noiseLevel * 100).toFixed(0)}%
                    </label>
                    <Slider
                      value={[params.noiseLevel]}
                      onValueChange={(value) => updateParam("noiseLevel", value[0])}
                      min={0}
                      max={1}
                      step={0.01}
                      className="h-3 [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-yellow-400 [&_[role=slider]]:to-yellow-600 [&_[role=slider]]:border-0"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-medium">Type</label>
                    <select
                      value={params.noiseType}
                      onChange={(e) => updateParam("noiseType", e.target.value as "white" | "pink" | "brown")}
                      className="w-full px-2 py-1 text-xs bg-slate-800 border border-slate-600 rounded text-slate-200 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                    >
                      <option value="white">White</option>
                      <option value="pink">Pink</option>
                      <option value="brown">Brown</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Expandable Sections with modern styling */}
          <div className="space-y-3">
            {/* LFO Section */}
            <div className="bg-slate-900 rounded-lg border border-slate-600 shadow-lg">
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-600">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-200">LFO</span>
                  <Button
                    variant={params.lfoEnabled ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateParam("lfoEnabled", !params.lfoEnabled)}
                    className={
                      params.lfoEnabled
                        ? "h-5 px-2 text-xs bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 border-0"
                        : "h-5 px-2 text-xs bg-slate-700 border-slate-600 hover:bg-slate-600 text-slate-300"
                    }
                  >
                    {params.lfoEnabled ? "ON" : "OFF"}
                  </Button>
                  {params.lfoEnabled && (
                    <span className="text-xs text-slate-400 font-mono">
                      {formatLfoRate(params.lfoRate, params.lfoBpmSync, params.lfoBpmDivision, currentBpm)}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsLfoExpanded(!isLfoExpanded)}
                  className="h-5 w-5 p-0 text-slate-400 hover:text-white"
                >
                  {isLfoExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </Button>
              </div>
              {isLfoExpanded && params.lfoEnabled && (
                <div className="p-3 space-y-3">
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 font-medium">Wave</label>
                      <select
                        value={params.lfoWaveform}
                        onChange={(e) => updateParam("lfoWaveform", e.target.value as OscillatorType)}
                        className="w-full px-2 py-1 text-xs bg-slate-800 border border-slate-600 rounded text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="sine">Sine</option>
                        <option value="square">Square</option>
                        <option value="sawtooth">Saw</option>
                        <option value="triangle">Tri</option>
                      </select>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <label className="text-xs text-slate-400 font-medium">Rate</label>
                        <Button
                          variant={params.lfoBpmSync ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateParam("lfoBpmSync", !params.lfoBpmSync)}
                          className="h-4 px-1 text-xs"
                        >
                          {params.lfoBpmSync ? <Music className="h-2 w-2" /> : <Clock className="h-2 w-2" />}
                        </Button>
                      </div>
                      {params.lfoBpmSync ? (
                        <select
                          value={params.lfoBpmDivision}
                          onChange={(e) => updateParam("lfoBpmDivision", e.target.value)}
                          className="w-full px-2 py-1 text-xs bg-slate-800 border border-slate-600 rounded text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                          {divisionOptions.slice(0, 8).map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.value}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Slider
                          value={[params.lfoRate]}
                          onValueChange={(value) => updateParam("lfoRate", value[0])}
                          min={0.1}
                          max={20}
                          step={0.1}
                          className="h-3 [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-purple-500 [&_[role=slider]]:to-pink-600 [&_[role=slider]]:border-0"
                        />
                      )}
                    </div>
                    <div className="text-xs text-slate-400 pt-4 font-mono">BPM: {currentBpm}</div>
                    <div></div>
                  </div>

                  <div className="border-t border-slate-600 pt-3">
                    <div className="text-xs font-medium mb-2 text-slate-300">Modulation</div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs text-slate-400 font-medium">
                          Pitch: {params.lfoToPitch.toFixed(0)}
                        </label>
                        <Slider
                          value={[params.lfoToPitch]}
                          onValueChange={(value) => updateParam("lfoToPitch", value[0])}
                          min={0}
                          max={100}
                          step={1}
                          className="h-3 [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-cyan-500 [&_[role=slider]]:to-blue-600 [&_[role=slider]]:border-0"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 font-medium">
                          Filter: {params.lfoToFilter.toFixed(0)}
                        </label>
                        <Slider
                          value={[params.lfoToFilter]}
                          onValueChange={(value) => updateParam("lfoToFilter", value[0])}
                          min={0}
                          max={5000}
                          step={10}
                          className="h-3 [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-cyan-500 [&_[role=slider]]:to-blue-600 [&_[role=slider]]:border-0"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 font-medium">
                          Vol: {(params.lfoToVolume * 100).toFixed(0)}%
                        </label>
                        <Slider
                          value={[params.lfoToVolume]}
                          onValueChange={(value) => updateParam("lfoToVolume", value[0])}
                          min={0}
                          max={1}
                          step={0.01}
                          className="h-3 [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-cyan-500 [&_[role=slider]]:to-blue-600 [&_[role=slider]]:border-0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Effects Section */}
            <div className="bg-slate-900 rounded-lg border border-slate-600 shadow-lg">
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-600">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-200">Effects</span>
                  <div className="flex gap-1">
                    {params.distortionEnabled && (
                      <span className="text-xs bg-gradient-to-r from-red-500 to-rose-600 text-white px-2 py-0.5 rounded-full font-medium">
                        DIST
                      </span>
                    )}
                    {params.delayEnabled && (
                      <span className="text-xs bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-2 py-0.5 rounded-full font-medium">
                        DLY
                      </span>
                    )}
                    {params.phaserEnabled && (
                      <span className="text-xs bg-gradient-to-r from-purple-500 to-violet-600 text-white px-2 py-0.5 rounded-full font-medium">
                        PHS
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFxExpanded(!isFxExpanded)}
                  className="h-5 w-5 p-0 text-slate-400 hover:text-white"
                >
                  {isFxExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </Button>
              </div>
              {isFxExpanded && (
                <div className="p-3 space-y-2">
                  {/* Distortion */}
                  <div className="border border-slate-600 rounded-lg p-2 bg-slate-800">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-slate-200">Distortion</span>
                      <Button
                        variant={params.distortionEnabled ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateParam("distortionEnabled", !params.distortionEnabled)}
                        className={
                          params.distortionEnabled
                            ? "h-5 px-2 text-xs bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 border-0"
                            : "h-5 px-2 text-xs bg-slate-700 border-slate-600 hover:bg-slate-600 text-slate-300"
                        }
                      >
                        {params.distortionEnabled ? "ON" : "OFF"}
                      </Button>
                    </div>
                    {params.distortionEnabled && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-slate-400 font-medium">
                            Amount: {params.distortionAmount.toFixed(0)}
                          </label>
                          <Slider
                            value={[params.distortionAmount]}
                            onValueChange={(value) => updateParam("distortionAmount", value[0])}
                            min={1}
                            max={100}
                            step={1}
                            className="h-3 [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-red-500 [&_[role=slider]]:to-rose-600 [&_[role=slider]]:border-0"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 font-medium">
                            Gain: {(params.distortionGain * 100).toFixed(0)}%
                          </label>
                          <Slider
                            value={[params.distortionGain]}
                            onValueChange={(value) => updateParam("distortionGain", value[0])}
                            min={0}
                            max={1}
                            step={0.01}
                            className="h-3 [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-red-500 [&_[role=slider]]:to-rose-600 [&_[role=slider]]:border-0"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Delay */}
                  <div className="border border-slate-600 rounded-lg p-2 bg-slate-800">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-slate-200">Delay</span>
                      <Button
                        variant={params.delayEnabled ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateParam("delayEnabled", !params.delayEnabled)}
                        className={
                          params.delayEnabled
                            ? "h-5 px-2 text-xs bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 border-0"
                            : "h-5 px-2 text-xs bg-slate-700 border-slate-600 hover:bg-slate-600 text-slate-300"
                        }
                      >
                        {params.delayEnabled ? "ON" : "OFF"}
                      </Button>
                      {params.delayEnabled && (
                        <span className="text-xs text-slate-400 font-mono">
                          {formatDelayTime(params.delayTime, params.delayBpmSync, params.delayBpmDivision, currentBpm)}
                        </span>
                      )}
                    </div>
                    {params.delayEnabled && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <div className="flex items-center gap-1 mb-1">
                              <label className="text-xs text-slate-400 font-medium">Time</label>
                              <Button
                                variant={params.delayBpmSync ? "default" : "outline"}
                                size="sm"
                                onClick={() => updateParam("delayBpmSync", !params.delayBpmSync)}
                                className="h-4 px-1 text-xs"
                              >
                                {params.delayBpmSync ? <Music className="h-2 w-2" /> : <Clock className="h-2 w-2" />}
                              </Button>
                            </div>
                            {params.delayBpmSync ? (
                              <select
                                value={params.delayBpmDivision}
                                onChange={(e) => updateParam("delayBpmDivision", e.target.value)}
                                className="w-full px-2 py-1 text-xs bg-slate-700 border border-slate-600 rounded text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              >
                                {divisionOptions.slice(0, 8).map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.value}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <Slider
                                value={[params.delayTime]}
                                onValueChange={(value) => updateParam("delayTime", value[0])}
                                min={0.01}
                                max={1}
                                step={0.01}
                                className="h-3 [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-blue-500 [&_[role=slider]]:to-cyan-600 [&_[role=slider]]:border-0"
                              />
                            )}
                          </div>
                          <div>
                            <label className="text-xs text-slate-400 font-medium">
                              FB: {(params.delayFeedback * 100).toFixed(0)}%
                            </label>
                            <Slider
                              value={[params.delayFeedback]}
                              onValueChange={(value) => updateParam("delayFeedback", value[0])}
                              min={0}
                              max={0.95}
                              step={0.01}
                              className="h-3 [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-blue-500 [&_[role=slider]]:to-cyan-600 [&_[role=slider]]:border-0"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-400 font-medium">
                              Wet: {(params.delayWetLevel * 100).toFixed(0)}%
                            </label>
                            <Slider
                              value={[params.delayWetLevel]}
                              onValueChange={(value) => updateParam("delayWetLevel", value[0])}
                              min={0}
                              max={1}
                              step={0.01}
                              className="h-3 [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-blue-500 [&_[role=slider]]:to-cyan-600 [&_[role=slider]]:border-0"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Phaser */}
                  <div className="border border-slate-600 rounded-lg p-2 bg-slate-800">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-slate-200">Phaser</span>
                      <Button
                        variant={params.phaserEnabled ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateParam("phaserEnabled", !params.phaserEnabled)}
                        className={
                          params.phaserEnabled
                            ? "h-5 px-2 text-xs bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 border-0"
                            : "h-5 px-2 text-xs bg-slate-700 border-slate-600 hover:bg-slate-600 text-slate-300"
                        }
                      >
                        {params.phaserEnabled ? "ON" : "OFF"}
                      </Button>
                    </div>
                    {params.phaserEnabled && (
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs text-slate-400 font-medium">
                            Rate: {params.phaserRate.toFixed(2)}Hz
                          </label>
                          <Slider
                            value={[params.phaserRate]}
                            onValueChange={(value) => updateParam("phaserRate", value[0])}
                            min={0.1}
                            max={10}
                            step={0.1}
                            className="h-3 [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-purple-500 [&_[role=slider]]:to-violet-600 [&_[role=slider]]:border-0"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 font-medium">
                            Depth: {params.phaserDepth.toFixed(0)}Hz
                          </label>
                          <Slider
                            value={[params.phaserDepth]}
                            onValueChange={(value) => updateParam("phaserDepth", value[0])}
                            min={100}
                            max={5000}
                            step={10}
                            className="h-3 [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-purple-500 [&_[role=slider]]:to-violet-600 [&_[role=slider]]:border-0"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 font-medium">
                            FB: {params.phaserFeedback.toFixed(1)}
                          </label>
                          <Slider
                            value={[params.phaserFeedback]}
                            onValueChange={(value) => updateParam("phaserFeedback", value[0])}
                            min={0.1}
                            max={20}
                            step={0.1}
                            className="h-3 [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-purple-500 [&_[role=slider]]:to-violet-600 [&_[role=slider]]:border-0"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Master Volume with modern styling */}
          <div className="bg-slate-900 rounded-lg border border-slate-600 p-3 shadow-lg">
            <label className="text-sm font-medium text-slate-200">
              Master Volume: {(params.masterVolume * 100).toFixed(0)}%
            </label>
            <Slider
              value={[params.masterVolume]}
              onValueChange={(value) => updateParam("masterVolume", value[0])}
              min={0}
              max={1}
              step={0.01}
              className="h-4 mt-2 [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-emerald-500 [&_[role=slider]]:to-green-600 [&_[role=slider]]:border-0 bg-slate-500 text-slate-600"
            />
          </div>
        </div>
      )}
    </div>
  )
}
