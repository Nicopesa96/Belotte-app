import { type ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
}

export default function Layout({ children, className = '' }: Props) {
  return (
    <div className={`flex flex-col min-h-svh bg-green-dark ${className}`}>
      {children}
    </div>
  )
}
