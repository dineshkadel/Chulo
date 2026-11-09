import { useEffect, useState, useRef, type MouseEvent, type ReactNode, type RefObject } from 'react'
import { ShoppingCart, Soup, UserRound } from 'lucide-react'
import type { Route } from '../../App'
import { useAuth } from '../../hooks/useAuth'
import { useCart } from '../../hooks/useCart'
import type { User } from '../../types/user'
import { CartDrawer } from '../cart/CartDrawer'

/* ─── Data ─────────────────────────────────────────────────────────────────── */

const serif = { fontFamily: "'Playfair Display', Georgia, serif" }

const NAV_LINKS = [
  { label: 'Explore', href: '#explore' },
  { label: 'Restaurants', href: '/restaurant' },
  { label: 'About', href: '#story' },
  { label: 'Contact', href: '#contact' },
] as const

const avatarClass =
  'rounded-full bg-gradient-to-br from-[var(--gold)] to-[var(--red)] text-white flex items-center justify-center font-bold select-none'

/* ─── Hooks ────────────────────────────────────────────────────────────────── */

function useScrolled(threshold = 12) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])

  return scrolled
}

function useClickOutside(ref: RefObject<HTMLElement | null>, active: boolean, onOutside: () => void) {
  useEffect(() => {
    if (!active) return
    const handle = (event: Event) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onOutside()
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [ref, active, onOutside])
}

function getUserInitial(user: User | null) {
  return (user?.display_name || user?.email || 'U').charAt(0).toUpperCase()
}

/* ─── Small pieces ─────────────────────────────────────────────────────────── */

function Logo({ onClick }: { onClick: (e: MouseEvent<HTMLAnchorElement>) => void }) {
  return (
    <a href="/" onClick={onClick} className="flex items-center gap-2 text-[var(--ink)] no-underline shrink-0 group">
      <Soup size={26} className="group-hover:scale-110 transition-transform" aria-hidden="true" />
      <span className="font-black text-2xl tracking-tight" style={serif}>
        Chulo<span className="text-[var(--red)]">.</span>
      </span>
    </a>
  )
}

function DesktopLinks() {
  return (
    <nav className="hidden md:flex items-center gap-7">
      {NAV_LINKS.map(({ label, href }) => (
        <a
          key={label}
          href={href}
          className="text-sm font-semibold text-[var(--muted)] hover:text-[var(--ink)] transition-colors no-underline relative group py-1"
        >
          {label}
          <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-[var(--red)] group-hover:w-full transition-all duration-200" />
        </a>
      ))}
    </nav>
  )
}

function CartButton({ totalItems, onClick }: { totalItems: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative w-10 h-10 rounded-xl flex items-center justify-center text-[var(--ink)] hover:bg-[var(--line)]/50 transition-colors cursor-pointer"
      aria-label="View shopping cart"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
      {totalItems > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--red)] text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-xs animate-in zoom-in">
          {totalItems}
        </span>
      )}
    </button>
  )
}

function AuthButtons({ onLogin, onSignUp }: { onLogin: () => void; onSignUp: () => void }) {
  return (
    <>
      <button
        type="button"
        onClick={onLogin}
        className="text-sm font-bold text-[var(--muted)] hover:text-[var(--ink)] px-3 py-2 rounded-lg hover:bg-[var(--line)]/50 transition-colors cursor-pointer"
      >
        Log in
      </button>
      <button
        type="button"
        onClick={onSignUp}
        className="text-sm font-bold text-white bg-[var(--red)] hover:bg-[#b83b20] active:scale-95 px-4 py-2 rounded-xl shadow-sm transition-all cursor-pointer"
      >
        Sign up
      </button>
    </>
  )
}

