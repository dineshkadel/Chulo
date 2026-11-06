import { useEffect, useState } from 'react'
import { ArrowLeft, Plus } from 'lucide-react'
import { getMenuItems } from '../api/restaurants'
import { useCartContext } from '../contexts/CartContext'
import type { MenuItem } from '../types/restaurant'

export function MenuItemDetailPage({ restaurantId, menuItemId }: { restaurantId: number; menuItemId: number }) {
  const [item, setItem] = useState<MenuItem | null>(null)
  const { addItem } = useCartContext()
  useEffect(() => { getMenuItems(restaurantId).then((items) => setItem(items.find((entry) => entry.id === menuItemId) || null)).catch(() => setItem(null)) }, [restaurantId, menuItemId])
  if (!item) return <main className="grid min-h-[60vh] place-items-center bg-[#fffaf4]"><p className="text-sm text-[var(--muted)]">Loading menu item…</p></main>
  return <main className="min-h-screen bg-[#fffaf4] px-6 py-10 sm:px-10"><div className="mx-auto max-w-3xl"><a href={`/restaurant/${restaurantId}`} className="inline-flex items-center gap-2 text-sm font-bold text-[var(--red)] no-underline"><ArrowLeft size={17} /> Back to menu</a><article className="mt-6 overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-sm md:grid md:grid-cols-2"><div className="min-h-64 bg-[var(--sand)]">{item.image_url ? <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" /> : <div className="grid h-full min-h-64 place-items-center text-7xl">🍽️</div>}</div><div className="p-7"><p className="text-xs font-bold uppercase tracking-[.16em] text-[var(--red)]">Menu item</p><h1 className="m-0 font-[family-name:var(--display)] text-4xl text-[var(--ink)]">{item.name}</h1><p className="mt-5 leading-7 text-[var(--muted)]">{item.description || 'Freshly prepared to order.'}</p><p className="mt-7 text-2xl font-black text-[var(--red)]">₨{item.price.toFixed(0)}</p><button disabled={!item.is_available} onClick={() => addItem({ menu_item_id: item.id, name: item.name, price: item.price, quantity: 1, restaurantId })} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--red)] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"><Plus size={17} /> {item.is_available ? 'Add to cart' : 'Unavailable'}</button></div></article></div></main>
}
