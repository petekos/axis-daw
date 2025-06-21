export interface SynthParams {
  // Oscillator 1
  waveform: OscillatorType
  detune: number

  // Oscillator 2
  osc2Enabled: boolean
  osc2Waveform: OscillatorType
  osc2Detune: number
  osc2Level: number
  phaseModAmount: number // Phase modulation from osc2 to osc1

  // Noise Source
  noiseEnabled: boolean
  noiseLevel: number // 0-1
  noiseType: "white" | "pink"

  // Fixed Pitch
  fixedPitchMode: boolean // If true, use fixedPitch instead of MIDI note
  fixedPitch: number // Hz

  // Amplitude Envelope
  attackTime: number
  decayTime: number
  sustainLevel: number
  releaseTime: number

  // Pitch Envelope
  pitchEnvAttack: number
  pitchEnvDecay: number
  pitchEnvSustain: number
  pitchEnvRelease: number
  pitchEnvAmount: number // in semitones

  // Filter
  filterType: BiquadFilterType
  filterFrequency: number
  filterResonance: number

  // Filter Envelope
  filterAttackTime: number
  filterDecayTime: number
  filterSustainLevel: number
  filterReleaseTime: number
  filterEnvelopeAmount: number

  // LFO
  lfoEnabled: boolean
  lfoWaveform: OscillatorType
  lfoRate: number
  lfoBpmSync: boolean
  lfoBpmDivision: string // Musical division like "1/4", "1/8", etc.

  // LFO Modulation Destinations
  lfoToPitch: number // Vibrato
  lfoToFilter: number // Filter sweep
  lfoToVolume: number // Tremolo
  lfoToPhaserRate: number // Phaser rate modulation
  lfoToDelayTime: number // Delay time modulation

  // Effects
  distortionEnabled: boolean
  distortionAmount: number
  distortionGain: number

  delayEnabled: boolean
  delayTime: number
  delayBpmSync: boolean
  delayBpmDivision: string // Musical division
  delayFeedback: number
  delayWetLevel: number

  phaserEnabled: boolean
  phaserRate: number
  phaserDepth: number
  phaserFeedback: number

  // Master
  masterVolume: number
}

// Musical divisions and their multipliers
export const MUSICAL_DIVISIONS = {
  "1/1": { name: "Whole", multiplier: 4 },
  "1/2": { name: "Half", multiplier: 2 },
  "1/4": { name: "Quarter", multiplier: 1 },
  "1/8": { name: "Eighth", multiplier: 0.5 },
  "1/16": { name: "Sixteenth", multiplier: 0.25 },
  "1/32": { name: "Thirty-second", multiplier: 0.125 },
  "1/4T": { name: "Quarter Triplet", multiplier: 2 / 3 },
  "1/8T": { name: "Eighth Triplet", multiplier: 1 / 3 },
  "1/16T": { name: "Sixteenth Triplet", multiplier: 1 / 6 },
  "1/4.": { name: "Dotted Quarter", multiplier: 1.5 },
  "1/8.": { name: "Dotted Eighth", multiplier: 0.75 },
  "1/16.": { name: "Dotted Sixteenth", multiplier: 0.375 },
}

export function bpmToSeconds(bpm: number, division: string): number {
  const divisionData = MUSICAL_DIVISIONS[division as keyof typeof MUSICAL_DIVISIONS]
  if (!divisionData) return 0.25 // Default to quarter note

  // Calculate seconds per beat at given BPM
  const secondsPerBeat = 60 / bpm

  // Apply division multiplier
  return secondsPerBeat * divisionData.multiplier
}

export function bpmToHz(bpm: number, division: string): number {
  const seconds = bpmToSeconds(bpm, division)
  return 1 / seconds // Convert to frequency
}

export class Synthesizer {
  private audioContext: AudioContext | null = null
  private masterGain: GainNode | null = null
  private activeVoices: Map<number, Voice> = new Map()
  private isInitialized = false
  private currentBpm = 120

  constructor() {
    // Don't initialize Web Audio API during SSR
    if (typeof window !== "undefined") {
      this.initializeAudio()
    }
  }

