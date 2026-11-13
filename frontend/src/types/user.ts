export type UserRole = 'customer' | 'admin' | 'delivery_person' | 'restaurant_owner'

export interface Address {
  id?: number
  user_id?: number
  label: string
  street: string
  city: string
  lat: number
  lng: number
  is_default?: boolean
}

export interface UserPreferences {
  favorite_cuisines?: string[]
  spice_level?: 'mild' | 'medium' | 'spicy'
  dietary?: 'veg' | 'non-veg' | 'vegan'
}

export interface User {
  id: number
  email: string
  display_name: string
  roles: string[]
  avatar_url?: string
  phone?: string
  current_lat?: number
  current_lng?: number
  location_updated_at?: string
  created_at?: string
}

export interface AuthResponse {
  user: User
  active_role: string
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

