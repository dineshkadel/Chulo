import { request } from './client'

export interface AdminCustomerItem {
  id: number
  email: string
  display_name: string
  phone?: string
  roles: string[]
  avatar_url?: string
  is_active: boolean
  orders_count: number
  total_spent: number
  created_at: string
}

export interface AdminCustomerListResponse {
  customers: AdminCustomerItem[]
  total: number
  page: number
  limit: number
}

export interface AddressItem {
  id: number
  label: string
  street: string
  city: string
  lat: number
  lng: number
  is_default: boolean
}

export interface AdminCustomerDetailResponse extends AdminCustomerItem {
  addresses: AddressItem[]
}

export interface GetAdminCustomersParams {
  search?: string
  status?: string
  role?: string
  page?: number
  limit?: number
}

/**
 * Fetch paginated customers for admin management.
 */
export async function getAdminCustomers(
  params: GetAdminCustomersParams = {}
): Promise<AdminCustomerListResponse> {
  const q = new URLSearchParams()
  if (params.search) q.append('search', params.search)
  if (params.status && params.status !== 'all') q.append('status', params.status)
  if (params.role && params.role !== 'all') q.append('role', params.role)
  if (params.page) q.append('page', String(params.page))
  if (params.limit) q.append('limit', String(params.limit))

  const qs = q.toString()
  return request<AdminCustomerListResponse>(`/admin/customers${qs ? `?${qs}` : ''}`)
}

/**
 * Fetch a single customer's full profile and address details.
 */
export async function getAdminCustomer(id: number): Promise<AdminCustomerDetailResponse> {
  return request<AdminCustomerDetailResponse>(`/admin/customers/${id}`)
}

/**
 * Update customer active / suspended status.
 */
export async function updateAdminCustomerStatus(
  id: number,
  isActive: boolean
): Promise<AdminCustomerDetailResponse | { success: boolean; message: string }> {
  return request(`/admin/customers/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ is_active: isActive }),
  })
}

/**
 * Update customer role.
 */
export async function updateAdminCustomerRole(
  id: number,
  role: string
): Promise<{ success: boolean; message: string }> {
  return request(`/admin/customers/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  })
}

/**
 * Soft delete customer.
 */
export async function deleteAdminCustomer(
  id: number
): Promise<{ success: boolean; message: string }> {
  return request(`/admin/customers/${id}`, {
    method: 'DELETE',
  })
}

// ==================== RESTAURANT MANAGEMENT ====================

export interface AdminRestaurantItem {
  id: number
  name: string
  email: string
  phone?: string
  address: string
  description?: string
  cuisine_types: string
  price_tier: number
  lat: number
  lng: number
  operating_hours?: string
  hero_image_url?: string
  avg_rating: number
  review_count: number
  dietary_tags?: string
  is_active: boolean
  total_orders: number
  total_revenue: number
  menu_items_count: number
  created_at: string
}

export interface AdminRestaurantListResponse {
  restaurants: AdminRestaurantItem[]
  total: number
  page: number
  limit: number
}

export interface AdminRestaurantStats {
  total_orders: number
  total_revenue: number
  completed_orders: number
  cancelled_orders: number
  pending_orders: number
  menu_items_count: number
  avg_rating: number
  review_count: number
}

export interface AdminRestaurantMenuItem {
  id: number
  restaurant_id: number
  category_id: number
  category_name: string
  name: string
  description?: string
  price: number
  image_url?: string
  dietary_tags?: string
  is_available: boolean
  created_at: string
}

export interface AdminRestaurantOrderItem {
  id: number
  status: string
  total: number
  subtotal: number
  delivery_fee: number
  items_count: number
  customer_name: string
  customer_email: string
  customer_phone?: string
  delivery_address: string
  items_summary: string
  created_at: string
}

export interface AdminRestaurantDetailResponse {
  restaurant: AdminRestaurantItem
  stats: AdminRestaurantStats
  menu_items: AdminRestaurantMenuItem[]
  recent_orders: AdminRestaurantOrderItem[]
}

export interface GetAdminRestaurantsParams {
  search?: string
  status?: string
  page?: number
  limit?: number
}

export interface CreateAdminRestaurantPayload {
  name: string
  email: string
  password: string
  phone?: string
  address: string
  description?: string
  cuisine_types?: string
  price_tier?: number
  lat: number
  lng: number
  operating_hours?: string
  hero_image_url?: string
  dietary_tags?: string
  is_active?: boolean
}

export interface UpdateAdminRestaurantPayload {
  name: string
  email: string
  password?: string
  phone?: string
  address: string
  description?: string
  cuisine_types?: string
  price_tier: number
  lat: number
  lng: number
  operating_hours?: string
  hero_image_url?: string
  dietary_tags?: string
  is_active?: boolean
}

/**
 * Fetch paginated restaurants for admin management.
 */
export async function getAdminRestaurants(
  params: GetAdminRestaurantsParams = {}
): Promise<AdminRestaurantListResponse> {
  const q = new URLSearchParams()
  if (params.search) q.append('search', params.search)
  if (params.status && params.status !== 'all') q.append('status', params.status)
  if (params.page) q.append('page', String(params.page))
  if (params.limit) q.append('limit', String(params.limit))

  const qs = q.toString()
  return request<AdminRestaurantListResponse>(`/admin/restaurants${qs ? `?${qs}` : ''}`)
}

/**
 * Fetch a single restaurant's full details, stats, menu items, and recent orders.
 */
export async function getAdminRestaurant(id: number): Promise<AdminRestaurantDetailResponse> {
  return request<AdminRestaurantDetailResponse>(`/admin/restaurants/${id}`)
}

/**
 * Create a new restaurant partner.
 */
export async function createAdminRestaurant(
  payload: CreateAdminRestaurantPayload
): Promise<AdminRestaurantItem> {
  return request<AdminRestaurantItem>('/admin/restaurants', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/**
 * Update restaurant details.
 */
export async function updateAdminRestaurant(
  id: number,
  payload: UpdateAdminRestaurantPayload
): Promise<AdminRestaurantItem> {
  return request<AdminRestaurantItem>(`/admin/restaurants/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

/**
 * Soft delete restaurant.
 */
export async function deleteAdminRestaurant(
  id: number
): Promise<{ success: boolean; message: string }> {
  return request(`/admin/restaurants/${id}`, {
    method: 'DELETE',
  })
}

/**
 * Toggle restaurant active / inactive status.
 */
export async function updateAdminRestaurantStatus(
  id: number,
  isActive: boolean
): Promise<{ success: boolean; is_active: boolean; message: string }> {
  return request(`/admin/restaurants/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ is_active: isActive }),
  })
}

/**
 * Upload restaurant banner/hero image.
 */
export async function uploadAdminRestaurantImage(
  id: number,
  file: File
): Promise<{ hero_image_url: string; message: string }> {
  const form = new FormData()
  form.append('image', file)
  return request(`/admin/restaurants/${id}/image`, {
    method: 'POST',
    body: form,
  })
}

/**
 * Get restaurant menu items for admin.
 */
export async function getAdminRestaurantMenuItems(
  id: number
): Promise<AdminRestaurantMenuItem[]> {
  return request<AdminRestaurantMenuItem[]>(`/admin/restaurants/${id}/menu-items`)
}

/**
 * Get restaurant orders for admin.
 */
export async function getAdminRestaurantOrders(
  id: number,
  limit = 30
): Promise<AdminRestaurantOrderItem[]> {
  return request<AdminRestaurantOrderItem[]>(`/admin/restaurants/${id}/orders?limit=${limit}`)
}


