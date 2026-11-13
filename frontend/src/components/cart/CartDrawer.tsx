import { useState, useEffect } from 'react'
import { useCart } from '../../hooks/useCart'
import { useAuth } from '../../hooks/useAuth'
import { formatCurrency } from '../../utils/format'
import { ShoppingCart, MapPin, AlertCircle, ArrowRight, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react'
import { quoteDeliveryFee, createOrder } from '../../api/orders'
import type { QuoteDeliveryFeeResult } from '../../types/order'
import { OrderTrackerModal } from '../order/OrderTrackerModal'

export function CartDrawer({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
  onCheckout?: () => void
}) {
  const { items, removeItem, updateQuantity, totalAmount, clearCart, restaurantId } = useCart()
  const { user, isAuthenticated } = useAuth()

  // Checkout step state
  const [step, setStep] = useState<'cart' | 'checkout'>('cart')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryLat, setDeliveryLat] = useState(27.7172) // Kathmandu default
  const [deliveryLng, setDeliveryLng] = useState(85.3240)
  const [specialNotes, setSpecialNotes] = useState('')
  const [feeQuote, setFeeQuote] = useState<QuoteDeliveryFeeResult | null>(null)
  const [quotingFee, setQuotingFee] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [trackingOrderId, setTrackingOrderId] = useState<number | null>(null)

  // Initialize address and coordinates from authenticated user profile
  useEffect(() => {
    if (user) {
      if (user.current_lat && user.current_lng) {
        setDeliveryLat(user.current_lat)
        setDeliveryLng(user.current_lng)
      }
    }
  }, [user])

  // Reset step when closed
  useEffect(() => {
    if (!isOpen) {
      setStep('cart')
      setError(null)
    }
  }, [isOpen])

  // Fetch delivery fee quote when entering checkout step
  useEffect(() => {
    if (step === 'checkout' && restaurantId) {
      setQuotingFee(true)
      quoteDeliveryFee({
        restaurant_id: restaurantId,
        delivery_lat: deliveryLat,
        delivery_lng: deliveryLng,
      })
        .then((res) => {
          setFeeQuote(res)
          setError(null)
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Unable to quote delivery fee')
          // Fallback quote
          setFeeQuote({ distance_km: 2.5, delivery_fee: 60, estimated_min: 30 })
        })
        .finally(() => setQuotingFee(false))
    }
  }, [step, restaurantId, deliveryLat, deliveryLng])

  if (!isOpen) {
    // If order was placed, still show tracking modal if active
    if (trackingOrderId) {
      return (
        <OrderTrackerModal
          orderId={trackingOrderId}
          onClose={() => setTrackingOrderId(null)}
        />
      )
    }
    return null
  }

  const deliveryFee = feeQuote ? feeQuote.delivery_fee : 50
  const grandTotal = totalAmount + deliveryFee

  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      setError('Please log in before placing an order.')
      return
    }

    if (!deliveryAddress.trim()) {
      setError('Please enter your delivery street address.')
      return
    }

    if (!restaurantId || items.length === 0) {
      setError('Cart is empty or missing restaurant info.')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const payload = {
        restaurant_id: restaurantId,
        items: items.map((i) => ({
          menu_item_id: i.menu_item_id,
          quantity: i.quantity,
          special_instructions: i.special_instructions,
        })),
        delivery_address: deliveryAddress.trim(),
        delivery_lat: deliveryLat,
        delivery_lng: deliveryLng,
        special_notes: specialNotes.trim() || undefined,
      }

      const created = await createOrder(payload)

      // Success: clear cart and switch to tracking modal
      clearCart()
      onClose()
      setTrackingOrderId(created.id)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to place order')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="w-full max-w-md bg-[var(--cream)] h-full flex flex-col shadow-2xl p-6 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[var(--line)]">
            <div className="flex items-center gap-2">
              {step === 'checkout' && (
                <button
                  type="button"
                  onClick={() => setStep('cart')}
                  className="w-8 h-8 rounded-lg hover:bg-stone-200/60 flex items-center justify-center text-stone-600"
                  title="Back to cart"
                >
                  <ArrowLeft size={18} />
                </button>
              )}
              <h2 className="text-xl font-black text-[var(--ink)]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                {step === 'cart' ? 'Your Cart' : 'Checkout & Delivery'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--line)] text-stone-500 font-bold"
            >
              ✕
            </button>
          </div>

          {error && (
            <div className="my-3 p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle size={15} className="text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {step === 'cart' ? (
              items.length === 0 ? (
                <div className="text-center py-16 text-[var(--muted)]">
                  <ShoppingCart size={44} className="mx-auto mb-3 opacity-40" aria-hidden="true" />
                  <p className="font-bold text-sm text-stone-700">Your cart is empty.</p>
                  <p className="text-xs text-stone-400 mt-1">Add items from any restaurant menu to start.</p>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.menu_item_id}
                    className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-[var(--line)] shadow-xs"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <h4 className="font-bold text-sm text-[var(--ink)] truncate">{item.name}</h4>
                      <p className="text-xs text-[var(--muted)] mt-0.5">{formatCurrency(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => updateQuantity(item.menu_item_id, item.quantity - 1)}
                        className="w-7 h-7 rounded-lg bg-[var(--sand)] hover:bg-stone-200 flex items-center justify-center font-bold text-stone-700"
                      >
                        -
                      </button>
                      <span className="text-xs font-bold w-5 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.menu_item_id, item.quantity + 1)}
                        className="w-7 h-7 rounded-lg bg-[var(--sand)] hover:bg-stone-200 flex items-center justify-center font-bold text-stone-700"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeItem(item.menu_item_id)}
                        className="text-xs text-red-500 hover:text-red-700 ml-1.5 font-semibold"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )
            ) : (
              /* Checkout Form Step */
              <div className="space-y-4 text-xs">
                {/* Authenticated Check */}
                {!isAuthenticated && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-center justify-between">
                    <span>You need to be logged in to place an order.</span>
                    <a href="/login" className="font-bold text-[var(--red)] underline">
                      Sign in
                    </a>
                  </div>
                )}

                {/* Delivery Address */}
                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700 flex items-center gap-1.5">
                    <MapPin size={14} className="text-[var(--red)]" /> Delivery Street Address *
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="e.g. Lazimpat, House #42, Kathmandu"
                    className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs text-stone-800 outline-none focus:border-[var(--red)] focus:ring-1 focus:ring-[var(--red)]"
                  />
                </div>

                {/* Coordinates & Fee Info */}
                <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-1.5">
                  <div className="flex justify-between items-center text-stone-600">
                    <span>Delivery Location:</span>
                    <span className="font-mono text-[11px]">Kathmandu ({deliveryLat.toFixed(2)}, {deliveryLng.toFixed(2)})</span>
                  </div>
                  <div className="flex justify-between items-center text-stone-600">
                    <span>Haversine Distance:</span>
                    <span>{quotingFee ? 'Calculating...' : `${feeQuote?.distance_km.toFixed(1) || '2.0'} km`}</span>
                  </div>
                  <div className="flex justify-between items-center text-stone-600">
                    <span>Estimated Time:</span>
                    <span>~{feeQuote?.estimated_min || 30} mins</span>
                  </div>
                </div>

                {/* Special Notes */}
                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">Special Notes / Cooking Instructions</label>
                  <textarea
                    rows={2}
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    placeholder="e.g. Please ring bell, make momo spicy, extra achar..."
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-800 outline-none focus:border-[var(--red)]"
                  />
                </div>

                {/* Items Summary in checkout */}
                <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-1.5">
                  <span className="font-bold text-stone-700 block mb-1">Order Summary</span>
                  {items.map((i) => (
                    <div key={i.menu_item_id} className="flex justify-between text-stone-600">
                      <span>{i.quantity}× {i.name}</span>
                      <span>{formatCurrency(i.price * i.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="pt-4 border-t border-[var(--line)] space-y-3">
              {step === 'cart' ? (
                <>
                  <div className="flex justify-between items-center text-base font-black text-[var(--ink)]">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(totalAmount)}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={clearCart}
                      className="px-4 py-3 rounded-xl border border-[var(--line)] text-xs font-bold text-[var(--muted)] hover:text-red-500"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => setStep('checkout')}
                      className="flex-1 py-3 rounded-xl bg-[var(--red)] text-white font-bold text-sm hover:bg-[#b83b20] active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      Proceed to Checkout <ArrowRight size={16} />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1 text-xs text-stone-600 pb-1">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(totalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Fee (Haversine):</span>
                      <span>{quotingFee ? '...' : formatCurrency(deliveryFee)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-black text-stone-900 pt-1.5 border-t border-stone-200">
                      <span>Total to Pay:</span>
                      <span className="text-[var(--red)]">{formatCurrency(grandTotal)}</span>
                    </div>
                  </div>

                  <button
                    onClick={handlePlaceOrder}
                    disabled={submitting || quotingFee || !isAuthenticated}
                    className="w-full py-3.5 rounded-xl bg-[var(--red)] disabled:opacity-60 text-white font-bold text-sm hover:bg-[#b83b20] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        Placing Order...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        Confirm & Place Order ({formatCurrency(grandTotal)})
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Order Tracker Modal if order was just placed */}
      {trackingOrderId && (
        <OrderTrackerModal
          orderId={trackingOrderId}
          onClose={() => setTrackingOrderId(null)}
        />
      )}
    </>
  )
}
