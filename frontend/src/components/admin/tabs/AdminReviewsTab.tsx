import { useState } from 'react'
import {
  Eye,
  EyeOff,
  Search,
  Star,
} from 'lucide-react'

interface ReviewRecord {
  id: number
  customer_name: string
  restaurant_name: string
  rating: number
  comment: string
  created_at: string
  is_visible: boolean
}

const INITIAL_REVIEWS: ReviewRecord[] = [
  { id: 1, customer_name: 'Sanjay Karki', restaurant_name: 'Himalayan Momo Ghar', rating: 5, comment: 'The jhol momo was freshly steamed, spicy and authentic! Delivery was also prompt.', created_at: '2026-11-15', is_visible: true },
  { id: 2, customer_name: 'Riya Sharma', restaurant_name: 'Thakali Kitchen Hub', rating: 5, comment: 'Best Thakali set in town. Generous ghee, delicious dal and perfect mutton curry.', created_at: '2026-11-14', is_visible: true },
  { id: 3, customer_name: 'Bikash Rai', restaurant_name: 'Bawarchi Biryani House', rating: 4, comment: 'Good packaging, piping hot biryani. Could add more raita though.', created_at: '2026-11-13', is_visible: true },
  { id: 4, customer_name: 'Prashant Subedi', restaurant_name: 'Kathmandu Pizza Co.', rating: 2, comment: 'Pizza arrived cold and the crust was a bit soggy. Expected better for the price.', created_at: '2026-11-12', is_visible: true },
  { id: 5, customer_name: 'Alisha Tuladhar', restaurant_name: 'Newari Khaja Ghar', rating: 5, comment: 'Authentic choila and chatamari. Loved the quick delivery by the rider.', created_at: '2026-11-11', is_visible: true },
]

export function AdminReviewsTab() {
  const [reviews, setReviews] = useState<ReviewRecord[]>(INITIAL_REVIEWS)
  const [search, setSearch] = useState('')
  const [ratingFilter, setRatingFilter] = useState<number | 0>(0)

  const toggleVisibility = (id: number) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_visible: !r.is_visible } : r))
    )
  }

  const filtered = reviews.filter((r) => {
    const matchRating = ratingFilter === 0 || r.rating === ratingFilter
    const matchSearch =
      r.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      r.restaurant_name.toLowerCase().includes(search.toLowerCase()) ||
      r.comment.toLowerCase().includes(search.toLowerCase())
    return matchRating && matchSearch
  })

  return (
    <div className="space-y-6">
      {/* Platform rating score overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-[var(--red)] p-6 text-white shadow-md">
          <p className="m-0 text-xs font-bold uppercase tracking-wider text-orange-200">
            Average Platform Rating
          </p>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="text-5xl font-black">4.7</span>
            <span className="text-sm text-orange-200">/ 5.0</span>
          </div>
          <div className="mt-2 flex gap-1 text-amber-300">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={18} fill="currentColor" />
            ))}
          </div>
          <p className="mt-4 text-xs text-orange-100/80">Based on 480+ customer reviews</p>
        </div>

        <div className="sm:col-span-2 rounded-2xl border border-[#eadfd2] bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="m-0 text-base font-bold text-[var(--ink)]">Ratings Distribution</h3>
            <p className="m-0 text-xs text-stone-500">Customer sentiment breakdown across partner vendors</p>
          </div>
          <div className="mt-4 space-y-2 text-xs">
            <div className="flex items-center gap-3">
              <span className="w-12 font-bold text-stone-600">5 stars</span>
              <div className="h-2 flex-1 rounded-full bg-stone-100 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '78%' }} />
              </div>
              <span className="w-8 text-right font-semibold text-stone-400">78%</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-12 font-bold text-stone-600">4 stars</span>
              <div className="h-2 flex-1 rounded-full bg-stone-100 overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '14%' }} />
              </div>
              <span className="w-8 text-right font-semibold text-stone-400">14%</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-12 font-bold text-stone-600">3 stars</span>
              <div className="h-2 flex-1 rounded-full bg-stone-100 overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '5%' }} />
              </div>
              <span className="w-8 text-right font-semibold text-stone-400">5%</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-12 font-bold text-stone-600">1-2 stars</span>
              <div className="h-2 flex-1 rounded-full bg-stone-100 overflow-hidden">
                <div className="h-full bg-red-400 rounded-full" style={{ width: '3%' }} />
              </div>
              <span className="w-8 text-right font-semibold text-stone-400">3%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Moderation Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="m-0 text-lg font-bold text-[var(--ink)]">Review Moderation Feed</h2>
          <p className="m-0 text-xs text-stone-500">Inspect customer feedback and manage public visibility</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="search"
              placeholder="Filter reviews by restaurant, user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-60 sm:w-64 rounded-xl border border-stone-200 bg-white pl-9 pr-3 text-xs focus:border-[var(--red)] focus:outline-none shadow-xs"
            />
          </div>

          <div className="flex items-center rounded-xl border border-stone-200 bg-white p-1 text-xs font-semibold shadow-xs">
            <button
              onClick={() => setRatingFilter(0)}
              className={`rounded-lg px-2.5 py-1 transition-colors cursor-pointer ${
                ratingFilter === 0 ? 'bg-[var(--red)] text-white' : 'text-stone-600 hover:text-[var(--ink)]'
              }`}
            >
              All
            </button>
            {[5, 4, 3, 2, 1].map((r) => (
              <button
                key={r}
                onClick={() => setRatingFilter(r)}
                className={`rounded-lg px-2 py-1 transition-colors cursor-pointer ${
                  ratingFilter === r ? 'bg-[var(--red)] text-white' : 'text-stone-600 hover:text-[var(--ink)]'
                }`}
              >
                {r}★
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="grid gap-4">
        {filtered.map((rev) => (
          <div
            key={rev.id}
            className={`rounded-2xl border bg-white p-5 shadow-xs transition-opacity ${
              rev.is_visible ? 'border-[#eadfd2]' : 'border-stone-200 opacity-60 bg-stone-50'
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <strong className="text-sm text-[var(--ink)]">{rev.customer_name}</strong>
                  <span className="text-stone-300">·</span>
                  <span className="text-xs text-stone-500 font-medium">reviewed</span>
                  <strong className="text-xs text-[var(--red)]">{rev.restaurant_name}</strong>
                </div>
                <div className="mt-1 flex items-center gap-1 text-amber-500">
                  {Array.from({ length: rev.rating }).map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" />
                  ))}
                  <span className="ml-2 text-[11px] text-stone-400">{rev.created_at}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleVisibility(rev.id)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                    rev.is_visible
                      ? 'border border-stone-200 text-stone-600 hover:bg-stone-100'
                      : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                  }`}
                >
                  {rev.is_visible ? (
                    <>
                      <EyeOff size={13} /> Hide from public
                    </>
                  ) : (
                    <>
                      <Eye size={13} /> Unhide review
                    </>
                  )}
                </button>
              </div>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-stone-700 bg-[#fffaf4] p-3 rounded-xl border border-stone-100">
              "{rev.comment}"
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
