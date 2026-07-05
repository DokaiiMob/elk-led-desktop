/** Команды протокола ELK-BLEDOM (9 байт). */

export function buildColorCommand(r: number, g: number, b: number): Uint8Array {
  return new Uint8Array([0x7e, 0x00, 0x05, 0x03, r & 0xff, g & 0xff, b & 0xff, 0x00, 0xef])
}

export function buildBrightnessCommand(brightness: number): Uint8Array {
  const b = Math.min(100, Math.max(0, brightness))
  return new Uint8Array([0x7e, 0x00, 0x01, b, 0x00, 0x00, 0x00, 0x00, 0xef])
}

export function buildPowerCommand(on: boolean): Uint8Array {
  return on
    ? new Uint8Array([0x7e, 0x00, 0x04, 0xf0, 0x00, 0x01, 0xff, 0x00, 0xef])
    : new Uint8Array([0x7e, 0x00, 0x04, 0x00, 0x00, 0x00, 0xff, 0x00, 0xef])
}

export function buildEffectSpeedCommand(speed: number): Uint8Array {
  const s = Math.min(100, Math.max(0, speed))
  return new Uint8Array([0x7e, 0x00, 0x02, s, 0x00, 0x00, 0x00, 0x00, 0xef])
}

export function buildBuiltinEffectCommand(effectId: number): Uint8Array {
  return new Uint8Array([0x7e, 0x00, 0x03, effectId & 0xff, 0x03, 0x00, 0x00, 0x00, 0xef])
}

export function buildWarmWhiteModeCommand(temperature: number): Uint8Array {
  const t = Math.min(138, Math.max(128, temperature))
  return new Uint8Array([0x7e, 0x00, 0x03, t, 0x02, 0x00, 0x00, 0x00, 0xef])
}

export function buildGrayscaleCommand(level: number): Uint8Array {
  const g = Math.min(100, Math.max(0, level))
  return new Uint8Array([0x7e, 0x00, 0x05, 0x01, g, 0x00, 0x00, 0x00, 0xef])
}

export function buildRgbModeCommand(): Uint8Array {
  return new Uint8Array([0x7e, 0x00, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0xef])
}

/** Паттерны Lotus Lantern (вариант 0x05). */
export function buildLotusPatternCommand(pattern: number): Uint8Array {
  const p = (Math.min(28, Math.max(0, pattern)) + 128) & 0xff
  return new Uint8Array([0x7e, 0x05, 0x03, p, 0x03, 0xff, 0xff, 0x00, 0xef])
}

export function buildLotusSpeedCommand(speed: number): Uint8Array {
  const s = Math.min(100, Math.max(0, speed))
  return new Uint8Array([0x7e, 0x04, 0x02, s, 0xff, 0xff, 0xff, 0x00, 0xef])
}

export const BUILTIN_EFFECTS = [
  { id: 0x80, label: 'Статичный красный' },
  { id: 0x81, label: 'Статичный зелёный' },
  { id: 0x82, label: 'Статичный синий' },
  { id: 0x83, label: 'Статичный жёлтый' },
  { id: 0x84, label: 'Статичный голубой' },
  { id: 0x85, label: 'Статичный пурпурный' },
  { id: 0x86, label: 'Статичный белый' },
  { id: 0x87, label: 'Прыжок RGB' },
  { id: 0x88, label: 'Прыжок 7 цветов' },
  { id: 0x89, label: 'Градиент RGB' },
  { id: 0x8a, label: 'Градиент 7 цветов' },
  { id: 0x92, label: 'Градиент R→G' },
  { id: 0x95, label: 'Стробоскоп 7 цветов' },
  { id: 0x96, label: 'Стробоскоп красный' },
  { id: 0x97, label: 'Стробоскоп зелёный' },
  { id: 0x98, label: 'Стробоскоп синий' }
] as const

export const LOTUS_PATTERNS = [
  'Статичный красный',
  'Статичный синий',
  'Статичный зелёный',
  'Статичный голубой',
  'Статичный жёлтый',
  'Статичный пурпурный',
  'Статичный белый',
  'Прыжок 3 цвета',
  'Прыжок 7 цветов',
  'Переход 3 цвета',
  'Переход 7 цветов',
  'Градиент красный',
  'Градиент зелёный',
  'Градиент синий',
  'Градиент жёлтый',
  'Градиент голубой',
  'Градиент пурпурный',
  'Градиент белый',
  'Переход R↔G',
  'Переход R↔B',
  'Переход G↔B',
  'Стробоскоп 7 цветов',
  'Стробоскоп красный',
  'Стробоскоп зелёный',
  'Стробоскоп синий',
  'Стробоскоп жёлтый',
  'Стробоскоп голубой',
  'Стробоскоп пурпурный',
  'Стробоскоп белый'
] as const

export const COLOR_PRESETS = [
  { name: 'Красный', hex: '#FF0000' },
  { name: 'Зелёный', hex: '#00FF00' },
  { name: 'Синий', hex: '#0000FF' },
  { name: 'Жёлтый', hex: '#FFFF00' },
  { name: 'Голубой', hex: '#00FFFF' },
  { name: 'Пурпурный', hex: '#FF00FF' },
  { name: 'Белый', hex: '#FFFFFF' },
  { name: 'Тёплый', hex: '#FFAA66' },
  { name: 'Фиолет', hex: '#9933FF' },
  { name: 'Розовый', hex: '#FF3366' }
] as const
