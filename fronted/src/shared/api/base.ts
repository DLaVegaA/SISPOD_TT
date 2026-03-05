import axios from 'axios';

// Conexión a la API, con la URL base definida en las variables de entorno o por defecto a localhost:3000
export const api = axios.create({
  // Puerto 3000 por defecto en Node.js:
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});