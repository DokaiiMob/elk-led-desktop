export type AudioSourceKind = 'microphone' | 'stereo_mix' | 'virtual_device'

export interface AudioSource {
  id: string
  label: string
  kind: AudioSourceKind
  deviceId?: string
  recommended?: boolean
}

const STEREO_MIX_RE = /stereo mix|stereomix|стерео микш|mixagem|what u hear|wave out/i
const VIRTUAL_RE = /cable output|vb-audio|virtual cable|voicemeeter|blackhole|loopback/i

function classifyDevice(label: string): AudioSourceKind {
  if (STEREO_MIX_RE.test(label)) return 'stereo_mix'
  if (VIRTUAL_RE.test(label)) return 'virtual_device'
  return 'microphone'
}

export async function requestAudioPermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    stream.getTracks().forEach((t) => t.stop())
    return true
  } catch {
    return false
  }
}

export async function listAudioSources(): Promise<AudioSource[]> {
  await requestAudioPermission()

  const sources: AudioSource[] = []
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    const inputs = devices.filter((d) => d.kind === 'audioinput')

    for (const [index, d] of inputs.entries()) {
      const label = d.label || `Устройство ${index + 1}`
      const kind = classifyDevice(label)
      sources.push({
        id: `in:${d.deviceId || index}`,
        label:
          kind === 'stereo_mix'
            ? `Системный звук: ${label}`
            : kind === 'virtual_device'
              ? `Виртуальный вход: ${label}`
              : `Микрофон: ${label}`,
        kind,
        deviceId: d.deviceId || undefined,
        recommended: kind === 'stereo_mix'
      })
    }
  } catch {
    // ignore
  }

  if (sources.length === 0) {
    sources.push({
      id: 'mic:default',
      label: 'Микрофон (по умолчанию)',
      kind: 'microphone'
    })
  }

  const stereo = sources.find((s) => s.kind === 'stereo_mix')
  if (stereo) stereo.recommended = true

  return sources
}

export function getAudioSourceHint(sources: AudioSource[]): string | null {
  if (sources.some((s) => s.kind === 'stereo_mix')) {
    return 'Для звука с ПК используйте «Стерео микшер» — без WASAPI и драйверов.'
  }
  return 'Включите «Стерео микшер» в Windows: Параметры звука → Запись → Показать отключённые. Или используйте микрофон у колонок.'
}
