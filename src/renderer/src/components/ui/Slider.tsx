interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (value: number) => void
}

export function Slider({ label, value, min, max, step = 1, unit = '', onChange }: SliderProps): React.JSX.Element {
  return (
    <div className="slider-field">
      <div className="slider-field__header">
        <span className="slider-field__label">{label}</span>
        <span className="slider-field__value">
          {step < 1 ? value.toFixed(1) : value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        className="slider-field__input"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  )
}
