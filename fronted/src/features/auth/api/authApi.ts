import { httpClient } from '@/shared/api/http'

// Tipamos lo que esperamos enviar y recibir basándonos en tu SQL (tabla Usuario)
export const loginRequest = async (credentials: Record<string, string>) => {
  return httpClient.post('/auth/login', credentials)
}

export const recoverPasswordRequest = async (data: { correo: string }) => {
  return httpClient.post('/auth/forgot-password', data)
}

export const validarTokenResetRequest = async (token: string) => {
  return httpClient.get(`/auth/validar-token/${token}`)
}

export const resetPasswordRequest = async (token: string, contrasena: string) => {
  return httpClient.post(`/auth/reset-password/${token}`, { contrasena })
}