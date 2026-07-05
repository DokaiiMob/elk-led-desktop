import type { AudioSource } from '../../audio/bassListener'
import { BassMeter } from '../BassMeter'
import { Card } from '../Card'
import { Button } from '../ui/Button'
import { Slider } from '../ui/Slider'

interface MusicPanelProps {
  connected: boolean
  musicRunning: boolean
  bassLevel: number
  audioSources: AudioSource[]
  selectedAudioId: string
  audioHint: string | null
  musicColor: string
  sensitivity: number
  minBright: number
  rainbowPlusMusic: boolean
  rainbowSpeed: number
  onAudioChange: (id: string) => void
  onRefreshAudio: () => void
  onMusicColorChange: (c: string) => void
  onSensitivityChange: (v: number) => void
  onMinBrightChange: (v: number) => void
  onRainbowPlusChange: (v: boolean) => void
  onStart: () => void
  onStop: () => void
  onStartRainbow: () => void
  onStopRainbow: () => void
  rainbowRunning: boolean
  onRainbowSpeedChange: (v: number) => void
}

export function MusicPanel(props: MusicPanelProps): React.JSX.Element {
  const recommended = props.audioSources.find((s) => s.recommended)

  return (
    <>
      <Card title="Источник звука">
        <p className="hint hint--info">
          {props.audioHint ??
            'Звук через стандартный микрофонный вход: микрофон, «Стерео микшер» или VB-Audio Cable. WASAPI не используется.'}
        </p>

        <label className="field-label" htmlFor="audio-source">
          Устройство записи
        </label>
        <select
          id="audio-source"
          className="select"
          value={props.selectedAudioId}
          onChange={(e) => props.onAudioChange(e.target.value)}
        >
          {props.audioSources.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
              {s.recommended ? ' ★' : ''}
            </option>
          ))}
        </select>

        {recommended && props.selectedAudioId !== recommended.id && (
          <p className="hint">Рекомендуется: {recommended.label}</p>
        )}

        <div className="btn-row">
          <Button variant="secondary" onClick={props.onRefreshAudio}>
            Обновить список устройств
          </Button>
        </div>
      </Card>

      <Card title="Режим «в такт музыке»">
        <BassMeter level={props.bassLevel} active={props.musicRunning} />

        {props.musicRunning && props.bassLevel < 0.05 && (
          <p className="hint">
            Подождите 5–10 сек калибровки. Выберите «Стерео микшер» или поднесите микрофон к колонке.
          </p>
        )}

        <div className="color-row">
          <input
            type="color"
            value={props.musicColor}
            onChange={(e) => props.onMusicColorChange(e.target.value)}
            aria-label="Цвет в режиме музыки"
          />
          <input
            type="text"
            className="text-input hex-input"
            value={props.musicColor}
            onChange={(e) => props.onMusicColorChange(e.target.value)}
          />
        </div>

        <Slider
          label="Чувствительность к басу"
          value={props.sensitivity}
          min={10}
          max={100}
          unit="%"
          onChange={props.onSensitivityChange}
        />
        <Slider
          label="Мин. яркость в тишине"
          value={props.minBright}
          min={0}
          max={80}
          unit="%"
          onChange={props.onMinBrightChange}
        />

        <label className="checkbox">
          <input
            type="checkbox"
            checked={props.rainbowPlusMusic}
            onChange={(e) => props.onRainbowPlusChange(e.target.checked)}
          />
          Радуга + музыка (цвет радугой, яркость от баса)
        </label>

        <div className="btn-row btn-row--split">
          <Button onClick={props.onStart} disabled={props.musicRunning || !props.connected}>
            Старт
          </Button>
          <Button variant="secondary" onClick={props.onStop} disabled={!props.musicRunning}>
            Стоп
          </Button>
        </div>
      </Card>

      <Card title="Радуга">
        <Slider
          label="Скорость смены цвета"
          value={props.rainbowSpeed}
          min={0.5}
          max={15}
          step={0.5}
          onChange={props.onRainbowSpeedChange}
        />
        <div className="btn-row btn-row--split">
          <Button onClick={props.onStartRainbow} disabled={props.rainbowRunning || !props.connected}>
            Старт
          </Button>
          <Button variant="secondary" onClick={props.onStopRainbow} disabled={!props.rainbowRunning}>
            Стоп
          </Button>
        </div>
      </Card>
    </>
  )
}
