import {
  Bike,
  LayoutDashboard,
  MessageSquareText,
  Settings,
  ShoppingBag,
  Store,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react'
import type { AdminTab } from './AdminSidebar'

interface NavItem {
  id: AdminTab
  label: string
  icon: LucideIcon
  badge?: string | number
}

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'customer', label: 'Customer', icon: Users },
  { id: 'delivery person', label: 'Delivery Person', icon: Bike },
  { id: 'restaurant', label: 'Restaurant', icon: Store },
  { id: 'menu', label: 'Menu', icon: UtensilsCrossed },
  { id: 'order', label: 'Order', icon: ShoppingBag },
  { id: 'review', label: 'Review', icon: MessageSquareText },
  { id: 'setting', label: 'Setting', icon: Settings },
]
