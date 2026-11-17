import {
  Bike,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Store,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react'
import type { Route } from '../../App'

export type AdminTab =
  | 'dashboard'
  | 'customer'
  | 'delivery person'
  | 'restaurant'
  | 'menu'
  | 'order'
  | 'review'
  | 'setting'

export interface NavItem {
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

interface AdminSidebarProps {
  currentTab: AdminTab
  onSelectTab: (tab: AdminTab) => void
  navigate: (to: Route) => void
  onLogout: () => void
}

export function AdminSidebar({ currentTab, onSelectTab, navigate, onLogout }: AdminSidebarProps) {
  return (
    <aside className="flex h-full flex-col overflow-y-auto overflow-x-hidden bg-[#140c06] px-2.5 py-6 text-orange-50">
      <button
        type="button"
        onClick={() => navigate('/')}
        title="Return to storefront"
        className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border-0 bg-transparent px-2 text-left text-white transition-colors hover:bg-white/10"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--red)] text-white">
          <ShieldCheck size={20} aria-hidden="true" />
        </span>
        <span>
          <strong className="block font-[family-name:var(--display)] text-lg leading-tight">Chulo</strong>
          <span className="text-xs text-orange-200/60">Admin portal</span>
        </span>
      </button>

      <nav className="mt-8 flex-1" aria-label="Admin portal">
        <div className="grid gap-1">
          {ADMIN_NAV_ITEMS.map(({ id, label, icon: Icon, badge }) => {
            const active = currentTab === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelectTab(id)}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-9 w-full cursor-pointer items-center gap-2.5 rounded-lg border-0 px-2.5 text-left text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-[var(--red)] text-white'
                    : 'bg-transparent text-orange-100/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={18} aria-hidden="true" />
                <span className="flex-1 truncate">{label}</span>
                {badge && (
                  <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px]">{badge}</span>
                )}
              </button>
            )
          })}
        </div>
      </nav>

      <button
        type="button"
        onClick={onLogout}
        className="mt-6 flex min-h-9 cursor-pointer items-center gap-2.5 rounded-lg border-0 bg-transparent px-2.5 text-sm font-semibold text-orange-100/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        <LogOut size={17} aria-hidden="true" /> Sign out
      </button>
    </aside>
  )
}