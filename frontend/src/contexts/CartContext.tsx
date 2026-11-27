import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react'
import { STORAGE_KEYS } from '../utils/constants'
import type { OrderItem } from '../types/order'

export interface CartItem extends OrderItem {
  restaurantId: number
  restaurantName?: string
}

export interface RestaurantCartGroup {
  restaurantId: number
  restaurantName: string
  items: CartItem[]
  subtotal: number
  totalItems: number
}

interface CartContextType {
  items: CartItem[]
  restaurantGroups: RestaurantCartGroup[]
  addItem: (item: CartItem) => void
  removeItem: (menuItemId: number) => void
  updateQuantity: (menuItemId: number, quantity: number) => void
  clearRestaurant: (restaurantId: number) => void
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

  // Allow items from multiple restaurants to coexist in the cart
  const addItem = (item: CartItem) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.menu_item_id === item.menu_item_id)
      if (existingIndex > -1) {
        const next = [...prev]
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + item.quantity,
          restaurantName: item.restaurantName || next[existingIndex].restaurantName,
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

  const clearRestaurant = (targetRestaurantId: number) => {
    setItems((prev) => prev.filter((i) => i.restaurantId !== targetRestaurantId))
  }

  const clearCart = () => {
    setItems([])
  }

  // Group items by restaurant for Foodmandu/DoorDash-style multi-restaurant orders
  const restaurantGroups = useMemo<RestaurantCartGroup[]>(() => {
    const map = new Map<number, RestaurantCartGroup>()
    for (const item of items) {
      const existing = map.get(item.restaurantId)
      if (existing) {
        existing.items.push(item)
        existing.subtotal += item.price * item.quantity
        existing.totalItems += item.quantity
        if (!existing.restaurantName && item.restaurantName) {
          existing.restaurantName = item.restaurantName
        }
      } else {
        map.set(item.restaurantId, {
          restaurantId: item.restaurantId,
          restaurantName: item.restaurantName || `Restaurant #${item.restaurantId}`,
          items: [item],
          subtotal: item.price * item.quantity,
          totalItems: item.quantity,
        })
      }
    }
    return Array.from(map.values())
  }, [items])

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        restaurantGroups,
        addItem,
        removeItem,
        updateQuantity,
        clearRestaurant,
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
