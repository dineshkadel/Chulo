import { useEffect, useState, useCallback } from 'react'
import {
  CheckCircle2,
  Clock,
  ChefHat,
  Bike,
  PackageCheck,
  AlertCircle,
  XCircle,
  RefreshCw,
  Phone,
  MapPin,
  Utensils,
} from 'lucide-react'
import { getOrder, cancelOrder } from '../../api/orders'
import type { Order, OrderStatus } from '../../types/order'
import { OrderStatusBadge } from './OrderStatusBadge'
import { formatCurrency, formatDateTime } from '../../utils/format'

interface OrderTrackerModalProps {
  orderId: number
  onClose: () => void
  onOrderUpdated?: (order: Order) => void
}

const LIFECYCLE_STEPS: { status: OrderStatus; label: string; desc: string; icon: typeof Clock }[] = [
  { status: 'PLACED', label: 'Placed', desc: 'Waiting for restaurant confirmation', icon: Clock },
  { status: 'ACCEPTED', label: 'Accepted', desc: 'Restaurant confirmed your order', icon: CheckCircle2 },
  { status: 'PREPARING', label: 'Cooking', desc: 'Freshly preparing your dishes', icon: ChefHat },
  { status: 'READY', label: 'Ready', desc: 'Food is packed and ready', icon: PackageCheck },
  { status: 'ASSIGNED', label: 'Rider Assigned', desc: 'Delivery partner on the way to pickup', icon: Bike },
  { status: 'PICKED_UP', label: 'On The Way', desc: 'Rider is heading to your doorstep', icon: Bike },
  { status: 'DELIVERED', label: 'Delivered', desc: 'Enjoy your meal!', icon: CheckCircle2 },
]

