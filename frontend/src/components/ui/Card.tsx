import type { HTMLAttributes, ReactNode } from 'react'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  hoverable?: boolean
}

export function Card({ children, hoverable = false, className = '', ...props }: CardProps) {
  return (
    <div
      className={`bg-white rounded-2xl border border-[var(--line)] shadow-sm ${hoverable ? 'hover:shadow-md hover:border-[var(--gold)]/40 transition-all duration-200' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

