interface CardProps {
  title?: string
  children: React.ReactNode
  className?: string
}

export function Card({ title, children, className = '' }: CardProps): React.JSX.Element {
  return (
    <section className={`card ${className}`.trim()}>
      {title && <h2 className="card__title">{title}</h2>}
      {children}
    </section>
  )
}
