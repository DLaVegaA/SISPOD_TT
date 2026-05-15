import { httpClient } from '@/shared/api/http'
 
export const dentistaApi = {
  obtenerMiPerfil: () => httpClient.get('/dentistas/me'),
 
  actualizarPerfil: (_id: number, data: any) =>
    httpClient.put('/dentistas/me', {
      nombre:            data.nombre,
      apellido_paterno:  data.apellido_paterno,
      apellido_materno:  data.apellido_materno || null,
      telefono:          data.telefono,
      correo:            data.correo,
      no_cedula:         data.cedula,
    }),
}
 