function MenuToggle({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="md:hidden flex flex-col justify-center items-center w-9 h-9 rounded-lg hover:bg-[var(--line)]/50 transition-colors gap-1.5 p-1.5 cursor-pointer"
      aria-label="Toggle navigation"
      aria-expanded={open}
    >
      <span className={`block w-5 h-0.5 bg-[var(--ink)] transition-transform duration-200 ${open ? 'rotate-45 translate-y-2' : ''}`} />
      <span className={`block w-5 h-0.5 bg-[var(--ink)] transition-opacity duration-200 ${open ? 'opacity-0' : ''}`} />
      <span className={`block w-5 h-0.5 bg-[var(--ink)] transition-transform duration-200 ${open ? '-rotate-45 -translate-y-2' : ''}`} />
    </button>
  )
}

/* ─── Profile dropdown ─────────────────────────────────────────────────────── */

const menuItemClass =
  'w-full px-4 py-2.5 text-left text-xs font-semibold text-[var(--ink)] hover:bg-[var(--cream)] flex items-center gap-2.5 transition-colors bg-transparent border-0 cursor-pointer'

function MenuIcon({ children }: { children: ReactNode }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted)]" aria-hidden="true">
      {children}
    </svg>
  )
}

function ProfileMenu({
  user,
  totalItems,
  onProfile,
  onOpenCart,
  onLogout,
}: {
  user: User
  totalItems: number
  onProfile: () => void
  onOpenCart: () => void
  onLogout: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, open, () => setOpen(false))

  const initial = getUserInitial(user)
  const role = user.roles?.[0] || 'customer'

  // Close the menu first, then run the action.
  const run = (action: () => void) => () => {
    setOpen(false)
    action()
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full border border-[var(--line)] bg-white hover:border-[var(--gold)]/60 hover:shadow-xs transition-all cursor-pointer"
        aria-expanded={open}
      >
        <div className={`w-8 h-8 text-sm shadow-xs ${avatarClass}`}>{initial}</div>
        <span className="hidden sm:inline text-xs font-bold text-[var(--ink)] max-w-[100px] truncate">
          {user.display_name || user.email}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={`text-[var(--muted)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[var(--line)] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-4 py-3 border-b border-[var(--line)]/60">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 text-base font-black shadow-xs ${avatarClass}`}>{initial}</div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-[var(--ink)] m-0 truncate">{user.display_name || 'Customer'}</p>
                <p className="text-xs text-[var(--muted)] m-0 truncate">{user.email}</p>
                <span className="inline-block mt-1 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-[var(--sand)] text-[var(--ink)]">
                  {role}
                </span>
              </div>
            </div>
          </div>

          <div className="py-1">
            <button type="button" onClick={run(onProfile)} className={menuItemClass}>
              <MenuIcon>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </MenuIcon>
              Customer Profile
            </button>

            <button type="button" onClick={run(onOpenCart)} className={`${menuItemClass} justify-between`}>
              <span className="flex items-center gap-2.5">
                <MenuIcon>
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                </MenuIcon>
                My Cart
              </span>
              {totalItems > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[var(--sand)] text-[var(--ink)]">
                  {totalItems} items
                </span>
              )}
            </button>

            <a href="/restaurant" onClick={() => setOpen(false)} className={`${menuItemClass} no-underline`}>
              <MenuIcon>
                <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
                <path d="M7 2v20" />
                <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
              </MenuIcon>
              Browse Restaurants
            </a>
          </div>

          <div className="pt-1 border-t border-[var(--line)]/60">
            <button
              type="button"
              onClick={run(onLogout)}
              className="w-full px-4 py-2.5 text-left text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors bg-transparent border-0 cursor-pointer"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Mobile drawer ────────────────────────────────────────────────────────── */

const mobileButtonClass =
  'w-full py-2.5 text-sm font-bold rounded-xl border border-[var(--line)] text-[var(--ink)] flex items-center justify-center gap-2 bg-white'

function MobileMenu({
  user,
  totalItems,
  onClose,
  onGo,
  onOpenCart,
  onLogout,
}: {
  user: User | null
  totalItems: number
  onClose: () => void
  onGo: (to: Route) => void
  onOpenCart: () => void
  onLogout: () => void
}) {
  return (
    <div className="md:hidden bg-[var(--cream)] border-b border-[var(--line)] px-6 py-4 flex flex-col gap-3 shadow-lg animate-in slide-in-from-top-3 duration-200">
      {user && (
        <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[var(--line)] mb-1">
          <div className={`w-10 h-10 text-sm ${avatarClass}`}>{getUserInitial(user)}</div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-sm text-[var(--ink)] m-0 truncate">{user.display_name || 'Customer'}</p>
            <p className="text-xs text-[var(--muted)] m-0 truncate">{user.email}</p>
          </div>
        </div>
      )}

      {NAV_LINKS.map(({ label, href }) => (
        <a
          key={label}
          href={href}
          onClick={onClose}
          className="text-base font-semibold text-[var(--ink)] py-2 border-b border-[var(--line)]/50 no-underline"
        >
          {label}
        </a>
      ))}

      <div className="pt-2 flex flex-col gap-2">
        {user ? (
          <>
            <button type="button" onClick={() => onGo('/profile')} className={mobileButtonClass}>
              <UserRound size={16} aria-hidden="true" /> Customer Profile
            </button>
            <button type="button" onClick={onOpenCart} className={mobileButtonClass}>
              <ShoppingCart size={16} aria-hidden="true" /> View Cart ({totalItems})
            </button>
            <button type="button" onClick={onLogout} className="w-full py-2.5 text-sm font-bold rounded-xl bg-red-600 text-white">
              Sign Out
            </button>
          </>
        ) : (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onGo('/login')}
              className="flex-1 py-2.5 text-sm font-bold rounded-xl border border-[var(--line)] text-[var(--ink)] bg-white"
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => onGo('/register')}
              className="flex-1 py-2.5 text-sm font-bold rounded-xl bg-[var(--red)] text-white"
            >
              Sign up
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Navbar ───────────────────────────────────────────────────────────────── */

export function Navbar({ navigate, compact }: { navigate: (to: Route) => void; compact?: boolean }) {
  const scrolled = useScrolled()
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)

  const { user, isAuthenticated, logout } = useAuth()
  const { totalItems } = useCart()

  const signedInUser = isAuthenticated && user ? user : null

  const go = (to: Route) => {
    navigate(to)
    setMenuOpen(false)
  }

  const goHome = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    go('/')
  }

  const openCart = () => {
    setMenuOpen(false)
    setCartOpen(true)
  }

  const handleLogout = () => {
    logout()
    setMenuOpen(false)
    navigate('/login')
  }

  return (
    <>
      <header
        className={[
          'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
          scrolled
            ? 'bg-[var(--cream)]/95 backdrop-blur-md shadow-[0_2px_20px_hsl(36_20%_20%/0.08)] border-b border-[var(--line)]'
            : 'bg-transparent',
        ].join(' ')}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-[72px] flex items-center justify-between gap-4">
          <Logo onClick={goHome} />

          {!compact && <DesktopLinks />}

          <div className="flex items-center gap-3">
            {!compact && <CartButton totalItems={totalItems} onClick={openCart} />}

            {signedInUser ? (
              <ProfileMenu
                user={signedInUser}
                totalItems={totalItems}
                onProfile={() => go('/profile')}
                onOpenCart={openCart}
                onLogout={handleLogout}
              />
            ) : (
              <AuthButtons onLogin={() => go('/login')} onSignUp={() => go('/register')} />
            )}

            {!compact && <MenuToggle open={menuOpen} onClick={() => setMenuOpen(!menuOpen)} />}
          </div>
        </div>

        {!compact && menuOpen && (
          <MobileMenu
            user={signedInUser}
            totalItems={totalItems}
            onClose={() => setMenuOpen(false)}
            onGo={go}
            onOpenCart={openCart}
            onLogout={handleLogout}
          />
        )}
      </header>

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}
