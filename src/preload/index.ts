import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

export interface BleDeviceInfo {
  deviceId: string
  deviceName: string
}

const bleBridge = {
  onDeviceList: (callback: (devices: BleDeviceInfo[]) => void): (() => void) => {
    const handler = (_event: IpcRendererEvent, devices: BleDeviceInfo[]): void => {
      callback(devices)
    }
    ipcRenderer.on('ble:device-list', handler)
    return () => ipcRenderer.removeListener('ble:device-list', handler)
  },
  pickDevice: (deviceId: string): void => {
    ipcRenderer.send('ble:pick-device', deviceId)
  },
  cancelPick: (): void => {
    ipcRenderer.send('ble:cancel-pick')
  }
}

contextBridge.exposeInMainWorld('bleBridge', bleBridge)

export type BleBridge = typeof bleBridge
