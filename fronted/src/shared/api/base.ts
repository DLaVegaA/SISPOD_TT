import axios from 'axios';

// Aquí es donde conectarás con el back de tu amigo
export const api = axios.create({
  // Si tu amigo usa el puerto 3000 por defecto en Node.js:
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});