  private initializeAudio() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.masterGain = this.audioContext.createGain()
      this.masterGain.connect(this.audioContext.destination)
      this.isInitialized = true
    } catch (error) {
      console.warn("Web Audio API not supported:", error)
    }
  }

  async init() {
    if (!this.isInitialized && typeof window !== "undefined") {
      this.initializeAudio()
    }

    if (this.audioContext && this.audioContext.state === "suspended") {
      await this.audioContext.resume()
    }
  }

  setBpm(bpm: number) {
    this.currentBpm = bpm
    // Update existing voices with new BPM-synced values
    this.activeVoices.forEach((voice) => {
      voice.updateBpmSyncedParams(bpm)
    })
  }

  noteOn(midiNote: number, velocity: number, params: SynthParams) {
    if (!this.audioContext || !this.masterGain) return

    // Stop existing note if playing
    this.noteOff(midiNote)

    const voice = new Voice(this.audioContext, this.masterGain, params, this.currentBpm)
    voice.start(midiNote, velocity)
    this.activeVoices.set(midiNote, voice)
  }

  noteOff(midiNote: number) {
    const voice = this.activeVoices.get(midiNote)
    if (voice) {
      voice.stop()
      this.activeVoices.delete(midiNote)
    }
  }

  setMasterVolume(volume: number) {
    if (this.masterGain && this.audioContext) {
      this.masterGain.gain.setValueAtTime(volume, this.audioContext.currentTime)
    }
  }

  stopAll() {
    this.activeVoices.forEach((voice) => voice.stop())
    this.activeVoices.clear()
  }
}

class Voice {
  private audioContext: AudioContext
  private oscillator1: OscillatorNode
  private oscillator2: OscillatorNode | null = null
  private phaseModGain: GainNode | null = null
  private osc2Gain: GainNode | null = null
  private amplitudeGain: GainNode
  private filter: BiquadFilterNode
  private distortion: WaveShaperNode | null = null
  private delay: DelayNode | null = null
  private delayGain: GainNode | null = null
  private delayFeedback: GainNode | null = null
  private phaser: BiquadFilterNode[] = []
  private phaserLFO: OscillatorNode | null = null
  private phaserGain: GainNode | null = null
  private dryGain: GainNode
  private wetGain: GainNode

  // LFO components
  private lfo: OscillatorNode | null = null
  private lfoToPitchGain: GainNode | null = null
  private lfoToFilterGain: GainNode | null = null
  private lfoToVolumeGain: GainNode | null = null
  private lfoToPhaserRateGain: GainNode | null = null
  private lfoToDelayTimeGain: GainNode | null = null
  private volumeModGain: GainNode | null = null

  private noiseSource: AudioBufferSourceNode | null = null
  private noiseGain: GainNode | null = null

  private isPlaying = false
  private baseFrequency = 440
  private currentBpm: number

  constructor(
    audioContext: AudioContext,
    destination: AudioNode,
    private params: SynthParams,
    bpm: number,
  ) {
    this.audioContext = audioContext
    this.currentBpm = bpm

    // Create main oscillator
    this.oscillator1 = audioContext.createOscillator()
    this.oscillator1.type = params.waveform
    this.oscillator1.detune.value = params.detune

    // Create second oscillator if enabled
    if (params.osc2Enabled) {
      this.oscillator2 = audioContext.createOscillator()
      this.oscillator2.type = params.osc2Waveform
      this.oscillator2.detune.value = params.osc2Detune

      this.osc2Gain = audioContext.createGain()
      this.osc2Gain.gain.value = params.osc2Level

      // Phase modulation setup
      this.phaseModGain = audioContext.createGain()
      this.phaseModGain.gain.value = params.phaseModAmount

      // Connect phase modulation
      this.oscillator2.connect(this.phaseModGain)
      this.phaseModGain.connect(this.oscillator1.frequency)

      // Connect osc2 to mixer
      this.oscillator2.connect(this.osc2Gain)
    }

    // Create audio processing chain
    this.amplitudeGain = audioContext.createGain()
    this.filter = audioContext.createBiquadFilter()
    this.dryGain = audioContext.createGain()
    this.wetGain = audioContext.createGain()

    // Configure filter
    this.filter.type = params.filterType
    this.filter.frequency.value = params.filterFrequency
    this.filter.Q.value = params.filterResonance

    // Create LFO if enabled
    if (params.lfoEnabled) {
      this.createLFO()
    }

    // Create effects
    this.createEffects()

    // Create noise source if enabled
    if (params.noiseEnabled) {
      this.noiseGain = audioContext.createGain()
      this.noiseGain.gain.value = params.noiseLevel
      this.noiseSource = this.createNoiseBufferSource(audioContext, params.noiseType)
      this.noiseSource.connect(this.noiseGain)
    }

    // Connect audio processing chain
    this.connectAudioGraph(destination)

    // Set initial gain to 0
    this.amplitudeGain.gain.value = 0
  }

