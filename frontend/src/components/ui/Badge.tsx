import type { ReactNode } from 'react'

export interface BadgeProps {
  children: ReactNode
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  className?: string
}

export function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  const variantClasses = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    neutral: 'bg-stone-50 text-stone-700 border-stone-200',
  }[variant]

  return (
    <span
      className={`inline-flex items-center text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${variantClasses} ${className}`}
    >
      {children}
    </span>
  )
}

