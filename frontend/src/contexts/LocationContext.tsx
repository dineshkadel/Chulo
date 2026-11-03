import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { DEFAULT_COORDINATES, STORAGE_KEYS } from '../utils/constants'

interface LocationCoordinates {
  latitude: number
  longitude: number
  addressName?: string
}

interface LocationContextType {
  coordinates: LocationCoordinates
  setCoordinates: (coords: LocationCoordinates) => void
  detectLocation: () => Promise<LocationCoordinates>
  isLoadingLocation: boolean
}

const LocationContext = createContext<LocationContextType | undefined>(undefined)

export function LocationProvider({ children }: { children: ReactNode }) {
  const [coordinates, setCoordsState] = useState<LocationCoordinates>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOCATION)
      return saved ? JSON.parse(saved) : DEFAULT_COORDINATES
    } catch {
      return DEFAULT_COORDINATES
    }
  })
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)

  const setCoordinates = (coords: LocationCoordinates) => {
    setCoordsState(coords)
    try {
      localStorage.setItem(STORAGE_KEYS.LOCATION, JSON.stringify(coords))
    } catch {}
  }

  const detectLocation = (): Promise<LocationCoordinates> => {
    setIsLoadingLocation(true)
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setIsLoadingLocation(false)
        resolve(coordinates)
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCoords: LocationCoordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            addressName: 'Current Location',
          }
          setCoordinates(newCoords)
          setIsLoadingLocation(false)
          resolve(newCoords)
        },
        () => {
          setIsLoadingLocation(false)
          resolve(coordinates)
        },
        { timeout: 10000, enableHighAccuracy: true }
      )
    })
  }

  useEffect(() => {
    // Optionally auto-check once on load
  }, [])

  return (
    <LocationContext.Provider
      value={{
        coordinates,
        setCoordinates,
        detectLocation,
        isLoadingLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  )
}

export function useLocationContext(): LocationContextType {
  const context = useContext(LocationContext)
  if (!context) {
    throw new Error('useLocationContext must be used within a LocationProvider')
  }
  return context
}

