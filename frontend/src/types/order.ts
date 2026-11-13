export type OrderStatus =
  | 'PLACED'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY'
  | 'ASSIGNED'
  | 'PICKED_UP'
  | 'DELIVERED'
  | 'REJECTED'
  | 'CANCELLED'

export interface OrderItem {
  id?: number
  menu_item_id: number
  name: string
  price: number
  quantity: number
  subtotal?: number
  special_instructions?: string
}

export interface OrderStatusHistoryItem {
  id: number
  status: OrderStatus
  changed_by: number
  role: string
  notes?: string
  created_at: string
}

export interface OrderRestaurantInfo {
  id: number
  name: string
  address?: string
  phone?: string
  hero_image_url?: string
  latitude: number
  longitude: number
}

export interface OrderCustomerInfo {
  id: number
  display_name: string
  email: string
  phone?: string
}

export interface OrderDeliveryPersonInfo {
  id: number
  full_name: string
  phone: string
  vehicle_type: string
  license_plate?: string
  current_lat: number
  current_lng: number
  avg_rating: number
}

export interface Order {
  id: number
  user_id: number
  restaurant_id: number
  delivery_person_id?: number
  status: OrderStatus
  delivery_address: string
  delivery_lat: number
  delivery_lng: number
  subtotal: number
  delivery_fee: number
  tax: number
  total: number
  promo_code?: string
  special_notes?: string
  estimated_delivery_min: number
  items: OrderItem[]
  status_history?: OrderStatusHistoryItem[]
  restaurant?: OrderRestaurantInfo
  customer?: OrderCustomerInfo
  delivery_person?: OrderDeliveryPersonInfo
  created_at: string
  updated_at: string
}

export interface CreateOrderPayload {
  restaurant_id: number
  items: {
    menu_item_id: number
    quantity: number
    special_instructions?: string
  }[]
  delivery_address: string
  delivery_lat: number
  delivery_lng: number
  delivery_address_id?: number
  special_notes?: string
  promo_code?: string
}

export interface QuoteDeliveryFeePayload {
  restaurant_id: number
  delivery_lat: number
  delivery_lng: number
}

export interface QuoteDeliveryFeeResult {
  distance_km: number
  delivery_fee: number
  estimated_min: number
}
