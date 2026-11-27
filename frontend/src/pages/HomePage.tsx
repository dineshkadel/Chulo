import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, Bike, ChevronLeft, ChevronRight, MapPin, Search, Store } from 'lucide-react'
import type { Route } from '../App'
import { getCategories, getRestaurants } from '../api/restaurants'
import type { FoodCategory, Restaurant } from '../types/restaurant'
import { CategoryCard } from '../components/restaurant/CategoryCard'
import { RestaurantCard } from '../components/restaurant/RestaurantCard'
import { useLocationContext } from '../contexts/LocationContext'

// Foodmandu-style tokens: white surfaces, one strong orange, soft grey lines, rounded cards.
// Scoped on <main> so nothing else in the app is affected.
const theme = {
  '--brand': '#f26b1d',
  '--brand-dark': '#d85a10',
  '--brand-soft': '#fff1e8',
  '--ink': '#222222',
  '--muted': '#6b7280',
  '--line': '#ececec',
  '--bg': '#ffffff',
  '--panel': '#fafafa',
} as React.CSSProperties

function useHomeData(latitude: number, longitude: number) {
  const [categories, setCategories] = useState<FoodCategory[]>([])
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([getCategories(), getRestaurants({ lat: latitude, lng: longitude, sortByDistance: true })])
      .then(([categoryData, restaurantData]) => {
        if (active) {
          setCategories(categoryData)
          setRestaurants(restaurantData)
        }
      })
      .catch((reason: Error) => {
        if (active) setError(reason.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [latitude, longitude])

  return { categories, restaurants, loading, error }
}

// skeletons
function CategorySkeleton() {
  return (
    <div className="flex flex-col items-center gap-2 animate-pulse">
      <div className="w-20 h-20 rounded-full bg-[var(--line)]" />
      <div className="w-12 h-3 rounded bg-[var(--line)]" />
    </div>
  )
}

function RestaurantSkeleton() {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-white overflow-hidden animate-pulse">
      <div className="h-[160px] bg-[var(--line)]" />
      <div className="p-4 space-y-3">
        <div className="h-4 rounded bg-[var(--line)] w-3/4" />
        <div className="h-3 rounded bg-[var(--line)] w-1/2" />
      </div>
    </div>
  )
}

// sections
const HERO_IMAGE =
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=2000&q=80'

function Hero() {
  const [query, setQuery] = useState('')

  return (
    <section className="bg-white pt-[72px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 grid lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[calc(85vh-72px)] py-8">
        <div className="order-2 lg:order-1">
          <h1 className="font-extrabold leading-[1.05] tracking-tight text-[var(--ink)] m-0" style={{ fontSize: 'clamp(40px, 5.5vw, 72px)' }}>
            Good food, delivered fast.
          </h1>
          <p className="text-[var(--muted)] text-base sm:text-lg mt-5 mb-8 max-w-md">
            Order from your favourite local restaurants and track your rider to your door.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const q = query.trim()
              window.location.assign(q ? `/explore?q=${encodeURIComponent(q)}` : '/explore')
            }}
            className="flex items-center bg-white rounded-full border border-[var(--line)] shadow-[0_8px_30px_rgba(0,0,0,0.08)] max-w-[520px] overflow-hidden"
          >
            <span className="pl-5 text-[var(--brand)]">
              <Search size={20} aria-hidden="true" />
            </span>
            <input
              aria-label="Search dishes or restaurants"
              placeholder="Search dishes or restaurants"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 min-w-0 h-14 border-0 outline-none bg-transparent px-3 text-sm text-[var(--ink)]"
            />
            <button className="h-14 px-7 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white font-bold text-sm border-0 cursor-pointer transition-colors">
              Find food
            </button>
          </form>
        </div>

        <div className="order-1 lg:order-2 relative h-[280px] sm:h-[380px] lg:h-[calc(85vh-72px-64px)] min-h-[280px] rounded-3xl overflow-hidden bg-[var(--brand-soft)]">
          <img src={HERO_IMAGE} alt="A table of freshly prepared dishes" className="absolute inset-0 w-full h-full object-cover" fetchPriority="high" />
        </div>
      </div>
    </section>
  )
}

