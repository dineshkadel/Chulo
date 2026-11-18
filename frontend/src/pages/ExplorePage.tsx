import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ChevronRight, Store } from 'lucide-react'
import { getCategories, getRestaurants } from '../api/restaurants'
import { getFoodItems, type ExploreMenuItem } from '../api/foodItems'
import type { FoodCategory, Restaurant } from '../types/restaurant'

const serif = { fontFamily: "'Playfair Display', Georgia, serif" }

export function ExplorePage() {
  const [categories, setCategories] = useState<FoodCategory[]>([])
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [items, setItems] = useState<ExploreMenuItem[]>([])
  const [categoryId, setCategoryId] = useState<number | null>(() => {
    const value = Number(new URLSearchParams(window.location.search).get('category'))
    return Number.isInteger(value) && value > 0 ? value : null
  })
  const [restaurantId, setRestaurantId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([getCategories(), getRestaurants(), getFoodItems()])
      .then(([loadedCategories, loadedRestaurants, loadedItems]) => {
        if (!active) return
        setCategories(loadedCategories); setRestaurants(loadedRestaurants); setItems(loadedItems)
      })
      .catch(() => active && setError('We could not load dishes right now. Please try again shortly.'))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  const visibleItems = useMemo(() => items.filter((item) =>
    (categoryId === null || (item.food_category_id ?? item.category_id) === categoryId) && (restaurantId === null || item.restaurant_id === restaurantId),
  ), [categoryId, restaurantId, items])

  return <main className="min-h-screen bg-[#fffaf4] pb-16 pt-[72px]">
    <section className="border-b border-[var(--line)] bg-[var(--sand)] px-6 py-10 sm:px-10"><div className="mx-auto max-w-7xl"><p className="m-0 text-xs font-bold uppercase tracking-[.18em] text-[var(--red)]">Find something delicious</p><h1 className="mb-0 mt-3 text-4xl font-black text-[var(--ink)] sm:text-5xl" style={serif}>Explore dishes</h1><p className="mb-0 mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">Browse dishes from local restaurants, organised by category and kitchen.</p></div></section>
    <nav aria-label="Food categories" className="sticky top-[72px] z-20 border-b border-[var(--line)] bg-[#fffaf4]/95 backdrop-blur"><div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-6 py-3 sm:px-10"><FilterButton active={categoryId === null} onClick={() => setCategoryId(null)}>All dishes</FilterButton>{categories.map((category) => <FilterButton key={category.id} active={category.id === categoryId} onClick={() => setCategoryId(category.id)}>{category.name}</FilterButton>)}</div></nav>
    <div className="mx-auto grid max-w-7xl gap-8 px-6 py-9 sm:px-10 lg:grid-cols-[230px_minmax(0,1fr)]"><aside className="lg:sticky lg:top-36 lg:h-fit"><div className="rounded-2xl border border-[var(--line)] bg-white p-4"><div className="flex items-center gap-2"><Store size={17} className="text-[var(--red)]" /><h2 className="m-0 font-bold text-[var(--ink)]">Restaurants</h2></div><div className="mt-3 flex gap-2 overflow-x-auto lg:flex-col"><button onClick={() => setRestaurantId(null)} className={restaurantButtonClass(restaurantId === null)}>All restaurants</button>{restaurants.map((restaurant) => <button key={restaurant.id} onClick={() => setRestaurantId(restaurant.id)} className={restaurantButtonClass(restaurant.id === restaurantId)}>{restaurant.name}</button>)}</div></div></aside>
      <section aria-live="polite"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="m-0 text-3xl font-black text-[var(--ink)]" style={serif}>{categoryId ? categories.find((category) => category.id === categoryId)?.name : 'All dishes'}</h2><p className="mb-0 mt-1 text-sm text-[var(--muted)]">{loading ? 'Loading dishes…' : `${visibleItems.length} dish${visibleItems.length === 1 ? '' : 'es'} to explore`}</p></div>{restaurantId !== null && <button onClick={() => setRestaurantId(null)} className="text-sm font-bold text-[var(--red)]">Clear restaurant</button>}</div>{error ? <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : loading ? <ExploreSkeletons /> : visibleItems.length ? <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{visibleItems.map((item) => <ExploreItemCard key={`${item.restaurant_id}-${item.id}`} item={item} />)}</div> : <p className="mt-6 rounded-xl border border-[var(--line)] bg-white p-6 text-sm text-[var(--muted)]">No dishes match these filters yet.</p>}</section></div>
  </main>
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) { return <button onClick={onClick} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-colors ${active ? 'bg-[var(--red)] text-white' : 'bg-white text-[var(--muted)] hover:bg-[var(--sand)]'}`}>{children}</button> }
function restaurantButtonClass(active: boolean) { return `shrink-0 rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors ${active ? 'bg-[var(--sand)] text-[var(--red)]' : 'text-[var(--muted)] hover:bg-[var(--cream)]'}` }
function ExploreItemCard({ item }: { item: ExploreMenuItem }) { return <article className="group overflow-hidden rounded-2xl border border-[var(--line)] bg-white transition-shadow hover:shadow-[var(--shadow)]"><a href={`/restaurant/${item.restaurant_id}/menu/${item.id}`} className="block no-underline text-inherit"><div className="h-44 overflow-hidden bg-[var(--sand)]">{item.image_url ? <img src={item.image_url} alt={item.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" /> : <div className="grid h-full place-items-center text-5xl" aria-label="No dish image">🍽️</div>}</div><div className="p-4"><p className="m-0 text-xs font-bold uppercase tracking-wide text-[var(--red)]">{item.restaurantName}</p><div className="mt-2 flex items-start justify-between gap-3"><h3 className="m-0 text-lg font-black text-[var(--ink)]" style={serif}>{item.name}</h3><strong className="shrink-0 text-[var(--red)]">रु{item.price.toFixed(0)}</strong></div><p className="mb-0 mt-2 line-clamp-2 text-sm leading-5 text-[var(--muted)]">{item.description || 'Freshly prepared to order.'}</p><span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[var(--red)]">View dish <ChevronRight size={15} /></span></div></a></article> }
function ExploreSkeletons() { return <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white"><div className="h-44 animate-pulse bg-[var(--sand)]" /><div className="space-y-3 p-4"><div className="h-3 w-24 animate-pulse rounded bg-stone-100" /><div className="h-5 w-3/4 animate-pulse rounded bg-stone-100" /><div className="h-3 w-full animate-pulse rounded bg-stone-100" /></div></div>)}</div> }
