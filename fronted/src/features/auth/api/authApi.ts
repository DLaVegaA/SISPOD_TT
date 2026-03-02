import { api } from '@/shared/api/base';

// Tipamos lo que esperamos enviar y recibir basándonos en tu SQL (tabla Usuario)
export const loginRequest = async (credentials: Record<string, string>) => {
  // Cuando el back esté listo, este será el endpoint
  const response = await api.post('/auth/login', credentials);
  return response.data;
};