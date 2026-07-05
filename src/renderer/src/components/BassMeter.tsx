interface BassMeterProps {
  level: number
  active?: boolean
}

export function BassMeter({ level, active }: BassMeterProps): React.JSX.Element {
  const pct = Math.round(level * 100)
  return (
    <div className={`bass-meter ${active ? 'bass-meter--active' : ''}`}>
      <div className="bass-meter__header">
        <span>Уровень баса</span>
        <strong>{pct}%</strong>
      </div>
      <div className="bass-meter__track" role="meter" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="bass-meter__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
