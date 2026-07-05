import { app, BrowserWindow, session } from 'electron'
import { join } from 'path'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 780,
    minWidth: 420,
    minHeight: 600,
    title: 'ELK-BLEDOM — управление лентой',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function setupBluetooth(): void {
  session.defaultSession.on('select-bluetooth-device', (event, deviceList, callback) => {
    event.preventDefault()
    const elk = deviceList.find((d) => d.deviceName?.toUpperCase().startsWith('ELK'))
    if (elk) {
      callback(elk.deviceId)
      return
    }
    if (deviceList.length > 0) {
      callback(deviceList[0].deviceId)
    }
  })

  session.defaultSession.setBluetoothPairingHandler((_details, callback) => {
    callback()
  })
}

app.commandLine.appendSwitch('enable-features', 'WebBluetooth')

app.whenReady().then(() => {
  setupBluetooth()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
