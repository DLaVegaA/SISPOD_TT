import { httpClient } from '@/shared/api/http'

export const dentistaApi = {
  // Corresponde a router.get('/me', ...) en dentistaRoutes.ts
  obtenerMiPerfil: () => httpClient.get('/dentistas/me'),

  // Corresponde a router.put('/:id', ...) en dentistaRoutes.ts
  // Nota: El backend espera nombre, apellidos, telefono, correo y no_cedula
  actualizarPerfil: (id: number, data: any) => httpClient.put(`/dentistas/${id}`, {
    nombre: data.nombre,
    apellido_paterno: data.apellido_paterno,
    apellido_materno: data.apellido_materno,
    telefono: data.telefono,
    correo: data.correo,
    no_cedula: data.cedula // El frontend usa 'cedula', el backend 'no_cedula'
  })
}