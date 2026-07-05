import { app, BrowserWindow, ipcMain, session, WebContents } from 'electron'
import { join } from 'path'

let mainWindow: BrowserWindow | null = null
let selectBluetoothCallback: ((deviceId: string) => void) | null = null

export interface BleDeviceInfo {
  deviceId: string
  deviceName: string
}

const MEDIA_PERMISSIONS = new Set([
  'media',
  'microphone',
  'audioCapture',
  'videoCapture',
  'speaker-selection'
])

const BLUETOOTH_PERMISSIONS = new Set(['bluetooth', 'bluetooth-scan', 'bluetooth-link'])

function sendDeviceList(webContents: WebContents, deviceList: Electron.BluetoothDevice[]): void {
  const devices: BleDeviceInfo[] = deviceList.map((d) => ({
    deviceId: d.deviceId,
    deviceName: d.deviceName || 'Без имени'
  }))
  webContents.send('ble:device-list', devices)
}

function attachBluetoothHandlers(webContents: WebContents): void {
  webContents.on('select-bluetooth-device', (event, deviceList, callback) => {
    event.preventDefault()
    selectBluetoothCallback = callback
    sendDeviceList(webContents, deviceList)
  })
}

function setupSession(): void {
  const ses = session.defaultSession

  ses.setPermissionCheckHandler((_webContents, permission) => {
    return MEDIA_PERMISSIONS.has(permission) || BLUETOOTH_PERMISSIONS.has(permission)
  })

  ses.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(MEDIA_PERMISSIONS.has(permission) || BLUETOOTH_PERMISSIONS.has(permission))
  })

  ses.setDevicePermissionHandler((details) => details.deviceType === 'bluetooth')

  ses.setBluetoothPairingHandler((_details, callback) => {
    callback()
  })
}

function registerIpc(): void {
  ipcMain.on('ble:pick-device', (_event, deviceId: string) => {
    selectBluetoothCallback?.(deviceId)
    selectBluetoothCallback = null
  })

  ipcMain.on('ble:cancel-pick', () => {
    selectBluetoothCallback?.('')
    selectBluetoothCallback = null
  })
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 540,
    height: 920,
    minWidth: 440,
    minHeight: 680,
    title: 'ELK-BLEDOM — управление лентой',
    backgroundColor: '#0f0f14',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  attachBluetoothHandlers(mainWindow.webContents)

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.commandLine.appendSwitch('enable-features', 'WebBluetooth')

app.whenReady().then(() => {
  registerIpc()
  setupSession()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  selectBluetoothCallback?.('')
  selectBluetoothCallback = null
  if (process.platform !== 'darwin') app.quit()
})
