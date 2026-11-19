import { useEffect, useState } from 'react'
import { ArrowLeft, MapPin, Plus, Star } from 'lucide-react'
import { getMenuItems, getRestaurantById } from '../api/restaurants'
import { useCartContext } from '../contexts/CartContext'
import { useLocationContext } from '../contexts/LocationContext'
import type { MenuItem, Restaurant } from '../types/restaurant'

const serif = { fontFamily: "'Playfair Display', Georgia, serif" }

// helpers
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const radians = (value: number) => (value * Math.PI) / 180
  const dLat = radians(lat2 - lat1)
  const dLng = radians(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// data loading
function useRestaurantData(restaurantId: number) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    Promise.all([getRestaurantById(restaurantId), getMenuItems(restaurantId)])
      .then(([place, menu]) => {
        if (active) {
          setRestaurant(place)
          setItems(menu)
        }
      })
      .catch(() => {
        if (active) setError('We could not load this restaurant right now.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [restaurantId])

  return { restaurant, items, loading, error }
}

// skeletons
function BannerSkeleton() {
  return <section className="min-h-[40vh] bg-[var(--line)] animate-pulse" aria-hidden="true" />
}

function MenuSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white overflow-hidden animate-pulse">
      <div className="h-36 bg-[var(--line)]" />
      <div className="p-4 space-y-3">
        <div className="h-4 rounded bg-[var(--line)] w-2/3" />
        <div className="h-3 rounded bg-[var(--line)] w-full" />
        <div className="h-3 rounded bg-[var(--line)] w-1/2" />
      </div>
    </div>
  )
}

function PageMessage({ message }: { message: string }) {
  return (
    <main className="grid min-h-[60vh] place-items-center bg-[#fffaf4] px-6 pt-[72px]">
      <p className="rounded-xl bg-white p-6 text-sm text-[var(--muted)] shadow-sm" role="alert">
        {message}
      </p>
    </main>
  )
}

// sections
/* Banner: photo fills ~40% of the screen, the bottom ~20% holds the details and description */
function RestaurantBanner({ restaurant, distance }: { restaurant: Restaurant; distance?: number }) {
  return (
    <section className="relative min-h-[40vh] flex flex-col justify-between overflow-hidden bg-[var(--ink)] text-white pt-[72px]">
      {restaurant.hero_image_url ? (
        <img
          src={restaurant.hero_image_url}
          alt={restaurant.name}
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-[var(--red)] to-[var(--ink)]" aria-hidden="true">
          <span className="text-[160px] font-black leading-none text-[var(--gold)]/40" style={serif}>
            {restaurant.name.slice(0, 1)}
          </span>
        </div>
      )}
      {/* keeps the text readable on any photo */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pt-5 sm:px-10">
        <a
          href="/restaurant"
          className="inline-flex items-center gap-2 rounded-full bg-black/40 px-4 py-2 text-sm font-bold text-white no-underline backdrop-blur-sm hover:bg-black/60 transition-colors"
        >
          <ArrowLeft size={17} aria-hidden="true" /> All restaurants
        </a>
      </div>

      {/* bottom ~20vh: details + description */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-8 pt-10 sm:px-10 min-h-[20vh]">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${restaurant.is_open ? 'bg-emerald-600' : 'bg-stone-700'}`}>
            {restaurant.is_open ? 'Open now' : 'Currently closed'}
          </span>
          <span className="text-sm font-semibold text-white/80">
            {restaurant.cuisine_types || 'Local food'} · {'₨'.repeat(Math.max(1, restaurant.price_tier))}
          </span>
        </div>

        <h1 className="mb-2 mt-3 text-4xl font-black leading-tight tracking-tight sm:text-5xl" style={serif}>
          {restaurant.name}
        </h1>

        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/80">
          <span className="inline-flex items-center gap-1">
            <Star size={16} className="fill-[var(--gold)] text-[var(--gold)]" aria-hidden="true" />
            {restaurant.avg_rating ? restaurant.avg_rating.toFixed(1) : 'New'}
            {restaurant.review_count ? ` (${restaurant.review_count})` : ''}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin size={16} aria-hidden="true" />
            {distance !== undefined ? `${distance.toFixed(1)} km away` : restaurant.address || 'Kathmandu'}
          </span>
        </div>

        {restaurant.description && (
          <p className="mb-0 mt-3 max-w-3xl text-sm leading-6 text-white/85 sm:text-base line-clamp-3">
            {restaurant.description}
          </p>
        )}
      </div>
    </section>
  )
}

function MenuItemCard({ item, restaurant }: { item: MenuItem; restaurant: Restaurant }) {
  const { addItem } = useCartContext()

  return (
    <article className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white flex flex-col">
      <a href={`/restaurant/${restaurant.id}/menu/${item.id}`} className="block flex-1 text-inherit no-underline">
        <div className="h-36 overflow-hidden bg-[var(--sand)]">
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-4xl" aria-hidden="true">🍽️</div>
          )}
        </div>
        <div className="p-4">
          <h3 className="m-0 font-bold text-[var(--ink)]" style={serif}>{item.name}</h3>
          <p className="mb-0 mt-2 min-h-10 text-sm text-[var(--muted)]">{item.description || 'Freshly prepared to order.'}</p>
        </div>
      </a>

      <div className="flex items-center justify-between border-t border-[var(--line)] px-4 py-3">
        <strong className="text-[var(--red)]">₨{item.price.toFixed(0)}</strong>
        <button
          disabled={!item.is_available}
          onClick={() =>
            addItem({
              menu_item_id: item.id,
              name: item.name,
              price: item.price,
              quantity: 1,
              restaurantId: restaurant.id,
              restaurantName: restaurant.name,
            })
          }
          className="inline-flex items-center gap-1 rounded-lg border-0 bg-[var(--red)] px-3 py-2 text-xs font-bold text-white cursor-pointer hover:bg-[hsl(14_75%_40%)] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={15} aria-hidden="true" /> {item.is_available ? 'Add' : 'Unavailable'}
        </button>
      </div>
    </article>
  )
}

function MenuSection({ items, restaurant, loading }: { items: MenuItem[]; restaurant: Restaurant | null; loading: boolean }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-14 sm:px-10" id="menu">
      <div className="mb-8 flex items-end justify-between gap-4">
        <h2 className="m-0 text-3xl font-black tracking-tight text-[var(--ink)] sm:text-4xl" style={serif}>
          Menu
        </h2>
        {!loading && items.length > 0 && (
          <span className="text-sm text-[var(--muted)]">{items.length} {items.length === 1 ? 'dish' : 'dishes'}</span>
        )}
      </div>

      {loading || !restaurant ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <MenuSkeleton key={i} />)}
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-[var(--line)] bg-white p-5 text-sm text-[var(--muted)]">
          This restaurant has not added menu items yet.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => <MenuItemCard key={item.id} item={item} restaurant={restaurant} />)}
        </div>
      )}
    </section>
  )
}

// main: combine page
export function RestaurantDetailPage({ restaurantId }: { restaurantId: number }) {
  const { coordinates } = useLocationContext()
  const { restaurant, items, loading, error } = useRestaurantData(restaurantId)

  if (error) return <PageMessage message={error} />

  const distance =
    restaurant && restaurant.lat !== undefined && restaurant.lng !== undefined
      ? distanceKm(coordinates.latitude, coordinates.longitude, restaurant.lat, restaurant.lng)
      : undefined

  return (
    <main className="min-h-screen bg-[#fffaf4]">
      {loading || !restaurant ? <BannerSkeleton /> : <RestaurantBanner restaurant={restaurant} distance={distance} />}
      <MenuSection items={items} restaurant={restaurant} loading={loading} />
    </main>
  )
}