function ActiveOrderSection({ onDismiss }: { onDismiss: () => void }) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-8 pt-6">
      <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--brand)]/30 bg-[var(--brand-soft)] px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-10 h-10 rounded-full bg-[var(--brand)] text-white flex items-center justify-center shrink-0">
            <Bike size={20} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="font-bold text-sm text-[var(--ink)] m-0">Your order is on the way</p>
            <p className="text-xs text-[var(--muted)] m-0">See where your rider is right now.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <a href="#" className="bg-[var(--brand)] text-white text-xs font-bold px-4 py-2 rounded-lg no-underline hover:bg-[var(--brand-dark)] transition-colors">
            Track order
          </a>
          <button onClick={onDismiss} className="bg-transparent border-0 cursor-pointer text-[var(--muted)] hover:text-[var(--ink)] text-xl leading-none" aria-label="Dismiss">
            ×
          </button>
        </div>
      </div>
    </section>
  )
}

function CategoriesSection({ categories, loading }: { categories: FoodCategory[]; loading: boolean }) {
  const railRef = useRef<HTMLDivElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const updateArrows = useCallback(() => {
    const el = railRef.current
    if (!el) return
    setCanPrev(el.scrollLeft > 4)
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    updateArrows()
    window.addEventListener('resize', updateArrows)
    return () => window.removeEventListener('resize', updateArrows)
  }, [categories, loading, updateArrows])

  const scrollByPage = (dir: 1 | -1) => {
    const el = railRef.current
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' })
  }

  const arrow =
    'w-9 h-9 rounded-full border border-[var(--line)] bg-white text-[var(--ink)] flex items-center justify-center cursor-pointer transition-colors hover:bg-[var(--brand)] hover:text-white hover:border-[var(--brand)] disabled:opacity-40 disabled:cursor-default disabled:hover:bg-white disabled:hover:text-[var(--ink)] disabled:hover:border-[var(--line)]'

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-8 pt-10" id="explore">
      <div className="flex items-center justify-between gap-4 mb-5">
        <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--ink)] m-0">What are you craving?</h2>
        <div className="hidden sm:flex gap-2 shrink-0">
          <button type="button" aria-label="Previous categories" disabled={!canPrev} onClick={() => scrollByPage(-1)} className={arrow}>
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <button type="button" aria-label="Next categories" disabled={!canNext} onClick={() => scrollByPage(1)} className={arrow}>
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        ref={railRef}
        onScroll={updateArrows}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="snap-start shrink-0 w-[96px] sm:w-[112px]">
              <CategorySkeleton />
            </div>
          ))
          : categories.map((category) => (
            <div key={category.id} className="snap-start shrink-0 w-[96px] sm:w-[112px]">
              <CategoryCard category={category} href={`/explore?category=${category.id}`} />
            </div>
          ))}
      </div>
    </section>
  )
}

function RestaurantsSection({
  restaurants,
  loading,
  navigate,
  detectLocation,
}: {
  restaurants: Restaurant[]
  loading: boolean
  navigate: (to: Route) => void
  detectLocation: () => Promise<unknown>
}) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-8 pt-12" id="restaurants">
      <div className="flex items-center justify-between mb-5 gap-4">
        <button
          type="button"
          onClick={() => void detectLocation()}
          aria-label="Restaurants near you: use my current location"
          className="group flex items-center gap-2 text-xl sm:text-2xl font-extrabold text-[var(--ink)] hover:text-[var(--brand)] bg-transparent border-0 cursor-pointer p-0 transition-colors"
        >
          Restaurants near you
          <MapPin size={22} className="text-[var(--brand)]" aria-hidden="true" />
        </button>
        <button
          onClick={() => navigate('/restaurant')}
          className="text-sm font-bold text-[var(--brand)] hover:underline whitespace-nowrap shrink-0 border-0 bg-transparent cursor-pointer"
        >
          See all
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <RestaurantSkeleton key={i} />)
          : restaurants.slice(0, 8).map((restaurant) => <RestaurantCard key={restaurant.id} restaurant={restaurant} />)}
      </div>
    </section>
  )
}

