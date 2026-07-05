export interface ConnectResult {
  ok: boolean
  cancelled?: boolean
  error?: string
}

export function parseBleError(error: unknown): ConnectResult {
  const message = error instanceof Error ? error.message : String(error)
  const name = error instanceof DOMException ? error.name : ''

  const isCancelled =
    name === 'NotFoundError' &&
    (message.includes('cancelled') ||
      message.includes('canceled') ||
      message.includes('User cancelled'))

  if (isCancelled) {
    return {
      ok: false,
      cancelled: true,
      error: 'Подключение отменено. Выберите устройство ELK-BLEDOM в списке Bluetooth.'
    }
  }

  if (name === 'NotFoundError') {
    return {
      ok: false,
      error: 'Устройство не найдено. Включите ленту и убедитесь, что Bluetooth активен.'
    }
  }

  if (name === 'SecurityError' || message.includes('not allowed')) {
    return {
      ok: false,
      error: 'Нет доступа к Bluetooth. Перезапустите приложение и разрешите Bluetooth.'
    }
  }

  if (name === 'NetworkError' || message.includes('GATT')) {
    return {
      ok: false,
      error: 'Не удалось подключиться к ленте. Поднесите её ближе и попробуйте снова.'
    }
  }

  return { ok: false, error: message || 'Неизвестная ошибка подключения' }
}
