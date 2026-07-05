import {
  buildBrightnessCommand,
  buildBuiltinEffectCommand,
  buildColorCommand,
  buildEffectSpeedCommand,
  buildGrayscaleCommand,
  buildLotusPatternCommand,
  buildLotusSpeedCommand,
  buildPowerCommand,
  buildRgbModeCommand,
  buildWarmWhiteModeCommand
} from './elkProtocol'
import { ConnectResult, parseBleError } from './bleErrors'

export const SERVICE_UUID = '0000fff0-0000-1000-8000-00805f9b34fb'
export const CHAR_UUID = '0000fff3-0000-1000-8000-00805f9b34fb'
const LAST_DEVICE_KEY = 'elk-last-device-id'

export class ElkBleClient {
  private device: BluetoothDevice | null = null
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null
  private writeQueue: Uint8Array[] = []
  private draining = false
  private _connected = false
  private _lastError: string | null = null

  get isConnected(): boolean {
    return this._connected
  }

  /** @deprecated используйте результат connect() */
  get connectError(): string | null {
    return this._lastError
  }

  get deviceName(): string | null {
    return this.device?.name ?? null
  }

  get deviceId(): string | null {
    return this.device?.id ?? null
  }

  async getKnownDevices(): Promise<BluetoothDevice[]> {
    if (!navigator.bluetooth?.getDevices) return []
    return navigator.bluetooth.getDevices()
  }

  async reconnectLast(): Promise<ConnectResult> {
    const lastId = localStorage.getItem(LAST_DEVICE_KEY)
    if (!lastId) {
      return { ok: false, error: 'Нет сохранённого устройства. Подключитесь вручную.' }
    }
    const known = await this.getKnownDevices()
    const device = known.find((d) => d.id === lastId)
    if (!device) {
      return {
        ok: false,
        error: 'Предыдущее устройство недоступно. Нажмите «Подключиться» и выберите ленту снова.'
      }
    }
    return this.connectToDevice(device)
  }

  async connect(showAllDevices = false): Promise<ConnectResult> {
    if (!navigator.bluetooth) {
      return { ok: false, error: 'Web Bluetooth недоступен. Запустите приложение через Electron.' }
    }
    if (!window.bleBridge) {
      return { ok: false, error: 'Мост Bluetooth не загружен. Перезапустите приложение.' }
    }
    try {
      const device = await navigator.bluetooth.requestDevice(
        showAllDevices
          ? { acceptAllDevices: true, optionalServices: [SERVICE_UUID] }
          : {
              acceptAllDevices: true,
              optionalServices: [SERVICE_UUID]
            }
      )
      return this.connectToDevice(device)
    } catch (error) {
      const result = parseBleError(error)
      this._lastError = result.error ?? null
      this._connected = false
      return result
    }
  }

  private async connectToDevice(device: BluetoothDevice): Promise<ConnectResult> {
    this._lastError = null
    try {
      this.device = device
      const server = await device.gatt?.connect()
      if (!server) throw new Error('Не удалось подключиться по GATT')

      const service = await server.getPrimaryService(SERVICE_UUID)
      this.characteristic = await service.getCharacteristic(CHAR_UUID)
      this._connected = true
      localStorage.setItem(LAST_DEVICE_KEY, device.id)

      device.addEventListener('gattserverdisconnected', () => {
        this._connected = false
        this.characteristic = null
      })

      await this.sendRaw(buildPowerCommand(true))
      return { ok: true }
    } catch (error) {
      const result = parseBleError(error)
      this._lastError = result.error ?? null
      this._connected = false
      return result
    }
  }

  disconnect(): void {
    this._connected = false
    this.writeQueue = []
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect()
    }
    this.characteristic = null
    this.device = null
  }

  setPower(on: boolean): void {
    void this.sendRaw(buildPowerCommand(on))
  }

  setColorAndBrightness(r: number, g: number, b: number, brightness: number): void {
    void this.sendRaw(buildColorCommand(r, g, b))
    void this.sendRaw(buildBrightnessCommand(brightness))
  }

  setBrightness(brightness: number): void {
    void this.sendRaw(buildBrightnessCommand(brightness))
  }

  setBuiltinEffect(effectId: number, speed = 50): void {
    void this.sendRaw(buildBuiltinEffectCommand(effectId))
    void this.sendRaw(buildEffectSpeedCommand(speed))
  }

  setLotusPattern(pattern: number, speed = 50): void {
    void this.sendRaw(buildLotusPatternCommand(pattern))
    void this.sendRaw(buildLotusSpeedCommand(speed))
  }

  setEffectSpeed(speed: number): void {
    void this.sendRaw(buildEffectSpeedCommand(speed))
  }

  setWarmWhite(temperature: number, brightness = 80): void {
    void this.sendRaw(buildWarmWhiteModeCommand(temperature))
    void this.sendRaw(buildBrightnessCommand(brightness))
  }

  setGrayscale(level: number): void {
    void this.sendRaw(buildGrayscaleCommand(level))
  }

  switchToRgbMode(): void {
    void this.sendRaw(buildRgbModeCommand())
  }

  private async sendRaw(payload: Uint8Array): Promise<void> {
    if (!this._connected || !this.characteristic) return
    this.writeQueue.push(payload)
    while (this.writeQueue.length > 6) this.writeQueue.shift()
    await this.drainQueue()
  }

  private async drainQueue(): Promise<void> {
    if (this.draining || !this.characteristic) return
    this.draining = true
    while (this.writeQueue.length > 0 && this._connected && this.characteristic) {
      const payload = this.writeQueue.shift()!
      await this.characteristic.writeValueWithoutResponse(payload)
      await delay(12)
    }
    this.draining = false
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
