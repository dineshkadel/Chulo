import { useEffect, useRef, useState } from 'react'
import {
  Bell,
  Check,
  ClipboardList,
  Edit3,
  LogOut,
  MenuSquare,
  MessageSquareText,
  Plus,
  RefreshCw,
  Settings,
  Star,
  Store,
  Trash2,
  UtensilsCrossed,
  X,
} from 'lucide-react'
import type { Route } from '../../App'
import { RestaurantOrdersKanban } from '../../components/restaurant/RestaurantOrdersKanban'
import {
  createFoodCategory,
  createMenuItem,
  deleteMenuItem,
  getMyFoodCategories,
  getMyMenuItems,
  getRestaurantMe,
  toggleMenuItemAvailability,
  updateMenuItem,
  updateRestaurantMe,
  type FoodCategory,
  type MenuItemPayload,
  type RestaurantProfile,
  type RestaurantProfileUpdatePayload,
} from '../../api/restaurantApi'
import type { MenuItem } from '../../types/restaurant'

// ─── constants ───────────────────────────────────────────────────────────────

type Tab = 'orders' | 'menu' | 'reviews' | 'settings'

const NAV: { id: Tab; label: string; icon: typeof ClipboardList }[] = [
  { id: 'orders', label: 'Orders', icon: ClipboardList },
  { id: 'menu', label: 'Menu', icon: UtensilsCrossed },
  { id: 'reviews', label: 'Reviews', icon: MessageSquareText },
  { id: 'settings', label: 'Settings', icon: Settings },
]

// ─── helpers ─────────────────────────────────────────────────────────────────

const npr = (v: number) => `Rs ${v.toLocaleString('en-IN')}`

function Spinner() {
  return (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
  )
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700">
      <X size={16} className="shrink-0" />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1 rounded-lg bg-red-100 px-3 py-1 text-xs font-bold hover:bg-red-200"
        >
          <RefreshCw size={12} /> Retry
        </button>
      )}
    </div>
  )
}

// ─── Menu tab ────────────────────────────────────────────────────────────────

interface AddItemModalProps {
  categories: FoodCategory[]
  onClose: () => void
  onSaved: (item: MenuItem) => void
}

