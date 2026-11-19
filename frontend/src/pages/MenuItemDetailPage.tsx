import { useEffect, useState } from 'react'
import { ArrowLeft, Check, Minus, Plus, Store } from 'lucide-react'
import { getMenuItems, getRestaurantById } from '../api/restaurants'
import { useCartContext } from '../contexts/CartContext'
import type { MenuItem, Restaurant } from '../types/restaurant'

const serif = { fontFamily: "'Playfair Display', Georgia, serif" }

const MAX_QUANTITY = 20 // per order

// data loading
function useMenuItemData(restaurantId: number, menuItemId: number) {
  const [item, setItem] = useState<MenuItem | null>(null)
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    Promise.all([
      getMenuItems(restaurantId),
      getRestaurantById(restaurantId).catch(() => null), // the dish still works without the restaurant name
    ])
      .then(([items, place]) => {
        if (!active) return
        const found = items.find((entry) => entry.id === menuItemId) ?? null
        setItem(found)
        setRestaurant(place)
        if (!found) setError('We could not find this menu item.')
      })
      .catch(() => {
        if (active) setError('We could not load this menu item right now.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [restaurantId, menuItemId])

  return { item, restaurant, loading, error }
}

// states
function PageSkeleton() {
  return (
    <main className="min-h-screen bg-[#fffaf4] pt-[72px] md:grid md:grid-cols-2" aria-hidden="true">
      <div className="min-h-[40vh] bg-[var(--line)] animate-pulse md:min-h-[calc(100vh-72px)]" />
      <div className="space-y-5 p-8 sm:p-12 md:self-center">
        <div className="h-3 w-24 rounded bg-[var(--line)] animate-pulse" />
        <div className="h-10 w-3/4 rounded bg-[var(--line)] animate-pulse" />
        <div className="h-4 w-full rounded bg-[var(--line)] animate-pulse" />
        <div className="h-4 w-2/3 rounded bg-[var(--line)] animate-pulse" />
        <div className="h-12 w-40 rounded bg-[var(--line)] animate-pulse" />
      </div>
    </main>
  )
}

function PageMessage({ message, restaurantId }: { message: string; restaurantId: number }) {
  return (
    <main className="grid min-h-[60vh] place-items-center bg-[#fffaf4] px-6 pt-[72px]">
      <div className="rounded-xl bg-white p-6 text-center shadow-sm">
        <p className="m-0 mb-4 text-sm text-[var(--muted)]" role="alert">{message}</p>
        <a href={`/restaurant/${restaurantId}`} className="text-sm font-bold text-[var(--red)] no-underline hover:underline">
          Back to menu
        </a>
      </div>
    </main>
  )
}

// sections
/* Left half: the dish photo fills the whole panel */
function ItemImagePanel({ item, restaurantId }: { item: MenuItem; restaurantId: number }) {
  return (
    <div className="relative min-h-[40vh] overflow-hidden bg-[var(--ink)] md:min-h-[calc(100vh-72px)]">
      {item.image_url ? (
        <img src={item.image_url} alt={item.name} fetchPriority="high" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        // no photo: a plain brand panel instead of a placeholder picture
        <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-[var(--red)] to-[var(--ink)]" aria-hidden="true">
          <span className="text-[180px] font-black leading-none text-[var(--gold)]/40" style={serif}>
            {item.name.slice(0, 1)}
          </span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-transparent" />

      <a
        href={`/restaurant/${restaurantId}`}
        className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-black/40 px-4 py-2 text-sm font-bold text-white no-underline backdrop-blur-sm transition-colors hover:bg-black/60 sm:left-8 sm:top-8"
      >
        <ArrowLeft size={17} aria-hidden="true" /> Back to menu
      </a>
    </div>
  )
}

function QuantityStepper({ quantity, onChange }: { quantity: number; onChange: (next: number) => void }) {
  const stepper =
    'grid h-11 w-11 place-items-center rounded-full border border-[var(--line)] bg-white text-[var(--ink)] cursor-pointer transition-colors hover:border-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[var(--line)]'

  return (
    <div>
      <div className="flex items-center gap-4" role="group" aria-label="Quantity">
        <button type="button" aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => onChange(quantity - 1)} className={stepper}>
          <Minus size={18} aria-hidden="true" />
        </button>
        <span className="min-w-8 text-center text-xl font-black text-[var(--ink)]" aria-live="polite">{quantity}</span>
        <button type="button" aria-label="Increase quantity" disabled={quantity >= MAX_QUANTITY} onClick={() => onChange(quantity + 1)} className={stepper}>
          <Plus size={18} aria-hidden="true" />
        </button>
      </div>
      <p className="mb-0 mt-2 text-xs text-[var(--muted)]">
        {quantity >= MAX_QUANTITY ? `Maximum of ${MAX_QUANTITY} per order reached` : `Up to ${MAX_QUANTITY} per order`}
      </p>
    </div>
  )
}

/* Right half: all the details and the add-to-cart action */
function ItemDetailsPanel({ item, restaurant, restaurantId }: { item: MenuItem; restaurant: Restaurant | null; restaurantId: number }) {
  const { addItem } = useCartContext()
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    if (!added) return
    const t = setTimeout(() => setAdded(false), 2000)
    return () => clearTimeout(t)
  }, [added])

  const handleAdd = () => {
    addItem({
      menu_item_id: item.id,
      name: item.name,
      price: item.price,
      quantity: Math.min(quantity, MAX_QUANTITY),
      restaurantId,
      restaurantName: restaurant?.name ?? '',
    })
    setAdded(true)
  }

  return (
    <div className="flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-16">
      {restaurant && (
        <a href={`/restaurant/${restaurantId}`} className="inline-flex items-center gap-2 self-start text-sm font-bold text-[var(--red)] no-underline hover:underline">
          <Store size={16} aria-hidden="true" /> {restaurant.name}
        </a>
      )}

      <h1 className="mb-0 mt-4 text-4xl font-black leading-tight tracking-tight text-[var(--ink)] sm:text-5xl" style={serif}>
        {item.name}
      </h1>

      <p className="mb-0 mt-5 max-w-lg text-base leading-7 text-[var(--muted)]">
        {item.description || 'Freshly prepared to order.'}
      </p>

      <p className="mb-0 mt-8 text-3xl font-black text-[var(--red)]">₨{item.price.toFixed(0)}</p>

      <div className="my-8 h-px bg-[var(--line)]" />

      {item.is_available ? (
        <>
          <QuantityStepper quantity={quantity} onChange={setQuantity} />

          <button
            onClick={handleAdd}
            className="mt-6 inline-flex w-full max-w-md items-center justify-between gap-3 rounded-xl border-0 bg-[var(--red)] px-6 py-4 text-sm font-bold text-white cursor-pointer transition-colors hover:bg-[hsl(14_75%_40%)]"
          >
            <span className="inline-flex items-center gap-2">
              {added ? <Check size={18} aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />}
              {added ? 'Added to cart' : 'Add to cart'}
            </span>
            <span>₨{(item.price * quantity).toFixed(0)}</span>
          </button>
        </>
      ) : (
        <p className="m-0 rounded-xl bg-[var(--sand)] px-5 py-4 text-sm font-semibold text-[var(--muted)]">
          This item is currently unavailable.
        </p>
      )}
    </div>
  )
}

// main: combine page
export function MenuItemDetailPage({ restaurantId, menuItemId }: { restaurantId: number; menuItemId: number }) {
  const { item, restaurant, loading, error } = useMenuItemData(restaurantId, menuItemId)

  if (loading) return <PageSkeleton />
  if (error || !item) return <PageMessage message={error || 'We could not find this menu item.'} restaurantId={restaurantId} />

  return (
    <main className="min-h-screen bg-[#fffaf4] pt-[72px] md:grid md:grid-cols-2">
      <ItemImagePanel item={item} restaurantId={restaurantId} />
      <ItemDetailsPanel key={item.id} item={item} restaurant={restaurant} restaurantId={restaurantId} />
    </main>
  )
}