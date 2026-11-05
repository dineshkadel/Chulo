export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-[var(--line)]/70 animate-pulse rounded-lg ${className}`} />
  )
}

