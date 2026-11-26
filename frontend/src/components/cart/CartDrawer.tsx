import { useState, useEffect } from 'react'
import { useCart } from '../../hooks/useCart'
import { useAuth } from '../../hooks/useAuth'
import { formatCurrency } from '../../utils/format'
import {
  ShoppingCart,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Store,
  Trash2,
} from 'lucide-react'
import { quoteDeliveryFee, createOrder } from '../../api/orders'
import type { QuoteDeliveryFeeResult } from '../../types/order'
import { OrderTrackerModal } from '../order/OrderTrackerModal'
import { DeliveryLocationMapPicker } from './DeliveryLocationMapPicker'

export function CartDrawer({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
  onCheckout?: () => void
}) {
  const {
    items,
    restaurantGroups,
    removeItem,
    updateQuantity,
    clearRestaurant,
    clearCart,
    totalAmount,
    totalItems,
  } = useCart()
  const { user, isAuthenticated } = useAuth()

  // Checkout step state & selected restaurant for checkout
  const [step, setStep] = useState<'cart' | 'checkout'>('cart')
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(null)

  // Track collapsed state for each restaurant dropdown in cart
  const [collapsedIds, setCollapsedIds] = useState<Record<number, boolean>>({})

  // Checkout form fields
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryLat, setDeliveryLat] = useState(27.7172) // Kathmandu default
  const [deliveryLng, setDeliveryLng] = useState(85.324)
  const [specialNotes, setSpecialNotes] = useState('')
  const [feeQuote, setFeeQuote] = useState<QuoteDeliveryFeeResult | null>(null)
  const [quotingFee, setQuotingFee] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [trackingOrderId, setTrackingOrderId] = useState<number | null>(null)

  // Toggle restaurant dropdown accordion in cart
  const toggleDropdown = (restId: number) => {
    setCollapsedIds((prev) => ({
      ...prev,
      [restId]: !prev[restId],
    }))
  }

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
      setSelectedRestaurantId(null)
    }
  }, [isOpen])

  // Get active restaurant group for checkout
  const activeGroup =
    restaurantGroups.find((g) => g.restaurantId === selectedRestaurantId) ||
    restaurantGroups[0] ||
    null

  // Fetch delivery fee quote when entering checkout step for selected restaurant
  useEffect(() => {
    if (step === 'checkout' && activeGroup) {
      setQuotingFee(true)
      quoteDeliveryFee({
        restaurant_id: activeGroup.restaurantId,
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
  }, [step, activeGroup, deliveryLat, deliveryLng])

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
  const activeSubtotal = activeGroup ? activeGroup.subtotal : 0
  const grandTotal = activeSubtotal + deliveryFee

  // Handle starting checkout for a specific restaurant
  const handleStartCheckout = (restaurantId: number) => {
    setSelectedRestaurantId(restaurantId)
    setStep('checkout')
    setError(null)
  }

  // Handle placing the order for the active restaurant
  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      setError('Please log in before placing an order.')
      return
    }

    if (!deliveryAddress.trim()) {
      setError('Please enter your delivery street address.')
      return
    }

    if (!activeGroup || activeGroup.items.length === 0) {
      setError('Selected restaurant cart is empty.')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const payload = {
        restaurant_id: activeGroup.restaurantId,
        items: activeGroup.items.map((i) => ({
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

      // Success: Clear ONLY this restaurant's items from the cart
      // (items from other restaurants remain in the cart for their own separate checkout)
      clearRestaurant(activeGroup.restaurantId)

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
                  className="w-8 h-8 rounded-lg hover:bg-stone-200/60 flex items-center justify-center text-stone-600 cursor-pointer"
                  title="Back to cart"
                >
                  <ArrowLeft size={18} />
                </button>
              )}
              <div>
                <h2
                  className="text-xl font-black text-[var(--ink)] m-0 leading-tight"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  {step === 'cart' ? 'Your Cart' : 'Checkout & Delivery'}
                </h2>
                {step === 'checkout' && activeGroup && (
                  <p className="m-0 text-xs text-[var(--red)] font-bold truncate max-w-xs">
                    {activeGroup.restaurantName}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--line)] text-stone-500 font-bold cursor-pointer"
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
                  <p className="text-xs text-stone-400 mt-1">
                    Add items from any restaurant menu to start your order.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Multi-restaurant banner if items from > 1 restaurant */}
                  {restaurantGroups.length > 1 && (
                    <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-2xl text-[11px] leading-relaxed text-amber-900 flex items-start gap-2 shadow-xs">
                      <Store size={15} className="text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-bold">Multi-Restaurant Cart</strong>
                        You have dishes from {restaurantGroups.length} different restaurants. Each
                        restaurant is placed and delivered as a separate order.
                      </div>
                    </div>
                  )}

                  {/* Grouped by Restaurant with Dropdown Accordion */}
                  {restaurantGroups.map((group) => {
                    const isCollapsed = !!collapsedIds[group.restaurantId]

                    return (
                      <div
                        key={group.restaurantId}
                        className="rounded-2xl border border-[var(--line)] bg-white shadow-xs overflow-hidden transition-all"
                      >
                        {/* Restaurant Header & Dropdown Trigger */}
                        <div className="flex items-center justify-between p-3.5 bg-stone-50/80 border-b border-stone-100">
                          <button
                            type="button"
                            onClick={() => toggleDropdown(group.restaurantId)}
                            className="flex items-center gap-2.5 text-left flex-1 min-w-0 cursor-pointer"
                          >
                            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[var(--red)]/10 text-[var(--red)]">
                              <Store size={15} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-bold text-xs text-[var(--ink)] truncate m-0">
                                {group.restaurantName}
                              </h3>
                              <span className="text-[11px] text-[var(--muted)]">
                                {group.totalItems} {group.totalItems === 1 ? 'item' : 'items'} ·{' '}
                                <strong className="text-[var(--ink)]">
                                  {formatCurrency(group.subtotal)}
                                </strong>
                              </span>
                            </div>
                            <div className="text-stone-400 p-1">
                              {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                            </div>
                          </button>

                          {/* Quick Clear Restaurant button */}
                          <button
                            type="button"
                            onClick={() => clearRestaurant(group.restaurantId)}
                            title="Remove all items from this restaurant"
                            className="ml-2 p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        {/* Collapsible Food Items Dropdown */}
                        {!isCollapsed && (
                          <div className="p-3.5 space-y-2.5 divide-y divide-stone-100">
                            {group.items.map((item) => (
                              <div
                                key={item.menu_item_id}
                                className="pt-2.5 first:pt-0 flex items-center justify-between gap-2"
                              >
                                <div className="min-w-0 flex-1 pr-1">
                                  <h4 className="font-semibold text-xs text-[var(--ink)] truncate m-0">
                                    {item.name}
                                  </h4>
                                  <p className="text-[11px] text-[var(--muted)] m-0 mt-0.5">
                                    {formatCurrency(item.price)} each
                                  </p>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    onClick={() =>
                                      updateQuantity(item.menu_item_id, item.quantity - 1)
                                    }
                                    className="w-6 h-6 rounded-md bg-[var(--sand)] hover:bg-stone-200 flex items-center justify-center font-bold text-xs text-stone-700 cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <span className="text-xs font-bold w-4 text-center">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() =>
                                      updateQuantity(item.menu_item_id, item.quantity + 1)
                                    }
                                    className="w-6 h-6 rounded-md bg-[var(--sand)] hover:bg-stone-200 flex items-center justify-center font-bold text-xs text-stone-700 cursor-pointer"
                                  >
                                    +
                                  </button>
                                  <button
                                    onClick={() => removeItem(item.menu_item_id)}
                                    className="text-[11px] text-red-500 hover:text-red-700 ml-1 font-semibold cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ))}

                            {/* Subtotal & Dedicated Checkout Button for this Restaurant */}
                            <div className="pt-3 space-y-2.5">
                              <div className="flex justify-between items-center text-xs font-bold text-stone-700">
                                <span>Subtotal:</span>
                                <span className="text-[var(--ink)] font-black">
                                  {formatCurrency(group.subtotal)}
                                </span>
                              </div>

                              <button
                                onClick={() => handleStartCheckout(group.restaurantId)}
                                className="w-full py-2.5 rounded-xl bg-[var(--red)] hover:bg-[#b83b20] active:scale-98 transition-all text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                              >
                                Checkout from {group.restaurantName} ({formatCurrency(group.subtotal)})
                                <ArrowRight size={14} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            ) : (
              /* Checkout Form Step for the Selected Restaurant */
              <div className="space-y-4 text-xs">
                {/* Active Restaurant Banner */}
                {activeGroup && (
                  <div className="p-3 bg-white rounded-2xl border border-stone-200 flex items-center gap-2.5 shadow-xs">
                    <div className="grid h-8 w-8 place-items-center rounded-xl bg-[var(--red)]/10 text-[var(--red)]">
                      <Store size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                        Placing Order To
                      </span>
                      <strong className="text-xs text-[var(--ink)] font-bold truncate block">
                        {activeGroup.restaurantName}
                      </strong>
                    </div>
                    <span className="text-xs font-black text-[var(--red)]">
                      {formatCurrency(activeGroup.subtotal)}
                    </span>
                  </div>
                )}

                {/* Authenticated Check */}
                {!isAuthenticated && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-center justify-between">
                    <span>You need to be logged in to place an order.</span>
                    <a href="/login" className="font-bold text-[var(--red)] underline">
                      Sign in
                    </a>
                  </div>
                )}

                {/* Delivery Location Map with Live Pin & Fee Recalculation */}
                <DeliveryLocationMapPicker
                  lat={deliveryLat}
                  lng={deliveryLng}
                  address={deliveryAddress}
                  onChangeLocation={(newLat, newLng, suggestedAddr) => {
                    setDeliveryLat(newLat)
                    setDeliveryLng(newLng)
                    if (suggestedAddr) {
                      setDeliveryAddress(suggestedAddr)
                    }
                  }}
                  onChangeAddress={(addr) => setDeliveryAddress(addr)}
                  isCalculating={quotingFee}
                  distanceKm={feeQuote?.distance_km}
                  estimatedMin={feeQuote?.estimated_min}
                  deliveryFee={feeQuote?.delivery_fee}
                />

                {/* Special Notes */}
                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">
                    Special Notes / Cooking Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    placeholder="e.g. Ring doorbell, make momo spicy, extra achar..."
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-800 outline-none focus:border-[var(--red)]"
                  />
                </div>

                {/* Items Summary in checkout for active restaurant only */}
                {activeGroup && (
                  <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-1.5">
                    <span className="font-bold text-stone-700 block mb-1">
                      Dishes for this Order ({activeGroup.items.length})
                    </span>
                    {activeGroup.items.map((i) => (
                      <div key={i.menu_item_id} className="flex justify-between text-stone-600">
                        <span>
                          {i.quantity}× {i.name}
                        </span>
                        <span>{formatCurrency(i.price * i.quantity)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="pt-4 border-t border-[var(--line)] space-y-3">
              {step === 'cart' ? (
                <>
                  <div className="flex justify-between items-center text-sm font-bold text-stone-600">
                    <span>Total in Cart ({totalItems} items):</span>
                    <span className="text-base font-black text-[var(--ink)]">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={clearCart}
                      className="px-3.5 py-2.5 rounded-xl border border-[var(--line)] text-xs font-bold text-[var(--muted)] hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      Clear All
                    </button>
                    {restaurantGroups.length === 1 && (
                      <button
                        onClick={() => handleStartCheckout(restaurantGroups[0].restaurantId)}
                        className="flex-1 py-2.5 rounded-xl bg-[var(--red)] text-white font-bold text-xs hover:bg-[#b83b20] active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        Proceed to Checkout <ArrowRight size={15} />
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1 text-xs text-stone-600 pb-1">
                    <div className="flex justify-between">
                      <span>Items Subtotal:</span>
                      <span>{formatCurrency(activeSubtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Fee:</span>
                      <span>{quotingFee ? '...' : formatCurrency(deliveryFee)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-black text-stone-900 pt-1.5 border-t border-stone-200">
                      <span>Order Total:</span>
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
