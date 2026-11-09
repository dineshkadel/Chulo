import type { Restaurant } from '../../types/restaurant'
import { RestaurantCard } from '../restaurant/RestaurantCard'

export function RecommendationCarousel({
  restaurants,
  title = 'Recommended for you',
}: {
  restaurants: Restaurant[]
  title?: string
}) {
  if (restaurants.length === 0) return null

  return (
    <section className="my-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[var(--ink)]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          {title}
        </h2>
      </div>
      <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-none">
        {restaurants.map((restaurant) => (
          <div key={restaurant.id} className="w-[280px] shrink-0">
            <RestaurantCard restaurant={restaurant} />
          </div>
        ))}
      </div>
    </section>
  )
}

