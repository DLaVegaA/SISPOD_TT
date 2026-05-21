import axios from 'axios'

const SESSION_TOKEN_KEY = 'session_access_token'

// Conexión base para todas las peticiones HTTP del frontend.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  if (typeof window === 'undefined') {
    return config
  }

  const token = window.localStorage.getItem(SESSION_TOKEN_KEY)
  if (!token) {
    return config
  }

  config.headers.set('Authorization', `Bearer ${token}`)

  return config
})
