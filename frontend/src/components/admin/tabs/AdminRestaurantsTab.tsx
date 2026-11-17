import { useState } from 'react'
import {
  MapPin,
  Search,
  Star,
  Store,
} from 'lucide-react'

interface RestaurantRecord {
  id: number
  name: string
  email: string
  phone: string
  address: string
  cuisine_types: string
  price_tier: number
  avg_rating: number
  review_count: number
  is_active: boolean
  is_open: boolean
}

const INITIAL_RESTAURANTS: RestaurantRecord[] = [
  { id: 1, name: 'Himalayan Momo Ghar', email: 'momoghar@example.com', phone: '+977 1 4412345', address: 'Jhamsikhel, Lalitpur', cuisine_types: 'Tibetan, Nepali', price_tier: 1, avg_rating: 4.8, review_count: 126, is_active: true, is_open: true },
  { id: 2, name: 'Thakali Kitchen Hub', email: 'thakalikitchen@example.com', phone: '+977 1 4423456', address: 'Thamel, Kathmandu', cuisine_types: 'Thakali, Traditional', price_tier: 2, avg_rating: 4.9, review_count: 89, is_active: true, is_open: true },
  { id: 3, name: 'Bawarchi Biryani House', email: 'bawarchi@example.com', phone: '+977 1 5534567', address: 'Pulchowk, Lalitpur', cuisine_types: 'Indian, Mughlai', price_tier: 2, avg_rating: 4.6, review_count: 74, is_active: true, is_open: true },
  { id: 4, name: 'Kathmandu Pizza Co.', email: 'ktmpizza@example.com', phone: '+977 1 4445678', address: 'Lazimpat, Kathmandu', cuisine_types: 'Italian, Pizza', price_tier: 3, avg_rating: 4.7, review_count: 104, is_active: true, is_open: false },
  { id: 5, name: 'Newari Khaja Ghar', email: 'newarikhaja@example.com', phone: '+977 1 6612345', address: 'Bhaktapur Durbar Square', cuisine_types: 'Newari, Authentic', price_tier: 1, avg_rating: 4.8, review_count: 58, is_active: true, is_open: true },
  { id: 6, name: 'Dragon Wok Express', email: 'dragonwok@example.com', phone: '+977 1 4467890', address: 'Baneshwor, Kathmandu', cuisine_types: 'Chinese, Asian', price_tier: 2, avg_rating: 4.3, review_count: 32, is_active: false, is_open: false },
]

export function AdminRestaurantsTab() {
  const [restaurants, setRestaurants] = useState<RestaurantRecord[]>(INITIAL_RESTAURANTS)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'open' | 'closed' | 'inactive'>('all')

  const filtered = restaurants.filter((r) => {
    const matchSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.cuisine_types.toLowerCase().includes(search.toLowerCase()) ||
      r.address.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase())
    if (!matchSearch) return false
    if (filter === 'all') return true
    if (filter === 'open') return r.is_open && r.is_active
    if (filter === 'closed') return !r.is_open && r.is_active
    if (filter === 'inactive') return !r.is_active
    return true
  })

  const toggleActive = (id: number) => {
    setRestaurants((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_active: !r.is_active } : r))
    )
  }

  const toggleOpen = (id: number) => {
    setRestaurants((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_open: !r.is_open } : r))
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="m-0 text-lg font-bold text-[var(--ink)]">Restaurant Partners</h2>
          <p className="m-0 text-xs text-stone-500">
            {restaurants.length} total restaurants · {restaurants.filter((r) => r.is_open).length} currently taking orders
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="search"
              placeholder="Filter restaurant name, cuisine..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-56 sm:w-64 rounded-xl border border-stone-200 bg-white pl-9 pr-3 text-xs focus:border-[var(--red)] focus:outline-none shadow-xs"
            />
          </div>

          <div className="flex items-center rounded-xl border border-stone-200 bg-white p-1 text-xs font-semibold shadow-xs">
            {(['all', 'open', 'closed', 'inactive'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1.5 capitalize transition-colors cursor-pointer ${
                  filter === f
                    ? 'bg-[var(--red)] text-white'
                    : 'text-stone-600 hover:text-[var(--ink)]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Restaurant List Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((r) => (
          <div
            key={r.id}
            className="rounded-2xl border border-[#eadfd2] bg-white p-5 shadow-xs hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#fff0dc] text-[var(--red)] font-bold text-lg">
                  <Store size={20} />
                </span>
                <div>
                  <h3 className="m-0 text-base font-bold text-[var(--ink)] line-clamp-1">{r.name}</h3>
                  <p className="m-0 text-xs text-stone-500 line-clamp-1">{r.cuisine_types}</p>
                </div>
              </div>
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  r.is_open && r.is_active
                    ? 'bg-emerald-100 text-emerald-800'
                    : !r.is_active
                    ? 'bg-red-100 text-red-800'
                    : 'bg-stone-100 text-stone-500'
                }`}
              >
                {!r.is_active ? 'Suspended' : r.is_open ? 'Open' : 'Closed'}
              </span>
            </div>

            <div className="mt-4 space-y-2 border-t border-b border-stone-100 py-3 text-xs">
              <div className="flex items-center gap-2 text-stone-600">
                <MapPin size={13} className="shrink-0 text-stone-400" />
                <span className="truncate">{r.address}</span>
              </div>
              <div className="flex items-center justify-between text-stone-600">
                <span className="flex items-center gap-1 font-bold text-[var(--ink)]">
                  <Star size={13} fill="currentColor" className="text-amber-500" />
                  {r.avg_rating.toFixed(1)} ({r.review_count} reviews)
                </span>
                <span className="text-stone-400 font-mono text-[11px]">{r.phone}</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-2">
              <button
                onClick={() => toggleOpen(r.id)}
                className={`flex-1 rounded-xl py-2 text-xs font-bold transition-colors cursor-pointer ${
                  r.is_open
                    ? 'border border-stone-200 text-stone-700 hover:bg-stone-50'
                    : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                }`}
              >
                {r.is_open ? 'Mark Closed' : 'Mark Open'}
              </button>
              <button
                onClick={() => toggleActive(r.id)}
                className={`rounded-xl px-3 py-2 text-xs font-bold transition-colors cursor-pointer ${
                  r.is_active
                    ? 'border border-red-200 text-red-600 hover:bg-red-50'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {r.is_active ? 'Suspend' : 'Activate'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-stone-200 py-16 text-center text-stone-400">
          <Store size={40} className="mx-auto mb-2 opacity-40" />
          <p className="font-bold">No restaurants found</p>
          <p className="text-xs">Try selecting a different filter.</p>
        </div>
      )}
    </div>
  )
}
