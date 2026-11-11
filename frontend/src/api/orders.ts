import { request } from './client'
import type {
  Order,
  OrderStatus,
  CreateOrderPayload,
  QuoteDeliveryFeePayload,
  QuoteDeliveryFeeResult,
} from '../types/order'
import type { ApiEnvelope } from '../types/api'


export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  return request<Order>('/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function quoteDeliveryFee(
  payload: QuoteDeliveryFeePayload
): Promise<QuoteDeliveryFeeResult> {
  return request<QuoteDeliveryFeeResult>('/orders/quote-fee', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getOrder(orderId: number): Promise<Order> {
  return request<Order>(`/orders/${orderId}`)
}

export async function getMyOrders(
  status?: string,
  limit = 20,
  offset = 0
): Promise<{ orders: Order[]; total: number }> {
  const params = new URLSearchParams()
  if (status) params.append('status', status)
  if (limit) params.append('limit', String(limit))
  if (offset) params.append('offset', String(offset))
  const qs = params.toString() ? `?${params.toString()}` : ''
  return request<{ orders: Order[]; total: number }>(`/orders/my-orders${qs}`)
}

export async function cancelOrder(orderId: number, reason?: string): Promise<Order> {
  return request<Order>(`/orders/${orderId}/cancel`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  })
}

// ─── Restaurant Endpoints ──────────────────────────────────────────────────────

function getRestaurantToken(): string | null {
  return localStorage.getItem('restaurant_access_token')
}

export async function getRestaurantOrders(
  status?: string,
  limit = 50,
  offset = 0
): Promise<{ orders: Order[]; total: number }> {
  const token = getRestaurantToken()
  const params = new URLSearchParams()
  if (status && status !== 'All') params.append('status', status)
  if (limit) params.append('limit', String(limit))
  if (offset) params.append('offset', String(offset))
  const qs = params.toString() ? `?${params.toString()}` : ''

  const res = await fetch(`/api/v1/restaurants/orders${qs}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  const json: ApiEnvelope<{ orders: Order[]; total: number }> = await res.json().catch(() => ({}))
  if (!res.ok || !json.data) {
    throw new Error(json.error?.detail || json.error?.message || 'Failed to fetch restaurant orders')
  }
  return json.data
}

export async function updateRestaurantOrderStatus(
  orderId: number,
  status: OrderStatus,
  notes?: string
): Promise<Order> {
  const token = getRestaurantToken()
  const res = await fetch(`/api/v1/restaurants/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ status, notes }),
  })

  const json: ApiEnvelope<Order> = await res.json().catch(() => ({}))
  if (!res.ok || !json.data) {
    throw new Error(json.error?.detail || json.error?.message || 'Failed to update order status')
  }
  return json.data
}

// ─── Delivery Person Endpoints ────────────────────────────────────────────────

function getDeliveryToken(): string | null {
  return localStorage.getItem('delivery_access_token')
}

export async function getDeliveryOrders(
  status?: string,
  limit = 50,
  offset = 0
): Promise<{ orders: Order[]; total: number }> {
  const token = getDeliveryToken()
  const params = new URLSearchParams()
  if (status) params.append('status', status)
  if (limit) params.append('limit', String(limit))
  if (offset) params.append('offset', String(offset))
  const qs = params.toString() ? `?${params.toString()}` : ''

  const res = await fetch(`/api/v1/delivery-persons/orders${qs}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  const json: ApiEnvelope<{ orders: Order[]; total: number }> = await res.json().catch(() => ({}))
  if (!res.ok || !json.data) {
    throw new Error(json.error?.detail || json.error?.message || 'Failed to fetch delivery orders')
  }
  return json.data
}

export async function updateDeliveryOrderStatus(
  orderId: number,
  status: OrderStatus,
  notes?: string
): Promise<Order> {
  const token = getDeliveryToken()
  const res = await fetch(`/api/v1/delivery-persons/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ status, notes }),
  })

  const json: ApiEnvelope<Order> = await res.json().catch(() => ({}))
  if (!res.ok || !json.data) {
    throw new Error(json.error?.detail || json.error?.message || 'Failed to update delivery status')
  }
  return json.data
}