  private getLfoRate(): number {
    if (this.params.lfoBpmSync) {
      return bpmToHz(this.currentBpm, this.params.lfoBpmDivision)
    }
    return this.params.lfoRate
  }

  private getDelayTime(): number {
    if (this.params.delayBpmSync) {
      return bpmToSeconds(this.currentBpm, this.params.delayBpmDivision)
    }
    return this.params.delayTime
  }

  updateBpmSyncedParams(bpm: number) {
    this.currentBpm = bpm

    // Update LFO rate if BPM synced
    if (this.lfo && this.params.lfoBpmSync) {
      const newRate = this.getLfoRate()
      this.lfo.frequency.setValueAtTime(newRate, this.audioContext.currentTime)
    }

    // Update delay time if BPM synced
    if (this.delay && this.params.delayBpmSync) {
      const newDelayTime = this.getDelayTime()
      this.delay.delayTime.setValueAtTime(newDelayTime, this.audioContext.currentTime)
    }
  }

  private createLFO() {
    if (!this.params.lfoEnabled) return

    // Create main LFO
    this.lfo = this.audioContext.createOscillator()
    this.lfo.type = this.params.lfoWaveform
    this.lfo.frequency.value = this.getLfoRate()

    // Create modulation gain nodes for different destinations

    // Pitch modulation (vibrato)
    if (this.params.lfoToPitch > 0) {
      this.lfoToPitchGain = this.audioContext.createGain()
      this.lfoToPitchGain.gain.value = this.params.lfoToPitch
      this.lfo.connect(this.lfoToPitchGain)
      this.lfoToPitchGain.connect(this.oscillator1.frequency)

      if (this.oscillator2) {
        this.lfoToPitchGain.connect(this.oscillator2.frequency)
      }
    }

    // Filter modulation
    if (this.params.lfoToFilter > 0) {
      this.lfoToFilterGain = this.audioContext.createGain()
      this.lfoToFilterGain.gain.value = this.params.lfoToFilter
      this.lfo.connect(this.lfoToFilterGain)
      this.lfoToFilterGain.connect(this.filter.frequency)
    }

    // Volume modulation (tremolo)
    if (this.params.lfoToVolume > 0) {
      this.lfoToVolumeGain = this.audioContext.createGain()
      this.lfoToVolumeGain.gain.value = this.params.lfoToVolume
      this.volumeModGain = this.audioContext.createGain()
      this.volumeModGain.gain.value = 1 // Base level

      this.lfo.connect(this.lfoToVolumeGain)
      this.lfoToVolumeGain.connect(this.volumeModGain.gain)
    }

    // Phaser rate modulation
    if (this.params.lfoToPhaserRate > 0 && this.phaserLFO) {
      this.lfoToPhaserRateGain = this.audioContext.createGain()
      this.lfoToPhaserRateGain.gain.value = this.params.lfoToPhaserRate
      this.lfo.connect(this.lfoToPhaserRateGain)
      this.lfoToPhaserRateGain.connect(this.phaserLFO.frequency)
    }

    // Delay time modulation
    if (this.params.lfoToDelayTime > 0 && this.delay) {
      this.lfoToDelayTimeGain = this.audioContext.createGain()
      this.lfoToDelayTimeGain.gain.value = this.params.lfoToDelayTime * 0.001 // Scale to reasonable delay time range
      this.lfo.connect(this.lfoToDelayTimeGain)
      this.lfoToDelayTimeGain.connect(this.delay.delayTime)
    }
  }

