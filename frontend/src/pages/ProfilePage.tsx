import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react'
import {
  Coffee,
  CookingPot,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  Pizza,
  Settings,
  ShoppingBag,
  Soup,
  UserRound,
  UtensilsCrossed,
  RefreshCw,
  Eye,
  type LucideIcon,
} from 'lucide-react'
import type { Route } from '../App'
import { useAuth } from '../hooks/useAuth'
import { useGeolocation } from '../hooks/useGeolocation'
import { updateProfile, updateLocation } from '../api/user'
import { getMyOrders } from '../api/orders'
import type { Order } from '../types/order'
import { OrderTrackerModal, OrderStatusBadge } from '../components/order'
import { formatDate, formatCurrency } from '../utils/format'

const AVATAR_OPTIONS: { value: string; label: string; icon: LucideIcon }[] = [
  { value: 'momo', label: 'Momo', icon: Soup },
  { value: 'thakali', label: 'Thakali', icon: CookingPot },
  { value: 'thukpa', label: 'Thukpa', icon: UtensilsCrossed },
  { value: 'chiya', label: 'Chiya', icon: Coffee },
  { value: 'pizza', label: 'Pizza', icon: Pizza },
  { value: 'curry', label: 'Curry', icon: CookingPot },
]

const LEGACY_AVATARS: Record<string, string> = {
  '\u{1F95F}': 'momo',
  '\u{1F35B}': 'thakali',
  '\u{1F35C}': 'thukpa',
  '\u2615': 'chiya',
  '\u{1F355}': 'pizza',
  '\u{1F372}': 'curry',
}

