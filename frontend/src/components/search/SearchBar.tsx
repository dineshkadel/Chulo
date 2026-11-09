import { type FormEvent } from 'react'
import { Search } from 'lucide-react'

export interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onSearch?: (value: string) => void
  className?: string
}

export function SearchBar({
  value,
  onChange,
  onSearch,
  className = '',
}: SearchBarProps) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSearch?.(value)
  }

  return (
    <form onSubmit={handleSubmit} className={`relative flex items-center ${className}`}>
      <span className="absolute left-4 text-stone-400">
        <Search size={18} aria-hidden="true" />
      </span>
      <input
        type="search"
        aria-label="Search dishes or restaurants"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-11 pr-24 py-3.5 bg-white border border-[var(--line)] rounded-2xl text-sm text-[var(--ink)] shadow-xs focus:outline-none focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/20 transition-all"
      />
      <button
        type="submit"
        className="absolute right-2 px-4 py-2 bg-[var(--red)] text-white font-bold text-xs rounded-xl hover:bg-[#b83b20] transition-colors"
      >
        Search
      </button>
    </form>
  )
}
