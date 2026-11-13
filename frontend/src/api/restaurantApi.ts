/**
 * Restaurant-authenticated API layer.
 * All calls send: Authorization: Bearer <restaurant_access_token>
 */

import type { MenuItem } from '../types/restaurant'

// ─── helpers ────────────────────────────────────────────────────────────────

function getToken(): string {
  return localStorage.getItem('restaurant_access_token') ?? ''
}

export function getMyRestaurantId(): number | null {
  try {
    const raw = localStorage.getItem('restaurant_portal')
    if (!raw) return null
    const parsed = JSON.parse(raw) as { id?: number }
    return parsed.id ?? null
  } catch {
    return null
  }
}

function authHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed: ${res.status}`
    try {
      const body = await res.json()
      message = body?.message ?? body?.error ?? message
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }
  return res.json() as Promise<T>
}

// ─── Restaurant profile ─────────────────────────────────────────────────────

export interface RestaurantProfile {
  id: number
  email: string
  name: string
  description?: string
  cuisine_types?: string
  price_tier: number
  lat: number
  lng: number
  address?: string
  phone?: string
  operating_hours?: string
  hero_image_url?: string
  dietary_tags?: string
  avg_rating: number
  review_count: number
  is_active: boolean
  created_at: string
}

export interface RestaurantProfileUpdatePayload {
  name: string
  description?: string
  cuisine_types?: string
  price_tier: number
  lat: number
  lng: number
  address?: string
  phone?: string
  operating_hours?: string
  hero_image_url?: string
  dietary_tags?: string
}

export async function getRestaurantMe(): Promise<RestaurantProfile> {
  const res = await fetch('/api/v1/restaurants/me', {
    headers: authHeaders(),
  })
  return handleResponse<RestaurantProfile>(res)
}

export async function updateRestaurantMe(
  payload: RestaurantProfileUpdatePayload,
): Promise<RestaurantProfile> {
  const res = await fetch('/api/v1/restaurants/me', {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
  return handleResponse<RestaurantProfile>(res)
}

// ─── Menu items ─────────────────────────────────────────────────────────────

export interface MenuItemPayload {
  food_category_id: number
  name: string
  description?: string
  price: number
  dietary_tags?: string
  is_available?: boolean
}

/** Public endpoint – no auth needed, but we pass it anyway (harmless). */
export async function getMyMenuItems(): Promise<MenuItem[]> {
  const id = getMyRestaurantId()
  if (!id) throw new Error('Restaurant ID not found in session')
  const res = await fetch(`/api/v1/restaurants/${id}/menu-items`)
  return handleResponse<MenuItem[]>(res)
}

export async function createMenuItem(payload: MenuItemPayload): Promise<MenuItem> {
  const res = await fetch('/api/v1/restaurants/menu-items', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
  return handleResponse<MenuItem>(res)
}

export async function updateMenuItem(
  id: number,
  payload: Partial<MenuItemPayload>,
): Promise<MenuItem> {
  const res = await fetch(`/api/v1/restaurants/menu-items/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
  return handleResponse<MenuItem>(res)
}

export async function deleteMenuItem(id: number): Promise<void> {
  const res = await fetch(`/api/v1/restaurants/menu-items/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!res.ok && res.status !== 204) {
    throw new Error(`Delete failed: ${res.status}`)
  }
}

export async function toggleMenuItemAvailability(
  id: number,
  isAvailable: boolean,
): Promise<MenuItem> {
  return updateMenuItem(id, { is_available: isAvailable })
}

// ─── Food categories ─────────────────────────────────────────────────────────

export interface FoodCategory {
  id: number
  name: string
  image?: string
}

export async function getMyFoodCategories(): Promise<FoodCategory[]> {
  // Categories are global (GET /api/v1/food-categories) – no auth required
  const res = await fetch('/api/v1/food-categories')
  if (res.status === 404) return []
  return handleResponse<FoodCategory[]>(res)
}

export async function createFoodCategory(name: string): Promise<FoodCategory> {
  const res = await fetch('/api/v1/restaurants/food-categories', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ name }),
  })
  return handleResponse<FoodCategory>(res)
}
