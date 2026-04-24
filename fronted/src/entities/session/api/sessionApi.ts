import { httpClient } from '@/shared/api/http'
import type { LoginCredentials } from '../model/types'

const SESSION_TOKEN_KEY = 'session_access_token'

function getStoredToken(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage.getItem(SESSION_TOKEN_KEY)
}

export const loginRequest = async (credentials: LoginCredentials) => {
  return httpClient.post<unknown, LoginCredentials>('/auth/login', credentials)
}

export const getProfileRequest = async () => {
  return httpClient.get<unknown>('/usuarios/me')
}

export const logoutRequest = async () => {
  const token = getStoredToken()

  return httpClient.post<unknown>(
    '/auth/cerrar-sesion',
    undefined,
    token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : undefined,
  )
}
