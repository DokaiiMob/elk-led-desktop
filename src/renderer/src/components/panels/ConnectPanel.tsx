import { Card } from '../Card'
import { Button } from '../ui/Button'

interface ConnectPanelProps {
  connected: boolean
  connecting: boolean
  hasLastDevice: boolean
  showAllBleDevices: boolean
  onShowAllChange: (v: boolean) => void
  onConnect: () => void
  onReconnect: () => void
  onDisconnect: () => void
  onStopAll: () => void
}

export function ConnectPanel({
  connected,
  connecting,
  hasLastDevice,
  showAllBleDevices,
  onShowAllChange,
  onConnect,
  onReconnect,
  onDisconnect,
  onStopAll
}: ConnectPanelProps): React.JSX.Element {
  return (
    <Card title="Bluetooth">
      <p className="hint">
        Выберите ленту ELK-BLEDOM в списке устройств. Если ленты нет — включите «Показать все BLE».
      </p>

      <label className="checkbox">
        <input
          type="checkbox"
          checked={showAllBleDevices}
          onChange={(e) => onShowAllChange(e.target.checked)}
        />
        Показать все BLE-устройства
      </label>

      <div className="btn-row btn-row--split">
        <Button onClick={onConnect} disabled={connecting || connected} fullWidth>
          {connecting ? 'Подключение…' : 'Подключиться'}
        </Button>
        <Button variant="secondary" onClick={onDisconnect} disabled={!connected} fullWidth>
          Отключиться
        </Button>
      </div>

      {hasLastDevice && (
        <div className="btn-row">
          <Button variant="ghost" onClick={onReconnect} disabled={connecting || connected} fullWidth>
            Быстрое переподключение
          </Button>
        </div>
      )}

      {connected && (
        <div className="btn-row">
          <Button variant="danger" onClick={onStopAll} fullWidth>
            Остановить все режимы
          </Button>
        </div>
      )}
    </Card>
  )
}