  private createEffects() {
    // Distortion
    if (this.params.distortionEnabled) {
      this.distortion = this.audioContext.createWaveShaper()
      this.distortion.curve = this.makeDistortionCurve(this.params.distortionAmount)
      this.distortion.oversample = "4x"
    }

    // Delay
    if (this.params.delayEnabled) {
      this.delay = this.audioContext.createDelay(1.0)
      this.delay.delayTime.value = this.getDelayTime()
      this.delayGain = this.audioContext.createGain()
      this.delayGain.gain.value = this.params.delayWetLevel
      this.delayFeedback = this.audioContext.createGain()
      this.delayFeedback.gain.value = this.params.delayFeedback
    }

    // Phaser
    if (this.params.phaserEnabled) {
      // Create multiple all-pass filters for phaser effect
      for (let i = 0; i < 4; i++) {
        const filter = this.audioContext.createBiquadFilter()
        filter.type = "allpass"
        filter.frequency.value = 1000 + i * 200
        filter.Q.value = this.params.phaserFeedback
        this.phaser.push(filter)
      }

      // Create LFO for phaser
      this.phaserLFO = this.audioContext.createOscillator()
      this.phaserLFO.type = "sine"
      this.phaserLFO.frequency.value = this.params.phaserRate

      this.phaserGain = this.audioContext.createGain()
      this.phaserGain.gain.value = this.params.phaserDepth

      // Connect phaser LFO
      this.phaserLFO.connect(this.phaserGain)
      this.phaser.forEach((filter) => {
        this.phaserGain.connect(filter.frequency)
      })
    }
  }

