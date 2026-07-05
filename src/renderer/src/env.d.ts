import { BleBridge } from '../../preload/index'

declare global {
  interface Window {
    bleBridge: BleBridge
  }
}

export {}
