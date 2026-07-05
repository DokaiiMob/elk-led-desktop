export const SERVICE_UUID = '0000fff0-0000-1000-8000-00805f9b34fb'
export const CHAR_UUID = '0000fff3-0000-1000-8000-00805f9b34fb'

export interface ElkDevice {
  name: string
  id: string
}

function buildColorCommand(r: number, g: number, b: number): Uint8Array {
  return new Uint8Array([0x7e, 0x00, 0x05, 0x03, r & 0xff, g & 0xff, b & 0xff, 0x00, 0xef])
}

function buildBrightnessCommand(brightness: number): Uint8Array {
  const b = Math.min(100, Math.max(0, brightness))
  return new Uint8Array([0x7e, 0x00, 0x01, b, 0x00, 0x00, 0x00, 0x00, 0xef])
}

function buildPowerCommand(on: boolean): Uint8Array {
  if (on) {
    return new Uint8Array([0x7e, 0x00, 0x04, 0xf0, 0x00, 0x01, 0xff, 0x00, 0xef])
  }
  return new Uint8Array([0x7e, 0x00, 0x04, 0x00, 0x00, 0x00, 0xff, 0x00, 0xef])
}

export class ElkBleClient {
  private device: BluetoothDevice | null = null
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null
  private writeQueue: Uint8Array[] = []
  private draining = false
  private _connected = false
  private _connectError: string | null = null

  get isConnected(): boolean {
    return this._connected
  }

  get connectError(): string | null {
    return this._connectError
  }

  get deviceName(): string | null {
    return this.device?.name ?? null
  }

  async connect(): Promise<boolean> {
    this._connectError = null
    try {
      if (!navigator.bluetooth) {
        throw new Error('Web Bluetooth недоступен. Запустите приложение через Electron.')
      }

      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: 'ELK' }],
        optionalServices: [SERVICE_UUID]
      })

      const server = await this.device.gatt?.connect()
      if (!server) throw new Error('Не удалось подключиться по GATT')

      const service = await server.getPrimaryService(SERVICE_UUID)
      this.characteristic = await service.getCharacteristic(CHAR_UUID)
      this._connected = true

      this.device.addEventListener('gattserverdisconnected', () => {
        this._connected = false
        this.characteristic = null
      })

      await this.setPower(true)
      return true
    } catch (error) {
      this._connectError = error instanceof Error ? error.message : String(error)
      this._connected = false
      return false
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

  async setPower(on: boolean): Promise<void> {
    await this.write(buildPowerCommand(on))
  }

  setColorAndBrightness(r: number, g: number, b: number, brightness: number): void {
    void this.write(buildColorCommand(r, g, b))
    void this.write(buildBrightnessCommand(brightness))
  }

  setBrightness(brightness: number): void {
    void this.write(buildBrightnessCommand(brightness))
  }

  private async write(payload: Uint8Array): Promise<void> {
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
