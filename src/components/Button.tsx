import { type ButtonHTMLAttributes } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export default function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: Props) {
  const base = 'font-belote font-bold rounded-lg border-2 transition-all active:scale-95 disabled:opacity-50'

  const variants = {
    primary: 'bg-mint border-green-800 text-green-dark hover:bg-green-light',
    secondary: 'bg-transparent border-mint text-mint hover:bg-mint/10',
    danger: 'bg-red-belote border-red-800 text-white hover:bg-red-700',
  }

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg w-full',
  }

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  )
}
