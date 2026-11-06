import { useEffect, useState, type ReactNode } from 'react'
import { Bike, MapPin, Soup, Store } from 'lucide-react'
import type { Route } from '../App'
import { getCategories, getRestaurants } from '../api/restaurants'
import type { FoodCategory, Restaurant } from '../types/restaurant'
import { CategoryCard } from '../components/restaurant/CategoryCard'
import { RestaurantCard } from '../components/restaurant/RestaurantCard'
import { useLocationContext } from '../contexts/LocationContext'

const serif = { fontFamily: "'Playfair Display', Georgia, serif" }

// data 
const steps: { title: string; desc: string; icon: ReactNode }[] = [
  {
    title: 'Choose your food',
    desc: 'Browse restaurants and dishes, then place your order in a few taps.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    ),
  },
  {
    title: 'The kitchen gets cooking',
    desc: 'The restaurant starts preparing your meal as soon as your order comes in.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
  },
  {
    title: 'It arrives at your door',
    desc: 'A rider picks it up and brings it straight to you while it is still hot.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
]

//data loading
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

// section of homepage 
function CategorySkeleton() {
  return (
    <div className="flex flex-col items-center gap-3 p-5 rounded-2xl border border-[var(--line)] bg-white animate-pulse">
      <div className="w-14 h-14 rounded-full bg-[var(--line)]" />
      <div className="w-12 h-3 rounded bg-[var(--line)]" />
    </div>
  )
}

function RestaurantSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white overflow-hidden animate-pulse">
      <div className="h-[180px] bg-[var(--line)]" />
      <div className="p-4 space-y-3">
        <div className="h-4 rounded bg-[var(--line)] w-3/4" />
        <div className="h-3 rounded bg-[var(--line)] w-1/2" />
        <div className="h-3 rounded bg-[var(--line)] w-1/3" />
      </div>
    </div>
  )
}

function Hero({ detectLocation }: { detectLocation: () => Promise<unknown> }) {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-[var(--sand)] via-[hsl(36_60%_94%)] to-[var(--cream)] pt-[72px]">
      <div className="absolute top-[10%] right-[5%] w-[500px] h-[500px] rounded-full bg-[var(--gold)]/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-[15%] w-[300px] h-[300px] rounded-full bg-[var(--red)]/8 blur-2xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 sm:px-10 w-full grid lg:grid-cols-2 gap-12 lg:gap-6 items-center py-16 lg:py-24">
        <div className="relative z-10">
          <h1
            className="font-black leading-[0.95] tracking-tight mb-6 text-[var(--ink)]"
            style={{ ...serif, fontSize: 'clamp(48px, 6vw, 80px)' }}
          >
            Good food is closer than you think.
          </h1>


          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex items-center bg-white rounded-md shadow-[0_8px_32px_hsl(36_20%_20%/0.12)] max-w-[480px] overflow-hidden border border-[var(--line)]"
          >
            <span className="pl-4 text-[var(--muted)]">
              <MapPin size={20} aria-hidden="true" />
            </span>
            <input
              aria-label="Delivery address"
              placeholder="Enter your delivery address"
              className="flex-1 h-14 border-0 outline-none bg-transparent px-3 text-sm text-[var(--ink)]"
            />
            <button
              aria-label="Find food near this address"
              className="h-14 px-5 bg-[var(--red)] text-white font-bold text-sm border-0 cursor-pointer hover:bg-[hsl(14_75%_40%)] transition-colors"
            >
              Find food
            </button>
          </form>

          <button onClick={() => void detectLocation()} className="mt-4 flex items-center gap-2 text-xs font-semibold text-[var(--muted)] hover:text-[var(--red)] transition-colors bg-transparent border-0 cursor-pointer p-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Use my current location
          </button>
        </div>

        {/* Decorative illustration */}
        <div className="relative hidden lg:flex items-center justify-center min-h-[420px]" aria-hidden="true">
          <div className="absolute w-72 h-72 rounded-full bg-[var(--gold)]/25 top-0 right-12" />
          <div
            className="absolute bottom-0 left-0 right-0 h-48 bg-[var(--red)]"
            style={{ clipPath: 'polygon(0 100%,18% 20%,35% 70%,52% 0%,70% 65%,86% 22%,100% 100%)' }}
          />
          <div className="relative z-10 w-52 h-52 rounded-full bg-[var(--sand)] border-8 border-white shadow-[0_20px_60px_hsl(14_75%_30%/0.25)] flex items-center justify-center">
            <Soup size={96} strokeWidth={1.5} className="text-[var(--red)]" />
          </div>
        </div>
      </div>
    </section>
  )
}
function ActiveOrderSection({ onDismiss }: { onDismiss: () => void }) {
  return (
    <section className="px-6 sm:px-10 max-w-7xl mx-auto pt-10">
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--line)] bg-white px-5 py-4 shadow-[0_4px_20px_hsl(36_20%_20%/0.06)]">
        <div className="flex items-center gap-4 min-w-0">
          <span className="w-11 h-11 rounded-xl bg-[var(--red)]/10 text-[var(--red)] flex items-center justify-center shrink-0">
            <Bike size={22} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="font-bold text-sm text-[var(--ink)] m-0">You have an order on the way</p>
            <p className="text-xs text-[var(--muted)] m-0">See where your rider is right now.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <a
            href="#"
            className="bg-[var(--red)] text-white text-xs font-bold px-4 py-2.5 rounded-lg no-underline hover:bg-[hsl(14_75%_40%)] transition-colors"
          >
            Track order
          </a>
          <button
            onClick={onDismiss}
            className="bg-transparent border-0 cursor-pointer text-[var(--muted)] hover:text-[var(--ink)] text-xl leading-none"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      </div>
    </section>
  )
}
function CategoriesSection({ categories, loading }: { categories: FoodCategory[]; loading: boolean }) {
  return (
    <section className="py-20 px-6 sm:px-10 max-w-7xl mx-auto" id="explore">
      <h2 className="mb-8 text-3xl sm:text-4xl font-black tracking-tight text-[var(--ink)]" style={serif}>
        What are you craving?
      </h2>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <CategorySkeleton key={i} />)
          : categories.map((category) => <CategoryCard key={category.id} category={category} />)}
      </div>
    </section>
  )
}

