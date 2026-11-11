import { request } from './client'
import type { FoodCategory, Restaurant, MenuItem } from '../types/restaurant'

export async function getCategories(): Promise<FoodCategory[]> {
  return request<FoodCategory[]>('/food-categories')
}

export async function getRestaurants(options?: { lat?: number; lng?: number; sortByDistance?: boolean }): Promise<Restaurant[]> {
	const params = new URLSearchParams()
	if (options?.lat !== undefined && options?.lng !== undefined) {
		params.set('lat', String(options.lat))
		params.set('lng', String(options.lng))
		if (options.sortByDistance) params.set('sort', 'distance')
	}
	const query = params.toString()
	return request<Restaurant[]>(`/restaurants${query ? `?${query}` : ''}`)
}

export async function getRestaurantById(id: number): Promise<Restaurant> {
  return request<Restaurant>(`/restaurants/${id}`)
}

export async function getMenuItems(restaurantId: number): Promise<MenuItem[]> {
  return request<MenuItem[]>(`/restaurants/${restaurantId}/menu-items`)
}

