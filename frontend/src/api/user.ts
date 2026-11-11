import { request } from './client'
import type { User, Address } from '../types/user'

export async function getProfile(): Promise<User> {
  return request<User>('/users/me')
}

export interface UpdateProfileParams {
  display_name: string
  phone?: string
  avatar_url?: string
}

export async function updateProfile(params: UpdateProfileParams): Promise<User> {
  return request<User>('/users/me', {
    method: 'PUT',
    body: JSON.stringify(params),
  })
}

export interface UpdateLocationParams {
  latitude: number
  longitude: number
  label?: string
  city?: string
  street?: string
  save_as_address?: boolean
}

export async function updateLocation(params: UpdateLocationParams): Promise<User> {
  return request<User>('/users/me/location', {
    method: 'PATCH',
    body: JSON.stringify(params),
  })
}

export async function getAddresses(): Promise<Address[]> {
  return request<Address[]>('/users/me/addresses')
}

