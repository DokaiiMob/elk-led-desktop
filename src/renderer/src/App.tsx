import { useCallback, useEffect, useRef, useState } from 'react'
import {
  BassListener,
  AudioSource,
  getAudioSourceHint,
  listAudioSources
} from './audio/bassListener'
import { ElkBleClient } from './ble/elkBle'
import { BluetoothPicker } from './components/BluetoothPicker'
import { ConnectPanel } from './components/panels/ConnectPanel'
import { EffectsPanel } from './components/panels/EffectsPanel'
import { ManualPanel } from './components/panels/ManualPanel'
import { MusicPanel } from './components/panels/MusicPanel'
import { ColorPreview } from './components/ui/ColorPreview'
import { StatusPill } from './components/ui/StatusPill'
import { TabId, TabNav } from './components/ui/TabNav'
import { useScenes } from './hooks/useScenes'
import { useSoftAnimations, SoftAnimationType } from './hooks/useSoftAnimations'
import { hexToRgb, hsvToRgb } from './utils/color'

type StatusKind = 'default' | 'ok' | 'cancelled' | 'error'

export default function App(): React.JSX.Element {
  const bleRef = useRef(new ElkBleClient())

  const [activeTab, setActiveTab] = useState<TabId>('connect')
  const [deviceName, setDeviceName] = useState<string | null>(null)
  const [status, setStatus] = useState('Подключитесь к ленте')
  const [statusKind, setStatusKind] = useState<StatusKind>('default')
  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected] = useState(false)
  const [hasLastDevice, setHasLastDevice] = useState(false)
  const [showAllBleDevices, setShowAllBleDevices] = useState(false)

  const [audioSources, setAudioSources] = useState<AudioSource[]>([])
  const [audioHint, setAudioHint] = useState<string | null>(null)
  const [selectedAudioId, setSelectedAudioId] = useState('')
  const [bassLevel, setBassLevel] = useState(0)

  const [musicColor, setMusicColor] = useState('#FF3366')
  const [sensitivity, setSensitivity] = useState(85)
  const [minBright, setMinBright] = useState(10)
  const [rainbowPlusMusic, setRainbowPlusMusic] = useState(false)
  const [musicRunning, setMusicRunning] = useState(false)

  const [rainbowRunning, setRainbowRunning] = useState(false)
  const [rainbowSpeed, setRainbowSpeed] = useState(3)

  const [manualBright, setManualBright] = useState(80)
  const [manualColor, setManualColor] = useState('#FFFFFF')

  const [builtinEffect, setBuiltinEffect] = useState(0x87)
  const [builtinSpeed, setBuiltinSpeed] = useState(50)
  const [lotusPattern, setLotusPattern] = useState(7)
  const [lotusSpeed, setLotusSpeed] = useState(50)
  const [effectProtocol, setEffectProtocol] = useState<'standard' | 'lotus'>('standard')
  const [whiteTemp, setWhiteTemp] = useState(136)
  const [softColor, setSoftColor] = useState('#FFFFFF')
  const [softSpeed, setSoftSpeed] = useState(3)
  const [sceneName, setSceneName] = useState('')

  const bassRef = useRef<BassListener | null>(null)
  const rainbowPhaseRef = useRef(0)
  const musicTimerRef = useRef<number | null>(null)
  const rainbowTimerRef = useRef<number | null>(null)

  const { scenes, saveScene, deleteScene } = useScenes()

  const stopRainbow = useCallback(() => {
    if (rainbowTimerRef.current) {
      window.clearInterval(rainbowTimerRef.current)
      rainbowTimerRef.current = null
    }
    setRainbowRunning(false)
  }, [])

  const softAnimations = useSoftAnimations({
    ble: bleRef.current,
    connected,
    onStopOthers: () => {
      if (musicTimerRef.current) {
        window.clearInterval(musicTimerRef.current)
        musicTimerRef.current = null
      }
      bassRef.current?.stop()
      bassRef.current = null
      setMusicRunning(false)
      setBassLevel(0)
      if (rainbowTimerRef.current) {
        window.clearInterval(rainbowTimerRef.current)
        rainbowTimerRef.current = null
      }
      setRainbowRunning(false)
    }
  })

  const stopMusic = useCallback(() => {
    if (musicTimerRef.current) {
      window.clearInterval(musicTimerRef.current)
      musicTimerRef.current = null
    }
    bassRef.current?.stop()
    bassRef.current = null
    setMusicRunning(false)
    setBassLevel(0)
  }, [])

  const stopAllModes = useCallback(() => {
    stopMusic()
    stopRainbow()
    softAnimations.stop()
  }, [stopMusic, stopRainbow, softAnimations])

  const refreshAudio = useCallback(async () => {
    const sources = await listAudioSources()
    setAudioSources(sources)
    setAudioHint(getAudioSourceHint(sources))
    const recommended = sources.find((s) => s.recommended)
    if (recommended) setSelectedAudioId(recommended.id)
    else if (sources.length > 0 && !sources.some((s) => s.id === selectedAudioId)) {
      setSelectedAudioId(sources[0].id)
    }
  }, [selectedAudioId])

  useEffect(() => {
    void refreshAudio()
    void bleRef.current.getKnownDevices().then((devices) => {
      const lastId = localStorage.getItem('elk-last-device-id')
      setHasLastDevice(!!lastId && devices.some((d) => d.id === lastId))
    })
    return () => {
      bassRef.current?.stop()
      if (musicTimerRef.current) window.clearInterval(musicTimerRef.current)
      if (rainbowTimerRef.current) window.clearInterval(rainbowTimerRef.current)
      softAnimations.stop()
      bleRef.current.disconnect()
    }
  }, [refreshAudio, softAnimations])

  const applyConnectionResult = (result: { ok: boolean; cancelled?: boolean; error?: string }): void => {
    if (result.ok) {
      setConnected(true)
      setDeviceName(bleRef.current.deviceName ?? 'ELK-BLEDOM')
      setStatus('Готово к управлению')
      setStatusKind('ok')
      setActiveTab('music')
      return
    }
    setConnected(false)
    if (result.cancelled) {
      setStatus(result.error ?? 'Подключение отменено')
      setStatusKind('cancelled')
      return
    }
    setStatus(result.error ?? 'Не удалось подключиться')
    setStatusKind('error')
  }

  const handleConnect = async (): Promise<void> => {
    setConnecting(true)
    setStatus('Выберите устройство в списке…')
    applyConnectionResult(await bleRef.current.connect(showAllBleDevices))
    setConnecting(false)
  }

  const handleReconnect = async (): Promise<void> => {
    setConnecting(true)
    setStatus('Переподключение…')
    applyConnectionResult(await bleRef.current.reconnectLast())
    setConnecting(false)
  }

  const handleDisconnect = (): void => {
    stopAllModes()
    bleRef.current.disconnect()
    setConnected(false)
    setDeviceName(null)
    setStatus('Отключено')
    setStatusKind('default')
    setActiveTab('connect')
  }

  const requireConnected = (): boolean => {
    if (connected) return true
    setStatus('Сначала подключитесь к ленте')
    setStatusKind('error')
    setActiveTab('connect')
    return false
  }

  const startMusic = async (): Promise<void> => {
    if (!requireConnected()) return
    stopAllModes()
    const source = audioSources.find((s) => s.id === selectedAudioId) ?? audioSources[0]
    if (!source) return

    try {
      const listener = new BassListener()
      await listener.start(source)
      bassRef.current = listener
      setMusicRunning(true)
      bleRef.current.switchToRgbMode()

      musicTimerRef.current = window.setInterval(() => {
        const level = bassRef.current?.bassLevel ?? 0
        setBassLevel(level)
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

      setStatus('Музыкальный режим активен')
      setStatusKind('ok')
    } catch (error) {
      setMusicRunning(false)
      setStatus(error instanceof Error ? error.message : 'Ошибка захвата звука')
      setStatusKind('error')
    }
  }

  const startRainbow = (): void => {
    if (!requireConnected()) return
    stopAllModes()
    bleRef.current.switchToRgbMode()
    setRainbowRunning(true)
    rainbowTimerRef.current = window.setInterval(() => {
      rainbowPhaseRef.current = (rainbowPhaseRef.current + rainbowSpeed) % 360
      const [r, g, b] = hsvToRgb(rainbowPhaseRef.current)
      bleRef.current.setColorAndBrightness(r, g, b, 80)
    }, 35)
  }

  const previewColor = musicRunning ? musicColor : manualColor
  const previewBright = musicRunning ? Math.round(minBright + (100 - minBright) * bassLevel) : manualBright

  return (
    <div className="app-shell">
      <BluetoothPicker showAll={showAllBleDevices} />

      <header className="app-header">
        <div className="app-header__brand">
          <h1>ELK LED</h1>
          <p>Управление RGB-лентой</p>
        </div>
        <StatusPill
          connected={connected}
          deviceName={deviceName}
          message={status}
          kind={statusKind}
        />
        <ColorPreview color={previewColor} brightness={previewBright} />
      </header>

      <TabNav
        active={activeTab}
        onChange={setActiveTab}
        disabled={{ music: !connected, effects: !connected, manual: !connected }}
      />

      <main className="app-main" role="tabpanel">
        {activeTab === 'connect' && (
          <ConnectPanel
            connected={connected}
            connecting={connecting}
            hasLastDevice={hasLastDevice}
            showAllBleDevices={showAllBleDevices}
            onShowAllChange={setShowAllBleDevices}
            onConnect={() => void handleConnect()}
            onReconnect={() => void handleReconnect()}
            onDisconnect={handleDisconnect}
            onStopAll={stopAllModes}
          />
        )}

        {activeTab === 'music' && (
          <MusicPanel
            connected={connected}
            musicRunning={musicRunning}
            bassLevel={bassLevel}
            audioSources={audioSources}
            selectedAudioId={selectedAudioId}
            audioHint={audioHint}
            musicColor={musicColor}
            sensitivity={sensitivity}
            minBright={minBright}
            rainbowPlusMusic={rainbowPlusMusic}
            rainbowSpeed={rainbowSpeed}
            rainbowRunning={rainbowRunning}
            onAudioChange={setSelectedAudioId}
            onRefreshAudio={() => void refreshAudio()}
            onMusicColorChange={setMusicColor}
            onSensitivityChange={setSensitivity}
            onMinBrightChange={setMinBright}
            onRainbowPlusChange={setRainbowPlusMusic}
            onStart={() => void startMusic()}
            onStop={stopMusic}
            onStartRainbow={startRainbow}
            onStopRainbow={stopRainbow}
            onRainbowSpeedChange={setRainbowSpeed}
          />
        )}

        {activeTab === 'effects' && (
          <EffectsPanel
            connected={connected}
            effectProtocol={effectProtocol}
            builtinEffect={builtinEffect}
            builtinSpeed={builtinSpeed}
            lotusPattern={lotusPattern}
            lotusSpeed={lotusSpeed}
            whiteTemp={whiteTemp}
            softColor={softColor}
            softSpeed={softSpeed}
            onProtocolChange={setEffectProtocol}
            onBuiltinEffectChange={setBuiltinEffect}
            onBuiltinSpeedChange={setBuiltinSpeed}
            onLotusPatternChange={setLotusPattern}
            onLotusSpeedChange={setLotusSpeed}
            onApplyBuiltin={() => {
              if (!requireConnected()) return
              stopAllModes()
              if (effectProtocol === 'standard') {
                bleRef.current.setBuiltinEffect(builtinEffect, builtinSpeed)
              } else {
                bleRef.current.setLotusPattern(lotusPattern, lotusSpeed)
              }
            }}
            onApplyPreset={(hex) => {
              if (!requireConnected()) return
              stopAllModes()
              bleRef.current.switchToRgbMode()
              setManualColor(hex)
              const [r, g, b] = hexToRgb(hex)
              bleRef.current.setColorAndBrightness(r, g, b, manualBright)
            }}
            onWhiteTempChange={setWhiteTemp}
            onApplyWhite={(t) => {
              if (!requireConnected()) return
              stopAllModes()
              setWhiteTemp(t)
              bleRef.current.setWarmWhite(t, manualBright)
            }}
            onSoftColorChange={setSoftColor}
            onSoftSpeedChange={setSoftSpeed}
            onStartSoft={(type) => {
              if (!requireConnected() || !type) return
              softAnimations.start(type, softColor, softSpeed)
            }}
            onStopSoft={softAnimations.stop}
          />
        )}

        {activeTab === 'manual' && (
          <ManualPanel
            connected={connected}
            manualColor={manualColor}
            manualBright={manualBright}
            sceneName={sceneName}
            scenes={scenes}
            onColorChange={setManualColor}
            onBrightChange={(v) => {
              setManualBright(v)
              if (connected) bleRef.current.setBrightness(v)
            }}
            onApply={() => {
              if (!requireConnected()) return
              bleRef.current.switchToRgbMode()
              const [r, g, b] = hexToRgb(manualColor)
              bleRef.current.setColorAndBrightness(r, g, b, manualBright)
            }}
            onPower={(on) => bleRef.current.setPower(on)}
            onSceneNameChange={setSceneName}
            onSaveScene={() => {
              saveScene(sceneName, manualColor, manualBright)
              setSceneName('')
            }}
            onApplyScene={(color, brightness) => {
              if (!requireConnected()) return
              stopAllModes()
              bleRef.current.switchToRgbMode()
              setManualColor(color)
              setManualBright(brightness)
              const [r, g, b] = hexToRgb(color)
              bleRef.current.setColorAndBrightness(r, g, b, brightness)
            }}
            onDeleteScene={deleteScene}
          />
        )}
      </main>
    </div>
  )
}
