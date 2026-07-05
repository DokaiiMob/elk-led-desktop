const SAMPLE_RATE = 44100
const BASS_LOW_HZ = 20
const BASS_HIGH_HZ = 200
const DECAY = 0.82
const GAIN = 5

export type AudioSourceType = 'microphone' | 'system'

export interface AudioSource {
  id: string
  label: string
  type: AudioSourceType
  deviceId?: string
}

function fftBassEnergy(samples: Float32Array, sampleRate: number): number {
  const n = samples.length
  if (n < 2) return 0

  const windowed = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    windowed[i] = samples[i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1)))
  }

  const re = new Float32Array(n)
  const im = new Float32Array(n)
  re.set(windowed)
  fftInPlace(re, im)

  const half = Math.floor(n / 2)
  let energy = 0
  for (let k = 1; k < half; k++) {
    const freq = (k * sampleRate) / n
    if (freq < BASS_LOW_HZ || freq > BASS_HIGH_HZ) continue
    energy += Math.hypot(re[k], im[k])
  }

  const norm = energy / (n * 0.25)
  return Math.min(1, norm * GAIN)
}

function fftInPlace(re: Float32Array, im: Float32Array): void {
  const n = re.length
  let j = 0
  for (let i = 1; i < n; i++) {
    let bit = n >> 1
    while (j & bit) {
      j ^= bit
      bit >>= 1
    }
    j ^= bit
    if (i < j) {
      ;[re[i], re[j]] = [re[j], re[i]]
      ;[im[i], im[j]] = [im[j], im[i]]
    }
  }

  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len
    const wlenRe = Math.cos(ang)
    const wlenIm = Math.sin(ang)
    for (let i = 0; i < n; i += len) {
      let wRe = 1
      let wIm = 0
      for (let k = 0; k < len / 2; k++) {
        const uRe = re[i + k]
        const uIm = im[i + k]
        const vRe = re[i + k + len / 2] * wRe - im[i + k + len / 2] * wIm
        const vIm = re[i + k + len / 2] * wIm + im[i + k + len / 2] * wRe
        re[i + k] = uRe + vRe
        im[i + k] = uIm + vIm
        re[i + k + len / 2] = uRe - vRe
        im[i + k + len / 2] = uIm - vIm
        const nextWRe = wRe * wlenRe - wIm * wlenIm
        wIm = wRe * wlenIm + wIm * wlenRe
        wRe = nextWRe
      }
    }
  }
}

export class BassListener {
  private level = 0
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private stream: MediaStream | null = null
  private rafId: number | null = null
  private buffer: Float32Array | null = null

  get bassLevel(): number {
    return Math.min(1, this.level)
  }

  async start(source: AudioSource): Promise<void> {
    this.stop()
    this.audioContext = new AudioContext({ sampleRate: SAMPLE_RATE })
    this.analyser = this.audioContext.createAnalyser()
    this.analyser.fftSize = 2048
    this.buffer = new Float32Array(this.analyser.fftSize)

    if (source.type === 'microphone') {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: source.deviceId ? { deviceId: { exact: source.deviceId } } : true,
        video: false
      })
    } else {
      this.stream = await navigator.mediaDevices.getDisplayMedia({
        audio: true,
        video: true
      })
      this.stream.getVideoTracks().forEach((track) => {
        track.stop()
        this.stream?.removeTrack(track)
      })
    }

    const input = this.audioContext.createMediaStreamSource(this.stream)
    input.connect(this.analyser)

    const tick = (): void => {
      if (!this.analyser || !this.buffer) return
      this.analyser.getFloatTimeDomainData(this.buffer)
      const energy = fftBassEnergy(this.buffer, this.audioContext?.sampleRate ?? SAMPLE_RATE)
      this.level = Math.max(energy, this.level * DECAY)
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
    this.buffer = null
    this.level = 0
  }
}

export async function listAudioSources(): Promise<AudioSource[]> {
  const sources: AudioSource[] = []

  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    devices
      .filter((d) => d.kind === 'audioinput')
      .forEach((d, index) => {
        sources.push({
          id: `mic:${d.deviceId || index}`,
          label: `Микрофон: ${d.label || `Устройство ${index + 1}`}`,
          type: 'microphone',
          deviceId: d.deviceId || undefined
        })
      })
  } catch {
    sources.push({
      id: 'mic:default',
      label: 'Микрофон (по умолчанию)',
      type: 'microphone'
    })
  }

  sources.push({
    id: 'loopback:display',
    label: 'Системный звук (экран с аудио)',
    type: 'system'
  })

  return sources
}
