import type { SynthParams } from "./synthesizer"

export interface SynthPreset {
  id: string
  name: string
  params: SynthParams
  category: string
  description?: string
  createdAt: number
  isFactory: boolean
}

export const FACTORY_PRESETS: SynthPreset[] = [
  {
    id: "classic-lead",
    name: "Classic Lead",
    category: "Lead",
    description: "Bright sawtooth lead with vibrato",
    isFactory: true,
    createdAt: Date.now(),
    params: {
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
      sustainLevel: 0.8,
      releaseTime: 0.5,
      filterType: "lowpass",
      filterFrequency: 3000,
      filterResonance: 2,
      filterAttackTime: 0.01,
      filterDecayTime: 0.2,
      filterSustainLevel: 0.6,
      filterReleaseTime: 0.8,
      filterEnvelopeAmount: 2,
      lfoEnabled: true,
      lfoWaveform: "sine",
      lfoRate: 4.5,
      lfoBpmSync: false,
      lfoBpmDivision: "1/4",
      lfoToPitch: 15,
      lfoToFilter: 200,
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
    },
  },
  {
    id: "warm-pad",
    name: "Warm Pad",
    category: "Pad",
    description: "Lush pad with slow filter sweep",
    isFactory: true,
    createdAt: Date.now(),
    params: {
      waveform: "sawtooth",
      detune: 0,
      osc2Enabled: true,
      osc2Waveform: "triangle",
      osc2Detune: 7,
      osc2Level: 0.4,
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
      attackTime: 1.2,
      decayTime: 0.8,
      sustainLevel: 0.9,
      releaseTime: 2.0,
      filterType: "lowpass",
      filterFrequency: 800,
      filterResonance: 1.5,
      filterAttackTime: 1.5,
      filterDecayTime: 1.0,
      filterSustainLevel: 0.7,
      filterReleaseTime: 2.5,
      filterEnvelopeAmount: 1.8,
      lfoEnabled: true,
      lfoWaveform: "triangle",
      lfoRate: 0.3,
      lfoBpmSync: false,
      lfoBpmDivision: "1/4",
      lfoToPitch: 0,
      lfoToFilter: 400,
      lfoToVolume: 0.1,
      lfoToPhaserRate: 0,
      lfoToDelayTime: 0,
      distortionEnabled: false,
      distortionAmount: 20,
      distortionGain: 0.5,
      delayEnabled: true,
      delayTime: 0.4,
      delayBpmSync: false,
      delayBpmDivision: "1/4",
      delayFeedback: 0.2,
      delayWetLevel: 0.15,
      phaserEnabled: false,
      phaserRate: 0.5,
      phaserDepth: 1000,
      phaserFeedback: 5,
      masterVolume: 0.25,
    },
  },
  {
    id: "wobble-bass",
    name: "Wobble Bass",
    category: "Bass",
    description: "Dubstep-style wobble bass",
    isFactory: true,
    createdAt: Date.now(),
    params: {
      waveform: "square",
      detune: 0,
      osc2Enabled: true,
      osc2Waveform: "sawtooth",
      osc2Detune: -12,
      osc2Level: 0.6,
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
      decayTime: 0.1,
      sustainLevel: 1.0,
      releaseTime: 0.2,
      filterType: "lowpass",
      filterFrequency: 400,
      filterResonance: 8,
      filterAttackTime: 0.01,
      filterDecayTime: 0.1,
      filterSustainLevel: 0.3,
      filterReleaseTime: 0.2,
      filterEnvelopeAmount: 0.5,
      lfoEnabled: true,
      lfoWaveform: "square",
      lfoRate: 8,
      lfoBpmSync: true,
      lfoBpmDivision: "1/16",
      lfoToPitch: 0,
      lfoToFilter: 1200,
      lfoToVolume: 0,
      lfoToPhaserRate: 0,
      lfoToDelayTime: 0,
      distortionEnabled: true,
      distortionAmount: 40,
      distortionGain: 0.7,
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
      masterVolume: 0.4,
    },
  },
  {
    id: "space-pluck",
    name: "Space Pluck",
    category: "Pluck",
    description: "Ethereal pluck with phaser and delay",
    isFactory: true,
    createdAt: Date.now(),
    params: {
      waveform: "triangle",
      detune: 0,
      osc2Enabled: false,
      osc2Waveform: "sine",
      osc2Detune: 12,
      osc2Level: 0.3,
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
      decayTime: 0.8,
      sustainLevel: 0.2,
      releaseTime: 1.5,
      filterType: "highpass",
      filterFrequency: 200,
      filterResonance: 1,
      filterAttackTime: 0.01,
      filterDecayTime: 0.5,
      filterSustainLevel: 0.8,
      filterReleaseTime: 1.0,
      filterEnvelopeAmount: 0.5,
      lfoEnabled: true,
      lfoWaveform: "sine",
      lfoRate: 0.8,
      lfoBpmSync: true,
      lfoBpmDivision: "1/2",
      lfoToPitch: 5,
      lfoToFilter: 0,
      lfoToVolume: 0,
      lfoToPhaserRate: 2,
      lfoToDelayTime: 20,
      distortionEnabled: false,
      distortionAmount: 20,
      distortionGain: 0.5,
      delayEnabled: true,
      delayTime: 0.375,
      delayBpmSync: true,
      delayBpmDivision: "1/8.",
      delayFeedback: 0.4,
      delayWetLevel: 0.4,
      phaserEnabled: true,
      phaserRate: 1.2,
      phaserDepth: 800,
      phaserFeedback: 3,
      masterVolume: 0.3,
    },
  },
  {
    id: "fm-bell",
    name: "FM Bell",
    category: "Bell",
    description: "Bell-like sound using phase modulation",
    isFactory: true,
    createdAt: Date.now(),
    params: {
      waveform: "sine",
      detune: 0,
      osc2Enabled: true,
      osc2Waveform: "sine",
      osc2Detune: 19,
      osc2Level: 0.2,
      phaseModAmount: 800,
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
      decayTime: 2.0,
      sustainLevel: 0.3,
      releaseTime: 3.0,
      filterType: "lowpass",
      filterFrequency: 4000,
      filterResonance: 0.5,
      filterAttackTime: 0.01,
      filterDecayTime: 1.5,
      filterSustainLevel: 0.6,
      filterReleaseTime: 2.0,
      filterEnvelopeAmount: 1.0,
      lfoEnabled: true,
      lfoWaveform: "sine",
      lfoRate: 0.2,
      lfoBpmSync: false,
      lfoBpmDivision: "1/4",
      lfoToPitch: 3,
      lfoToFilter: 100,
      lfoToVolume: 0.05,
      lfoToPhaserRate: 0,
      lfoToDelayTime: 0,
      distortionEnabled: false,
      distortionAmount: 20,
      distortionGain: 0.5,
      delayEnabled: true,
      delayTime: 0.5,
      delayBpmSync: true,
      delayBpmDivision: "1/4.",
      delayFeedback: 0.15,
      delayWetLevel: 0.2,
      phaserEnabled: false,
      phaserRate: 0.5,
      phaserDepth: 1000,
      phaserFeedback: 5,
      masterVolume: 0.35,
    },
  },
]

