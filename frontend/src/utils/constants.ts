export const APP_NAME = 'Chulo'
export const API_BASE_URL = '/api/v1'

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  TOKEN: 'token',
  USER: 'user',
  CART: 'chulo_cart',
  LOCATION: 'chulo_location',
} as const

// Kathmandu Valley center coordinates
export const DEFAULT_COORDINATES = {
  latitude: 27.7172,
  longitude: 85.324,
  cityName: 'Kathmandu',
} as const