function AddItemModal({ categories, onClose, onSaved }: AddItemModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [categoryId, setCategoryId] = useState<number>(categories[0]?.id ?? 0)
  const [newCatName, setNewCatName] = useState('')
  const [creatingCat, setCreatingCat] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleCreateCategory() {
    if (!newCatName.trim()) return
    setCreatingCat(true)
    try {
      const cat = await createFoodCategory(newCatName.trim())
      categories.push(cat) // mutate prop-safe (parent will refetch on save)
      setCategoryId(cat.id)
      setNewCatName('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create category')
    } finally {
      setCreatingCat(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !price || !categoryId) {
      setError('Name, price and category are required')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload: MenuItemPayload = {
        food_category_id: categoryId,
        name: name.trim(),
        description: description.trim() || undefined,
        price: parseFloat(price),
        is_available: true,
      }
      const item = await createMenuItem(payload)
      onSaved(item)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add item')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="w-full max-w-lg rounded-t-2xl bg-white p-6 sm:rounded-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold">Add menu item</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-stone-100">
            <X size={20} />
          </button>
        </div>
        {error && <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <form onSubmit={handleSubmit} className="grid gap-4">
          <label className="grid gap-1.5 text-sm font-bold">
            Item name *
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Chicken Momo"
              className="rounded-xl border border-stone-300 px-3 py-2.5 font-normal"
              required
            />
          </label>
          <label className="grid gap-1.5 text-sm font-bold">
            Price (Rs) *
            <input
              type="number"
              min="1"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="280"
              className="rounded-xl border border-stone-300 px-3 py-2.5 font-normal"
              required
            />
          </label>
          <label className="grid gap-1.5 text-sm font-bold">
            Category *
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              className="rounded-xl border border-stone-300 px-3 py-2.5 font-normal"
              required
            >
              {categories.length === 0 && (
                <option value={0} disabled>
                  — create a category first —
                </option>
              )}
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          {/* Quick inline category creation */}
          <div className="flex gap-2">
            <input
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="New category name"
              className="min-w-0 flex-1 rounded-xl border border-stone-200 px-3 py-2 text-sm font-normal"
            />
            <button
              type="button"
              onClick={handleCreateCategory}
              disabled={creatingCat || !newCatName.trim()}
              className="flex items-center gap-1 rounded-xl bg-stone-100 px-3 py-2 text-sm font-bold disabled:opacity-50"
            >
              {creatingCat ? <Spinner /> : <Plus size={14} />} Add cat
            </button>
          </div>
          <label className="grid gap-1.5 text-sm font-bold">
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Short description…"
              className="rounded-xl border border-stone-300 px-3 py-2.5 font-normal"
            />
          </label>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-stone-300 py-3 text-sm font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-(--red) py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {saving ? <Spinner /> : <Plus size={16} />} Add item
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface EditItemModalProps {
  item: MenuItem
  categories: FoodCategory[]
  onClose: () => void
  onSaved: (item: MenuItem) => void
}

function EditItemModal({ item, categories, onClose, onSaved }: EditItemModalProps) {
  const [name, setName] = useState(item.name)
  const [description, setDescription] = useState(item.description ?? '')
  const [price, setPrice] = useState(String(item.price))
  const [categoryId, setCategoryId] = useState<number>(item.category_id ?? categories[0]?.id ?? 0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const updated = await updateMenuItem(item.id, {
        food_category_id: categoryId,
        name: name.trim(),
        description: description.trim() || undefined,
        price: parseFloat(price),
      })
      onSaved(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="w-full max-w-lg rounded-t-2xl bg-white p-6 sm:rounded-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold">Edit item</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-stone-100">
            <X size={20} />
          </button>
        </div>
        {error && <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <form onSubmit={handleSubmit} className="grid gap-4">
          <label className="grid gap-1.5 text-sm font-bold">
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl border border-stone-300 px-3 py-2.5 font-normal"
              required
            />
          </label>
          <label className="grid gap-1.5 text-sm font-bold">
            Price (Rs)
            <input
              type="number"
              min="1"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="rounded-xl border border-stone-300 px-3 py-2.5 font-normal"
              required
            />
          </label>
          <label className="grid gap-1.5 text-sm font-bold">
            Category
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              className="rounded-xl border border-stone-300 px-3 py-2.5 font-normal"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-bold">
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="rounded-xl border border-stone-300 px-3 py-2.5 font-normal"
            />
          </label>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-stone-300 py-3 text-sm font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-(--red) py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {saving ? <Spinner /> : <Check size={16} />} Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function MenuTab() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<FoodCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editItem, setEditItem] = useState<MenuItem | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [fetchedItems, fetchedCats] = await Promise.all([
        getMyMenuItems(),
        getMyFoodCategories(),
      ])
      setItems(fetchedItems)
      setCategories(fetchedCats)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load menu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  async function handleToggle(item: MenuItem) {
    setTogglingId(item.id)
    try {
      const updated = await toggleMenuItemAvailability(item.id, !item.is_available)
      setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Toggle failed')
    } finally {
      setTogglingId(null)
    }
  }

  async function handleDelete(item: MenuItem) {
    if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`)) return
    setDeletingId(item.id)
    try {
      await deleteMenuItem(item.id)
      setItems((prev) => prev.filter((i) => i.id !== item.id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    } finally {
      setDeletingId(null)
    }
  }

  function categoryName(id?: number) {
    return categories.find((c) => c.id === id)?.name ?? 'Uncategorised'
  }

  return (
    <>
      {/* header */}
      <div className="mb-7 flex items-end justify-between">
        <div>
          <p className="m-0 text-xs font-bold uppercase tracking-[.16em] text-(--red)">
            Your dishes
          </p>
          <h1 className="mt-2 font-[family-name:var(--display)] text-4xl">Menu</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="grid h-10 w-10 place-items-center rounded-xl border border-stone-200 hover:bg-stone-50"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 rounded-xl bg-(--red) px-4 py-2.5 text-sm font-bold text-white"
          >
            <Plus size={16} /> Add item
          </button>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-stone-100" />
          ))}
        </div>
      ) : items.length === 0 && !error ? (
        <div className="rounded-2xl border-2 border-dashed border-stone-200 py-16 text-center text-stone-400">
          <UtensilsCrossed size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-bold">No menu items yet</p>
          <p className="mt-1 text-sm">Click "Add item" to build your menu.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <article key={item.id} className="rounded-2xl border border-[#eadfd2] bg-white p-5">
              <div className="flex items-start justify-between gap-2">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#fff0dc] text-(--red)">
                  <MenuSquare size={20} />
                </span>
                <button
                  onClick={() => handleToggle(item)}
                  disabled={togglingId === item.id}
                  className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition-all ${
                    item.is_available
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  {togglingId === item.id ? <Spinner /> : null}
                  {item.is_available ? 'Available' : 'Sold out'}
                </button>
              </div>
              <p className="mb-1 mt-5 text-xs font-bold uppercase tracking-wide text-stone-400">
                {categoryName(item.category_id)}
              </p>
              <h2 className="m-0 text-lg">{item.name}</h2>
              {item.description && (
                <p className="mt-1 line-clamp-2 text-sm text-stone-500">{item.description}</p>
              )}
              <div className="mt-3 flex items-center justify-between">
                <span className="font-bold text-(--red)">{npr(item.price)}</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditItem(item)}
                    className="grid h-8 w-8 place-items-center rounded-xl bg-stone-100 hover:bg-stone-200"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    disabled={deletingId === item.id}
                    className="grid h-8 w-8 place-items-center rounded-xl bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
                  >
                    {deletingId === item.id ? <Spinner /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {showAdd && (
        <AddItemModal
          categories={categories}
          onClose={() => setShowAdd(false)}
          onSaved={(item) => {
            setItems((prev) => [item, ...prev])
            setShowAdd(false)
          }}
        />
      )}
      {editItem && (
        <EditItemModal
          item={editItem}
          categories={categories}
          onClose={() => setEditItem(null)}
          onSaved={(updated) => {
            setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
            setEditItem(null)
          }}
        />
      )}
    </>
  )
}

// ─── Reviews tab ─────────────────────────────────────────────────────────────

function ReviewsTab({ profile }: { profile: RestaurantProfile | null }) {
  const rating = profile?.avg_rating ?? 0
  const count = profile?.review_count ?? 0
  const stars = Math.round(rating)

  return (
    <>
      <div className="mb-7">
        <p className="m-0 text-xs font-bold uppercase tracking-[.16em] text-(--red)">
          Customer feedback
        </p>
        <h1 className="mt-2 font-[family-name:var(--display)] text-4xl">Reviews</h1>
      </div>

      {/* Rating summary */}
      <div className="mb-6 grid gap-4 sm:grid-cols-[220px_1fr]">
        <div className="rounded-2xl bg-(--red) p-6 text-white">
          <p className="m-0 text-sm text-orange-100">Average rating</p>
          <strong className="mt-2 block text-5xl">
            {rating > 0 ? rating.toFixed(1) : '—'}
          </strong>
          <div className="mt-2 flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={17}
                fill={i < stars ? 'currentColor' : 'none'}
                className={i < stars ? '' : 'opacity-40'}
              />
            ))}
          </div>
          <p className="mb-0 mt-4 text-sm text-orange-100">
            {count > 0 ? `Based on ${count} review${count === 1 ? '' : 's'}` : 'No reviews yet'}
          </p>
        </div>

        <div className="flex flex-col items-center justify-center rounded-2xl border border-[#eadfd2] bg-white p-8 text-center">
          <MessageSquareText size={40} className="mb-3 text-stone-300" />
          <h2 className="m-0 text-lg font-bold">Customer reviews coming soon</h2>
          <p className="mt-2 max-w-xs text-sm leading-6 text-stone-500">
            The reviews dashboard is under development. Rating and review count above are pulled live
            from your restaurant profile.
          </p>
        </div>
      </div>
    </>
  )
}

// ─── Settings tab ────────────────────────────────────────────────────────────

function SettingsTab({ onProfileUpdate }: { onProfileUpdate: (p: RestaurantProfile) => void }) {
  const [profile, setProfile] = useState<RestaurantProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form fields
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [cuisineTypes, setCuisineTypes] = useState('')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [heroImageUrl, setHeroImageUrl] = useState('')

  async function loadProfile() {
    setLoading(true)
    setError('')
    try {
      const p = await getRestaurantMe()
      setProfile(p)
      // populate form
      setName(p.name)
      setDescription(p.description ?? '')
      setAddress(p.address ?? '')
      setPhone(p.phone ?? '')
      setCuisineTypes(p.cuisine_types ?? '')
      setLat(String(p.lat ?? ''))
      setLng(String(p.lng ?? ''))
      setHeroImageUrl(p.hero_image_url ?? '')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadProfile() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const payload: RestaurantProfileUpdatePayload = {
        name: name.trim(),
        description: description.trim() || undefined,
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        cuisine_types: cuisineTypes.trim() || undefined,
        lat: parseFloat(lat) || 0,
        lng: parseFloat(lng) || 0,
        hero_image_url: heroImageUrl.trim() || undefined,
        price_tier: profile?.price_tier ?? 2,
      }
      const updated = await updateRestaurantMe(payload)
      setProfile(updated)
      onProfileUpdate(updated)
      // Update localStorage cache
      const cached = JSON.parse(localStorage.getItem('restaurant_portal') ?? '{}')
      localStorage.setItem(
        'restaurant_portal',
        JSON.stringify({ ...cached, name: updated.name, address: updated.address }),
      )
      setSuccess('Profile updated successfully!')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-stone-400">
        <Spinner /> <span className="ml-3">Loading profile…</span>
      </div>
    )
  }

  return (
    <>
      <div className="mb-7">
        <p className="m-0 text-xs font-bold uppercase tracking-[.16em] text-(--red)">
          Account and profile
        </p>
        <h1 className="mt-2 font-[family-name:var(--display)] text-4xl">Settings</h1>
      </div>

      {error && <ErrorBanner message={error} onRetry={loadProfile} />}

      <form onSubmit={handleSubmit} className="max-w-2xl rounded-2xl border border-[#eadfd2] bg-white p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-[#fff0dc] text-(--red)">
            <Store size={22} />
          </span>
          <div>
            <h2 className="m-0 text-lg">Restaurant profile</h2>
            <p className="m-0 mt-1 text-sm text-stone-500">Public business details</p>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-bold">
              Restaurant name *
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl border border-stone-300 px-3 py-2.5 font-normal"
                required
              />
            </label>
            <label className="grid gap-1.5 text-sm font-bold">
              Account email
              <input
                value={profile?.email ?? ''}
                disabled
                className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 font-normal text-stone-500"
              />
            </label>
          </div>

          <label className="grid gap-1.5 text-sm font-bold">
            Address
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="rounded-xl border border-stone-300 px-3 py-2.5 font-normal"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-bold">
              Phone
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="rounded-xl border border-stone-300 px-3 py-2.5 font-normal"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-bold">
              Cuisine types
              <input
                value={cuisineTypes}
                onChange={(e) => setCuisineTypes(e.target.value)}
                placeholder="e.g. Nepali, Indian"
                className="rounded-xl border border-stone-300 px-3 py-2.5 font-normal"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-bold">
              Latitude
              <input
                type="number"
                step="any"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="rounded-xl border border-stone-300 px-3 py-2.5 font-normal"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-bold">
              Longitude
              <input
                type="number"
                step="any"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className="rounded-xl border border-stone-300 px-3 py-2.5 font-normal"
              />
            </label>
          </div>

          <label className="grid gap-1.5 text-sm font-bold">
            Hero image URL
            <input
              value={heroImageUrl}
              onChange={(e) => setHeroImageUrl(e.target.value)}
              placeholder="https://…"
              className="rounded-xl border border-stone-300 px-3 py-2.5 font-normal"
            />
          </label>

          <label className="grid gap-1.5 text-sm font-bold">
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="rounded-xl border border-stone-300 px-3 py-2.5 font-normal"
            />
          </label>
        </div>

        {success && (
          <p className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
            <Check size={15} /> {success}
          </p>
        )}

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={loadProfile}
            className="rounded-xl border border-stone-200 px-4 py-3 text-sm font-bold hover:bg-stone-50"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-(--red) px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {saving ? <Spinner /> : <Check size={16} />} Save changes
          </button>
        </div>
      </form>
    </>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────

export function RestaurantDashboardPage({ navigate }: { navigate: (to: Route) => void }) {
  const token = localStorage.getItem('restaurant_access_token')
  const [tab, setTab] = useState<Tab>('orders')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profile, setProfile] = useState<RestaurantProfile | null>(null)
  const hasLoadedProfile = useRef(false)

  useEffect(() => {
    if (!token) navigate('/vendor/login')
  }, [token, navigate])

  useEffect(() => {
    if (!token || hasLoadedProfile.current) return
    hasLoadedProfile.current = true
    getRestaurantMe()
      .then(setProfile)
      .catch(() => {
        try {
          const cached = JSON.parse(localStorage.getItem('restaurant_portal') ?? '{}')
          if (cached.id) setProfile(cached as RestaurantProfile)
        } catch { /* ignore */ }
      })
  }, [token])

  if (!token) return null

  const logout = () => {
    ;['restaurant_access_token', 'restaurant_refresh_token', 'restaurant_portal'].forEach((k) =>
      localStorage.removeItem(k),
    )
    navigate('/vendor/login')
  }

  const displayName = profile?.name ?? 'Your restaurant'
  const initial = displayName.slice(0, 1).toUpperCase()
  const rating = profile?.avg_rating ?? 0
  const reviewCount = profile?.review_count ?? 0

  // NAV group metadata
  const NAV_GROUPS = [
    {
      label: 'Operations',
      items: [
        { id: 'orders' as Tab, label: 'Orders', icon: ClipboardList, badge: null },
        { id: 'menu' as Tab, label: 'Menu', icon: UtensilsCrossed, badge: null },
      ],
    },
    {
      label: 'Insights',
      items: [
        { id: 'reviews' as Tab, label: 'Reviews', icon: MessageSquareText, badge: reviewCount > 0 ? String(reviewCount) : null },
      ],
    },
    {
      label: 'Account',
      items: [
        { id: 'settings' as Tab, label: 'Settings', icon: Settings, badge: null },
      ],
    },
  ]

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`flex h-full flex-col ${mobile ? '' : 'py-6'}`}>
      {/* Brand */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left hover:bg-white/5"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-(--red) shadow-lg shadow-red-900/40">
          <Store size={20} />
        </span>
        <div>
          <strong className="block font-[family-name:var(--display)] text-lg leading-tight text-white">
            Chulo
          </strong>
          <span className="text-xs text-orange-200/70">Restaurant portal</span>
        </div>
      </button>

      {/* Restaurant card */}
      <div className="mx-2 mt-5 rounded-2xl bg-white/8 p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-orange-400 to-red-600 font-bold text-white text-lg shadow">
            {initial}
          </span>
          <div className="min-w-0">
            <p className="m-0 truncate text-sm font-bold text-white">{displayName}</p>
            {rating > 0 && (
              <p className="m-0 mt-0.5 flex items-center gap-1 text-xs text-orange-200/70">
                <Star size={11} fill="currentColor" className="text-amber-400" />
                {rating.toFixed(1)} · {reviewCount} reviews
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="mt-6 flex-1 space-y-5 px-2">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-orange-100/35">
              {group.label}
            </p>
            <div className="grid gap-0.5">
              {group.items.map(({ id, label, icon: Icon, badge }) => {
                const active = tab === id
                return (
                  <button
                    key={id}
                    onClick={() => { setTab(id); setSidebarOpen(false) }}
                    className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-all duration-150 ${
                      active
                        ? 'bg-(--red) text-white shadow-sm shadow-red-900/30'
                        : 'text-orange-100/60 hover:bg-white/8 hover:text-orange-50'
                    }`}
                  >
                    {/* Active pill indicator */}
                    {active && (
                      <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-white/60" />
                    )}
                    <Icon size={18} className={active ? 'text-white' : 'text-orange-200/50 group-hover:text-orange-100'} />
                    <span className="flex-1">{label}</span>
                    {badge && (
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                        active ? 'bg-white/20 text-white' : 'bg-white/10 text-orange-200'
                      }`}>
                        {badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="mt-auto space-y-1 px-2 pb-2">
        <div className="rounded-2xl bg-white/6 p-4">
          <p className="m-0 text-xs font-bold text-orange-100/80">Need help?</p>
          <p className="mb-0 mt-1 text-[11px] leading-5 text-orange-100/40">
            Contact our restaurant support team.
          </p>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-orange-100/50 hover:bg-white/8 hover:text-orange-100 transition-colors"
        >
          <LogOut size={17} />
          Sign out
        </button>
      </div>
    </div>
  )

  return (
    <main className="min-h-screen bg-[#f7f1ea] text-(--ink)">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex min-h-screen">
        {/* ── Desktop sidebar ── */}
        <aside className="hidden w-64 shrink-0 bg-[#1e1209] lg:block">
          <div className="sticky top-0 h-screen overflow-y-auto">
            <Sidebar />
          </div>
        </aside>

        {/* ── Mobile sidebar drawer ── */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#1e1209] transition-transform duration-300 ease-out lg:hidden ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-full flex-col p-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-orange-100/40">
                Menu
              </span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-xl text-orange-100/60 hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <Sidebar mobile />
          </div>
        </aside>

        {/* ── Content area ── */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top bar */}
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stone-200/60 bg-[#f7f1ea]/90 px-5 py-3.5 backdrop-blur">
            <div className="flex items-center gap-3">
              {/* Hamburger (mobile only) */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="grid h-9 w-9 place-items-center rounded-xl border border-stone-200 bg-white lg:hidden"
              >
                <MenuSquare size={18} />
              </button>

              <div>
                <p className="m-0 text-[11px] font-bold uppercase tracking-[.18em] text-(--red)">
                  {NAV.find((n) => n.id === tab)?.label ?? 'Dashboard'}
                </p>
                <p className="m-0 text-xs text-stone-500 lg:hidden">{displayName}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="relative grid h-9 w-9 place-items-center rounded-xl border border-stone-200 bg-white hover:bg-stone-50">
                <Bell size={16} />
              </button>
              <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-1.5">
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-(--red) text-xs font-bold text-white">
                  {initial}
                </span>
                <span className="hidden text-sm font-semibold sm:block">{displayName}</span>
              </div>
            </div>
          </header>

          {/* Page content */}
          <div className="flex-1 p-5 sm:p-8">
            <div className="mx-auto max-w-7xl">
              {tab === 'orders' && <RestaurantOrdersKanban />}
              {tab === 'menu' && <MenuTab />}
              {tab === 'reviews' && <ReviewsTab profile={profile} />}
              {tab === 'settings' && (
                <SettingsTab onProfileUpdate={(p) => setProfile(p)} />
              )}
            </div>
          </div>

          {/* Mobile bottom nav bar */}
          <nav className="sticky bottom-0 z-30 flex border-t border-stone-200 bg-white lg:hidden">
            {NAV.map(({ id, label, icon: Icon }) => {
              const active = tab === id
              return (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-bold transition-colors ${
                    active ? 'text-(--red)' : 'text-stone-400'
                  }`}
                >
                  <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                  {label}
                </button>
              )
            })}
          </nav>
        </div>
      </div>
    </main>
  )
}
