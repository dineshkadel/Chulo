import { useCallback, useEffect, useState } from 'react'
import {
  ArrowLeft,
  LogIn,
  ShieldAlert,
  X,
} from 'lucide-react'
import type { Route } from '../../App'
import { useAuth } from '../../hooks/useAuth'
import {
  AdminCustomersTab,
  AdminDeliveryPersonsTab,
  AdminHeader,
  AdminMenuTab,
  AdminOrdersTab,
  AdminOverviewTab,
  AdminRestaurantsTab,
  AdminReviewsTab,
  AdminSettingsTab,
  AdminSidebar,
  type AdminTab,
} from '../../components/admin'

interface AdminDashboardPageProps {
  navigate: (to: Route) => void
}

export function AdminDashboardPage({ navigate }: AdminDashboardPageProps) {
  const { user, isLoading, logout, isAuthenticated } = useAuth()
  const [currentTab, setCurrentTab] = useState<AdminTab>('dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), [])

  useEffect(() => {
    if (!mobileMenuOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMobileMenu()
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [mobileMenuOpen, closeMobileMenu])

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 800)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // 1. Loading state
  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#fffaf4]">
        <div className="flex flex-col items-center gap-3 text-stone-500">
          <span className="h-8 w-8 animate-spin rounded-full border-3 border-[var(--red)] border-t-transparent" />
          <span className="text-xs font-bold uppercase tracking-wider">Verifying Admin Permissions...</span>
        </div>
      </div>
    )
  }

  // 2. Unauthenticated or not admin access control
  const isAdmin = user?.roles?.includes('admin')

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#140c06] p-6 text-white">
        <div className="max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl backdrop-blur-md">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-red-500/20 text-red-400">
            <ShieldAlert size={34} />
          </div>
          <h2 className="mt-5 font-[family-name:var(--display)] text-2xl font-bold text-white">
            Access Restricted
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-orange-100/70">
            {isAuthenticated
              ? `Signed in as ${user?.email}. Your account does not have administrative privileges to access the Chulo Control Center.`
              : 'You must be signed in with an authorized administrator account to access the control center.'}
          </p>

          <div className="mt-6 flex flex-col gap-2.5">
            {!isAuthenticated ? (
              <button
                onClick={() => navigate('/login')}
                className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--red)] py-3 text-xs font-bold text-white shadow-lg transition-transform hover:scale-102"
              >
                <LogIn size={16} /> Sign In as Administrator
              </button>
            ) : null}
            <button
              onClick={() => navigate('/')}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 py-3 text-xs font-bold text-white transition-colors hover:bg-white/20"
            >
              <ArrowLeft size={16} /> Return to Storefront
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-row bg-[#f7f1ea] text-[var(--ink)]">
      {/* Desktop/tablet sidebar */}
      <div className="sticky top-0 hidden h-screen overflow-hidden md:block md:w-64 md:shrink-0">
        <AdminSidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          navigate={navigate}
          onLogout={handleLogout}
        />
      </div>

      {/* Mobile sidebar drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={closeMobileMenu}
            className="fixed inset-0 cursor-default border-0 bg-black/60"
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-[#140c06] shadow-2xl">
            <button
              type="button"
              onClick={closeMobileMenu}
              aria-label="Close navigation"
              className="absolute right-3 top-4 z-10 grid h-10 w-10 cursor-pointer place-items-center rounded-lg border-0 bg-transparent text-orange-100/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>
            <AdminSidebar
              currentTab={currentTab}
              onSelectTab={(tab) => {
                setCurrentTab(tab)
                closeMobileMenu()
              }}
              navigate={navigate}
              onLogout={handleLogout}
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader
          currentTab={currentTab}
          user={user}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        <main className="mx-auto w-full max-w-7xl flex-1 p-5 sm:p-8">
          {currentTab === 'dashboard' && <AdminOverviewTab onNavigateTab={setCurrentTab} />}
          {currentTab === 'customer' && <AdminCustomersTab />}
          {currentTab === 'delivery person' && <AdminDeliveryPersonsTab />}
          {currentTab === 'restaurant' && <AdminRestaurantsTab />}
          {currentTab === 'menu' && <AdminMenuTab />}
          {currentTab === 'order' && <AdminOrdersTab />}
          {currentTab === 'review' && <AdminReviewsTab />}
          {currentTab === 'setting' && <AdminSettingsTab />}
        </main>
      </div>
    </div>
  )
}