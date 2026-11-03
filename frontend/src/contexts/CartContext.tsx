import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { STORAGE_KEYS } from '../utils/constants'
import type { OrderItem } from '../types/order'

export interface CartItem extends OrderItem {
  restaurantId: number
  restaurantName?: string
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (menuItemId: number) => void
  updateQuantity: (menuItemId: number, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalAmount: number
  restaurantId: number | null
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CART)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(items))
    } catch {}
  }, [items])

  const restaurantId = items.length > 0 ? items[0].restaurantId : null

  const addItem = (item: CartItem) => {
    setItems((prev) => {
      // If item from different restaurant, user can confirm replace or reset cart
      if (prev.length > 0 && prev[0].restaurantId !== item.restaurantId) {
        return [item]
      }
      const existingIndex = prev.findIndex((i) => i.menu_item_id === item.menu_item_id)
      if (existingIndex > -1) {
        const next = [...prev]
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + item.quantity,
        }
        return next
      }
      return [...prev, item]
    })
  }

  const removeItem = (menuItemId: number) => {
    setItems((prev) => prev.filter((i) => i.menu_item_id !== menuItemId))
  }

  const updateQuantity = (menuItemId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(menuItemId)
      return
    }
    setItems((prev) =>
      prev.map((i) => (i.menu_item_id === menuItemId ? { ...i, quantity } : i))
    )
  }

  const clearCart = () => {
    setItems([])
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalAmount,
        restaurantId,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCartContext(): CartContextType {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCartContext must be used within a CartProvider')
  }
  return context
}

