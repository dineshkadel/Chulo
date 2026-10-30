export type ApiEnvelope<T> = { data?: T; error?: { message?: string } }

//  backend/internal/models/FoodCategory.
export type FoodCategory = { id: number; name: string; image?: string }

// backend/internal/dto/restaurant_dto.go.
export type Restaurant = {
  id: number; name: string; description?: string; cuisine_types?: string; price_tier: number
  address?: string; hero_image_url?: string; avg_rating: number; review_count: number; is_open: boolean
}

async function request<T>(path: string): Promise<T> {
  const response = await fetch(path)
  const payload: ApiEnvelope<T> = await response.json().catch(() => ({}))
  if (!response.ok || !payload.data) throw new Error(payload.error?.message || 'Could not load homepage data.')
  return payload.data
}

export const getCategories = () => request<FoodCategory[]>('/api/v1/food-categories')
export const getRestaurants = () => request<Restaurant[]>('/api/v1/restaurants')
