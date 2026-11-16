
import { getMenuItems, getRestaurants } from './restaurants'
import type { MenuItem } from '../types/restaurant'

export interface ExploreMenuItem extends MenuItem {
  restaurantName: string
}

export interface FoodItemParams {
  categoryId?: string
  restaurantId?: string
  q?: string
  limit?: number
}

// Cached for the session so changing a filter doesn't refetch every menu.
let catalogPromise: Promise<ExploreMenuItem[]> | null = null

async function loadCatalog(): Promise<ExploreMenuItem[]> {
  const restaurants = await getRestaurants()
  const menus = await Promise.all(restaurants.map(async (restaurant) => {
    try {
      const items = await getMenuItems(restaurant.id)
      return items.filter((item) => item.is_available).map((item) => ({ ...item, restaurantName: restaurant.name }))
    } catch {
      return [] as ExploreMenuItem[]
    }
  }))
  return menus.flat()
}

export async function getFoodItems(params: FoodItemParams = {}): Promise<ExploreMenuItem[]> {
    catalogPromise ??= loadCatalog().catch((e) => {
        catalogPromise = null
        throw e
    })
  let items = await catalogPromise

  if (params.categoryId) items = items.filter((item) => String(item.food_category_id ?? item.category_id) === params.categoryId)
  if (params.restaurantId) items = items.filter((item) => String(item.restaurant_id) === params.restaurantId)
  if (params.q) {
    const query = params.q.toLowerCase()
    items = items.filter((item) => item.name.toLowerCase().includes(query) || item.description?.toLowerCase().includes(query))
  }
  return params.limit ? items.slice(0, params.limit) : items
}