function RestaurantsSection({ restaurants, loading, navigate }: { restaurants: Restaurant[]; loading: boolean; navigate: (to: Route) => void }) {
  return (
    <section className="py-20 px-6 sm:px-10 max-w-7xl mx-auto" id="restaurants">
      <div className="flex items-end justify-between mb-8 gap-4">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--ink)]" style={serif}>
          Restaurants near you
        </h2>
        <button onClick={() => navigate('/restaurant')} className="text-sm font-bold text-[var(--red)] no-underline hover:underline whitespace-nowrap shrink-0 border-0 bg-transparent cursor-pointer">
          See all
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <RestaurantSkeleton key={i} />)
          : restaurants.slice(0, 6).map((restaurant) => <RestaurantCard key={restaurant.id} restaurant={restaurant} />)}
      </div>
    </section>
  )
}

function HowItWorksSection() {
  return (
    <section className="py-20 bg-[var(--sand)]">
      <div className="max-w-7xl mx-auto px-6 sm:px-10">
        <h2 className="text-center mb-14 text-3xl sm:text-4xl font-black tracking-tight text-[var(--ink)]" style={serif}>
          How Chulo works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={step.title} className="relative flex flex-col items-center text-center">
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[calc(50%+48px)] right-0 h-px border-t-2 border-dashed border-[var(--gold)]/40" />
              )}
              <div className="w-20 h-20 rounded-2xl bg-white border border-[var(--line)] flex items-center justify-center text-[var(--red)] shadow-[0_4px_20px_hsl(36_20%_20%/0.08)] mb-5">
                {step.icon}
              </div>
              <span className="text-sm font-bold text-[var(--muted)] mb-2">Step {i + 1}</span>
              <h3 className="font-bold text-[var(--ink)] text-lg mb-2">{step.title}</h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed max-w-[260px]">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function PartnerSection({ navigate }: { navigate: (to: Route) => void }) {
  return (
    <section className="bg-[var(--red)] py-20 px-6 sm:px-10 relative overflow-hidden" id="partner">
      <div className="absolute top-[-60px] right-[-60px] w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute bottom-[-80px] left-[10%] w-80 h-80 rounded-full bg-black/10 pointer-events-none" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center relative z-10">
        <div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-5 leading-tight" style={serif}>
            Own a restaurant? Sell on Chulo.
          </h2>
          <p className="text-white/75 text-base leading-relaxed max-w-md mb-8">
            Reach more customers, manage your orders in one place, and grow your business.
          </p>
          <button
            onClick={() => navigate('/vendor/register')}
            className="bg-white text-[var(--red)] font-bold px-7 py-4 rounded-sm border-0 cursor-pointer hover:-translate-y-0.5 transition-transform shadow-[0_8px_24px_hsl(0_0%_0%/0.2)] text-sm"
          >
            Become a partner
          </button>
        </div>

        <div className="hidden lg:flex items-center justify-center" aria-hidden="true">
          <div className="w-56 h-56 border-[3px] border-[var(--gold)] flex items-center justify-center">
            <Store size={72} strokeWidth={1.5} className="text-[var(--gold)]" />
          </div>
        </div>
      </div>
    </section>
  )
}

function AboutSection() {
  return (
    <section className="py-20 px-6 sm:px-10 bg-[var(--ink)] text-white" id="story">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        <h2 className="text-3xl sm:text-4xl font-black leading-tight" style={serif}>
          Made to help you enjoy local food.
        </h2>

        <div>
          <p className="text-white/70 leading-relaxed text-base mb-4">
            Chulo makes it easy to find a favourite, try something new, and support the local restaurants around you.
          </p>
          <a href="#" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--gold)] no-underline hover:underline">
            Read our story
          </a>
        </div>
      </div>
    </section>
  )
}

//main combine homepage
export function HomePage({ navigate }: { navigate: (to: Route) => void }) {
  const { coordinates, detectLocation } = useLocationContext()
  const { categories, restaurants, loading, error } = useHomeData(coordinates.latitude, coordinates.longitude)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const hasToken = Boolean(localStorage.getItem('token'))

  return (
    <main id="top" className="overflow-x-hidden">
      <Hero detectLocation={detectLocation} />
       {hasToken && !bannerDismissed && <ActiveOrderSection onDismiss={() => setBannerDismissed(true)} />}
      {error && (
        <p className="max-w-7xl mx-auto px-6 py-4 text-red-600 font-semibold text-sm" role="alert">
          {error}
        </p>
      )}

      <CategoriesSection categories={categories} loading={loading} />
      <RestaurantsSection restaurants={restaurants} loading={loading} navigate={navigate} />
      <HowItWorksSection />
      <PartnerSection navigate={navigate} />
      <AboutSection />
    </main>
  )
}
