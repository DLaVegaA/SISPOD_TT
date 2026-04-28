import { httpClient } from '@/shared/api/http'

export const pacienteApi = {
  // Ojo: Tu backend actual pide el ID del paciente en la URL (router.put('/:id'))
  actualizarPerfil: (id_paciente: number, data: unknown) => {
    return httpClient.put(`/pacientes/${id_paciente}`, data)
    
  },
  obtenerMiPerfil: () => httpClient.get('/pacientes/me')
}