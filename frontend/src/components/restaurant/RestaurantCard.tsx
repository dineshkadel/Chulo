import type { Restaurant } from '../../types/restaurant'

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill={i <= Math.round(rating) ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          className={i <= Math.round(rating) ? 'text-[var(--gold)]' : 'text-[var(--line)]'}
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </span>
  )
}

function PriceTier({ tier }: { tier: number }) {
  const clamped = Math.min(Math.max(tier, 0), 4)
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={`text-xs font-bold ${i <= clamped ? 'text-[var(--gold)]' : 'text-[var(--line)]'}`}
        >
          
        </span>
      ))}
    </span>
  )
}

// Gradient placeholder colours per first letter
const gradients = [
  'from-orange-400 to-red-500',
  'from-amber-400 to-orange-500',
  'from-red-400 to-pink-500',
  'from-yellow-400 to-amber-500',
  'from-rose-400 to-red-600',
]

export function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const gradientIndex = restaurant.name.charCodeAt(0) % gradients.length

  return (
    <a href={`/restaurant/${restaurant.id}`} className="group bg-white rounded-2xl border border-[var(--line)] overflow-hidden shadow-sm hover:shadow-xl hover:border-[var(--gold)]/50 transition-all duration-300 hover:scale-[1.02] flex flex-col cursor-pointer no-underline">
      {/* Image / Hero area */}
      <div className="relative h-[180px] w-full overflow-hidden bg-[var(--sand)]">
        {restaurant.hero_image_url ? (
          <img
            src={restaurant.hero_image_url}
            alt={restaurant.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${gradients[gradientIndex]} flex items-center justify-center`}
          >
            <span
              className="font-black text-6xl text-white/30 select-none"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              {restaurant.name.slice(0, 1)}
            </span>
          </div>
        )}

        {/* Open / Closed badge */}
        <span
          className={[
            'absolute top-3 right-3 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm backdrop-blur-sm',
            restaurant.is_open
              ? 'bg-emerald-500/90 text-white'
              : 'bg-stone-800/80 text-stone-300',
          ].join(' ')}
        >
          {restaurant.is_open ? '● Open' : 'Closed'}
        </span>
      </div>

      {/* Card Body */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          {/* Header row: Name + Rating */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3
              className="font-bold text-base text-[var(--ink)] leading-snug group-hover:text-[var(--red)] transition-colors line-clamp-1"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              {restaurant.name}
            </h3>
            <div className="flex items-center gap-1 shrink-0 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              <StarRating rating={restaurant.avg_rating} />
              <span className="text-xs font-bold text-[var(--ink)]">
                {restaurant.avg_rating > 0 ? restaurant.avg_rating.toFixed(1) : 'New'}
              </span>
            </div>
          </div>

          {/* Cuisine tags */}
          <p className="text-xs font-medium text-[var(--muted)] m-0 line-clamp-1">
            {restaurant.cuisine_types || 'Multi-cuisine, Local'}
          </p>
        </div>

        {/* Footer row: Price tier + distance */}
        <div className="flex items-center justify-between text-xs text-[var(--muted)] pt-2 border-t border-[var(--line)]/60">
          <div className="flex items-center gap-1.5">
            <span className="text-stone-400">Price:</span>
            <PriceTier tier={restaurant.price_tier} />
          </div>
          <div className="flex items-center gap-1 text-[11px] max-w-[145px] truncate text-stone-400">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
            <span className="truncate">{restaurant.distance_km !== undefined ? `${restaurant.distance_km.toFixed(1)} km away` : restaurant.address || 'Kathmandu'}</span>
          </div>
        </div>
      </div>
    </a>
  )
}

