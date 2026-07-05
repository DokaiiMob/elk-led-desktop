import { BUILTIN_EFFECTS, COLOR_PRESETS, LOTUS_PATTERNS } from '../../ble/elkProtocol'
import { Card } from '../Card'
import { Button } from '../ui/Button'
import { Slider } from '../ui/Slider'
import type { SoftAnimationType } from '../../hooks/useSoftAnimations'

interface EffectsPanelProps {
  connected: boolean
  effectProtocol: 'standard' | 'lotus'
  builtinEffect: number
  builtinSpeed: number
  lotusPattern: number
  lotusSpeed: number
  whiteTemp: number
  softColor: string
  softSpeed: number
  onProtocolChange: (p: 'standard' | 'lotus') => void
  onBuiltinEffectChange: (id: number) => void
  onBuiltinSpeedChange: (v: number) => void
  onLotusPatternChange: (i: number) => void
  onLotusSpeedChange: (v: number) => void
  onApplyBuiltin: () => void
  onApplyPreset: (hex: string) => void
  onWhiteTempChange: (t: number) => void
  onApplyWhite: (t: number) => void
  onSoftColorChange: (c: string) => void
  onSoftSpeedChange: (v: number) => void
  onStartSoft: (type: SoftAnimationType) => void
  onStopSoft: () => void
}

export function EffectsPanel(props: EffectsPanelProps): React.JSX.Element {
  return (
    <>
      <Card title="Быстрые цвета">
        <div className="preset-grid">
          {COLOR_PRESETS.map((p) => (
            <button
              key={p.hex}
              type="button"
              className="preset-btn"
              style={{ background: p.hex }}
              title={p.name}
              onClick={() => props.onApplyPreset(p.hex)}
              disabled={!props.connected}
              aria-label={p.name}
            />
          ))}
        </div>
      </Card>

      <Card title="Эффекты ленты">
        <label className="field-label">Протокол</label>
        <select
          className="select"
          value={props.effectProtocol}
          onChange={(e) => props.onProtocolChange(e.target.value as 'standard' | 'lotus')}
        >
          <option value="standard">Стандартный</option>
          <option value="lotus">Lotus Lantern</option>
        </select>

        {props.effectProtocol === 'standard' ? (
          <>
            <label className="field-label">Эффект</label>
            <select
              className="select"
              value={props.builtinEffect}
              onChange={(e) => props.onBuiltinEffectChange(Number(e.target.value))}
            >
              {BUILTIN_EFFECTS.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.label}
                </option>
              ))}
            </select>
            <Slider label="Скорость" value={props.builtinSpeed} min={0} max={100} unit="%" onChange={props.onBuiltinSpeedChange} />
          </>
        ) : (
          <>
            <label className="field-label">Паттерн</label>
            <select
              className="select"
              value={props.lotusPattern}
              onChange={(e) => props.onLotusPatternChange(Number(e.target.value))}
            >
              {LOTUS_PATTERNS.map((name, i) => (
                <option key={name} value={i}>
                  {name}
                </option>
              ))}
            </select>
            <Slider label="Скорость" value={props.lotusSpeed} min={0} max={100} unit="%" onChange={props.onLotusSpeedChange} />
          </>
        )}

        <div className="btn-row">
          <Button onClick={props.onApplyBuiltin} disabled={!props.connected}>
            Применить
          </Button>
        </div>
      </Card>

      <Card title="Белый свет">
        <Slider label="Температура" value={props.whiteTemp} min={128} max={138} onChange={props.onWhiteTempChange} />
        <div className="btn-row">
          <Button variant="secondary" onClick={() => props.onApplyWhite(128)} disabled={!props.connected}>
            Холодный
          </Button>
          <Button variant="secondary" onClick={() => props.onApplyWhite(136)} disabled={!props.connected}>
            Нейтральный
          </Button>
          <Button variant="secondary" onClick={() => props.onApplyWhite(138)} disabled={!props.connected}>
            Тёплый
          </Button>
        </div>
      </Card>

      <Card title="Анимации">
        <div className="color-row">
          <input type="color" value={props.softColor} onChange={(e) => props.onSoftColorChange(e.target.value)} />
          <input
            type="text"
            className="text-input hex-input"
            value={props.softColor}
            onChange={(e) => props.onSoftColorChange(e.target.value)}
          />
        </div>
        <Slider label="Скорость" value={props.softSpeed} min={1} max={10} onChange={props.onSoftSpeedChange} />
        <div className="btn-row">
          <Button variant="secondary" onClick={() => props.onStartSoft('breathe')} disabled={!props.connected}>
            Дыхание
          </Button>
          <Button variant="secondary" onClick={() => props.onStartSoft('strobe')} disabled={!props.connected}>
            Строб
          </Button>
          <Button variant="secondary" onClick={() => props.onStartSoft('police')} disabled={!props.connected}>
            Полиция
          </Button>
          <Button variant="secondary" onClick={() => props.onStartSoft('candle')} disabled={!props.connected}>
            Свеча
          </Button>
          <Button variant="ghost" onClick={props.onStopSoft}>
            Стоп
          </Button>
        </div>
      </Card>
    </>
  )
}
