import { useEffect, useState } from 'react'
import { Store } from 'lucide-react'
import type { Route } from '../App'
import { getRestaurants } from '../api/restaurants'
import { RestaurantGrid } from '../components/restaurant/RestaurantGrid'
import type { Restaurant } from '../types/restaurant'
import { useLocationContext } from '../contexts/LocationContext'

export function RestaurantListPage({ navigate }: { navigate: (to: Route) => void }) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { coordinates, detectLocation, isLoadingLocation } = useLocationContext()

  useEffect(() => {
    getRestaurants({ lat: coordinates.latitude, lng: coordinates.longitude, sortByDistance: true })
      .then(setRestaurants)
      .catch(() => setError('We could not load restaurants right now. Please try again shortly.'))
      .finally(() => setLoading(false))
  }, [coordinates.latitude, coordinates.longitude])

  return (
    <main className="min-h-screen bg-[#fffaf4]">
      <section className="border-b border-[#eadfd2] bg-[#fff0dc] px-6 py-16 sm:px-10">
        <div className="mx-auto max-w-7xl">
          <p className="m-0 text-xs font-bold uppercase tracking-[.18em] text-[var(--red)]">Discover local food</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
            <div><h1 className="m-0 font-[family-name:var(--display)] text-4xl sm:text-5xl">Restaurants near you</h1><p className="mb-0 mt-3 max-w-xl text-stone-600">Explore local kitchens, favourite dishes, and new places to try.</p></div>
            <div className="flex flex-wrap gap-3"><button onClick={() => void detectLocation()} className="rounded-xl border border-[var(--red)] bg-white px-5 py-3 text-sm font-bold text-[var(--red)]">{isLoadingLocation ? 'Locating…' : 'Use my location'}</button><button onClick={() => navigate('/vendor/register')} className="flex items-center gap-2 rounded-xl bg-[var(--red)] px-5 py-3 text-sm font-bold text-white"><Store size={17} />List your restaurant</button></div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 py-10 sm:px-10"><p className="mb-6 text-sm font-bold text-stone-500">{loading ? 'Finding great places...' : `${restaurants.length} restaurants available`}</p>{error ? <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : <RestaurantGrid restaurants={restaurants} loading={loading} />}</section>
    </main>
  )
}
