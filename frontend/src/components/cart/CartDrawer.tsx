import { useCart } from '../../hooks/useCart'
import { formatCurrency } from '../../utils/format'
import { ShoppingCart } from 'lucide-react'

export function CartDrawer({
  isOpen,
  onClose,
  onCheckout,
}: {
  isOpen: boolean
  onClose: () => void
  onCheckout?: () => void
}) {
  const { items, removeItem, updateQuantity, totalAmount, clearCart } = useCart()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-md bg-[var(--cream)] h-full flex flex-col shadow-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--line)]">
          <h2 className="text-xl font-bold text-[var(--ink)]">Your Cart</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--line)]"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-12 text-[var(--muted)]">
              <ShoppingCart size={40} className="mx-auto mb-2" aria-hidden="true" />
              Your cart is empty.
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.menu_item_id}
                className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-[var(--line)]"
              >
                <div>
                  <h4 className="font-bold text-sm text-[var(--ink)]">{item.name}</h4>
                  <p className="text-xs text-[var(--muted)]">{formatCurrency(item.price)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.menu_item_id, item.quantity - 1)}
                    className="w-7 h-7 rounded-lg bg-[var(--sand)] flex items-center justify-center font-bold"
                  >
                    -
                  </button>
                  <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.menu_item_id, item.quantity + 1)}
                    className="w-7 h-7 rounded-lg bg-[var(--sand)] flex items-center justify-center font-bold"
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeItem(item.menu_item_id)}
                    className="text-xs text-red-500 ml-2"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="pt-4 border-t border-[var(--line)] space-y-3">
            <div className="flex justify-between items-center text-base font-bold text-[var(--ink)]">
              <span>Total:</span>
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
                onClick={onCheckout}
                className="flex-1 py-3 rounded-xl bg-[var(--red)] text-white font-bold text-sm hover:bg-[#b83b20]"
              >
                Checkout →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
