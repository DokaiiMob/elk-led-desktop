import type { AudioSource } from './audioSources'
import { AutoGain } from './autoGain'

export type { AudioSource, AudioSourceKind } from './audioSources'
export { getAudioSourceHint, listAudioSources, requestAudioPermission } from './audioSources'

const BASS_LOW_HZ = 20
const BASS_HIGH_HZ = 300
const DECAY = 0.75

function measureBassFreq(analyser: AnalyserNode, freqData: Float32Array, sampleRate: number): number {
  const binWidth = sampleRate / analyser.fftSize
  let sum = 0
  let count = 0

  for (let i = 1; i < freqData.length; i++) {
    const freq = i * binWidth
    if (freq < BASS_LOW_HZ || freq > BASS_HIGH_HZ) continue
    sum += freqData[i]
    count++
  }

  if (count === 0) return 0
  return sum / count
}

function measureRms(timeData: Float32Array): number {
  let sum = 0
  for (let i = 0; i < timeData.length; i++) {
    sum += timeData[i] * timeData[i]
  }
  return Math.sqrt(sum / timeData.length)
}

export class BassListener {
  private level = 0
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private stream: MediaStream | null = null
  private rafId: number | null = null
  private freqBuffer: Float32Array | null = null
  private timeBuffer: Float32Array | null = null
  private autoGain = new AutoGain()

  get bassLevel(): number {
    return Math.min(1, this.level)
  }

  async start(source: AudioSource): Promise<void> {
    this.stop()
    this.autoGain.reset()

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: source.deviceId
        ? {
            deviceId: { ideal: source.deviceId },
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
          }
        : { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      video: false
    })

    const audioTrack = this.stream.getAudioTracks()[0]
    if (!audioTrack || audioTrack.readyState !== 'live') {
      this.stop()
      throw new Error('Аудиопоток не активен. Проверьте выбранное устройство.')
    }

    this.audioContext = new AudioContext()
    await this.audioContext.resume()

    this.analyser = this.audioContext.createAnalyser()
    this.analyser.fftSize = 4096
    this.analyser.smoothingTimeConstant = 0.2
    this.analyser.minDecibels = -100
    this.analyser.maxDecibels = -5
    this.freqBuffer = new Float32Array(this.analyser.frequencyBinCount)
    this.timeBuffer = new Float32Array(this.analyser.fftSize)

    const input = this.audioContext.createMediaStreamSource(this.stream)
    input.connect(this.analyser)

    const tick = (): void => {
      if (!this.analyser || !this.freqBuffer || !this.timeBuffer || !this.audioContext) return

      this.analyser.getFloatFrequencyData(this.freqBuffer)
      this.analyser.getFloatTimeDomainData(this.timeBuffer)

      const sampleRate = this.audioContext.sampleRate
      const freqDb = measureBassFreq(this.analyser, this.freqBuffer, sampleRate)
      const freqLinear = Math.pow(10, freqDb / 20)
      const rms = measureRms(this.timeBuffer)

      const raw = Math.max(freqLinear, rms * 2.5)
      const normalized = this.autoGain.normalize(raw)
      this.level = Math.max(normalized, this.level * DECAY)
      this.rafId = requestAnimationFrame(tick)
    }
    this.rafId = requestAnimationFrame(tick)
  }

  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    this.stream?.getTracks().forEach((t) => t.stop())
    this.stream = null
    void this.audioContext?.close()
    this.audioContext = null
    this.analyser = null
    this.freqBuffer = null
    this.timeBuffer = null
    this.level = 0
    this.autoGain.reset()
  }
}
