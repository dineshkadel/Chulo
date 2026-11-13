export interface Review {
  id: number
  user_id: number
  user_name?: string
  restaurant_id: number
  order_id?: number
  rating: number
  comment?: string
  created_at: string
}

