import { httpClient } from '@/shared/api/http'

export interface CrearCitaPayload {
  fecha_hora_inicio: string
  //fecha_hora_fin: string
  tipo_cita: number
  id_dentista: number
  id_paciente?: number
}

export const citasApi = {
  obtenerDisponibilidad: (fecha: string, tipo_cita: number, id_dentista: number) => {
    return httpClient.get('/citas/disponibilidad', {
      params: { fecha, tipo_cita, id_dentista },
    })
  },
  crearCita: (data: CrearCitaPayload) => {
    return httpClient.post('/citas', data)
  },
  listarMisCitas: (estado?: string) => {
    return httpClient.get('/citas', { params: { estado, limit: 100 } })
  },
  editarCita: (id: number, data: { fecha_hora_inicio: string }) => {
    return httpClient.post(`/citas/${id}`, data)
  },
  cancelarCita: (id: number) => {
    return httpClient.post(`/citas/${id}/cancelar`)
  },
  obtenerDetalleTipoCita: async (id: number) => {
    // Asegúrate de que la ruta coincida con la que pusiste en tu backend
    return await httpClient.get(`/tipo-cita/${id}`); 
  }
}