import { useState, useEffect } from 'react'
import type { Restaurant } from '../types/restaurant'
import { getRecommendations } from '../api/recommendations'

export function useRecommendations(lat?: number, lng?: number) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError(null)

    getRecommendations(lat, lng)
      .then((data) => {
        if (isMounted) {
          setRestaurants(data)
        }
      })
      .catch((err: Error) => {
        if (isMounted) {
          setError(err.message || 'Failed to fetch recommendations')
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [lat, lng])

  return { restaurants, loading, error }
}

