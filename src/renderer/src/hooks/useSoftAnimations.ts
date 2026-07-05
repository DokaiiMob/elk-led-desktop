import { useCallback, useRef } from 'react'
import { ElkBleClient } from '../ble/elkBle'
import { hexToRgb, hsvToRgb } from '../utils/color'

export type SoftAnimationType = 'breathe' | 'strobe' | 'police' | 'candle' | null

interface UseSoftAnimationsOptions {
  ble: ElkBleClient
  connected: boolean
  onStopOthers?: () => void
}

export function useSoftAnimations({ ble, connected, onStopOthers }: UseSoftAnimationsOptions) {
  const timerRef = useRef<number | null>(null)
  const activeRef = useRef<SoftAnimationType>(null)
  const phaseRef = useRef(0)

  const stop = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
    activeRef.current = null
  }, [])

  const start = useCallback(
    (type: SoftAnimationType, color = '#FFFFFF', speed = 3) => {
      if (!connected || !type) return
      stop()
      onStopOthers?.()
      activeRef.current = type
      ble.switchToRgbMode()
      phaseRef.current = 0

      const [cr, cg, cb] = hexToRgb(color)

      timerRef.current = window.setInterval(() => {
        phaseRef.current += speed
        switch (type) {
          case 'breathe': {
            const t = (Math.sin(phaseRef.current * 0.05) + 1) / 2
            const bright = Math.round(10 + t * 90)
            ble.setColorAndBrightness(cr, cg, cb, bright)
            break
          }
          case 'strobe': {
            const on = Math.floor(phaseRef.current / 5) % 2 === 0
            ble.setColorAndBrightness(cr, cg, cb, on ? 100 : 0)
            break
          }
          case 'police': {
            const half = Math.floor(phaseRef.current / 8) % 2 === 0
            ble.setColorAndBrightness(half ? 0 : 255, 0, half ? 255 : 0, 100)
            break
          }
          case 'candle': {
            const flicker = 55 + Math.random() * 35
            const warm = [255, Math.round(140 + Math.random() * 40), Math.round(40 + Math.random() * 30)] as const
            ble.setColorAndBrightness(warm[0], warm[1], warm[2], Math.round(flicker))
            break
          }
        }
      }, 40)
    },
    [ble, connected, onStopOthers, stop]
  )

  return { active: activeRef, start, stop }
}