  private createNoiseBufferSource(audioContext: AudioContext, type: "white" | "pink" = "white"): AudioBufferSourceNode {
    const bufferSize = 2 * audioContext.sampleRate
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate)
    const output = buffer.getChannelData(0)
    if (type === "white") {
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1
      }
    } else if (type === "pink") {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        b0 = 0.99886 * b0 + white * 0.0555179
        b1 = 0.99332 * b1 + white * 0.0750759
        b2 = 0.96900 * b2 + white * 0.1538520
        b3 = 0.86650 * b3 + white * 0.3104856
        b4 = 0.55000 * b4 + white * 0.5329522
        b5 = -0.7616 * b5 - white * 0.0168980
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362
        output[i] *= 0.11 // (roughly) compensate for gain
        b6 = white * 0.115926
      }
    }
    const noise = audioContext.createBufferSource()
    noise.buffer = buffer
    noise.loop = true
    return noise
  }

  private connectAudioGraph(destination: AudioNode) {
    let currentNode: AudioNode = this.filter

    // Connect oscillators and noise to filter
    this.oscillator1.connect(this.filter)
    if (this.oscillator2 && this.osc2Gain) {
      this.osc2Gain.connect(this.filter)
    }
    if (this.noiseSource && this.noiseGain) {
      this.noiseGain.connect(this.filter)
    }

    // Connect filter to amplitude envelope
    this.filter.connect(this.amplitudeGain)
    currentNode = this.amplitudeGain

    // Insert volume modulation if LFO is modulating volume
    if (this.volumeModGain) {
      currentNode.connect(this.volumeModGain)
      currentNode = this.volumeModGain
    }

    // Connect effects chain
    if (this.distortion) {
      currentNode.connect(this.distortion)
      currentNode = this.distortion
    }

    if (this.phaser.length > 0) {
      // Chain phaser filters
      currentNode.connect(this.phaser[0])
      for (let i = 0; i < this.phaser.length - 1; i++) {
        this.phaser[i].connect(this.phaser[i + 1])
      }
      currentNode = this.phaser[this.phaser.length - 1]
    }

    // Delay setup with feedback
    if (this.delay && this.delayGain && this.delayFeedback) {
      // Dry signal
      currentNode.connect(this.dryGain)
      this.dryGain.gain.value = 1 - this.params.delayWetLevel

      // Wet signal with delay
      currentNode.connect(this.delay)
      this.delay.connect(this.delayGain)
      this.delay.connect(this.delayFeedback)
      this.delayFeedback.connect(this.delay)

      // Mix dry and wet
      this.dryGain.connect(destination)
      this.delayGain.connect(destination)
    } else {
      currentNode.connect(destination)
    }
  }

  private makeDistortionCurve(amount: number): Float32Array {
    const samples = 44100
    const curve = new Float32Array(samples)
    const deg = Math.PI / 180

    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x))
    }

    return curve
  }

  start(midiNote: number, velocity: number) {
    if (this.isPlaying) return

    const now = this.audioContext.currentTime
    // Determine base frequency
    let frequency = this.params.fixedPitchMode ? this.params.fixedPitch : this.midiNoteToFrequency(midiNote)
    this.baseFrequency = frequency
    const normalizedVelocity = velocity / 127

    // Pitch envelope
    const pitchEnvAmt = this.params.pitchEnvAmount
    const envA = this.params.pitchEnvAttack
    const envD = this.params.pitchEnvDecay
    const envS = this.params.pitchEnvSustain
    const envR = this.params.pitchEnvRelease
    // Start at pitch + amount, decay to base
    const freqStart = frequency * Math.pow(2, pitchEnvAmt / 12)
    const freqSustain = frequency * Math.pow(2, (pitchEnvAmt * envS) / 12)

    // Set oscillator frequencies
    this.oscillator1.frequency.setValueAtTime(freqStart, now)
    this.oscillator1.frequency.linearRampToValueAtTime(freqSustain, now + envA)
    this.oscillator1.frequency.linearRampToValueAtTime(frequency, now + envA + envD)
    // Sustain at base frequency
    // Release handled in stop()
    if (this.oscillator2) {
      this.oscillator2.frequency.setValueAtTime(freqStart, now)
      this.oscillator2.frequency.linearRampToValueAtTime(freqSustain, now + envA)
      this.oscillator2.frequency.linearRampToValueAtTime(frequency, now + envA + envD)
    }

    // Start oscillators
    this.oscillator1.start(now)
    if (this.oscillator2) {
      this.oscillator2.start(now)
    }
    // Start noise
    if (this.noiseSource) {
      this.noiseSource.start(now)
    }
    // Start LFO
    if (this.lfo) {
      this.lfo.start(now)
    }
    // Start phaser LFO
    if (this.phaserLFO) {
      this.phaserLFO.start(now)
    }
    this.isPlaying = true
    // Amplitude envelope
    const maxGain = this.params.masterVolume * normalizedVelocity
    this.amplitudeGain.gain.setValueAtTime(0, now)
    this.amplitudeGain.gain.linearRampToValueAtTime(maxGain, now + this.params.attackTime)
    this.amplitudeGain.gain.linearRampToValueAtTime(
      maxGain * this.params.sustainLevel,
      now + this.params.attackTime + this.params.decayTime,
    )
    // Filter envelope
    const baseFreq = this.params.filterFrequency
    const envelopeAmount = this.params.filterEnvelopeAmount
    const maxFilterFreq = Math.min(baseFreq + baseFreq * envelopeAmount, 20000)
    this.filter.frequency.setValueAtTime(baseFreq, now)
    this.filter.frequency.linearRampToValueAtTime(maxFilterFreq, now + this.params.filterAttackTime)
    this.filter.frequency.linearRampToValueAtTime(
      baseFreq + (maxFilterFreq - baseFreq) * this.params.filterSustainLevel,
      now + this.params.filterAttackTime + this.params.decayTime,
    )
  }

  stop() {
    if (!this.isPlaying) return

    const now = this.audioContext.currentTime

    // Release amplitude envelope
    this.amplitudeGain.gain.cancelScheduledValues(now)
    this.amplitudeGain.gain.setValueAtTime(this.amplitudeGain.gain.value, now)
    this.amplitudeGain.gain.linearRampToValueAtTime(0, now + this.params.releaseTime)

    // Release filter envelope
    this.filter.frequency.cancelScheduledValues(now)
    this.filter.frequency.setValueAtTime(this.filter.frequency.value, now)
    this.filter.frequency.linearRampToValueAtTime(this.params.filterFrequency, now + this.params.filterReleaseTime)

    // Stop oscillators after release
    const stopTime = now + Math.max(this.params.releaseTime, this.params.filterReleaseTime) + 0.1
    this.oscillator1.stop(stopTime)
    if (this.oscillator2) {
      this.oscillator2.stop(stopTime)
    }
    if (this.lfo) {
      this.lfo.stop(stopTime)
    }
    if (this.phaserLFO) {
      this.phaserLFO.stop(stopTime)
    }
    // Stop noise
    if (this.noiseSource) {
      try {
        this.noiseSource.stop(now)
      } catch {}
    }

    this.isPlaying = false
  }

  private midiNoteToFrequency(midiNote: number): number {
    return 440 * Math.pow(2, (midiNote - 69) / 12)
  }
}
