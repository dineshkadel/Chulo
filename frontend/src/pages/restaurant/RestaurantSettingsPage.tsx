import type { RestaurantProfile } from '../../api/restaurantApi'
import { RestaurantSettings } from '../../components/restaurant/RestaurantSettings'

export function RestaurantSettingsPage({ onProfileUpdate }: {
  onProfileUpdate: (profile: RestaurantProfile) => void
}) {
  return <RestaurantSettings onProfileUpdate={onProfileUpdate} />
}
