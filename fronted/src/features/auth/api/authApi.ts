import { httpClient } from '@/shared/api/http'

// Tipamos lo que esperamos enviar y recibir basándonos en tu SQL (tabla Usuario)
export const loginRequest = async (credentials: Record<string, string>) => {
  return httpClient.post('/auth/login', credentials)
}

export const recoverPasswordRequest = async (data: { correo: string }) => {
  return httpClient.post('/auth/forgot-password', data)
}
