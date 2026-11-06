import { useEffect, useState } from 'react'
import { ArrowLeft, MapPin, Plus, Star } from 'lucide-react'
import { getMenuItems, getRestaurantById } from '../api/restaurants'
import { useCartContext } from '../contexts/CartContext'
import { useLocationContext } from '../contexts/LocationContext'
import type { MenuItem, Restaurant } from '../types/restaurant'

const serif = { fontFamily: "'Playfair Display', Georgia, serif" }

export function RestaurantDetailPage({ restaurantId }: { restaurantId: number }) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [items, setItems] = useState<MenuItem[]>([])
  const [error, setError] = useState('')
  const { coordinates } = useLocationContext()

  useEffect(() => {
    let active = true
    Promise.all([getRestaurantById(restaurantId), getMenuItems(restaurantId)])
      .then(([place, menu]) => { if (active) { setRestaurant(place); setItems(menu) } })
      .catch(() => { if (active) setError('We could not load this restaurant right now.') })
    return () => { active = false }
  }, [restaurantId])

  if (error) return <PageMessage message={error} />
  if (!restaurant) return <PageMessage message="Loading restaurant…" />

  const distance = restaurant.lat !== undefined && restaurant.lng !== undefined ? distanceKm(coordinates.latitude, coordinates.longitude, restaurant.lat, restaurant.lng) : undefined
  return <main className="min-h-screen bg-[#fffaf4]">
    <section className="border-b border-[var(--line)] bg-[var(--sand)]">
      <div className="mx-auto max-w-7xl px-6 py-6 sm:px-10">
        <a href="/restaurant" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--red)] no-underline"><ArrowLeft size={17} /> All restaurants</a>
        <div className="mt-6 grid gap-7 md:grid-cols-[280px_1fr] md:items-end">
          <div className="h-48 overflow-hidden rounded-2xl bg-[var(--gold)]/30 md:h-56">
            {restaurant.hero_image_url ? <img src={restaurant.hero_image_url} alt={restaurant.name} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-7xl font-black text-[var(--red)]/35" style={serif}>{restaurant.name.slice(0, 1)}</div>}
          </div>
          <div className="pb-2">
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${restaurant.is_open ? 'bg-emerald-600 text-white' : 'bg-stone-700 text-white'}`}>{restaurant.is_open ? 'Open now' : 'Currently closed'}</span>
            <h1 className="mb-2 mt-4 text-4xl font-black text-[var(--ink)] sm:text-5xl" style={serif}>{restaurant.name}</h1>
            <p className="m-0 text-sm font-semibold text-[var(--muted)]">{restaurant.cuisine_types || 'Local food'} · {'₨'.repeat(Math.max(1, restaurant.price_tier))}</p>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--muted)]"><span className="inline-flex items-center gap-1"><Star size={16} className="fill-[var(--gold)] text-[var(--gold)]" /> {restaurant.avg_rating ? restaurant.avg_rating.toFixed(1) : 'New'} {restaurant.review_count ? `(${restaurant.review_count})` : ''}</span><span className="inline-flex items-center gap-1"><MapPin size={16} /> {distance !== undefined ? `${distance.toFixed(1)} km away` : restaurant.address || 'Kathmandu'}</span></div>
          </div>
        </div>
      </div>
    </section>
    <section className="mx-auto max-w-7xl px-6 py-12 sm:px-10">
      {restaurant.description && <p className="max-w-3xl text-base leading-7 text-[var(--muted)]">{restaurant.description}</p>}
      <h2 className="mt-10 text-3xl font-black text-[var(--ink)]" style={serif}>Menu</h2>
      {items.length === 0 ? <p className="mt-5 rounded-xl border border-[var(--line)] bg-white p-5 text-sm text-[var(--muted)]">This restaurant has not added menu items yet.</p> : <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => <MenuItemCard key={item.id} item={item} restaurant={restaurant} />)}</div>}
    </section>
  </main>
}

function MenuItemCard({ item, restaurant }: { item: MenuItem; restaurant: Restaurant }) {
  const { addItem } = useCartContext()
  return <article className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
    <a href={`/restaurant/${restaurant.id}/menu/${item.id}`} className="block no-underline text-inherit">
      <div className="h-36 bg-[var(--sand)]">{item.image_url ? <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-4xl">🍽️</div>}</div>
      <div className="p-4"><h3 className="m-0 font-bold text-[var(--ink)]" style={serif}>{item.name}</h3><p className="mb-0 mt-2 min-h-10 text-sm text-[var(--muted)]">{item.description || 'Freshly prepared to order.'}</p></div>
    </a>
    <div className="flex items-center justify-between border-t border-[var(--line)] px-4 py-3"><strong className="text-[var(--red)]">₨{item.price.toFixed(0)}</strong><button disabled={!item.is_available} onClick={() => addItem({ menu_item_id: item.id, name: item.name, price: item.price, quantity: 1, restaurantId: restaurant.id, restaurantName: restaurant.name })} className="inline-flex items-center gap-1 rounded-lg bg-[var(--red)] px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"><Plus size={15} /> {item.is_available ? 'Add' : 'Unavailable'}</button></div>
  </article>
}

function PageMessage({ message }: { message: string }) { return <main className="grid min-h-[60vh] place-items-center bg-[#fffaf4] px-6"><p className="rounded-xl bg-white p-6 text-sm text-[var(--muted)] shadow-sm">{message}</p></main> }

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const radians = (value: number) => value * Math.PI / 180
  const dLat = radians(lat2 - lat1)
  const dLng = radians(lng2 - lng1)
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value))
}
