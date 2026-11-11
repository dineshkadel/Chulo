import { request } from './client'
import type { Restaurant } from '../types/restaurant'

export async function getRecommendations(lat?: number, lng?: number): Promise<Restaurant[]> {
  const query = lat !== undefined && lng !== undefined ? `?lat=${lat}&lng=${lng}` : ''
  return request<Restaurant[]>(`/restaurants${query}`)
}