export function ProfilePage({ navigate }: { navigate: (to: Route) => void }) {
  const { user, isAuthenticated, isLoading, setUser, logout } = useAuth()
  const { detectLocation, loading: geoLoading } = useGeolocation()

  const [activeTab, setActiveTab] = useState<'personal' | 'location' | 'orders' | 'account'>('personal')

  // Orders state
  const [orders, setOrders] = useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [ordersError, setOrdersError] = useState<string | null>(null)
  const [trackingOrderId, setTrackingOrderId] = useState<number | null>(null)

  const fetchMyOrders = async () => {
    try {
      setLoadingOrders(true)
      setOrdersError(null)
      const data = await getMyOrders()
      setOrders(data.orders || [])
    } catch (err: unknown) {
      setOrdersError(err instanceof Error ? err.message : 'Failed to fetch orders')
    } finally {
      setLoadingOrders(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'orders' && isAuthenticated) {
      fetchMyOrders()
    }
  }, [activeTab, isAuthenticated])

  // Personal info state
  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState('')
  const [customAvatar, setCustomAvatar] = useState(false)

  // Location info state
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [street, setStreet] = useState('')
  const [city, setCity] = useState('Kathmandu')
  const [label, setLabel] = useState('Home')

  // Feedback states
  const [savingPersonal, setSavingPersonal] = useState(false)
  const [personalSuccess, setPersonalSuccess] = useState('')
  const [personalError, setPersonalError] = useState('')

  const [savingLocation, setSavingLocation] = useState(false)
  const [locationSuccess, setLocationSuccess] = useState('')
  const [locationError, setLocationError] = useState('')

  // Sync form state when user data is loaded
  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || '')
      setPhone(user.phone || '')
      const avatar = user.avatar_url
      const presetAvatar = AVATAR_OPTIONS.find(({ value }) => value === avatar)
        ?? AVATAR_OPTIONS.find(({ value }) => value === LEGACY_AVATARS[avatar || ''])
      setSelectedAvatar(presetAvatar?.value || '')
      setAvatarUrl(presetAvatar ? '' : avatar || '')
      setCustomAvatar(Boolean(avatar && !presetAvatar))
      if (user.current_lat) setLat(user.current_lat)
      if (user.current_lng) setLng(user.current_lng)
    }
  }, [user])

  // If unauthenticated and finished loading, show prompt
  if (!isLoading && !isAuthenticated) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-[var(--cream)]">
        <div className="max-w-md w-full bg-white rounded-3xl border border-[var(--line)] p-8 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-[var(--sand)] flex items-center justify-center text-3xl mx-auto mb-4">
            <LockKeyhole size={32} aria-hidden="true" />
          </div>
          <h2
            className="text-2xl font-black text-[var(--ink)] mb-2"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Sign in to view profile
          </h2>
          <p className="text-sm text-[var(--muted)] mb-6">
            Please log in to your Chulo account to view and edit your personal details.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/login')}
              className="flex-1 py-3 px-4 rounded-xl bg-[var(--red)] text-white font-bold text-sm hover:bg-[#b83b20] transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/register')}
              className="flex-1 py-3 px-4 rounded-xl border border-[var(--line)] text-[var(--ink)] font-bold text-sm hover:bg-[var(--cream)] transition-colors"
            >
              Sign Up
            </button>
          </div>
        </div>
      </main>
    )
  }

  // Handle personal info submit
  const handlePersonalSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSavingPersonal(true)
    setPersonalSuccess('')
    setPersonalError('')

    const chosenAvatar = customAvatar ? avatarUrl.trim() : selectedAvatar || avatarUrl

    try {
      const updated = await updateProfile({
        display_name: displayName.trim(),
        phone: phone.trim(),
        avatar_url: chosenAvatar,
      })

      setUser(updated)
      setPersonalSuccess('Personal information updated successfully!')
      setTimeout(() => setPersonalSuccess(''), 4000)
    } catch (err) {
      setPersonalError(err instanceof Error ? err.message : 'Failed to update profile information.')
    } finally {
      setSavingPersonal(false)
    }
  }

  // Handle location detect
  const handleDetectLocation = async () => {
    try {
      const coords = await detectLocation()
      setLat(coords.latitude)
      setLng(coords.longitude)
      setLocationSuccess('GPS coordinates detected! Click "Save Location" to store.')
    } catch {
      setLocationError('Could not detect location. Please grant browser location permission.')
    }
  }

  // Handle location submit
  const handleLocationSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (lat === null || lng === null) {
      setLocationError('Please detect or enter your latitude and longitude coordinates.')
      return
    }

    setSavingLocation(true)
    setLocationSuccess('')
    setLocationError('')

    try {
      const updated = await updateLocation({
        latitude: lat,
        longitude: lng,
        label: label.trim() || 'Home',
        city: city.trim() || 'Kathmandu',
        street: street.trim(),
        save_as_address: true,
      })

      setUser(updated)
      setLocationSuccess('Delivery location and address saved successfully!')
      setTimeout(() => setLocationSuccess(''), 4000)
    } catch (err) {
      setLocationError(err instanceof Error ? err.message : 'Failed to update location.')
    } finally {
      setSavingLocation(false)
    }
  }

  const userInitial = (user?.display_name || user?.email || 'U').charAt(0).toUpperCase()
  const displayAvatar = customAvatar ? avatarUrl : selectedAvatar || user?.avatar_url || ''
  const displayAvatarOption = AVATAR_OPTIONS.find(({ value }) => value === displayAvatar)
    ?? AVATAR_OPTIONS.find(({ value }) => value === LEGACY_AVATARS[displayAvatar])

  return (
    <main className="min-h-screen bg-[var(--cream)] pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Profile Hero Header ────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-[var(--line)] shadow-sm overflow-hidden">
          {/* Top banner background */}
          <div className="h-32 bg-gradient-to-r from-[var(--sand)] via-[#f3cbb4] to-[var(--red)] relative">
            <div className="absolute inset-0 bg-black/5" />
            <div className="absolute top-4 right-4 flex gap-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/90 text-[var(--ink)] shadow-xs backdrop-blur-xs uppercase tracking-wider">
                {user?.roles?.[0] || 'Customer'}
              </span>
            </div>
          </div>

          {/* User info row */}
          <div className="px-6 sm:px-8 pb-6 pt-0 relative flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 -mt-14">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              {/* Avatar circle */}
              <div className="w-24 h-24 rounded-full border-4 border-white bg-gradient-to-br from-[var(--gold)] to-[var(--red)] text-white flex items-center justify-center font-black text-3xl shadow-md select-none overflow-hidden">
                {displayAvatarOption ? (
                  <displayAvatarOption.icon size={40} aria-hidden="true" />
                ) : displayAvatar.startsWith('http') ? (
                  <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  userInitial
                )}
              </div>

              <div>
                <h1
                  className="text-2xl sm:text-3xl font-black text-[var(--ink)] tracking-tight m-0"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  {user?.display_name || 'Customer'}
                </h1>
                <p className="text-sm text-[var(--muted)] m-0 flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
                  <span>{user?.email}</span>
                  <span className="text-emerald-600 font-bold text-xs" title="Verified Customer">
                    ✓
                  </span>
                </p>
                {user?.created_at && (
                  <p className="text-xs text-stone-400 m-0 mt-1">
                    Member since {formatDate(user.created_at)}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  logout()
                  navigate('/login')
                }}
                className="text-xs font-bold text-red-600 hover:text-red-700 px-3.5 py-2 rounded-xl border border-red-200 hover:bg-red-50 transition-colors flex items-center gap-1.5"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-t border-[var(--line)] px-6 sm:px-8 bg-stone-50/50 overflow-x-auto">
            <button
              onClick={() => setActiveTab('personal')}
              className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                activeTab === 'personal'
                  ? 'border-[var(--red)] text-[var(--red)] bg-white'
                  : 'border-transparent text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              <UserRound size={16} aria-hidden="true" />
              Personal Information
            </button>

            <button
              onClick={() => setActiveTab('location')}
              className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                activeTab === 'location'
                  ? 'border-[var(--red)] text-[var(--red)] bg-white'
                  : 'border-transparent text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              <MapPin size={16} aria-hidden="true" />
              Delivery Address & Location
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                activeTab === 'orders'
                  ? 'border-[var(--red)] text-[var(--red)] bg-white'
                  : 'border-transparent text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              <ShoppingBag size={16} aria-hidden="true" />
              My Orders & Tracking
            </button>

            <button
              onClick={() => setActiveTab('account')}
              className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                activeTab === 'account'
                  ? 'border-[var(--red)] text-[var(--red)] bg-white'
                  : 'border-transparent text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              <Settings size={16} aria-hidden="true" />
              Account & Preferences
            </button>
          </div>
        </div>

        {/* ── Tab Content ────────────────────────────────────────────────── */}

        {/* TAB 1: Personal Information */}
        {activeTab === 'personal' && (
          <div className="bg-white rounded-3xl border border-[var(--line)] shadow-sm p-6 sm:p-8 animate-in fade-in">
            <div className="mb-6">
              <h2
                className="text-xl font-black text-[var(--ink)]"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Personal Details
              </h2>
              <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
                Update your name, contact phone number, and choose your customer avatar.
              </p>
            </div>

            {/* Success Alert */}
            {personalSuccess && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 flex items-center gap-2.5 animate-in fade-in">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-600 shrink-0">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span className="font-semibold">{personalSuccess}</span>
              </div>
            )}

            {/* Error Alert */}
            {personalError && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2.5 animate-in fade-in">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{personalError}</span>
              </div>
            )}

            <form onSubmit={handlePersonalSubmit} className="space-y-6">
              {/* Full Name */}
              <div>
                <label htmlFor="profile-name" className="block text-xs font-bold text-[var(--ink)] mb-1.5">
                  Full Name <span className="text-[var(--red)]">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">
                    <UserRound size={16} aria-hidden="true" />
                  </span>
                  <input
                    id="profile-name"
                    required
                    type="text"
                    value={displayName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setDisplayName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-[var(--line)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/20 transition-all"
                  />
                </div>
              </div>

              {/* Email (Read only) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="profile-email" className="block text-xs font-bold text-[var(--ink)]">
                    Email Address
                  </label>
                  <span className="text-[11px] text-[var(--muted)] flex items-center gap-1">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    Primary Login ID (Cannot change)
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">
                    <Mail size={15} aria-hidden="true" />
                  </span>
                  <input
                    id="profile-email"
                    disabled
                    type="email"
                    value={user?.email || ''}
                    className="w-full pl-10 pr-4 py-3 bg-stone-100 border border-[var(--line)] rounded-xl text-sm text-[var(--muted)] cursor-not-allowed select-none"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="profile-phone" className="block text-xs font-bold text-[var(--ink)] mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">
                    <Phone size={15} aria-hidden="true" />
                  </span>
                  <input
                    id="profile-phone"
                    type="tel"
                    value={phone}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-[var(--line)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/20 transition-all"
                  />
                </div>
                <p className="text-[11px] text-[var(--muted)] mt-1">
                  Used by delivery riders to coordinate arrival for your orders.
                </p>
              </div>

              {/* Avatar Selection */}
              <div>
                <label className="block text-xs font-bold text-[var(--ink)] mb-2">
                  Choose Culinary Avatar
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 mb-3">
                  {AVATAR_OPTIONS.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        setSelectedAvatar(item.value)
                        setCustomAvatar(false)
                        setAvatarUrl('')
                      }}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        !customAvatar && selectedAvatar === item.value
                          ? 'border-[var(--red)] bg-[var(--red)]/5 shadow-xs scale-105'
                          : 'border-[var(--line)] hover:border-[var(--gold)] bg-white'
                      }`}
                    >
                      <item.icon size={24} aria-hidden="true" />
                      <span className="text-[11px] font-bold text-[var(--ink)]">{item.label}</span>
                    </button>
                  ))}
                </div>

                {/* Custom avatar URL toggle */}
                <div className="pt-1">
                  <label className="flex items-center gap-2 text-xs font-semibold text-[var(--muted)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customAvatar}
                      onChange={(e) => setCustomAvatar(e.target.checked)}
                      className="rounded accent-[var(--red)]"
                    />
                    Use custom image URL instead
                  </label>

                  {customAvatar && (
                    <input
                      aria-label="Custom avatar image URL"
                      type="url"
                      value={avatarUrl}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setAvatarUrl(e.target.value)}
                      className="w-full mt-2 px-3.5 py-2.5 bg-white border border-[var(--line)] rounded-xl text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--gold)]"
                    />
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-[var(--line)] flex justify-end">
                <button
                  type="submit"
                  disabled={savingPersonal}
                  className="py-3 px-6 rounded-xl bg-[var(--red)] hover:bg-[#b83b20] active:scale-[0.99] text-white font-bold text-sm tracking-wide shadow-sm transition-all duration-200 disabled:opacity-60 cursor-pointer flex items-center gap-2"
                >
                  {savingPersonal ? (
                    <>
                      <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>Saving…</span>
                    </>
                  ) : (
                    <>
                      <span>Save Changes</span>
                      <span>✓</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: Delivery Address & Location */}
        {activeTab === 'location' && (
          <div className="bg-white rounded-3xl border border-[var(--line)] shadow-sm p-6 sm:p-8 animate-in fade-in">
            <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2
                  className="text-xl font-black text-[var(--ink)]"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  Delivery Address & Coordinates
                </h2>
                <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
                  Keep your location coordinates updated so our algorithms match you with kitchens close to you.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={geoLoading}
                className="py-2.5 px-4 rounded-xl border border-[var(--line)] bg-[var(--sand)]/40 hover:bg-[var(--sand)] text-[var(--ink)] font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shrink-0"
              >
                {geoLoading ? (
                  <span className="w-3.5 h-3.5 border-2 border-[var(--ink)] border-t-transparent rounded-full animate-spin" />
                ) : (
                    <MapPin size={16} aria-hidden="true" />
                )}
                <span>Detect GPS Location</span>
              </button>
            </div>

            {/* Success Alert */}
            {locationSuccess && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 flex items-center gap-2.5 animate-in fade-in">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-600 shrink-0">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span className="font-semibold">{locationSuccess}</span>
              </div>
            )}

            {/* Error Alert */}
            {locationError && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2.5 animate-in fade-in">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{locationError}</span>
              </div>
            )}

            <form onSubmit={handleLocationSubmit} className="space-y-6">
              {/* Coordinates row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="profile-latitude" className="block text-xs font-bold text-[var(--ink)] mb-1.5">
                    Latitude
                  </label>
                  <input
                    id="profile-latitude"
                    type="number"
                    step="any"
                    value={lat ?? ''}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setLat(parseFloat(e.target.value) || null)}
                    className="w-full px-4 py-3 bg-white border border-[var(--line)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--gold)]"
                  />
                </div>
                <div>
                  <label htmlFor="profile-longitude" className="block text-xs font-bold text-[var(--ink)] mb-1.5">
                    Longitude
                  </label>
                  <input
                    id="profile-longitude"
                    type="number"
                    step="any"
                    value={lng ?? ''}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setLng(parseFloat(e.target.value) || null)}
                    className="w-full px-4 py-3 bg-white border border-[var(--line)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--gold)]"
                  />
                </div>
              </div>

              {/* Street & City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="profile-street" className="block text-xs font-bold text-[var(--ink)] mb-1.5">
                    Street / Area
                  </label>
                  <input
                    id="profile-street"
                    type="text"
                    value={street}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setStreet(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-[var(--line)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--gold)]"
                  />
                </div>
                <div>
                  <label htmlFor="profile-city" className="block text-xs font-bold text-[var(--ink)] mb-1.5">
                    City / Valley Zone
                  </label>
                  <input
                    id="profile-city"
                    type="text"
                    value={city}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setCity(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-[var(--line)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--gold)]"
                  />
                </div>
              </div>

              {/* Label */}
              <div>
                <label className="block text-xs font-bold text-[var(--ink)] mb-1.5">
                  Address Label
                </label>
                <div className="flex gap-3">
                  {['Home', 'Work', 'Other'].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setLabel(item)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        label === item
                          ? 'bg-[var(--red)] text-white shadow-xs'
                          : 'bg-stone-100 text-[var(--muted)] hover:bg-stone-200'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-[var(--line)] flex justify-end">
                <button
                  type="submit"
                  disabled={savingLocation}
                  className="py-3 px-6 rounded-xl bg-[var(--red)] hover:bg-[#b83b20] active:scale-[0.99] text-white font-bold text-sm tracking-wide shadow-sm transition-all duration-200 disabled:opacity-60 cursor-pointer flex items-center gap-2"
                >
                  {savingLocation ? (
                    <>
                      <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>Updating…</span>
                    </>
                  ) : (
                    <>
                      <span>Save Delivery Location</span>
                      <span>✓</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB: My Orders & Tracking */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-3xl border border-[var(--line)] shadow-sm p-6 sm:p-8 animate-in fade-in space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[var(--line)]">
              <div>
                <h2
                  className="text-xl font-black text-[var(--ink)]"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  Order History & Live Tracking
                </h2>
                <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
                  Track live status updates and view past receipts.
                </p>
              </div>

              <button
                type="button"
                onClick={fetchMyOrders}
                disabled={loadingOrders}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-bold text-stone-700 transition-colors cursor-pointer"
              >
                <RefreshCw size={13} className={loadingOrders ? 'animate-spin text-[var(--red)]' : ''} />
                Refresh
              </button>
            </div>

            {ordersError && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs">
                {ordersError}
              </div>
            )}

            {loadingOrders && orders.length === 0 ? (
              <div className="text-center py-16">
                <RefreshCw size={28} className="animate-spin text-[var(--red)] mx-auto mb-3" />
                <p className="text-xs font-bold text-stone-600">Loading your orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-16 text-stone-400">
                <ShoppingBag size={44} className="mx-auto mb-3 opacity-30" />
                <h4 className="font-bold text-sm text-stone-700">No orders placed yet</h4>
                <p className="text-xs text-stone-400 mt-1">
                  Explore top restaurants in Kathmandu and treat yourself today!
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/restaurant')}
                  className="mt-4 px-5 py-2.5 rounded-xl bg-[var(--red)] text-white text-xs font-bold hover:bg-[#b83b20] transition-colors"
                >
                  Browse Restaurants
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((o) => (
                  <div
                    key={o.id}
                    className="p-5 rounded-2xl border border-stone-200 bg-[#fffdfa] hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2.5">
                        <span className="font-black text-sm text-[var(--red)]">#CH-{o.id}</span>
                        <OrderStatusBadge status={o.status} />
                        <span className="text-xs text-stone-400">
                          {new Date(o.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="font-bold text-base text-stone-900 m-0">
                        {o.restaurant?.name || `Restaurant #${o.restaurant_id}`}
                      </h4>
                      <p className="text-xs text-stone-500 m-0">
                        📍 {o.delivery_address}
                      </p>
                      <p className="text-xs text-stone-600 m-0 pt-1">
                        {o.items?.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                      </p>
                    </div>

                    <div className="flex md:flex-col items-center md:items-end justify-between shrink-0 gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-stone-100">
                      <div className="text-right">
                        <span className="text-[11px] text-stone-400 block">Total</span>
                        <span className="font-black text-base text-stone-900">
                          {formatCurrency(o.total)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setTrackingOrderId(o.id)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--red)] text-white text-xs font-bold hover:bg-[#b83b20] transition-colors shadow-xs cursor-pointer"
                      >
                        <Eye size={14} />
                        Track & Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Account & Preferences */}
        {activeTab === 'account' && (
          <div className="bg-white rounded-3xl border border-[var(--line)] shadow-sm p-6 sm:p-8 animate-in fade-in space-y-6">
            <div>
              <h2
                className="text-xl font-black text-[var(--ink)]"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Account Details & Roles
              </h2>
              <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
                View system account information and partner opportunities.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-stone-50 border border-[var(--line)]">
                <span className="text-xs text-[var(--muted)] block mb-1">User ID</span>
                <span className="font-mono text-sm font-bold text-[var(--ink)]">#{user?.id}</span>
              </div>
              <div className="p-4 rounded-2xl bg-stone-50 border border-[var(--line)]">
                <span className="text-xs text-[var(--muted)] block mb-1">Active Roles</span>
                <span className="font-bold text-sm text-[var(--ink)]">
                  {user?.roles?.join(', ') || 'customer'}
                </span>
              </div>
            </div>

            {/* Partner Upsells */}
            <div className="p-5 rounded-2xl border border-[var(--line)] bg-[var(--sand)]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-sm text-[var(--ink)] m-0">Own a Restaurant in Kathmandu?</h4>
                <p className="text-xs text-[var(--muted)] m-0 mt-0.5">
                  Register your kitchen, manage live menus, and reach thousands of daily eaters.
                </p>
              </div>
              <a
                href="#partner"
                onClick={() => navigate('/')}
                className="shrink-0 px-4 py-2 rounded-xl bg-[var(--red)] text-white text-xs font-bold hover:bg-[#b83b20] transition-colors no-underline"
              >
                Learn More →
              </a>
            </div>

            {/* Logout button */}
            <div className="pt-4 border-t border-[var(--line)] flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-red-600 m-0">Sign Out of Session</p>
                <p className="text-xs text-[var(--muted)] m-0">You can sign back in anytime with your email.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  logout()
                  navigate('/login')
                }}
                className="py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Log Out
              </button>
            </div>
          </div>
        )}

      </div>

      {trackingOrderId && (
        <OrderTrackerModal
          orderId={trackingOrderId}
          onClose={() => setTrackingOrderId(null)}
          onOrderUpdated={() => fetchMyOrders()}
        />
      )}
    </main>
  )
}
