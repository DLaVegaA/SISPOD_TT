import axios from 'axios'

// Conexión base para todas las peticiones HTTP del frontend.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})
