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

