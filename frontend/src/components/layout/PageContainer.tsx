import type { ReactNode } from 'react'

interface PageContainerProps {
  children: ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '7xl' | 'full'
}

export function PageContainer({
  children,
  className = '',
  maxWidth = '7xl',
}: PageContainerProps) {
  const maxClass = maxWidth === 'full' ? 'w-full' : `max-w-${maxWidth}`

  return (
    <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${maxClass} ${className}`}>
      {children}
    </div>
  )
}

