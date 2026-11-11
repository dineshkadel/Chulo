export type RestaurantAuthPayload = {
  restaurant: {
    id: number
    name: string
    email: string
    address?: string
  }
  access_token: string
  refresh_token: string
}

type ApiEnvelope<T> = {
  data?: T
  error?: { message?: string; detail?: string }
}

async function restaurantAuth<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`/api/v1/restaurants/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const result: ApiEnvelope<T> = await response.json().catch(() => ({}))

  if (!response.ok || !result.data) {
    throw new Error(result.error?.detail || result.error?.message || 'Unable to complete your request.')
  }
  return result.data
}

export function registerRestaurant(payload: {
  name: string
  email: string
  password: string
  phone: string
  address: string
  description: string
  cuisine_types: string
  price_tier: number
  lat: number
  lng: number
}) {
  return restaurantAuth<RestaurantAuthPayload>('register', payload)
}

export function loginRestaurant(email: string, password: string) {
  return restaurantAuth<RestaurantAuthPayload>('login', { email, password })
}

export function saveRestaurantSession(session: RestaurantAuthPayload) {
  localStorage.setItem('restaurant_access_token', session.access_token)
  localStorage.setItem('restaurant_refresh_token', session.refresh_token)
  localStorage.setItem('restaurant_portal', JSON.stringify(session.restaurant))
}