export function OrderTrackerModal({ orderId, onClose, onOrderUpdated }: OrderTrackerModalProps) {
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [polling, setPolling] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [showCancelPrompt, setShowCancelPrompt] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCurrentOrder = useCallback(async (isPolling = false) => {
    try {
      if (isPolling) setPolling(true)
      const data = await getOrder(orderId)
      setOrder(data)
      setError(null)
      if (onOrderUpdated) onOrderUpdated(data)
    } catch (err: unknown) {
      if (!isPolling) {
        setError(err instanceof Error ? err.message : 'Unable to load order status')
      }
    } finally {
      setLoading(false)
      setPolling(false)
    }
  }, [orderId, onOrderUpdated])

  // Polling every 5 seconds while active
  useEffect(() => {
    fetchCurrentOrder(false)
    const interval = setInterval(() => {
      // If order is delivered, cancelled or rejected, stop active polling
      fetchCurrentOrder(true)
    }, 5000)
    return () => clearInterval(interval)
  }, [fetchCurrentOrder])

  const handleCancel = async () => {
    try {
      setCancelling(true)
      setError(null)
      const updated = await cancelOrder(orderId, cancelReason || 'Customer requested cancellation')
      setOrder(updated)
      setShowCancelPrompt(false)
      if (onOrderUpdated) onOrderUpdated(updated)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to cancel order')
    } finally {
      setCancelling(false)
    }
  }

  // Calculate current active step index in lifecycle
  const currentStatus = order?.status || 'PLACED'
  const isTerminalNegative = currentStatus === 'CANCELLED' || currentStatus === 'REJECTED'
  const activeStepIndex = LIFECYCLE_STEPS.findIndex((s) => s.status === currentStatus)

  // Customer can cancel ONLY before ACCEPTED (i.e. strictly when PLACED)
  const canCancel = currentStatus === 'PLACED'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-[#fffbf6]">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="font-black text-xl text-[var(--ink)]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                Order Tracking #CH-{orderId}
              </h3>
              {order && <OrderStatusBadge status={order.status} />}
              {polling && (
                <span className="inline-flex items-center text-[10px] text-stone-400 gap-1 font-semibold">
                  <RefreshCw size={11} className="animate-spin text-[var(--red)]" />
                  Live
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 mt-1">
              {order ? `From ${order.restaurant?.name || 'Restaurant'}` : 'Connecting to live status...'}
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
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs flex items-center gap-2">
              <AlertCircle size={16} className="text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="text-center py-16">
              <RefreshCw size={32} className="animate-spin text-[var(--red)] mx-auto mb-3" />
              <p className="text-sm font-bold text-stone-700">Fetching live order status...</p>
            </div>
          ) : !order ? (
            <div className="text-center py-12 text-sm text-stone-500">
              Order not found.
            </div>
          ) : (
            <>
              {/* Stepper or Negative Alert */}
              {isTerminalNegative ? (
                <div className={`p-5 rounded-2xl border ${currentStatus === 'CANCELLED' ? 'bg-stone-50 border-stone-300' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center gap-3">
                    <XCircle size={28} className={currentStatus === 'CANCELLED' ? 'text-stone-500' : 'text-red-600'} />
                    <div>
                      <h4 className="font-bold text-base text-stone-900">
                        {currentStatus === 'CANCELLED' ? 'Order Cancelled' : 'Order Declined by Restaurant'}
                      </h4>
                      <p className="text-xs text-stone-600 mt-0.5">
                        {currentStatus === 'CANCELLED'
                          ? 'This order was cancelled by you before kitchen preparation.'
                          : 'The restaurant was unable to fulfill this order at this time.'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* ─── VISUAL ORDER LIFECYCLE STEPPER ─── */
                <div className="bg-[#fffdfa] rounded-2xl border border-stone-200 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--red)]">
                      Order Journey
                    </span>
                    <span className="text-xs text-stone-500">
                      Estimated delivery: ~{order.estimated_delivery_min || 30} mins
                    </span>
                  </div>

                  {/* Horizontal / Vertical Stepper */}
                  <div className="space-y-4">
                    {LIFECYCLE_STEPS.map((step, idx) => {
                      const Icon = step.icon
                      const isCompleted = activeStepIndex > idx
                      const isCurrent = activeStepIndex === idx

                      return (
                        <div key={step.status} className="flex items-start gap-3.5 relative">
                          {/* Vertical line connecting steps */}
                          {idx < LIFECYCLE_STEPS.length - 1 && (
                            <div
                              className={`absolute left-4 top-8 bottom-0 w-0.5 -mb-4 transition-colors ${
                                isCompleted ? 'bg-emerald-500' : 'bg-stone-200'
                              }`}
                            />
                          )}

                          {/* Node Icon */}
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 transition-all ${
                              isCompleted
                                ? 'bg-emerald-500 text-white shadow-xs'
                                : isCurrent
                                ? 'bg-[var(--red)] text-white ring-4 ring-red-100 shadow-sm animate-pulse'
                                : 'bg-stone-100 text-stone-400 border border-stone-200'
                            }`}
                          >
                            <Icon size={16} />
                          </div>

                          {/* Label and description */}
                          <div className="min-w-0 flex-1 pt-0.5">
                            <div className="flex items-center justify-between">
                              <h5
                                className={`text-sm font-bold ${
                                  isCurrent ? 'text-[var(--red)]' : isCompleted ? 'text-emerald-900' : 'text-stone-400'
                                }`}
                              >
                                {step.label}
                              </h5>
                              {isCurrent && (
                                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-100 text-[var(--red)]">
                                  Current Status
                                </span>
                              )}
                              {isCompleted && (
                                <span className="text-[10px] font-bold text-emerald-600">
                                  Completed ✓
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-stone-500 mt-0.5">{step.desc}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Delivery Partner Details (Shown when ASSIGNED / PICKED_UP / DELIVERED) */}
              {order.delivery_person && (
                <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 space-y-2">
                  <span className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Bike size={14} /> Your Delivery Partner
                  </span>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm text-purple-950">{order.delivery_person.full_name}</p>
                      <p className="text-xs text-purple-800">
                        {order.delivery_person.vehicle_type}
                        {order.delivery_person.license_plate ? ` • ${order.delivery_person.license_plate}` : ''} • Rating: ⭐ {order.delivery_person.avg_rating.toFixed(1)}
                      </p>
                    </div>
                    <a
                      href={`tel:${order.delivery_person.phone}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 shadow-xs"
                    >
                      <Phone size={13} />
                      Call ({order.delivery_person.phone})
                    </a>
                  </div>
                </div>
              )}

              {/* Delivery Address */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-start gap-3">
                <MapPin size={18} className="text-[var(--red)] shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5">
                  <span className="font-bold text-stone-900 block">Delivery Address</span>
                  <p className="text-stone-600">{order.delivery_address}</p>
                  {order.special_notes && (
                    <p className="text-amber-800 italic mt-1">Delivery note: {order.special_notes}</p>
                  )}
                </div>
              </div>

              {/* Order Items Receipt Snapshot */}
              <div>
                <h4 className="font-bold text-sm text-stone-900 mb-3 flex items-center gap-1.5">
                  <Utensils size={15} /> Ordered Dishes
                </h4>
                <div className="border border-stone-200 rounded-2xl overflow-hidden divide-y divide-stone-100">
                  {order.items?.map((item) => (
                    <div key={item.id || item.menu_item_id} className="p-3.5 flex items-center justify-between text-sm bg-white">
                      <div>
                        <span className="font-bold text-stone-900">{item.name}</span>
                        <span className="text-xs text-stone-500 ml-2">× {item.quantity}</span>
                        {item.special_instructions && (
                          <p className="text-xs text-amber-700 italic mt-0.5">
                            Note: {item.special_instructions}
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

              {/* Bill breakdown */}
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
                  <span>Paid Total:</span>
                  <span className="text-[var(--red)]">{formatCurrency(order.total)}</span>
                </div>
              </div>

              {/* Audit history */}
              {order.status_history && order.status_history.length > 0 && (
                <div className="pt-2">
                  <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2">
                    Status Updates Log
                  </span>
                  <div className="space-y-1.5 text-xs text-stone-500">
                    {order.status_history.map((h) => (
                      <div key={h.id} className="flex justify-between items-center bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-100">
                        <span className="font-bold text-stone-700">{h.status}</span>
                        <span>{formatDateTime(h.created_at)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between gap-3">
          <div>
            {canCancel && !showCancelPrompt && (
              <button
                type="button"
                onClick={() => setShowCancelPrompt(true)}
                className="text-xs font-bold text-red-600 hover:text-red-700 underline"
              >
                Cancel Order
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs shadow-xs"
            >
              Close
            </button>
          </div>
        </div>

        {/* Inline Cancel Prompt */}
        {showCancelPrompt && (
          <div className="p-4 bg-red-50 border-t border-red-200 space-y-3 animate-in slide-in-from-bottom-2">
            <p className="text-xs font-bold text-red-900">
              Are you sure you want to cancel this order? (Allowed only before kitchen acceptance)
            </p>
            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (optional)..."
              className="w-full bg-white border border-red-300 rounded-xl px-3 py-2 text-xs text-stone-800"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCancelPrompt(false)}
                className="px-3 py-1.5 text-xs font-bold text-stone-600 hover:text-stone-800"
              >
                Never mind
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={cancelling}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
