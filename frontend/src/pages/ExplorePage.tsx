import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { ChevronRight, Search, Store } from 'lucide-react'
import { getCategories, getRestaurants } from '../api/restaurants'
import { getFoodItems, type ExploreMenuItem } from '../api/foodItems'
import type { FoodCategory, Restaurant } from '../types/restaurant'

// Same tokens as HomePage: white surfaces, one orange accent, soft grey lines.
const theme = {
  '--brand': '#f26b1d',
  '--brand-dark': '#d85a10',
  '--brand-soft': '#fff1e8',
  '--ink': '#222222',
  '--muted': '#6b7280',
  '--line': '#ececec',
  '--bg': '#ffffff',
  '--panel': '#fafafa',
} as CSSProperties

export function ExplorePage() {
  const [categories, setCategories] = useState<FoodCategory[]>([])
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [items, setItems] = useState<ExploreMenuItem[]>([])
  const [categoryId, setCategoryId] = useState<number | null>(() => {
    const value = Number(new URLSearchParams(window.location.search).get('category'))
    return Number.isInteger(value) && value > 0 ? value : null
  })
  const [restaurantId, setRestaurantId] = useState<number | null>(null)
  const [query, setQuery] = useState(() => new URLSearchParams(window.location.search).get('q') ?? '')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([getCategories(), getRestaurants(), getFoodItems()])
      .then(([loadedCategories, loadedRestaurants, loadedItems]) => {
        if (!active) return
        setCategories(loadedCategories)
        setRestaurants(loadedRestaurants)
        setItems(loadedItems)
      })
      .catch(() => active && setError('We could not load dishes right now. Please try again shortly.'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  const visibleItems = useMemo(() => {
    const term = query.trim().toLowerCase()
    return items.filter(
      (item) =>
        (categoryId === null || (item.food_category_id ?? item.category_id) === categoryId) &&
        (restaurantId === null || item.restaurant_id === restaurantId) &&
        (!term || [item.name, item.description, item.restaurantName].some((text) => text?.toLowerCase().includes(term))),
    )
  }, [categoryId, restaurantId, query, items])

  const title = categoryId ? categories.find((category) => category.id === categoryId)?.name : 'All dishes'

  return (
    <main className="min-h-screen bg-[var(--bg)] pb-16 pt-[72px] text-[var(--ink)]" style={theme}>
      <section className="border-b border-[var(--line)] bg-[var(--brand-soft)]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-8 sm:py-12">
          <h1 className="m-0 text-3xl font-extrabold tracking-tight sm:text-5xl">Explore dishes</h1>
          <p className="mb-0 mt-3 max-w-xl text-sm leading-6 text-[var(--muted)] sm:text-base">
            Browse dishes from local restaurants, organised by category and kitchen.
          </p>
          <label className="mt-6 flex h-12 max-w-xl items-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
            <Search size={18} className="shrink-0 text-[var(--brand)]" aria-hidden="true" />
            <input
              aria-label="Search dishes or restaurants"
              placeholder="Search dishes or restaurants"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="cursor-pointer border-0 bg-transparent text-lg leading-none text-[var(--muted)] hover:text-[var(--ink)]">
                ×
              </button>
            )}
          </label>
        </div>
      </section>

      <nav aria-label="Food categories" className="sticky top-[72px] z-20 border-b border-[var(--line)] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 sm:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <FilterButton active={categoryId === null} onClick={() => setCategoryId(null)}>
            All dishes
          </FilterButton>
          {categories.map((category) => (
            <FilterButton key={category.id} active={category.id === categoryId} onClick={() => setCategoryId(category.id)}>
              {category.name}
            </FilterButton>
          ))}
        </div>
      </nav>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-[140px] lg:h-fit">
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4">
            <div className="flex items-center gap-2">
              <Store size={18} className="text-[var(--brand)]" aria-hidden="true" />
              <h2 className="m-0 text-base font-bold">Restaurants</h2>
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto lg:max-h-[60vh] lg:flex-col lg:overflow-y-auto lg:overflow-x-visible">
              <button onClick={() => setRestaurantId(null)} className={restaurantButtonClass(restaurantId === null)}>
                All restaurants
              </button>
              {restaurants.map((restaurant) => (
                <button key={restaurant.id} onClick={() => setRestaurantId(restaurant.id)} className={restaurantButtonClass(restaurant.id === restaurantId)}>
                  {restaurant.name}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section aria-live="polite">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="m-0 text-xl font-extrabold sm:text-2xl">{title}</h2>
              <p className="mb-0 mt-1 text-sm text-[var(--muted)]">
                {loading ? 'Loading dishes…' : `${visibleItems.length} dish${visibleItems.length === 1 ? '' : 'es'} to explore`}
              </p>
            </div>
            {restaurantId !== null && (
              <button onClick={() => setRestaurantId(null)} className="cursor-pointer border-0 bg-transparent text-sm font-bold text-[var(--brand)] hover:underline">
                Clear restaurant
              </button>
            )}
          </div>

          {error ? (
            <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : loading ? (
            <ExploreSkeletons />
          ) : visibleItems.length ? (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {visibleItems.map((item) => (
                <ExploreItemCard key={`${item.restaurant_id}-${item.id}`} item={item} />
              ))}
            </div>
          ) : (
            <p className="mt-6 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-6 text-sm text-[var(--muted)]">No dishes match these filters yet.</p>
          )}
        </section>
      </div>
    </main>
  )
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${active
          ? 'border-[var(--brand)] bg-[var(--brand)] text-white'
          : 'border-[var(--line)] bg-white text-[var(--muted)] hover:border-[var(--brand)] hover:text-[var(--brand)]'
        }`}
    >
      {children}
    </button>
  )
}

function restaurantButtonClass(active: boolean) {
  return `shrink-0 cursor-pointer rounded-lg border-0 px-3 py-2 text-left text-sm font-semibold transition-colors ${active ? 'bg-[var(--brand-soft)] text-[var(--brand)]' : 'bg-transparent text-[var(--muted)] hover:bg-white hover:text-[var(--ink)]'
    }`
}

function ExploreItemCard({ item }: { item: ExploreMenuItem }) {
  return (
    <article className="group overflow-hidden rounded-xl border border-[var(--line)] bg-white transition-shadow hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
      <a href={`/restaurant/${item.restaurant_id}/menu/${item.id}`} className="block text-inherit no-underline">
        <div className="h-44 overflow-hidden bg-[var(--brand-soft)]">
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
          ) : (
            <div className="grid h-full place-items-center text-5xl" aria-label="No dish image">
              
            </div>
          )}
        </div>
        <div className="p-4">
          <p className="m-0 text-xs font-semibold text-[var(--muted)]">{item.restaurantName}</p>
          <div className="mt-1 flex items-start justify-between gap-3">
            <h3 className="m-0 text-base font-bold leading-snug">{item.name}</h3>
            <strong className="shrink-0 text-[var(--brand)]">Rs.{item.price.toFixed(0)}</strong>
          </div>
          <p className="mb-0 mt-2 line-clamp-2 text-sm leading-5 text-[var(--muted)]">{item.description || 'Freshly prepared to order.'}</p>
          <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[var(--brand)]">
            View dish <ChevronRight size={15} aria-hidden="true" />
          </span>
        </div>
      </a>
    </article>
  )
}

function ExploreSkeletons() {
  return (
    <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-xl border border-[var(--line)] bg-white">
          <div className="h-44 animate-pulse bg-[var(--line)]" />
          <div className="space-y-3 p-4">
            <div className="h-3 w-24 animate-pulse rounded bg-[var(--line)]" />
            <div className="h-5 w-3/4 animate-pulse rounded bg-[var(--line)]" />
            <div className="h-3 w-full animate-pulse rounded bg-[var(--line)]" />
          </div>
        </div>
      ))}
    </div>
  )
}