export class PresetManager {
  private static readonly STORAGE_KEY = "synth-presets"

  static savePreset(preset: Omit<SynthPreset, "id" | "createdAt" | "isFactory">): SynthPreset {
    const newPreset: SynthPreset = {
      ...preset,
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      isFactory: false,
    }

    const presets = this.getUserPresets()
    presets.push(newPreset)
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(presets))

    return newPreset
  }

  static getUserPresets(): SynthPreset[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  static getAllPresets(): SynthPreset[] {
    return [...FACTORY_PRESETS, ...this.getUserPresets()]
  }

  static deletePreset(id: string): boolean {
    const presets = this.getUserPresets()
    const filtered = presets.filter((p) => p.id !== id)

    if (filtered.length !== presets.length) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered))
      return true
    }
    return false
  }

  static exportPreset(preset: SynthPreset): string {
    return JSON.stringify(preset, null, 2)
  }

  static exportAllUserPresets(): string {
    return JSON.stringify(this.getUserPresets(), null, 2)
  }

  static importPreset(jsonString: string): SynthPreset | null {
    try {
      const preset = JSON.parse(jsonString) as SynthPreset

      // Validate preset structure
      if (!preset.name || !preset.params || !preset.category) {
        throw new Error("Invalid preset format")
      }

      // Create new preset with unique ID
      const newPreset = this.savePreset({
        name: preset.name,
        category: preset.category,
        description: preset.description,
        params: preset.params,
      })

      return newPreset
    } catch {
      return null
    }
  }

  static importPresets(jsonString: string): number {
    try {
      const presets = JSON.parse(jsonString) as SynthPreset[]
      let imported = 0

      for (const preset of presets) {
        if (this.importPreset(JSON.stringify(preset))) {
          imported++
        }
      }

      return imported
    } catch {
      return 0
    }
  }

  static getPresetsByCategory(): Record<string, SynthPreset[]> {
    const presets = this.getAllPresets()
    const categories: Record<string, SynthPreset[]> = {}

    for (const preset of presets) {
      if (!categories[preset.category]) {
        categories[preset.category] = []
      }
      categories[preset.category].push(preset)
    }

    // Sort presets within each category
    for (const category in categories) {
      categories[category].sort((a, b) => {
        // Factory presets first, then by name
        if (a.isFactory !== b.isFactory) {
          return a.isFactory ? -1 : 1
        }
        return a.name.localeCompare(b.name)
      })
    }

    return categories
  }
}
