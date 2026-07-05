type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  fullWidth?: boolean
}

const variantClass: Record<ButtonVariant, string> = {
  primary: 'btn--primary',
  secondary: 'btn--secondary',
  ghost: 'btn--ghost',
  danger: 'btn--danger'
}

export function Button({
  variant = 'primary',
  fullWidth,
  className = '',
  children,
  ...props
}: ButtonProps): React.JSX.Element {
  return (
    <button
      type="button"
      className={`btn ${variantClass[variant]} ${fullWidth ? 'btn--full' : ''} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  )
}
