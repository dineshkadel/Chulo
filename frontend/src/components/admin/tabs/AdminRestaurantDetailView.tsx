import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  DollarSign,
  Edit,
  Mail,
  MapPin,
  Phone,
  Power,
  RefreshCw,
  Search,
  ShoppingBag,
  Star,
  Store,
  Tag,
  Utensils,
} from 'lucide-react'
import {
  getAdminRestaurant,
  updateAdminRestaurantStatus,
  uploadAdminRestaurantImage,
  type AdminRestaurantDetailResponse,
  type AdminRestaurantItem,
} from '../../../api/adminApi'

interface AdminRestaurantDetailViewProps {
  restaurantId: number
  onBack: () => void
  onEdit: (restaurant: AdminRestaurantItem) => void
}

export function AdminRestaurantDetailView({
  restaurantId,
  onBack,
  onEdit,
}: AdminRestaurantDetailViewProps) {
  const [detail, setDetail] = useState<AdminRestaurantDetailResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'menu' | 'orders' | 'about'>('menu')
  const [isTogglingStatus, setIsTogglingStatus] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  // Filters
  const [menuSearch, setMenuSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [orderStatusFilter, setOrderStatusFilter] = useState('all')

  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchDetail = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getAdminRestaurant(restaurantId)
      setDetail(data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load restaurant details'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [restaurantId])

  useEffect(() => {
    fetchDetail()
  }, [fetchDetail])

  // Toggle active status
  const handleToggleStatus = async () => {
    if (!detail) return
    setIsTogglingStatus(true)
    const nextStatus = !detail.restaurant.is_active
    try {
      await updateAdminRestaurantStatus(detail.restaurant.id, nextStatus)
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              restaurant: { ...prev.restaurant, is_active: nextStatus },
            }
          : prev
      )
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setIsTogglingStatus(false)
    }
  }

  // Handle banner image upload
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !detail) return

    setIsUploadingImage(true)
    try {
      const res = await uploadAdminRestaurantImage(detail.restaurant.id, file)
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              restaurant: { ...prev.restaurant, hero_image_url: res.hero_image_url },
            }
          : prev
      )
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Image upload failed')
    } finally {
      setIsUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <RefreshCw size={28} className="animate-spin text-[var(--red)]" />
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          Loading restaurant records...
        </p>
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
        <AlertCircle size={36} className="mx-auto text-red-600 mb-3" />
        <h3 className="text-base font-bold text-red-900">Failed to Load Restaurant</h3>
        <p className="mt-1 text-xs text-red-700">{error || 'Restaurant could not be found'}</p>
        <div className="mt-5 flex justify-center gap-3">
          <button
            onClick={onBack}
            className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50 cursor-pointer"
          >
            Back to List
          </button>
          <button
            onClick={fetchDetail}
            className="rounded-xl bg-[var(--red)] px-4 py-2 text-xs font-bold text-white hover:opacity-90 cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const { restaurant, stats, menu_items, recent_orders } = detail

  // Filtered menu items
  const categories = Array.from(
    new Set(menu_items.map((m) => m.category_name).filter(Boolean))
  )

  const filteredMenuItems = menu_items.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
      item.category_name.toLowerCase().includes(menuSearch.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(menuSearch.toLowerCase()))
    if (!matchSearch) return false
    if (categoryFilter !== 'all' && item.category_name !== categoryFilter) return false
    return true
  })

  // Filtered orders
  const filteredOrders = recent_orders.filter((order) => {
    if (orderStatusFilter === 'all') return true
    return order.status.toUpperCase() === orderStatusFilter.toUpperCase()
  })

  // Price tier string
  const priceTierSymbols = '$'.repeat(Math.max(1, Math.min(4, restaurant.price_tier)))

  return (
    <div className="space-y-6">
      {/* Back button & top navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-bold text-stone-700 shadow-xs transition-colors hover:bg-stone-50 cursor-pointer"
        >
          <ArrowLeft size={15} /> Back to Restaurants
        </button>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchDetail}
            className="grid h-9 w-9 place-items-center rounded-xl border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 shadow-xs transition-colors cursor-pointer"
            title="Refresh Details"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin text-[var(--red)]' : ''} />
          </button>

          <button
            onClick={handleToggleStatus}
            disabled={isTogglingStatus}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold shadow-xs transition-colors cursor-pointer ${
              restaurant.is_active
                ? 'border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                : 'border border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
            }`}
          >
            <Power size={14} />
            {restaurant.is_active ? 'Deactivate Restaurant' : 'Activate Restaurant'}
          </button>

          <button
            onClick={() => onEdit(restaurant)}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--red)] px-4 py-2 text-xs font-bold text-white shadow-xs transition-transform hover:scale-102 cursor-pointer"
          >
            <Edit size={14} /> Edit Restaurant
          </button>
        </div>
      </div>

      {/* Hero Banner with Prominent Restaurant Image */}
      <div className="relative overflow-hidden rounded-3xl border border-stone-200 bg-stone-900 shadow-md">
        {/* Background Image / Banner */}
        <div className="relative h-64 sm:h-72 w-full overflow-hidden">
          {restaurant.hero_image_url ? (
            <img
              src={restaurant.hero_image_url}
              alt={restaurant.name}
              className="h-full w-full object-cover"
              onError={(e) => {
                // Fallback image if broken
                ;(e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80'
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-stone-800 to-stone-950 text-stone-600">
              <Store size={72} strokeWidth={1.2} />
            </div>
          )}

          {/* Dark gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />

          {/* Change cover photo button */}
          <div className="absolute right-4 top-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageFileChange}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingImage}
              className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-black/50 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md transition-colors hover:bg-black/70 cursor-pointer disabled:opacity-50"
            >
              <Camera size={14} className={isUploadingImage ? 'animate-spin' : ''} />
              {isUploadingImage ? 'Uploading...' : 'Change Cover Image'}
            </button>
          </div>

          {/* Banner bottom info */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      restaurant.is_active
                        ? 'bg-emerald-500/90 text-white'
                        : 'bg-red-500/90 text-white'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        restaurant.is_active ? 'bg-white' : 'bg-white'
                      }`}
                    />
                    {restaurant.is_active ? 'Active Partner' : 'Suspended'}
                  </span>

                  <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold tracking-wider backdrop-blur-sm">
                    {priceTierSymbols} ({restaurant.price_tier}/4)
                  </span>

                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/90 px-2.5 py-0.5 text-[11px] font-bold text-white">
                    <Star size={12} fill="currentColor" />
                    {restaurant.avg_rating.toFixed(1)} ({restaurant.review_count} reviews)
                  </span>
                </div>

                <h1 className="font-[family-name:var(--display)] text-2xl font-black sm:text-3xl">
                  {restaurant.name}
                </h1>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-stone-200">
                  <span className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-[var(--red)]" />
                    {restaurant.address}
                  </span>
                  {restaurant.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone size={13} className="text-orange-400" />
                      {restaurant.phone}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Mail size={13} className="text-stone-300" />
                    {restaurant.email}
                  </span>
                </div>
              </div>

              {/* Cuisine chips */}
              <div className="flex flex-wrap gap-1.5">
                {restaurant.cuisine_types
                  ? restaurant.cuisine_types.split(',').map((c, i) => (
                      <span
                        key={i}
                        className="rounded-lg bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm"
                      >
                        {c.trim()}
                      </span>
                    ))
                  : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Business Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Total Orders */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Total Orders
            </span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-orange-50 text-orange-600">
              <ShoppingBag size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-[var(--ink)]">
            {stats.total_orders.toLocaleString()}
          </p>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-stone-500">
            <span className="text-emerald-600 font-semibold">{stats.completed_orders} delivered</span>
            <span>·</span>
            <span className="text-stone-400">{stats.cancelled_orders} cancelled</span>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Revenue (Rs.)
            </span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-emerald-700">
            Rs.{stats.total_revenue.toLocaleString()}
          </p>
          <p className="mt-1 text-[11px] text-stone-500">Excludes cancelled & rejected</p>
        </div>

        {/* Menu Items Count */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Menu Dishes
            </span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-600">
              <Utensils size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-[var(--ink)]">
            {stats.menu_items_count}
          </p>
          <p className="mt-1 text-[11px] text-stone-500">Across {categories.length} categories</p>
        </div>

        {/* Customer Rating */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Avg Rating
            </span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-yellow-50 text-yellow-600">
              <Star size={18} fill="currentColor" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-[var(--ink)]">
            {stats.avg_rating.toFixed(1)} / 5.0
          </p>
          <p className="mt-1 text-[11px] text-stone-500">From {stats.review_count} verified reviews</p>
        </div>
      </div>

      {/* Main detail content tabs */}
      <div className="rounded-3xl border border-stone-200 bg-white shadow-xs overflow-hidden">
        {/* Navigation Tab Bar */}
        <div className="flex border-b border-stone-200 bg-stone-50/70 px-4 pt-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('menu')}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'menu'
                  ? 'border-[var(--red)] text-[var(--red)]'
                  : 'border-transparent text-stone-600 hover:text-[var(--ink)]'
              }`}
            >
              <Utensils size={15} />
              Menu Items
              <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[10px] text-stone-700">
                {menu_items.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'orders'
                  ? 'border-[var(--red)] text-[var(--red)]'
                  : 'border-transparent text-stone-600 hover:text-[var(--ink)]'
              }`}
            >
              <ShoppingBag size={15} />
              Orders History
              <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[10px] text-stone-700">
                {recent_orders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('about')}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'about'
                  ? 'border-[var(--red)] text-[var(--red)]'
                  : 'border-transparent text-stone-600 hover:text-[var(--ink)]'
              }`}
            >
              <Store size={15} />
              Restaurant Info
            </button>
          </div>
        </div>

        {/* Tab 1: Menu Items */}
        {activeTab === 'menu' && (
          <div className="p-6 space-y-5">
            {/* Search & Category Filter */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="search"
                  placeholder="Search dishes by name or category..."
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  className="h-9 w-64 rounded-xl border border-stone-200 bg-stone-50 pl-9 pr-3 text-xs focus:border-[var(--red)] focus:bg-white focus:outline-none"
                />
              </div>

              {categories.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mr-1">
                    Category:
                  </span>
                  <button
                    onClick={() => setCategoryFilter('all')}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold cursor-pointer transition-colors ${
                      categoryFilter === 'all'
                        ? 'bg-[var(--red)] text-white'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    All ({menu_items.length})
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-bold cursor-pointer transition-colors ${
                        categoryFilter === cat
                          ? 'bg-[var(--red)] text-white'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {cat} ({menu_items.filter((m) => m.category_name === cat).length})
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Menu Items Cards Grid */}
            {filteredMenuItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-200 py-12 text-center text-stone-400">
                <Utensils size={36} className="mx-auto text-stone-300 mb-2" />
                <p className="text-xs font-semibold">
                  {menuSearch || categoryFilter !== 'all'
                    ? 'No menu items match your search filter'
                    : 'This restaurant has not added any dishes yet'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredMenuItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white transition-all hover:shadow-md"
                  >
                    {/* Item Image */}
                    <div className="relative h-40 w-full overflow-hidden bg-stone-100">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'
                          }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-stone-300">
                          <Utensils size={32} />
                        </div>
                      )}

                      {/* Availability Tag */}
                      <span
                        className={`absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-bold shadow-xs ${
                          item.is_available
                            ? 'bg-emerald-500 text-white'
                            : 'bg-stone-600 text-white'
                        }`}
                      >
                        {item.is_available ? 'Available' : 'Unavailable'}
                      </span>

                      {/* Category Badge */}
                      <span className="absolute left-3 bottom-3 rounded-lg bg-black/60 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                        {item.category_name}
                      </span>
                    </div>

                    {/* Item Details */}
                    <div className="flex flex-1 flex-col justify-between p-4">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="m-0 text-sm font-bold text-[var(--ink)]">
                            {item.name}
                          </h4>
                          <span className="shrink-0 text-sm font-black text-[var(--red)]">
                            Rs.{item.price.toLocaleString()}
                          </span>
                        </div>

                        {item.description && (
                          <p className="mt-1.5 line-clamp-2 text-xs text-stone-500">
                            {item.description}
                          </p>
                        )}
                      </div>

                      {item.dietary_tags && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {item.dietary_tags.split(',').map((tag, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-600"
                            >
                              <Tag size={10} /> {tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Orders History */}
        {activeTab === 'orders' && (
          <div className="p-6 space-y-5">
            {/* Status filter bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mr-1">
                  Status:
                </span>
                {(['all', 'PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'PICKED_UP', 'DELIVERED', 'CANCELLED'] as const).map(
                  (st) => (
                    <button
                      key={st}
                      onClick={() => setOrderStatusFilter(st)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-bold cursor-pointer transition-colors ${
                        orderStatusFilter === st
                          ? 'bg-[var(--red)] text-white'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {st}
                    </button>
                  )
                )}
              </div>

              <span className="text-xs text-stone-500">
                Showing {filteredOrders.length} of {recent_orders.length} recent orders
              </span>
            </div>

            {/* Orders Table */}
            {filteredOrders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-200 py-12 text-center text-stone-400">
                <ShoppingBag size={36} className="mx-auto text-stone-300 mb-2" />
                <p className="text-xs font-semibold">No orders match this status</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-stone-200">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-stone-200 bg-stone-50 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                    <tr>
                      <th className="px-4 py-3">Order ID</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Dishes Ordered</th>
                      <th className="px-4 py-3">Delivery Address</th>
                      <th className="px-4 py-3">Total Amount</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Date & Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 bg-white">
                    {filteredOrders.map((ord) => {
                      const isDelivered = ord.status === 'DELIVERED'
                      const isCancelled = ord.status === 'CANCELLED' || ord.status === 'REJECTED'
                      return (
                        <tr key={ord.id} className="hover:bg-stone-50/70 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-[var(--red)]">
                            #ORD-{ord.id}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-[var(--ink)]">{ord.customer_name}</div>
                            {ord.customer_phone && (
                              <div className="text-[11px] text-stone-500">{ord.customer_phone}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 max-w-xs truncate text-stone-700">
                            {ord.items_summary || `${ord.items_count} item(s)`}
                          </td>
                          <td className="px-4 py-3 max-w-xs truncate text-stone-500">
                            {ord.delivery_address}
                          </td>
                          <td className="px-4 py-3 font-bold text-[var(--ink)]">
                            Rs.{ord.total.toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                isDelivered
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isCancelled
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {ord.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-stone-500">
                            {new Date(ord.created_at).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Detailed Restaurant Information */}
        {activeTab === 'about' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Profile details */}
              <div className="rounded-2xl border border-stone-200 bg-stone-50/50 p-5 space-y-3">
                <h4 className="m-0 text-xs font-bold uppercase tracking-wider text-stone-500">
                  Business Identification
                </h4>
                <div className="divide-y divide-stone-200/60 text-xs">
                  <div className="py-2.5 flex justify-between">
                    <span className="text-stone-500">Restaurant ID</span>
                    <span className="font-mono font-bold text-stone-800">{restaurant.id}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-stone-500">Official Name</span>
                    <span className="font-bold text-stone-800">{restaurant.name}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-stone-500">Contact Email</span>
                    <span className="font-medium text-stone-800">{restaurant.email}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-stone-500">Contact Phone</span>
                    <span className="font-medium text-stone-800">{restaurant.phone || 'N/A'}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-stone-500">Registration Date</span>
                    <span className="text-stone-800">
                      {new Date(restaurant.created_at).toLocaleDateString([], {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Geographic Location & Logistics */}
              <div className="rounded-2xl border border-stone-200 bg-stone-50/50 p-5 space-y-3">
                <h4 className="m-0 text-xs font-bold uppercase tracking-wider text-stone-500">
                  Location & Logistics
                </h4>
                <div className="divide-y divide-stone-200/60 text-xs">
                  <div className="py-2.5 flex justify-between">
                    <span className="text-stone-500">Physical Address</span>
                    <span className="font-bold text-stone-800 text-right">{restaurant.address}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-stone-500">Latitude</span>
                    <span className="font-mono text-stone-800">{restaurant.lat.toFixed(6)}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-stone-500">Longitude</span>
                    <span className="font-mono text-stone-800">{restaurant.lng.toFixed(6)}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-stone-500">Price Tier</span>
                    <span className="font-bold text-stone-800">
                      Tier {restaurant.price_tier} ({priceTierSymbols})
                    </span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-stone-500">Cuisine Focus</span>
                    <span className="font-semibold text-[var(--red)]">{restaurant.cuisine_types}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {restaurant.description && (
              <div className="rounded-2xl border border-stone-200 bg-stone-50/50 p-5">
                <h4 className="m-0 text-xs font-bold uppercase tracking-wider text-stone-500">
                  About the Restaurant
                </h4>
                <p className="mt-2 text-xs leading-relaxed text-stone-700">
                  {restaurant.description}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
