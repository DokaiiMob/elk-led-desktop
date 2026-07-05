interface ColorPreviewProps {
  color: string
  brightness: number
  label?: string
}

export function ColorPreview({ color, brightness, label = 'Превью' }: ColorPreviewProps): React.JSX.Element {
  return (
    <div className="color-preview" aria-label={`${label}: ${color}, яркость ${brightness}%`}>
      <div
        className="color-preview__swatch"
        style={{
          background: color,
          opacity: Math.max(0.08, brightness / 100)
        }}
      />
      <div className="color-preview__meta">
        <span className="color-preview__label">{label}</span>
        <span className="color-preview__hex">{color.toUpperCase()}</span>
        <span className="color-preview__bright">{brightness}%</span>
      </div>
    </div>
  )
}
