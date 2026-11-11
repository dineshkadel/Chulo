import { request } from './client'
import type { Review } from '../types/review'

export interface SubmitReviewParams {
  restaurant_id: number
  order_id?: number
  rating: number
  comment?: string
}

export async function submitReview(params: SubmitReviewParams): Promise<Review> {
  return request<Review>('/reviews', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

export async function getReviews(restaurantId: number): Promise<Review[]> {
  return request<Review[]>(`/restaurants/${restaurantId}/reviews`)
}

