import { ReactNode } from 'react'

interface CardProps {
  title: string
  children: ReactNode
}

export function Card({ title, children }: CardProps): React.JSX.Element {
  return (
    <section className="card">
      <h2>{title}</h2>
      {children}
    </section>
  )
}
