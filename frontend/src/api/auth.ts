import { request, setTokens, clearTokens } from './client'
import type { AuthResponse, User } from '../types/user'

export interface LoginParams {
  email: string
  password: string
}

export interface RegisterParams {
  name: string
  email: string
  password: string
  phone?: string
}

export async function login(params: LoginParams): Promise<AuthResponse> {
  const data = await request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(params),
  })
  if (data?.access_token) {
    setTokens(data.access_token, data.refresh_token)
  }
  return data
}

export async function register(params: RegisterParams): Promise<AuthResponse> {
  // Register the user on the backend without saving tokens (user must log in separately)
  const data = await request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(params),
  })
  return data
}

export async function getMe(): Promise<User> {
  return request<User>('/users/me')
}

export async function switchRole(role: string): Promise<AuthResponse> {
  const data = await request<AuthResponse>('/users/me/role', {
    method: 'POST',
    body: JSON.stringify({ role }),
  })
  if (data?.access_token) {
    setTokens(data.access_token, data.refresh_token)
  }
  return data
}

export function logout(): void {
  clearTokens()
}