function HowItWorksSection() {
  const steps = [
    { title: 'Choose your food', desc: 'Browse restaurants and dishes, then order in a few taps.' },
    { title: 'The kitchen gets cooking', desc: 'The restaurant starts preparing as soon as your order arrives.' },
    { title: 'It arrives at your door', desc: 'A rider brings it straight to you while it is still hot.' },
  ]
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-8 pt-14">
      <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--ink)] mb-6 m-0">How Chulo works</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {steps.map((s, i) => (
          <div key={s.title} className="flex gap-4 items-start rounded-xl bg-[var(--panel)] border border-[var(--line)] p-5">
            <span className="w-9 h-9 rounded-full bg-[var(--brand)] text-white font-bold flex items-center justify-center shrink-0">{i + 1}</span>
            <div>
              <h3 className="font-bold text-[var(--ink)] text-base m-0 mb-1">{s.title}</h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed m-0">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function PartnerSection() {
  const cards = [
    {
      title: 'Become a delivery partner',
      desc: 'Ride when you want, deliver in your area, and earn on every order.',
      cta: 'Start delivering',
      href: '/rider/register',
      icon: Bike,
    },
    {
      title: 'Own a restaurant?',
      desc: 'Reach more customers, manage orders in one place, and grow your business.',
      cta: 'Become a partner',
      href: '/vendor/register',
      icon: Store,
    },
  ]
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-8 py-16" id="partner">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {cards.map(({ title, desc, cta, href, icon: Icon }) => (
          <a
            key={title}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden rounded-3xl bg-[var(--panel)] border border-[var(--line)] p-8 sm:p-10 min-h-[260px] flex flex-col justify-between no-underline text-[var(--ink)] hover:border-[var(--brand)] transition-colors"
          >
            <Icon size={120} strokeWidth={1.2} className="absolute -right-4 -bottom-4 text-[var(--brand)]/10" aria-hidden="true" />
            <div className="relative max-w-xs">
              <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight m-0 mb-3">{title}</h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed m-0">{desc}</p>
            </div>
            <span className="relative mt-8 inline-flex items-center gap-2 self-start rounded-full bg-[var(--ink)] group-hover:bg-[var(--brand)] text-white text-sm font-bold px-5 py-3 transition-colors">
              {cta}
              <ArrowRight size={16} aria-hidden="true" />
            </span>
          </a>
        ))}
      </div>
    </section>
  )
}

// main
export function HomePage({ navigate }: { navigate: (to: Route) => void }) {
  const { coordinates, detectLocation } = useLocationContext()
  const { categories, restaurants, loading, error } = useHomeData(coordinates.latitude, coordinates.longitude)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const hasToken = Boolean(localStorage.getItem('token'))

  return (
    <main id="top" className="overflow-x-hidden bg-[var(--bg)] text-[var(--ink)]" style={theme}>
      <Hero />
      {hasToken && !bannerDismissed && <ActiveOrderSection onDismiss={() => setBannerDismissed(true)} />}
      {error && (
        <p className="max-w-7xl mx-auto px-4 sm:px-8 pt-4 text-red-600 font-semibold text-sm" role="alert">
          {error}
        </p>
      )}
      <CategoriesSection categories={categories} loading={loading} />
      <RestaurantsSection restaurants={restaurants} loading={loading} navigate={navigate} detectLocation={detectLocation} />
      <HowItWorksSection />
      <PartnerSection />
    </main>
  )
}