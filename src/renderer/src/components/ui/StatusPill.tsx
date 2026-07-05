interface StatusPillProps {
  connected: boolean
  deviceName: string | null
  message: string
  kind: 'default' | 'ok' | 'cancelled' | 'error'
}

export function StatusPill({ connected, deviceName, message, kind }: StatusPillProps): React.JSX.Element {
  return (
    <div className={`status-pill status-pill--${kind}`}>
      <span className={`status-pill__dot ${connected ? 'status-pill__dot--on' : ''}`} aria-hidden />
      <div className="status-pill__text">
        <span className="status-pill__title">{connected ? deviceName ?? 'Подключено' : 'Не подключено'}</span>
        <span className="status-pill__message">{message}</span>
      </div>
    </div>
  )
}
