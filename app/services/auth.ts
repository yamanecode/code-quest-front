import type { Credentials, LoginResponse, RegisterResponse } from '~/types/api'
import { apiFetch } from './http'

export function register(credentials: Credentials): Promise<RegisterResponse> {
  return apiFetch<RegisterResponse>('/api/auth/register', { method: 'POST', body: credentials })
}

export function login(credentials: Credentials): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/api/auth/login', { method: 'POST', body: credentials })
}
