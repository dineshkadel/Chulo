import { useLocationContext } from '../contexts/LocationContext'

export function useGeolocation() {
  const { coordinates, detectLocation, isLoadingLocation } = useLocationContext()
  return {
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    addressName: coordinates.addressName,
    detectLocation,
    loading: isLoadingLocation,
  }
}

