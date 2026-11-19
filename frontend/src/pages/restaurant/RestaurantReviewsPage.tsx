import type { RestaurantProfile } from '../../api/restaurantApi'
import { RestaurantReviews } from '../../components/restaurant/RestaurantReviews'

export function RestaurantReviewsPage({ profile }: { profile: RestaurantProfile | null }) {
  return <RestaurantReviews profile={profile} />
}
