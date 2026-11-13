import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Clock,
  CheckCircle,
  XCircle,
  ChefHat,
  Bike,
  PackageCheck,
  AlertCircle,
  Volume2,
  VolumeX,
  RefreshCw,
  Search,
  Eye,
  User,
  MapPin,
  FileText,
  History,
} from 'lucide-react'
import { getRestaurantOrders, updateRestaurantOrderStatus } from '../../api/orders'
import type { Order, OrderStatus } from '../../types/order'
import { OrderStatusBadge } from '../order/OrderStatusBadge'
import { formatCurrency, formatDateTime } from '../../utils/format'

function playChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const now = ctx.currentTime

    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(587.33, now) // D5
    gain1.gain.setValueAtTime(0.15, now)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.4)

    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(880, now + 0.15) // A5
    gain2.gain.setValueAtTime(0.18, now + 0.15)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(now + 0.15)
    osc2.stop(now + 0.6)
  } catch {
    // Browser audio policy might require user gesture first
  }
}

export function RestaurantOrdersKanban() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban')
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  // Track previous new orders count to trigger chime
  const prevPlacedCount = useRef<number>(0)

  const fetchOrders = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setRefreshing(true)
      const data = await getRestaurantOrders()
      setOrders(data.orders || [])
      setError(null)

      const placedCount = (data.orders || []).filter((o) => o.status === 'PLACED').length
      if (placedCount > prevPlacedCount.current && soundEnabled) {
        playChime()
      }
      prevPlacedCount.current = placedCount
    } catch (err: unknown) {
      if (!isBackground) {
        setError(err instanceof Error ? err.message : 'Failed to fetch restaurant orders')
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [soundEnabled])

  // Polling every 6 seconds
  useEffect(() => {
    fetchOrders(false)
    const interval = setInterval(() => {
      fetchOrders(true)
    }, 6000)
    return () => clearInterval(interval)
  }, [fetchOrders])

  const handleUpdateStatus = async (orderId: number, nextStatus: OrderStatus, notes?: string) => {
    try {
      setUpdatingId(orderId)
      setError(null)
      const updated = await updateRestaurantOrderStatus(orderId, nextStatus, notes)
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)))
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(updated)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update order status')
      // Refresh state to ensure client is in sync with server
      fetchOrders(false)
    } finally {
      setUpdatingId(null)
    }
  }

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    if (!search.trim()) return true
    const term = search.toLowerCase()
    const idStr = `ch-${o.id}`.toLowerCase()
    const custName = o.customer?.display_name?.toLowerCase() || ''
    const address = o.delivery_address?.toLowerCase() || ''
    return idStr.includes(term) || custName.includes(term) || address.includes(term)
  })

  // Kanban groupings
  const placedOrders = filteredOrders.filter((o) => o.status === 'PLACED')
  const kitchenOrders = filteredOrders.filter((o) => o.status === 'ACCEPTED' || o.status === 'PREPARING')
  const dispatchedOrders = filteredOrders.filter((o) => o.status === 'READY' || o.status === 'ASSIGNED' || o.status === 'PICKED_UP')
  const completedOrders = filteredOrders.filter((o) => o.status === 'DELIVERED' || o.status === 'REJECTED' || o.status === 'CANCELLED')

  const totalRevenue = orders
    .filter((o) => o.status === 'DELIVERED')
    .reduce((sum, o) => sum + (o.subtotal || 0), 0)

  return (
    <div className="space-y-6">
      {/* Alert message if error */}
      {error && (
        <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-xs font-bold text-red-600 hover:text-red-800 ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Banner & Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#eadfd2] shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-[var(--ink)]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Live Order Management
            </h2>
            {placedOrders.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-white font-bold text-xs animate-pulse">
                <span className="w-2 h-2 rounded-full bg-white" />
                {placedOrders.length} New Order{placedOrders.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Real-time order lifecycle tracking • Auto-refreshes every 6 seconds
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
              soundEnabled
                ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                : 'bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100'
            }`}
            title={soundEnabled ? 'Mute new order chime' : 'Enable new order chime'}
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            {soundEnabled ? 'Chime ON' : 'Chime Muted'}
          </button>

          {/* View Mode Toggle */}
          <div className="flex rounded-xl border border-stone-200 bg-stone-50 p-0.5 text-xs font-bold">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                viewMode === 'kanban' ? 'bg-white shadow-xs text-[var(--ink)]' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Kanban Board
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                viewMode === 'table' ? 'bg-white shadow-xs text-[var(--ink)]' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Table View
            </button>
          </div>

          {/* Refresh button */}
          <button
            type="button"
            onClick={() => fetchOrders(false)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-bold text-stone-700 transition-colors cursor-pointer"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-[var(--red)]' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#eadfd2]">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">New Incoming</span>
          <p className="text-2xl font-black text-amber-600 mt-1">{placedOrders.length}</p>
          <span className="text-[11px] text-stone-500">Requires response</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#eadfd2]">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">In Kitchen</span>
          <p className="text-2xl font-black text-blue-600 mt-1">{kitchenOrders.length}</p>
          <span className="text-[11px] text-stone-500">Preparing / Accepted</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#eadfd2]">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Ready / Dispatched</span>
          <p className="text-2xl font-black text-purple-600 mt-1">{dispatchedOrders.length}</p>
          <span className="text-[11px] text-stone-500">Rider assigned / pickup</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#eadfd2]">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Delivered Revenue</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{formatCurrency(totalRevenue)}</p>
          <span className="text-[11px] text-stone-500">{completedOrders.filter(o => o.status === 'DELIVERED').length} delivered orders</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by Order #CH-ID, Customer Name, or Delivery Address..."
          className="w-full bg-white border border-stone-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[var(--red)] focus:ring-1 focus:ring-[var(--red)] transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-700"
          >
            Clear
          </button>
        )}
      </div>

      {loading && orders.length === 0 ? (
        <div className="bg-white p-16 rounded-2xl border border-[#eadfd2] text-center">
          <RefreshCw size={28} className="animate-spin text-[var(--red)] mx-auto mb-3" />
          <p className="text-sm font-bold text-stone-700">Loading restaurant orders...</p>
        </div>
      ) : viewMode === 'kanban' ? (
        /* ─── KANBAN BOARD ─── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
          {/* Column 1: New / Placed */}
          <div className="bg-amber-50/50 rounded-2xl border border-amber-200/80 p-4 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-amber-200/70">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                <h3 className="font-bold text-sm text-amber-950">1. New Incoming</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold text-xs">
                {placedOrders.length}
              </span>
            </div>

            <div className="space-y-3">
              {placedOrders.length === 0 ? (
                <div className="text-center py-8 text-xs text-stone-400 bg-white/60 rounded-xl border border-dashed border-stone-200">
                  No new incoming orders
                </div>
              ) : (
                placedOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onViewDetails={() => setSelectedOrder(order)}
                    isUpdating={updatingId === order.id}
                    actions={
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100">
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(order.id, 'ACCEPTED')}
                          disabled={updatingId === order.id}
                          className="w-full py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer"
                        >
                          <CheckCircle size={14} />
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const reason = prompt('Reason for rejecting order:') || 'Restaurant busy'
                            handleUpdateStatus(order.id, 'REJECTED', reason)
                          }}
                          disabled={updatingId === order.id}
                          className="w-full py-2 px-2.5 rounded-xl bg-red-100 hover:bg-red-200 active:scale-95 text-red-700 font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
                        >
                          <XCircle size={14} />
                          Reject
                        </button>
                      </div>
                    }
                  />
                ))
              )}
            </div>
          </div>

          {/* Column 2: Kitchen (ACCEPTED & PREPARING) */}
          <div className="bg-sky-50/50 rounded-2xl border border-sky-200/80 p-4 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-sky-200/70">
              <div className="flex items-center gap-2">
                <ChefHat size={16} className="text-sky-700" />
                <h3 className="font-bold text-sm text-sky-950">2. In Kitchen</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-sky-200 text-sky-900 font-bold text-xs">
                {kitchenOrders.length}
              </span>
            </div>

            <div className="space-y-3">
              {kitchenOrders.length === 0 ? (
                <div className="text-center py-8 text-xs text-stone-400 bg-white/60 rounded-xl border border-dashed border-stone-200">
                  Kitchen is clear
                </div>
              ) : (
                kitchenOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onViewDetails={() => setSelectedOrder(order)}
                    isUpdating={updatingId === order.id}
                    actions={
                      <div className="pt-2 border-t border-stone-100">
                        {order.status === 'ACCEPTED' ? (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                            disabled={updatingId === order.id}
                            className="w-full py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                          >
                            <ChefHat size={14} />
                            Start Preparing
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(order.id, 'READY')}
                            disabled={updatingId === order.id}
                            className="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                          >
                            <PackageCheck size={14} />
                            Mark Ready (Auto-Assign Rider)
                          </button>
                        )}
                      </div>
                    }
                  />
                ))
              )}
            </div>
          </div>

          {/* Column 3: Ready / Assigned / Picked Up */}
          <div className="bg-purple-50/50 rounded-2xl border border-purple-200/80 p-4 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-purple-200/70">
              <div className="flex items-center gap-2">
                <Bike size={16} className="text-purple-700" />
                <h3 className="font-bold text-sm text-purple-950">3. Ready / Dispatched</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-purple-200 text-purple-900 font-bold text-xs">
                {dispatchedOrders.length}
              </span>
            </div>

            <div className="space-y-3">
              {dispatchedOrders.length === 0 ? (
                <div className="text-center py-8 text-xs text-stone-400 bg-white/60 rounded-xl border border-dashed border-stone-200">
                  No orders waiting for pickup
                </div>
              ) : (
                dispatchedOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onViewDetails={() => setSelectedOrder(order)}
                    isUpdating={updatingId === order.id}
                    actions={
                      <div className="pt-2 border-t border-stone-100 text-[11px] text-purple-900 font-medium">
                        {order.delivery_person ? (
                          <div className="bg-purple-100/70 p-2 rounded-lg space-y-0.5">
                            <p className="font-bold flex items-center gap-1 text-purple-950">
                              <Bike size={13} />
                              {order.delivery_person.full_name} ({order.delivery_person.vehicle_type})
                            </p>
                            <p className="text-purple-700">Phone: {order.delivery_person.phone}</p>
                          </div>
                        ) : order.status === 'READY' ? (
                          <div className="bg-amber-100/70 p-2 rounded-lg text-amber-900 flex items-center gap-1.5">
                            <Clock size={13} className="shrink-0" />
                            <span>Awaiting rider pickup assignment...</span>
                          </div>
                        ) : null}
                      </div>
                    }
                  />
                ))
              )}
            </div>
          </div>

          {/* Column 4: Completed / History */}
          <div className="bg-stone-50 rounded-2xl border border-stone-200 p-4 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-stone-600" />
                <h3 className="font-bold text-sm text-stone-900">4. Completed / Closed</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-stone-200 text-stone-800 font-bold text-xs">
                {completedOrders.length}
              </span>
            </div>

            <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
              {completedOrders.length === 0 ? (
                <div className="text-center py-8 text-xs text-stone-400 bg-white rounded-xl border border-dashed border-stone-200">
                  No completed orders yet
                </div>
              ) : (
                completedOrders.slice(0, 15).map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onViewDetails={() => setSelectedOrder(order)}
                    isUpdating={updatingId === order.id}
                    compact
                  />
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ─── TABLE VIEW ─── */
        <div className="bg-white rounded-2xl border border-[#eadfd2] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#fff8ef] text-stone-500 text-xs uppercase tracking-wider border-b border-[#eadfd2]">
                <tr>
                  <th className="py-3.5 px-4">Order ID</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Items Summary</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Placed At</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-stone-400 text-xs">
                      No matching orders found.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-[var(--red)]">
                        #CH-{order.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <strong className="block text-stone-900">{order.customer?.display_name || 'Customer'}</strong>
                        <span className="text-xs text-stone-500">{order.delivery_address}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs text-stone-700">
                          {order.items?.length || 0} items (
                          {order.items?.map((i) => `${i.quantity}x ${i.name}`).slice(0, 2).join(', ')}
                          {(order.items?.length || 0) > 2 ? '...' : ''})
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-stone-900">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-stone-500">
                        {formatDateTime(order.created_at)}
                      </td>
                      <td className="py-3.5 px-4">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:text-[var(--red)] hover:border-[var(--red)] transition-colors"
                            title="View Full Details"
                          >
                            <Eye size={15} />
                          </button>
                          {order.status === 'PLACED' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(order.id, 'ACCEPTED')}
                              disabled={updatingId === order.id}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                            >
                              Accept
                            </button>
                          )}
                          {order.status === 'ACCEPTED' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                              disabled={updatingId === order.id}
                              className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs"
                            >
                              Prepare
                            </button>
                          )}
                          {order.status === 'PREPARING' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(order.id, 'READY')}
                              disabled={updatingId === order.id}
                              className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
                            >
                              Ready
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── ORDER DETAILS MODAL ─── */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={handleUpdateStatus}
          isUpdating={updatingId === selectedOrder.id}
        />
      )}
    </div>
  )
}

/* ─── KANBAN ORDER CARD ───────────────────────────────────────────────────────── */

function OrderCard({
  order,
  onViewDetails,
  actions,
  isUpdating,
  compact = false,
}: {
  order: Order
  onViewDetails: () => void
  actions?: React.ReactNode
  isUpdating?: boolean
  compact?: boolean
}) {
  return (
    <div className={`bg-white rounded-xl border border-stone-200 shadow-xs p-3.5 space-y-2.5 hover:shadow-md transition-shadow ${compact ? 'opacity-85' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="font-black text-sm text-[var(--red)]">#CH-{order.id}</span>
          <span className="text-[11px] text-stone-400">• {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <button
          type="button"
          onClick={onViewDetails}
          className="text-stone-400 hover:text-[var(--red)] p-1 rounded-md transition-colors"
          title="Inspect details"
        >
          <Eye size={15} />
        </button>
      </div>

      {/* Customer Info */}
      <div>
        <p className="font-bold text-xs text-stone-800 leading-tight">
          {order.customer?.display_name || 'Customer'}
        </p>
        <p className="text-[11px] text-stone-500 truncate mt-0.5">
          📍 {order.delivery_address}
        </p>
      </div>

      {/* Items preview */}
      <div className="bg-stone-50 rounded-lg p-2 space-y-1 text-xs">
        {order.items?.map((item) => (
          <div key={item.id || item.menu_item_id} className="flex justify-between text-stone-700">
            <span>
              <strong className="text-stone-900">{item.quantity}x</strong> {item.name}
            </span>
            <span className="text-stone-500">{formatCurrency(item.price * item.quantity)}</span>
          </div>
        ))}
        {order.special_notes && (
          <p className="text-[11px] text-amber-700 italic pt-1 border-t border-stone-200/60">
            Note: {order.special_notes}
          </p>
        )}
      </div>

      {/* Total & Status */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-stone-500">Total:</span>
        <span className="font-bold text-sm text-stone-900">{formatCurrency(order.total)}</span>
      </div>

      {/* Actions */}
      {actions && (
        <div className="mt-2">
          {isUpdating ? (
            <div className="py-2 text-center text-xs text-stone-500 font-bold flex items-center justify-center gap-1.5">
              <RefreshCw size={13} className="animate-spin text-[var(--red)]" />
              Updating status...
            </div>
          ) : (
            actions
          )}
        </div>
      )}
    </div>
  )
}

/* ─── ORDER DETAILS MODAL ────────────────────────────────────────────────────── */

function OrderDetailsModal({
  order,
  onClose,
  onUpdateStatus,
  isUpdating,
}: {
  order: Order
  onClose: () => void
  onUpdateStatus: (orderId: number, status: OrderStatus, notes?: string) => Promise<void>
  isUpdating: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-[#fffbf6]">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="font-black text-xl text-[var(--ink)]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                Order #CH-{order.id}
              </h3>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Placed on {formatDateTime(order.created_at)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-stone-200 hover:bg-stone-100 flex items-center justify-center text-stone-500 font-bold"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Customer & Delivery Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                <User size={14} /> Customer Details
              </span>
              <p className="font-bold text-sm text-stone-900">{order.customer?.display_name || 'Guest'}</p>
              <p className="text-xs text-stone-600">{order.customer?.email}</p>
              {order.customer?.phone && <p className="text-xs text-stone-600">📞 {order.customer.phone}</p>}
            </div>

            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin size={14} /> Delivery Destination
              </span>
              <p className="text-xs text-stone-800 leading-relaxed font-medium">
                {order.delivery_address}
              </p>
              <p className="text-[11px] text-stone-500">
                Coordinates: ({order.delivery_lat.toFixed(4)}, {order.delivery_lng.toFixed(4)})
              </p>
            </div>
          </div>

          {/* Assigned Delivery Rider */}
          {order.delivery_person && (
            <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 space-y-2">
              <span className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1.5">
                <Bike size={14} /> Assigned Delivery Rider
              </span>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-purple-950">{order.delivery_person.full_name}</p>
                  <p className="text-xs text-purple-800">
                    Vehicle: {order.delivery_person.vehicle_type} • Rating: ⭐ {order.delivery_person.avg_rating.toFixed(1)}
                  </p>
                </div>
                <a
                  href={`tel:${order.delivery_person.phone}`}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700"
                >
                  Call Rider ({order.delivery_person.phone})
                </a>
              </div>
            </div>
          )}

          {/* Items breakdown with snapshot prices */}
          <div>
            <h4 className="font-bold text-sm text-stone-900 mb-3 flex items-center gap-1.5">
              <FileText size={15} /> Order Items
            </h4>
            <div className="border border-stone-200 rounded-2xl overflow-hidden divide-y divide-stone-100">
              {order.items?.map((item) => (
                <div key={item.id || item.menu_item_id} className="p-3.5 flex items-center justify-between text-sm bg-white">
                  <div>
                    <span className="font-bold text-stone-900">{item.name}</span>
                    <span className="text-xs text-stone-500 ml-2">× {item.quantity}</span>
                    {item.special_instructions && (
                      <p className="text-xs text-amber-700 italic mt-0.5">
                        Instructions: {item.special_instructions}
                      </p>
                    )}
                  </div>
                  <span className="font-bold text-stone-800">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Financial summary */}
          <div className="bg-[#fffbf6] p-4 rounded-2xl border border-[#eadfd2] space-y-2 text-sm">
            <div className="flex justify-between text-stone-600">
              <span>Subtotal:</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Delivery Fee (Haversine Distance):</span>
              <span>{formatCurrency(order.delivery_fee)}</span>
            </div>
            {order.tax > 0 && (
              <div className="flex justify-between text-stone-600">
                <span>Tax:</span>
                <span>{formatCurrency(order.tax)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-stone-900 pt-2 border-t border-stone-200">
              <span>Total:</span>
              <span className="text-[var(--red)]">{formatCurrency(order.total)}</span>
            </div>
          </div>

          {/* Lifecycle Audit Trail (status_history) */}
          {order.status_history && order.status_history.length > 0 && (
            <div>
              <h4 className="font-bold text-sm text-stone-900 mb-3 flex items-center gap-1.5">
                <History size={15} /> Status Audit Trail
              </h4>
              <div className="relative pl-6 space-y-3.5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
                {order.status_history.map((h) => (
                  <div key={h.id} className="relative">
                    <span className="absolute -left-6 top-1.5 w-2 h-2 rounded-full bg-[var(--red)] ring-4 ring-white" />
                    <div className="text-xs">
                      <span className="font-bold text-stone-900 uppercase tracking-wide mr-2">{h.status}</span>
                      <span className="text-stone-400">by {h.role}</span>
                      {h.notes && <p className="text-stone-600 italic mt-0.5">"{h.notes}"</p>}
                      <p className="text-[11px] text-stone-400 mt-0.5">{formatDateTime(h.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-100"
          >
            Close
          </button>

          {order.status === 'PLACED' && (
            <>
              <button
                type="button"
                onClick={() => {
                  const reason = prompt('Reason for rejecting order:') || 'Restaurant busy'
                  onUpdateStatus(order.id, 'REJECTED', reason)
                }}
                disabled={isUpdating}
                className="px-4 py-2.5 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 font-bold text-xs"
              >
                Reject Order
              </button>
              <button
                type="button"
                onClick={() => onUpdateStatus(order.id, 'ACCEPTED')}
                disabled={isUpdating}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm"
              >
                Accept Order
              </button>
            </>
          )}

          {order.status === 'ACCEPTED' && (
            <button
              type="button"
              onClick={() => onUpdateStatus(order.id, 'PREPARING')}
              disabled={isUpdating}
              className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm"
            >
              Start Preparing
            </button>
          )}

          {order.status === 'PREPARING' && (
            <button
              type="button"
              onClick={() => onUpdateStatus(order.id, 'READY')}
              disabled={isUpdating}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm"
            >
              Mark Ready & Auto-Assign Rider
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
