import { useCallback, useEffect, useRef, useState } from 'react'
import { BassListener, AudioSource, listAudioSources } from './audio/bassListener'
import { ElkBleClient } from './ble/elkBle'
import { Card } from './components/Card'
import { hexToRgb, hsvToRgb } from './utils/color'

export default function App(): React.JSX.Element {
  const bleRef = useRef(new ElkBleClient())

  const [deviceName, setDeviceName] = useState<string | null>(null)
  const [status, setStatus] = useState('Подключитесь к ленте')
  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected] = useState(false)

  const [audioSources, setAudioSources] = useState<AudioSource[]>([])
  const [selectedAudioId, setSelectedAudioId] = useState('')

  const [musicColor, setMusicColor] = useState('#FF3366')
  const [sensitivity, setSensitivity] = useState(80)
  const [minBright, setMinBright] = useState(15)
  const [rainbowPlusMusic, setRainbowPlusMusic] = useState(false)
  const [musicRunning, setMusicRunning] = useState(false)

  const [rainbowRunning, setRainbowRunning] = useState(false)
  const [rainbowSpeed, setRainbowSpeed] = useState(3)

  const [manualBright, setManualBright] = useState(80)
  const [manualColor, setManualColor] = useState('#FFFFFF')

  const bassRef = useRef<BassListener | null>(null)
  const rainbowPhaseRef = useRef(0)
  const musicTimerRef = useRef<number | null>(null)
  const rainbowTimerRef = useRef<number | null>(null)

  useEffect(() => {
    void listAudioSources().then((sources) => {
      setAudioSources(sources)
      if (sources.length > 0) setSelectedAudioId(sources[0].id)
    })
    return () => {
      bassRef.current?.stop()
      if (musicTimerRef.current) window.clearInterval(musicTimerRef.current)
      if (rainbowTimerRef.current) window.clearInterval(rainbowTimerRef.current)
      bleRef.current.disconnect()
    }
  }, [])

  const stopMusic = useCallback(() => {
    if (musicTimerRef.current) {
      window.clearInterval(musicTimerRef.current)
      musicTimerRef.current = null
    }
    bassRef.current?.stop()
    bassRef.current = null
    setMusicRunning(false)
  }, [])

  const stopRainbow = useCallback(() => {
    if (rainbowTimerRef.current) {
      window.clearInterval(rainbowTimerRef.current)
      rainbowTimerRef.current = null
    }
    setRainbowRunning(false)
  }, [])

  const handleConnect = async (): Promise<void> => {
    setConnecting(true)
    setStatus('Выберите устройство ELK в диалоге Bluetooth...')
    try {
      const ok = await bleRef.current.connect()
      if (ok) {
        setConnected(true)
        setDeviceName(bleRef.current.deviceName ?? 'ELK-BLEDOM')
        setStatus('Подключено')
      } else {
        setConnected(false)
        setStatus(`Ошибка: ${bleRef.current.connectError ?? 'не удалось подключиться'}`)
      }
    } catch (error) {
      setConnected(false)
      setStatus(error instanceof Error ? error.message : 'Ошибка подключения')
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = (): void => {
    stopMusic()
    stopRainbow()
    bleRef.current.disconnect()
    setConnected(false)
    setDeviceName(null)
    setStatus('Отключено')
  }

  const startMusic = async (): Promise<void> => {
    if (!connected) {
      setStatus('Сначала подключитесь к ленте')
      return
    }
    stopRainbow()
    const source = audioSources.find((s) => s.id === selectedAudioId) ?? audioSources[0]
    if (!source) return

    try {
      const listener = new BassListener()
      await listener.start(source)
      bassRef.current = listener
      setMusicRunning(true)

      musicTimerRef.current = window.setInterval(() => {
        const level = bassRef.current?.bassLevel ?? 0
        const sens = sensitivity / 100
        const brightness = Math.min(100, Math.round(minBright + (100 - minBright) * level * sens))
        let r: number
        let g: number
        let b: number
        if (rainbowPlusMusic) {
          rainbowPhaseRef.current = (rainbowPhaseRef.current + rainbowSpeed) % 360
          ;[r, g, b] = hsvToRgb(rainbowPhaseRef.current)
        } else {
          ;[r, g, b] = hexToRgb(musicColor)
        }
        bleRef.current.setColorAndBrightness(r, g, b, brightness)
      }, 12)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Не удалось запустить захват звука')
    }
  }

  const startRainbow = (): void => {
    if (!connected) {
      setStatus('Сначала подключитесь к ленте')
      return
    }
    stopMusic()
    setRainbowRunning(true)
    rainbowTimerRef.current = window.setInterval(() => {
      rainbowPhaseRef.current = (rainbowPhaseRef.current + rainbowSpeed) % 360
      const [r, g, b] = hsvToRgb(rainbowPhaseRef.current)
      bleRef.current.setColorAndBrightness(r, g, b, 80)
    }, 35)
  }

  return (
    <div className="app">
      <header>
        <h1>ELK-BLEDOM</h1>
        <p className="subtitle">Управление LED-лентой</p>
      </header>

      <Card title="Подключение к ленте">
        <p className="hint">
          Нажмите «Подключиться» — откроется системный диалог Bluetooth. Выберите устройство ELK-BLEDOM.
        </p>
        {deviceName && <p className="field-label">Устройство: {deviceName}</p>}
        <div className="row">
          <button type="button" onClick={() => void handleConnect()} disabled={connecting || connected}>
            {connecting ? 'Подключение...' : 'Подключиться'}
          </button>
          <button type="button" onClick={handleDisconnect} disabled={!connected}>
            Отключиться
          </button>
        </div>
        <p className={`status ${connected ? 'ok' : ''}`}>{status}</p>
      </Card>

      <Card title="Звук для режима музыки">
        <label className="field-label">Источник звука</label>
        <select
          className="select"
          value={selectedAudioId}
          onChange={(e) => setSelectedAudioId(e.target.value)}
        >
          {audioSources.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <p className="hint">
          Для системного звука выберите «экран с аудио» — откроется диалог выбора экрана.
        </p>
      </Card>

      <Card title="Режим музыки (в такт низких частот)">
        <label className="field-label">Цвет ленты</label>
        <div className="row">
          <input type="color" value={musicColor} onChange={(e) => setMusicColor(e.target.value)} />
          <input
            type="text"
            value={musicColor}
            onChange={(e) => setMusicColor(e.target.value)}
            className="hex-input"
          />
        </div>

        <label className="field-label">Чувствительность к басу: {sensitivity}%</label>
        <input
          type="range"
          min={10}
          max={100}
          value={sensitivity}
          onChange={(e) => setSensitivity(Number(e.target.value))}
        />

        <label className="field-label">Минимальная яркость в тишине: {minBright}%</label>
        <input
          type="range"
          min={0}
          max={80}
          value={minBright}
          onChange={(e) => setMinBright(Number(e.target.value))}
        />

        <label className="checkbox">
          <input
            type="checkbox"
            checked={rainbowPlusMusic}
            onChange={(e) => setRainbowPlusMusic(e.target.checked)}
          />
          Радуга + музыка (цвет радугой, яркость от баса)
        </label>

        <div className="row">
          <button type="button" onClick={() => void startMusic()} disabled={musicRunning || !connected}>
            Старт — музыка в такт
          </button>
          <button type="button" onClick={stopMusic} disabled={!musicRunning}>
            Стоп
          </button>
        </div>
      </Card>

      <Card title="Режим радуги">
        <label className="field-label">Скорость смены цвета: {rainbowSpeed.toFixed(1)}</label>
        <input
          type="range"
          min={0.5}
          max={15}
          step={0.5}
          value={rainbowSpeed}
          onChange={(e) => setRainbowSpeed(Number(e.target.value))}
        />
        <div className="row">
          <button type="button" onClick={startRainbow} disabled={rainbowRunning || !connected}>
            Старт — радуга
          </button>
          <button type="button" onClick={stopRainbow} disabled={!rainbowRunning}>
            Стоп радуги
          </button>
        </div>
      </Card>

      <Card title="Ручное управление">
        <label className="field-label">Яркость: {manualBright}%</label>
        <input
          type="range"
          min={0}
          max={100}
          value={manualBright}
          onChange={(e) => {
            const value = Number(e.target.value)
            setManualBright(value)
            if (connected) bleRef.current.setBrightness(value)
          }}
        />

        <label className="field-label">Цвет (RGB)</label>
        <div className="row">
          <input type="color" value={manualColor} onChange={(e) => setManualColor(e.target.value)} />
          <input
            type="text"
            value={manualColor}
            onChange={(e) => setManualColor(e.target.value)}
            className="hex-input"
          />
          <button
            type="button"
            onClick={() => {
              const [r, g, b] = hexToRgb(manualColor)
              bleRef.current.setColorAndBrightness(r, g, b, manualBright)
            }}
            disabled={!connected}
          >
            Применить
          </button>
        </div>

        <div className="row">
          <button type="button" onClick={() => void bleRef.current.setPower(true)} disabled={!connected}>
            Включить ленту
          </button>
          <button type="button" onClick={() => void bleRef.current.setPower(false)} disabled={!connected}>
            Выключить ленту
          </button>
        </div>
      </Card>
    </div>
  )
}
