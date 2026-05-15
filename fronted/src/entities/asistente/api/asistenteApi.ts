import { httpClient } from '@/shared/api/http'

export const asistenteApi = {
  obtenerMiPerfil: () => httpClient.get('/asistentes/me'),

  actualizarPerfil: (data: {
    nombre: string
    apellido_paterno: string
    apellido_materno: string
    telefono: string
    correo: string
  }) => httpClient.put('/asistentes/me', data),
}