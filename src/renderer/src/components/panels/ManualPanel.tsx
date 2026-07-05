import type { Scene } from '../../hooks/useScenes'
import { Card } from '../Card'
import { Button } from '../ui/Button'
import { Slider } from '../ui/Slider'

interface ManualPanelProps {
  connected: boolean
  manualColor: string
  manualBright: number
  sceneName: string
  scenes: Scene[]
  onColorChange: (c: string) => void
  onBrightChange: (v: number) => void
  onApply: () => void
  onPower: (on: boolean) => void
  onSceneNameChange: (n: string) => void
  onSaveScene: () => void
  onApplyScene: (color: string, brightness: number) => void
  onDeleteScene: (id: string) => void
}

export function ManualPanel(props: ManualPanelProps): React.JSX.Element {
  return (
    <>
      <Card title="Цвет и яркость">
        <div className="color-row">
          <input type="color" value={props.manualColor} onChange={(e) => props.onColorChange(e.target.value)} />
          <input
            type="text"
            className="text-input hex-input"
            value={props.manualColor}
            onChange={(e) => props.onColorChange(e.target.value)}
          />
        </div>

        <Slider
          label="Яркость"
          value={props.manualBright}
          min={0}
          max={100}
          unit="%"
          onChange={props.onBrightChange}
        />

        <div className="btn-row btn-row--split">
          <Button onClick={props.onApply} disabled={!props.connected}>
            Применить
          </Button>
          <Button variant="secondary" onClick={() => props.onPower(true)} disabled={!props.connected}>
            Вкл
          </Button>
        </div>
        <div className="btn-row">
          <Button variant="danger" onClick={() => props.onPower(false)} disabled={!props.connected} fullWidth>
            Выключить ленту
          </Button>
        </div>
      </Card>

      <Card title="Сохранённые сцены">
        <div className="btn-row">
          <input
            type="text"
            className="text-input"
            placeholder="Название сцены"
            value={props.sceneName}
            onChange={(e) => props.onSceneNameChange(e.target.value)}
          />
          <Button variant="secondary" onClick={props.onSaveScene}>
            Сохранить
          </Button>
        </div>

        {props.scenes.length === 0 ? (
          <p className="empty-state">Нет сохранённых сцен</p>
        ) : (
          <ul className="scene-list">
            {props.scenes.map((s) => (
              <li key={s.id} className="scene-item">
                <Button
                  variant="secondary"
                  onClick={() => props.onApplyScene(s.color, s.brightness)}
                  disabled={!props.connected}
                >
                  <span className="scene-swatch" style={{ background: s.color }} />
                  {s.name} — {s.brightness}%
                </Button>
                <Button variant="ghost" onClick={() => props.onDeleteScene(s.id)} aria-label="Удалить">
                  ×
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  )
}
