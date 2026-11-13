export interface FoodCategory {
  id: number
  name: string
  image?: string
}

export interface MenuItem {
  id: number
  restaurant_id: number
  name: string
  description?: string
  price: number
  image_url?: string
  category_id?: number
  is_available: boolean
}

export interface MenuCategory {
  id: number
  name: string
  items: MenuItem[]
}

export interface Restaurant {
  id: number
  name: string
  description?: string
  cuisine_types?: string
  price_tier: number
  address?: string
  hero_image_url?: string
  avg_rating: number
  review_count: number
  is_open: boolean
  lat?: number
  lng?: number
  distance_km?: number
}

