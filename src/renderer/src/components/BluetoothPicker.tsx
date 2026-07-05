import { useEffect, useState } from 'react'
import type { BleDeviceInfo } from '../../preload/index'

interface BluetoothPickerProps {
  showAll: boolean
}

export function BluetoothPicker({ showAll }: BluetoothPickerProps): React.JSX.Element | null {
  const [open, setOpen] = useState(false)
  const [devices, setDevices] = useState<BleDeviceInfo[]>([])
  const [scanning, setScanning] = useState(true)

  useEffect(() => {
    if (!window.bleBridge) return
    return window.bleBridge.onDeviceList((list) => {
      setDevices(list)
      setOpen(true)
      setScanning(list.length === 0)
    })
  }, [])

  if (!open) return null

  const visible = showAll
    ? devices
    : devices.filter((d) => {
        const name = d.deviceName.toUpperCase()
        return name.startsWith('ELK') || name.startsWith('LED') || name.startsWith('BLE')
      })

  const pick = (deviceId: string): void => {
    window.bleBridge.pickDevice(deviceId)
    setOpen(false)
    setDevices([])
    setScanning(true)
  }

  const cancel = (): void => {
    window.bleBridge.cancelPick()
    setOpen(false)
    setDevices([])
    setScanning(true)
  }

  return (
    <div className="picker-overlay" role="dialog" aria-modal="true">
      <div className="picker-modal">
        <h2>Выберите устройство</h2>
        {scanning && visible.length === 0 && (
          <p className="hint">Сканирование Bluetooth… включите ленту и подождите несколько секунд.</p>
        )}
        {!scanning && visible.length === 0 && devices.length > 0 && !showAll && (
          <p className="hint">
            Лента не найдена по имени ELK/LED/BLE. Включите «Показать все BLE-устройства» и нажмите «Подключиться» снова.
          </p>
        )}
        {!scanning && visible.length === 0 && devices.length === 0 && (
          <p className="hint">
            Устройства не найдены. Включите «Показать все BLE-устройства» или убедитесь, что лента включена.
          </p>
        )}
        <ul className="picker-list">
          {visible.map((d) => (
            <li key={d.deviceId}>
              <button type="button" className="picker-item" onClick={() => pick(d.deviceId)}>
                <span className="picker-name">{d.deviceName}</span>
                <span className="picker-id">{d.deviceId}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="row">
          <button type="button" className="btn-secondary" onClick={cancel}>
            Отмена
          </button>
        </div>
      </div>
    </div>
  )
}
