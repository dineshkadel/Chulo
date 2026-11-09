import type { Restaurant } from '../../types/restaurant'
import { RestaurantCard } from './RestaurantCard'

interface RestaurantGridProps {
  restaurants: Restaurant[]
  loading?: boolean
}

export function RestaurantGrid({ restaurants, loading = false }: RestaurantGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-2xl border border-[var(--line)] bg-white overflow-hidden animate-pulse">
            <div className="h-[180px] bg-[var(--line)]" />
            <div className="p-4 space-y-3">
              <div className="h-4 rounded bg-[var(--line)] w-3/4" />
              <div className="h-3 rounded bg-[var(--line)] w-1/2" />
              <div className="h-3 rounded bg-[var(--line)] w-1/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {restaurants.map((restaurant) => (
        <RestaurantCard key={restaurant.id} restaurant={restaurant} />
      ))}
    </div>
  )
}

