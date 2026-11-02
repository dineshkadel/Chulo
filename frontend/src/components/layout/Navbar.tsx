import { useEffect, useState, useRef, type MouseEvent } from 'react'
import { ShoppingCart, Soup, UserRound } from 'lucide-react'
import type { Route } from '../../App'
import { useAuth } from '../../hooks/useAuth'
import { useCart } from '../../hooks/useCart'
import { CartDrawer } from '../cart/CartDrawer'

export function Navbar({ navigate, compact }: { navigate: (to: Route) => void; compact?: boolean }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)

  const { user, isAuthenticated, logout } = useAuth()
  const { totalItems } = useCart()

  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false)
      }
    }
    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [profileOpen])

  const home = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    navigate('/')
    setMenuOpen(false)
  }

  const go = (to: Route) => {
    navigate(to)
    setMenuOpen(false)
    setProfileOpen(false)
  }

  const handleLogout = () => {
    logout()
    setProfileOpen(false)
    setMenuOpen(false)
    navigate('/login')
  }

  const userInitial = (user?.display_name || user?.email || 'U').charAt(0).toUpperCase()
  const primaryRole = user?.roles?.[0] || 'customer'

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
          {/* Logo */}
          <a
            href="/"
            onClick={home}
            className="flex items-center gap-2 text-[var(--ink)] no-underline shrink-0 group"
          >
            <Soup size={26} className="group-hover:scale-110 transition-transform" aria-hidden="true" />
            <span className="font-black text-2xl tracking-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Chulo<span className="text-[var(--red)]">.</span>
            </span>
          </a>

          {/* Desktop Nav Links */}
          {!compact && (
            <nav className="hidden md:flex items-center gap-7">
              {(['Explore', 'Restaurants', 'About', 'Contact'] as const).map((label) => (
                <a
                  key={label}
                  href={`#${label.toLowerCase()}`}
                  className="text-sm font-semibold text-[var(--muted)] hover:text-[var(--ink)] transition-colors no-underline relative group py-1"
                >
                  {label}
                  <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-[var(--red)] group-hover:w-full transition-all duration-200" />
                </a>
              ))}
            </nav>
          )}

          {/* Action Area */}
          <div className="flex items-center gap-3">
            {/* Cart Icon Button (accessible when not in compact auth view) */}
            {!compact && (
              <button
                type="button"
                onClick={() => setCartOpen(true)}
                className="relative w-10 h-10 rounded-xl flex items-center justify-center text-[var(--ink)] hover:bg-[var(--line)]/50 transition-colors cursor-pointer"
                aria-label="View shopping cart"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
            )}

            {/* Authenticated State */}
            {isAuthenticated && user ? (
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full border border-[var(--line)] bg-white hover:border-[var(--gold)]/60 hover:shadow-xs transition-all cursor-pointer"
                  aria-expanded={profileOpen}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--gold)] to-[var(--red)] text-white flex items-center justify-center font-bold text-sm shadow-xs select-none">
                    {userInitial}
                  </div>
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
                    className={`text-[var(--muted)] transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* Profile Dropdown */}
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[var(--line)] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* User Header */}
                    <div className="px-4 py-3 border-b border-[var(--line)]/60">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--gold)] to-[var(--red)] text-white flex items-center justify-center font-black text-base shadow-xs">
                          {userInitial}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm text-[var(--ink)] m-0 truncate">
                            {user.display_name || 'Customer'}
                          </p>
                          <p className="text-xs text-[var(--muted)] m-0 truncate">
                            {user.email}
                          </p>
                          <span className="inline-block mt-1 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-[var(--sand)] text-[var(--ink)]">
                            {primaryRole}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => go('/profile')}
                        className="w-full px-4 py-2.5 text-left text-xs font-semibold text-[var(--ink)] hover:bg-[var(--cream)] flex items-center gap-2.5 transition-colors bg-transparent border-0 cursor-pointer"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted)]">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        Customer Profile
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setProfileOpen(false)
                          setCartOpen(true)
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs font-semibold text-[var(--ink)] hover:bg-[var(--cream)] flex items-center justify-between transition-colors bg-transparent border-0 cursor-pointer"
                      >
                        <span className="flex items-center gap-2.5">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted)]">
                            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                          </svg>
                          My Cart
                        </span>
                        {totalItems > 0 && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[var(--sand)] text-[var(--ink)]">
                            {totalItems} items
                          </span>
                        )}
                      </button>

                      <a
                        href="#restaurants"
                        onClick={() => setProfileOpen(false)}
                        className="w-full px-4 py-2.5 text-left text-xs font-semibold text-[var(--ink)] hover:bg-[var(--cream)] flex items-center gap-2.5 transition-colors no-underline block"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted)]">
                          <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
                          <path d="M7 2v20" />
                          <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
                        </svg>
                        Browse Restaurants
                      </a>
                    </div>

                    {/* Logout */}
                    <div className="pt-1 border-t border-[var(--line)]/60">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full px-4 py-2.5 text-left text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors bg-transparent border-0 cursor-pointer"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
            ) : (
              /* Unauthenticated state */
              <>
                <button
                  type="button"
                  onClick={() => go('/login')}
                  className="text-sm font-bold text-[var(--muted)] hover:text-[var(--ink)] px-3 py-2 rounded-lg hover:bg-[var(--line)]/50 transition-colors cursor-pointer"
                >
                  Log in
                </button>
                <button
                  type="button"
                  onClick={() => go('/register')}
                  className="text-sm font-bold text-white bg-[var(--red)] hover:bg-[#b83b20] active:scale-95 px-4 py-2 rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  Sign up
                </button>
              </>
            )}

            {/* Mobile hamburger */}
            {!compact && (
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden flex flex-col justify-center items-center w-9 h-9 rounded-lg hover:bg-[var(--line)]/50 transition-colors gap-1.5 p-1.5 cursor-pointer"
                aria-label="Toggle navigation"
              >
                <span className={`block w-5 h-0.5 bg-[var(--ink)] transition-transform duration-200 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                <span className={`block w-5 h-0.5 bg-[var(--ink)] transition-opacity duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
                <span className={`block w-5 h-0.5 bg-[var(--ink)] transition-transform duration-200 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Drawer */}
        {!compact && menuOpen && (
          <div className="md:hidden bg-[var(--cream)] border-b border-[var(--line)] px-6 py-4 flex flex-col gap-3 shadow-lg animate-in slide-in-from-top-3 duration-200">
            {isAuthenticated && user && (
              <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[var(--line)] mb-1">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--gold)] to-[var(--red)] text-white flex items-center justify-center font-bold text-sm">
                  {userInitial}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-[var(--ink)] m-0 truncate">{user.display_name || 'Customer'}</p>
                  <p className="text-xs text-[var(--muted)] m-0 truncate">{user.email}</p>
                </div>
              </div>
            )}

            {(['Explore', 'Restaurants', 'About', 'Contact'] as const).map((label) => (
              <a
                key={label}
                href={`#${label.toLowerCase()}`}
                onClick={() => setMenuOpen(false)}
                className="text-base font-semibold text-[var(--ink)] py-2 border-b border-[var(--line)]/50 no-underline"
              >
                {label}
              </a>
            ))}

            <div className="pt-2 flex flex-col gap-2">
              {isAuthenticated ? (
                <>
                  <button
                    type="button"
                    onClick={() => go('/profile')}
                    className="w-full py-2.5 text-sm font-bold rounded-xl border border-[var(--line)] text-[var(--ink)] flex items-center justify-center gap-2 bg-white"
                  >
                    <><UserRound size={16} aria-hidden="true" /> Customer Profile</>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false)
                      setCartOpen(true)
                    }}
                    className="w-full py-2.5 text-sm font-bold rounded-xl border border-[var(--line)] text-[var(--ink)] flex items-center justify-center gap-2 bg-white"
                  >
                    <><ShoppingCart size={16} aria-hidden="true" /> View Cart ({totalItems})</>
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full py-2.5 text-sm font-bold rounded-xl bg-red-600 text-white"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => go('/login')}
                    className="flex-1 py-2.5 text-sm font-bold rounded-xl border border-[var(--line)] text-[var(--ink)] bg-white"
                  >
                    Log in
                  </button>
                  <button
                    type="button"
                    onClick={() => go('/register')}
                    className="flex-1 py-2.5 text-sm font-bold rounded-xl bg-[var(--red)] text-white"
                  >
                    Sign up
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Cart Drawer */}
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}
