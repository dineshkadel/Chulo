import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  Camera,
  ChevronLeft,
  ChevronRight,
  Edit,
  Eye,
  MapPin,
  Phone,
  Plus,
  Power,
  RefreshCw,
  Search,
  Star,
  Store,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import {
  createAdminRestaurant,
  deleteAdminRestaurant,
  getAdminRestaurants,
  updateAdminRestaurant,
  updateAdminRestaurantStatus,
  uploadAdminRestaurantImage,
  type AdminRestaurantItem,
  type CreateAdminRestaurantPayload,
  type UpdateAdminRestaurantPayload,
} from '../../../api/adminApi'
import { AdminRestaurantDetailView } from './AdminRestaurantDetailView'

export function AdminRestaurantsTab() {
  const [restaurants, setRestaurants] = useState<AdminRestaurantItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionPendingId, setActionPendingId] = useState<number | null>(null)

  // Navigation to Detail View
  const [selectedDetailId, setSelectedDetailId] = useState<number | null>(null)

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingRestaurant, setEditingRestaurant] = useState<AdminRestaurantItem | null>(null)
  const [deletingRestaurant, setDeletingRestaurant] = useState<AdminRestaurantItem | null>(null)

  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch restaurants from backend
  const fetchRestaurants = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await getAdminRestaurants({
        search: search.trim() || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        page,
        limit: 12,
      })
      setRestaurants(res.restaurants || [])
      setTotal(res.total || 0)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load restaurants'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [search, statusFilter, page])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRestaurants()
    }, 250)
    return () => clearTimeout(timer)
  }, [fetchRestaurants])

  // Toggle active/inactive status
  const handleToggleStatus = async (restaurant: AdminRestaurantItem) => {
    setActionPendingId(restaurant.id)
    const nextStatus = !restaurant.is_active
    try {
      await updateAdminRestaurantStatus(restaurant.id, nextStatus)
      setRestaurants((prev) =>
        prev.map((r) => (r.id === restaurant.id ? { ...r, is_active: nextStatus } : r))
      )
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update restaurant status')
    } finally {
      setActionPendingId(null)
    }
  }

  // Handle delete restaurant
  const handleConfirmDelete = async () => {
    if (!deletingRestaurant) return
    setIsSubmitting(true)
    try {
      await deleteAdminRestaurant(deletingRestaurant.id)
      setRestaurants((prev) => prev.filter((r) => r.id !== deletingRestaurant.id))
      setTotal((prev) => Math.max(0, prev - 1))
      setDeletingRestaurant(null)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete restaurant')
    } finally {
      setIsSubmitting(false)
    }
  }

  // If a restaurant is selected for detail view, render the detail page
  if (selectedDetailId !== null) {
    return (
      <AdminRestaurantDetailView
        restaurantId={selectedDetailId}
        onBack={() => {
          setSelectedDetailId(null)
          fetchRestaurants()
        }}
        onEdit={(restaurant) => {
          setEditingRestaurant(restaurant)
        }}
      />
    )
  }

  const totalPages = Math.ceil(total / 12) || 1

  return (
    <div className="space-y-6">
      {/* Header controls & actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="m-0 text-lg font-bold text-[var(--ink)]">Restaurant Partners</h2>
          <p className="m-0 text-xs text-stone-500">
            {total} registered restaurants · Complete partner management & performance insights
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Refresh button */}
          <button
            onClick={() => fetchRestaurants()}
            disabled={isLoading}
            className="grid h-10 w-10 place-items-center rounded-xl border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
            title="Refresh list"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin text-[var(--red)]' : ''} />
          </button>

          {/* Search box */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="search"
              placeholder="Filter by name, cuisine, address..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="h-10 w-56 sm:w-64 rounded-xl border border-stone-200 bg-white pl-9 pr-3 text-xs focus:border-[var(--red)] focus:outline-none shadow-xs"
            />
          </div>

          {/* Filter pills */}
          <div className="flex items-center rounded-xl border border-stone-200 bg-white p-1 text-xs font-semibold shadow-xs">
            {(['all', 'active', 'inactive'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => {
                  setStatusFilter(f)
                  setPage(1)
                }}
                className={`rounded-lg px-3 py-1.5 capitalize transition-colors cursor-pointer ${
                  statusFilter === f
                    ? 'bg-[var(--red)] text-white'
                    : 'text-stone-600 hover:text-[var(--ink)]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Add Restaurant button */}
          <button
            onClick={() => {
              setIsCreateModalOpen(true)
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--red)] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-transform hover:scale-102 cursor-pointer"
          >
            <Plus size={16} /> Add Restaurant
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center justify-between rounded-2xl bg-red-50 border border-red-200 p-4 text-xs font-medium text-red-700">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchRestaurants()}
            className="rounded-lg bg-red-100 px-3 py-1 font-bold text-red-800 hover:bg-red-200 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Restaurant Cards Grid */}
      {isLoading && restaurants.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
          <RefreshCw size={24} className="animate-spin text-[var(--red)]" />
          <p className="text-xs font-semibold text-stone-500">Loading restaurant partners...</p>
        </div>
      ) : restaurants.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-stone-200 bg-white py-16 text-center shadow-xs">
          <Store size={44} className="mx-auto text-stone-300 mb-3" />
          <h3 className="text-sm font-bold text-[var(--ink)]">No restaurants found</h3>
          <p className="mt-1 text-xs text-stone-500">
            {search || statusFilter !== 'all'
              ? 'Try modifying your search query or status filter'
              : 'Add your first restaurant partner to get started'}
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[var(--red)] px-4 py-2 text-xs font-bold text-white hover:opacity-90 cursor-pointer"
          >
            <Plus size={14} /> Add New Restaurant
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((restaurant) => {
            const isPending = actionPendingId === restaurant.id
            const priceTierStr = '$'.repeat(Math.max(1, Math.min(4, restaurant.price_tier)))

            return (
              <div
                key={restaurant.id}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-xs transition-all hover:shadow-lg hover:border-stone-300"
              >
                {/* Restaurant Image Banner */}
                <div className="relative h-44 w-full overflow-hidden bg-stone-100">
                  {restaurant.hero_image_url ? (
                    <img
                      src={restaurant.hero_image_url}
                      alt={restaurant.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'
                      }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200 text-stone-400">
                      <Store size={44} strokeWidth={1.5} />
                    </div>
                  )}

                  {/* Gradient shadow overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

                  {/* Status chip */}
                  <div className="absolute left-3 top-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold shadow-sm backdrop-blur-md ${
                        restaurant.is_active
                          ? 'bg-emerald-500/90 text-white'
                          : 'bg-red-500/90 text-white'
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      {restaurant.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </div>

                  {/* Price Tier & Rating badge */}
                  <div className="absolute right-3 top-3 flex items-center gap-1.5">
                    <span className="rounded-lg bg-black/50 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
                      {priceTierStr}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-md">
                      <Star size={11} fill="currentColor" />
                      {restaurant.avg_rating.toFixed(1)}
                    </span>
                  </div>

                  {/* Restaurant Name over banner */}
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <h3 className="m-0 text-base font-bold leading-tight drop-shadow-sm truncate">
                      {restaurant.name}
                    </h3>
                    <p className="mt-0.5 text-[11px] text-stone-200 truncate">
                      {restaurant.cuisine_types || 'Multi-cuisine'}
                    </p>
                  </div>
                </div>

                {/* Card Body */}
                <div className="flex flex-1 flex-col justify-between p-4 space-y-4">
                  {/* Address & Contact */}
                  <div className="space-y-1.5 text-xs text-stone-600">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin size={13} className="shrink-0 text-[var(--red)]" />
                      <span className="truncate">{restaurant.address}</span>
                    </div>
                    {restaurant.phone && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Phone size={13} className="shrink-0 text-stone-400" />
                        <span className="truncate">{restaurant.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Business Metrics Row */}
                  <div className="grid grid-cols-3 divide-x divide-stone-100 rounded-2xl bg-stone-50 py-2.5 px-1 text-center">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                        Orders
                      </div>
                      <div className="mt-0.5 text-xs font-black text-[var(--ink)]">
                        {restaurant.total_orders.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                        Dishes
                      </div>
                      <div className="mt-0.5 text-xs font-black text-[var(--ink)]">
                        {restaurant.menu_items_count}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                        Revenue
                      </div>
                      <div className="mt-0.5 text-xs font-black text-emerald-700">
                        Rs.{restaurant.total_revenue > 9999 ? `${(restaurant.total_revenue / 1000).toFixed(1)}k` : restaurant.total_revenue.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between border-t border-stone-100 pt-3">
                    {/* View Details */}
                    <button
                      onClick={() => setSelectedDetailId(restaurant.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-3.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-stone-800 cursor-pointer shadow-xs"
                    >
                      <Eye size={13} /> View Details
                    </button>

                    <div className="flex items-center gap-1.5">
                      {/* Active toggle */}
                      <button
                        onClick={() => handleToggleStatus(restaurant)}
                        disabled={isPending}
                        title={restaurant.is_active ? 'Suspend Restaurant' : 'Activate Restaurant'}
                        className={`grid h-8 w-8 place-items-center rounded-xl border transition-colors cursor-pointer ${
                          restaurant.is_active
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                        }`}
                      >
                        <Power size={13} className={isPending ? 'animate-spin' : ''} />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => {
                          setEditingRestaurant(restaurant)
                        }}
                        title="Edit Restaurant"
                        className="grid h-8 w-8 place-items-center rounded-xl border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer"
                      >
                        <Edit size={13} />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => setDeletingRestaurant(restaurant)}
                        title="Delete Restaurant"
                        className="grid h-8 w-8 place-items-center rounded-xl border border-stone-200 bg-white text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-stone-200 pt-4 text-xs">
          <span className="text-stone-500">
            Page {page} of {totalPages} ({total} total restaurants)
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="grid h-8 w-8 place-items-center rounded-lg border border-stone-200 bg-white text-stone-600 disabled:opacity-40 hover:bg-stone-50 cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="grid h-8 w-8 place-items-center rounded-lg border border-stone-200 bg-white text-stone-600 disabled:opacity-40 hover:bg-stone-50 cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Create Restaurant Modal */}
      {isCreateModalOpen && (
        <RestaurantFormModal
          mode="create"
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false)
            fetchRestaurants()
          }}
        />
      )}

      {/* Edit Restaurant Modal */}
      {editingRestaurant && (
        <RestaurantFormModal
          mode="edit"
          initialData={editingRestaurant}
          onClose={() => setEditingRestaurant(null)}
          onSuccess={() => {
            setEditingRestaurant(null)
            fetchRestaurants()
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingRestaurant && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-red-100 text-red-600 mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-center font-bold text-stone-900">Delete Restaurant</h3>
            <p className="mt-2 text-center text-xs leading-relaxed text-stone-600">
              Are you sure you want to delete{' '}
              <strong className="text-stone-900">{deletingRestaurant.name}</strong>? This action
              will deactivate the partner and archive associated records.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setDeletingRestaurant(null)}
                disabled={isSubmitting}
                className="flex-1 rounded-xl border border-stone-200 py-2.5 text-xs font-bold text-stone-700 hover:bg-stone-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white hover:bg-red-700 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ==================== RESTAURANT FORM MODAL (CREATE / EDIT) ====================

interface RestaurantFormModalProps {
  mode: 'create' | 'edit'
  initialData?: AdminRestaurantItem
  onClose: () => void
  onSuccess: () => void
}

function RestaurantFormModal({ mode, initialData, onClose, onSuccess }: RestaurantFormModalProps) {
  const [name, setName] = useState(initialData?.name || '')
  const [email, setEmail] = useState(initialData?.email || '')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState(initialData?.phone || '')
  const [address, setAddress] = useState(initialData?.address || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [cuisineTypes, setCuisineTypes] = useState(initialData?.cuisine_types || '')
  const [priceTier, setPriceTier] = useState<number>(initialData?.price_tier || 2)
  const [lat, setLat] = useState<number>(initialData?.lat || 27.7172)
  const [lng, setLng] = useState<number>(initialData?.lng || 85.324)
  const [heroImageURL, setHeroImageURL] = useState(initialData?.hero_image_url || '')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(initialData ? initialData.is_active : true)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setFilePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Restaurant name is required')
      return
    }
    if (!email.trim()) {
      setError('Email address is required')
      return
    }
    if (mode === 'create' && (!password || password.length < 6)) {
      setError('Password is required and must be at least 6 characters')
      return
    }
    if (!address.trim()) {
      setError('Physical address is required')
      return
    }

    setIsSubmitting(true)
    try {
      if (mode === 'create') {
        const payload: CreateAdminRestaurantPayload = {
          name: name.trim(),
          email: email.trim(),
          password,
          phone: phone.trim() || undefined,
          address: address.trim(),
          description: description.trim() || undefined,
          cuisine_types: cuisineTypes.trim() || undefined,
          price_tier: priceTier,
          lat,
          lng,
          hero_image_url: heroImageURL.trim() || undefined,
          is_active: isActive,
        }

        const created = await createAdminRestaurant(payload)

        // If an image file was selected, upload it immediately
        if (selectedFile && created?.id) {
          try {
            await uploadAdminRestaurantImage(created.id, selectedFile)
          } catch {
            // Ignore non-fatal image upload error on create
          }
        }
      } else if (mode === 'edit' && initialData) {
        const payload: UpdateAdminRestaurantPayload = {
          name: name.trim(),
          email: email.trim(),
          password: password.trim() ? password : undefined,
          phone: phone.trim() || undefined,
          address: address.trim(),
          description: description.trim() || undefined,
          cuisine_types: cuisineTypes.trim() || undefined,
          price_tier: priceTier,
          lat,
          lng,
          hero_image_url: heroImageURL.trim() || undefined,
          is_active: isActive,
        }

        await updateAdminRestaurant(initialData.id, payload)

        // If an image file was selected, upload it
        if (selectedFile) {
          await uploadAdminRestaurantImage(initialData.id, selectedFile)
        }
      }

      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save restaurant')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="my-8 w-full max-w-2xl rounded-3xl border border-stone-200 bg-white p-6 sm:p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div>
            <h3 className="font-[family-name:var(--display)] text-lg font-bold text-[var(--ink)]">
              {mode === 'create' ? 'Add Restaurant Partner' : `Edit: ${initialData?.name}`}
            </h3>
            <p className="m-0 text-xs text-stone-500">
              {mode === 'create'
                ? 'Register a new food vendor onto the Chulo platform'
                : 'Modify restaurant details, location, cuisine, and cover image'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-700 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-red-50 border border-red-200 p-3.5 text-xs text-red-700">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Cover image preview & upload */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              Restaurant Cover Image
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Image preview box */}
              <div className="relative h-28 w-44 shrink-0 overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 shadow-xs">
                {filePreview || heroImageURL ? (
                  <img
                    src={filePreview || heroImageURL}
                    alt="Preview"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80'
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-stone-400">
                    <Camera size={28} />
                  </div>
                )}
              </div>

              {/* Upload or URL input */}
              <div className="flex-1 space-y-2 w-full">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-1.5 text-xs font-bold text-stone-700 hover:bg-stone-100 cursor-pointer"
                >
                  <Upload size={13} /> Choose Image File
                </button>
                {selectedFile && (
                  <span className="ml-2 text-[11px] text-emerald-600 font-semibold truncate">
                    {selectedFile.name}
                  </span>
                )}
                <div>
                  <input
                    type="url"
                    placeholder="Or enter direct image URL (https://...)"
                    value={heroImageURL}
                    onChange={(e) => setHeroImageURL(e.target.value)}
                    className="h-9 w-full rounded-xl border border-stone-200 px-3 text-xs focus:border-[var(--red)] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Row: Name & Email */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Restaurant Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Himalayan Thakali Kitchen"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 w-full rounded-xl border border-stone-200 px-3 text-xs focus:border-[var(--red)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Login Email *</label>
              <input
                type="email"
                required
                placeholder="partner@restaurant.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 w-full rounded-xl border border-stone-200 px-3 text-xs focus:border-[var(--red)] focus:outline-none"
              />
            </div>
          </div>

          {/* Row: Password & Phone */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                {mode === 'create' ? 'Password *' : 'New Password (leave blank to keep current)'}
              </label>
              <input
                type="password"
                placeholder={mode === 'create' ? 'Min 6 characters' : 'Unchanged'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 w-full rounded-xl border border-stone-200 px-3 text-xs focus:border-[var(--red)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="+977 1 4412345"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-10 w-full rounded-xl border border-stone-200 px-3 text-xs focus:border-[var(--red)] focus:outline-none"
              />
            </div>
          </div>

          {/* Row: Address & Price Tier */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-700 mb-1">Physical Address *</label>
              <input
                type="text"
                required
                placeholder="e.g. Jhamsikhel, Lalitpur"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="h-10 w-full rounded-xl border border-stone-200 px-3 text-xs focus:border-[var(--red)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Price Tier (1-4)</label>
              <select
                value={priceTier}
                onChange={(e) => setPriceTier(Number(e.target.value))}
                className="h-10 w-full rounded-xl border border-stone-200 px-3 text-xs focus:border-[var(--red)] focus:outline-none bg-white"
              >
                <option value={1}>Tier 1 ($ - Budget)</option>
                <option value={2}>Tier 2 ($$ - Moderate)</option>
                <option value={3}>Tier 3 ($$$ - Premium)</option>
                <option value={4}>Tier 4 ($$$$ - Fine Dining)</option>
              </select>
            </div>
          </div>

          {/* Row: Cuisine Types & Coordinates */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Cuisine Types</label>
              <input
                type="text"
                placeholder="e.g. Nepali, Thakali, Newari"
                value={cuisineTypes}
                onChange={(e) => setCuisineTypes(e.target.value)}
                className="h-10 w-full rounded-xl border border-stone-200 px-3 text-xs focus:border-[var(--red)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Latitude</label>
              <input
                type="number"
                step="0.000001"
                required
                value={lat}
                onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                className="h-10 w-full rounded-xl border border-stone-200 px-3 text-xs focus:border-[var(--red)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Longitude</label>
              <input
                type="number"
                step="0.000001"
                required
                value={lng}
                onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                className="h-10 w-full rounded-xl border border-stone-200 px-3 text-xs focus:border-[var(--red)] focus:outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Description</label>
            <textarea
              rows={2}
              placeholder="Brief overview of specialty dishes, heritage, or ambience..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-stone-200 p-3 text-xs focus:border-[var(--red)] focus:outline-none"
            />
          </div>

          {/* Status switch */}
          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="isActiveSwitch"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded accent-[var(--red)] cursor-pointer"
            />
            <label htmlFor="isActiveSwitch" className="text-xs font-semibold text-stone-800 cursor-pointer">
              Restaurant is currently active and open for customer orders
            </label>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 border-t border-stone-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-[var(--red)] px-5 py-2 text-xs font-bold text-white shadow-xs hover:opacity-90 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting
                ? 'Saving...'
                : mode === 'create'
                ? 'Register Restaurant'
                : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
