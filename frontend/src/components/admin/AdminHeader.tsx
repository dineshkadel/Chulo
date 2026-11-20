import { Bell, Menu, RefreshCw, Search, ShieldCheck } from 'lucide-react'
import type { AdminTab } from './AdminSidebar'
import type { User } from '../../types/user'

interface AdminHeaderProps {
  currentTab: AdminTab
  user: User | null
  onOpenMobileMenu: () => void
  onRefresh?: () => void
  isRefreshing?: boolean
}

const TAB_DESCRIPTIONS: Record<AdminTab, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Platform Overview',
    subtitle: 'High-level real-time metrics, active orders, and system health.',
  },
  customer: {
    title: 'Customer Management',
    subtitle: 'Manage registered patrons, account statuses, and activity history.',
  },
  'delivery person': {
    title: 'Delivery Fleet & Riders',
    subtitle: 'Monitor rider locations, active deliveries, and fleet availability.',
  },
  restaurant: {
    title: 'Restaurant Partners',
    subtitle: 'Approve and moderate restaurant profiles, operating hours, and menus.',
  },
  menu: {
    title: 'Menu & Food Categories',
    subtitle: 'Standardized categories, item catalog oversight, and dietary tags.',
  },
  order: {
    title: 'Master Order Log',
    subtitle: 'Track lifecycle transitions, assign nearest riders, and override disputes.',
  },
  review: {
    title: 'Reviews & Feedback',
    subtitle: 'Moderate platform ratings, customer feedback, and vendor quality.',
  },
  setting: {
    title: 'System & Platform Settings',
    subtitle: 'Configure fee structures, dispatch radius, and operational toggles.',
  },
}

export function AdminHeader({
  currentTab,
  user,
  onOpenMobileMenu,
  onRefresh,
  isRefreshing = false,
}: AdminHeaderProps) {
  const meta = TAB_DESCRIPTIONS[currentTab]
  const initial = (user?.display_name || user?.email || 'A').charAt(0).toUpperCase()

  return (
    <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 border-b border-[#eadfd2] bg-[#fffaf4]/90 px-5 py-4 backdrop-blur-md sm:px-8">
      {/* Left side: mobile toggle + page breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 md:hidden cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--red)]">
              Admin Portal
            </span>
            <span className="text-stone-300">/</span>
            <span className="text-xs font-semibold capitalize text-stone-500">
              {currentTab}
            </span>
          </div>
          <h1 className="m-0 text-xl sm:text-2xl font-bold font-[family-name:var(--display)] text-[var(--ink)]">
            {meta.title}
          </h1>
          <p className="m-0 hidden text-xs text-stone-500 sm:block">
            {meta.subtitle}
          </p>
        </div>
      </div>

      {/* Right side: search, live status, notifications & profile */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Quick search input */}
        <div className="relative hidden md:block">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            type="search"
            placeholder="Search orders, users, restaurants..."
            className="h-10 w-64 lg:w-72 rounded-xl border border-stone-200 bg-white pl-9 pr-3 text-xs text-[var(--ink)] placeholder:text-stone-400 focus:border-[var(--red)] focus:outline-none shadow-xs transition-all"
          />
        </div>

        {/* Refresh button */}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="grid h-10 w-10 place-items-center rounded-xl border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 hover:text-[var(--ink)] transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh current data"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin text-[var(--red)]' : ''} />
          </button>
        )}

        {/* Live System Indicator */}
        <div className="hidden sm:flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-600 shadow-xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Services Online</span>
        </div>

        {/* Notifications */}
        <button
          type="button"
          className="relative grid h-10 w-10 place-items-center rounded-xl border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 hover:text-[var(--ink)] transition-colors cursor-pointer"
          aria-label="View system alerts"
        >
          <Bell size={18} />
          <span className="absolute 1 top-2 right-2 h-2 w-2 rounded-full bg-[var(--red)]" />
        </button>

        {/* Admin Avatar Pill */}
        <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white p-1 pr-3 shadow-xs">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--red)] text-xs font-bold text-white shadow-xs">
            {initial}
          </span>
          <div className="hidden text-left sm:block">
            <span className="block text-xs font-bold leading-tight text-[var(--ink)]">
              {user?.display_name || 'Admin'}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-stone-400 leading-none">
              <ShieldCheck size={11} className="text-[var(--red)]" /> Root
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}

