import { lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Bell,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  Settings,
  Store,
  UtensilsCrossed,
  X,
  type LucideIcon,
} from 'lucide-react'
import type { Route } from '../../App'
import { getRestaurantMe, type RestaurantProfile } from '../../api/restaurantApi'
import { RestaurantOverview } from '../../components/restaurant/RestaurantOverview'

const RestaurantOrdersPage = lazy(() => import('./RestaurantOrdersPage').then((module) => ({ default: module.RestaurantOrdersPage })))
const RestaurantMenuPage = lazy(() => import('./RestaurantMenuPage').then((module) => ({ default: module.RestaurantMenuPage })))
const RestaurantReviewsPage = lazy(() => import('./RestaurantReviewsPage').then((module) => ({ default: module.RestaurantReviewsPage })))
const RestaurantSettingsPage = lazy(() => import('./RestaurantSettingsPage').then((module) => ({ default: module.RestaurantSettingsPage })))

type PortalRoute = Extract<Route, '/vendor/dashboard' | '/vendor/orders' | '/vendor/menu' | '/vendor/reviews' | '/vendor/settings'>

interface NavItem {
  route: PortalRoute
  label: string
  icon: LucideIcon
}

const NAV_ITEMS: NavItem[] = [
  { route: '/vendor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { route: '/vendor/orders', label: 'Orders', icon: ClipboardList },
  { route: '/vendor/menu', label: 'Menu', icon: UtensilsCrossed },
  { route: '/vendor/reviews', label: 'Reviews', icon: MessageSquareText },
  { route: '/vendor/settings', label: 'Settings', icon: Settings },
]

function readCachedProfile(): RestaurantProfile | null {
  try {
    const cached: unknown = JSON.parse(localStorage.getItem('restaurant_portal') ?? 'null')
    if (cached && typeof cached === 'object' && 'id' in cached && 'name' in cached) {
      return cached as RestaurantProfile
    }
  } catch {
    // A missing or invalid cached profile is optional.
  }
  return null
}

function useRestaurantProfile(token: string | null) {
  const [profile, setProfile] = useState<RestaurantProfile | null>(readCachedProfile)
  const loaded = useRef(false)

  useEffect(() => {
    if (!token || loaded.current) return
    loaded.current = true
    getRestaurantMe()
      .then((data) => {
        setProfile(data)
        try {
          localStorage.setItem('restaurant_portal', JSON.stringify(data))
        } catch {
          // Caching is optional.
        }
      })
      .catch(() => {
        // Keep the cached profile, if any.
      })
  }, [token])

  return { profile, setProfile }
}

function RestaurantAvatar({ profile, name }: {
  profile: RestaurantProfile | null
  name: string
}) {
  const box = 'h-8 w-8 rounded-lg text-xs'
  if (profile?.hero_image_url) {
    return <img src={profile.hero_image_url} alt="" className={`${box} shrink-0 object-cover`} />
  }
  return (
    <span className={`${box} grid shrink-0 place-items-center bg-[var(--red)] font-bold text-white`} aria-hidden="true">
      {name.charAt(0).toUpperCase()}
    </span>
  )
}

function DashboardSidebar({
  route,
  reviewCount,
  onSelect,
  onLogout,
}: {
  route: PortalRoute
  reviewCount: number
  onSelect: (route: PortalRoute) => void
  onLogout: () => void
}) {
  return (
    <div className="flex h-full flex-col overflow-y-auto overflow-x-hidden px-4 py-6">
      <button
        onClick={() => onSelect('/vendor/dashboard')}
        className="flex min-h-11 items-center gap-3 rounded-xl border-0 bg-transparent px-2 text-left text-white transition-colors hover:bg-white/10"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--red)] text-white">
          <Store size={20} aria-hidden="true" />
        </span>
        <span>
          <strong className="block font-[family-name:var(--display)] text-lg leading-tight">
            Chulo
          </strong>
          <span className="text-xs text-stone-300">Restaurant portal</span>
        </span>
      </button>

      <nav className="mt-8 flex-1" aria-label="Restaurant portal">
        <div className="grid gap-1">
          {NAV_ITEMS.map(({ route: itemRoute, label, icon: Icon }) => {
            const active = route === itemRoute
            const badge =
              itemRoute === '/vendor/reviews' && reviewCount > 0
                ? String(reviewCount)
                : null

            return (
              <button
                key={itemRoute}
                onClick={() => onSelect(itemRoute)}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-11 w-full items-center gap-3 rounded-lg border-0 px-3 text-left text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-[var(--red)] text-white'
                    : 'bg-transparent text-stone-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={18} aria-hidden="true" />
                <span className="flex-1">{label}</span>
                {badge && (
                  <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px]">
                    {badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </nav>

      <button
        onClick={onLogout}
        className="mt-6 flex min-h-11 items-center gap-3 rounded-lg border-0 bg-transparent px-3 text-sm font-semibold text-stone-300 transition-colors hover:bg-white/10 hover:text-white"
      >
        <LogOut size={17} aria-hidden="true" /> Sign out
      </button>
    </div>
  )
}

function MobileSidebarDrawer({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  return (
    <div className="lg:hidden">
      <button aria-label="Close menu" tabIndex={open ? 0 : -1} onClick={onClose} className={`fixed inset-0 z-40 border-0 bg-black/50 transition-opacity duration-200 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`} />
      <aside aria-hidden={!open} className={`fixed inset-y-0 left-0 z-50 w-72 bg-[var(--ink)] transition-transform duration-200 ease-out ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <button onClick={onClose} aria-label="Close navigation" className="absolute right-3 top-4 z-10 grid h-10 w-10 place-items-center rounded-lg border-0 bg-transparent text-stone-300 transition-colors hover:bg-white/10 hover:text-white">
          <X size={18} />
        </button>
        {children}
      </aside>
    </div>
  )
}


function DashboardTopBar({ route, profile, name, onOpenMenu }: {
  route: PortalRoute
  profile: RestaurantProfile | null
  name: string
  onOpenMenu: () => void
}) {
  const label = NAV_ITEMS.find((item) => item.route === route)?.label ?? 'Dashboard'
  return (
    <header className="sticky top-0 z-30 flex min-h-[72px] items-center justify-between border-b border-stone-200 bg-[var(--cream)] px-4 sm:px-7">
      <div className="flex items-center gap-3">
        <button onClick={onOpenMenu} aria-label="Open navigation" className="grid h-10 w-10 place-items-center rounded-lg border border-stone-200 bg-white transition-colors hover:bg-stone-100 lg:hidden">
          <Menu size={18} aria-hidden="true" />
        </button>
        <div>
          <p className="m-0 text-xs font-bold uppercase tracking-[.14em] text-[var(--red)]">Restaurant workspace</p>
          <h1 className="m-0 mt-0.5 font-[family-name:var(--display)] text-xl leading-tight text-[var(--ink)]">{label}</h1>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button aria-label="Notifications" className="grid h-10 w-10 place-items-center rounded-lg border border-stone-200 bg-white transition-colors hover:bg-stone-100">
          <Bell size={17} aria-hidden="true" />
        </button>
        <div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-2 py-1">
          <RestaurantAvatar profile={profile} name={name} />
          <span className="hidden max-w-40 truncate text-sm font-semibold sm:block">{name}</span>
        </div>
      </div>
    </header>
  )
}



export function RestaurantDashboardPage({ route, navigate }: {
  route: PortalRoute
  navigate: (to: Route) => void
}) {
  const token = localStorage.getItem('restaurant_access_token')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { profile, setProfile } = useRestaurantProfile(token)
  const closeDrawer = useCallback(() => setDrawerOpen(false), [])

  useEffect(() => {
    if (!token) navigate('/vendor/login')
  }, [navigate, token])

  if (!token) return null

  const name = profile?.name ?? 'Your restaurant'
  const select = (nextRoute: PortalRoute) => {
    setDrawerOpen(false)
    navigate(nextRoute)
  }
  const logout = () => {
    ;['restaurant_access_token', 'restaurant_refresh_token', 'restaurant_portal'].forEach((key) => localStorage.removeItem(key))
    navigate('/vendor/login')
  }
  const sidebar = (
    <DashboardSidebar
      route={route}
      reviewCount={profile?.review_count ?? 0}
      onSelect={select}
      onLogout={logout}
    />
  )

  return (
    <main className="min-h-screen bg-[var(--cream)] text-[var(--ink)]">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 bg-[var(--ink)] lg:block">
          <div className="sticky top-0 h-screen">{sidebar}</div>
        </aside>
        <MobileSidebarDrawer open={drawerOpen} onClose={closeDrawer}>{sidebar}</MobileSidebarDrawer>
        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardTopBar route={route} profile={profile} name={name} onOpenMenu={() => setDrawerOpen(true)} />
          <div className="flex-1 p-4 sm:p-7">
            <div className="mx-auto max-w-7xl">
              {route === '/vendor/dashboard' && <RestaurantOverview onManageOrders={() => select('/vendor/orders')} />}
              <Suspense fallback={<div className="rounded-xl border border-stone-200 bg-white p-8 text-center text-sm text-stone-500">Loading page…</div>}>
                {route === '/vendor/orders' && <RestaurantOrdersPage />}
                {route === '/vendor/menu' && <RestaurantMenuPage />}
                {route === '/vendor/reviews' && <RestaurantReviewsPage profile={profile} />}
                {route === '/vendor/settings' && <RestaurantSettingsPage onProfileUpdate={setProfile} />}
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}