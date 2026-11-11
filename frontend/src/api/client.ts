import { API_BASE_URL, STORAGE_KEYS } from '../utils/constants'
import { ApiError, type ApiEnvelope } from '../types/api'

export function getAccessToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || localStorage.getItem(STORAGE_KEYS.TOKEN)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
}

export function setTokens(accessToken: string, refreshToken?: string): void {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken)
  localStorage.setItem(STORAGE_KEYS.TOKEN, accessToken)
  if (refreshToken) {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
  }
}

export function clearTokens(): void {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.TOKEN)
  localStorage.removeItem(STORAGE_KEYS.USER)
}

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    if (!res.ok) {
      clearTokens()
      return null
    }

    const payload: ApiEnvelope<{ access_token: string; refresh_token?: string }> = await res.json()
    if (payload.data?.access_token) {
      setTokens(payload.data.access_token, payload.data.refresh_token)
      return payload.data.access_token
    }
    return null
  } catch {
    clearTokens()
    return null
  }
}

export async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = getAccessToken()
  const url = endpoint.startsWith('http') || endpoint.startsWith('/api')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers as Record<string, string> | undefined),
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (response.status === 401 && getRefreshToken()) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      const retryHeaders = {
        ...headers,
        Authorization: `Bearer ${newToken}`,
      }
      const retryRes = await fetch(url, {
        ...options,
        headers: retryHeaders,
      })
      const retryPayload: ApiEnvelope<T> = await retryRes.json().catch(() => ({}))
      if (!retryRes.ok || retryPayload.data === undefined) {
        throw new ApiError(
          retryRes.status,
          retryPayload.error?.message || 'Request failed',
          retryPayload.error?.code,
          retryPayload.error?.detail
        )
      }
      return retryPayload.data
    }
  }

  const payload: ApiEnvelope<T> = await response.json().catch(() => ({}))

  if (!response.ok || payload.data === undefined) {
    throw new ApiError(
      response.status,
      payload.error?.message || 'Request failed',
      payload.error?.code,
      payload.error?.detail
    )
  }

  return payload.data
}

