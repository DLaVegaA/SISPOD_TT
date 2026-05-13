import { httpClient } from '@/shared/api/http'
import type { LogEntry } from '../model/types'

export async function getBitacoras(): Promise<LogEntry[]> {
  const data: any = await httpClient.get('/bitacora', { params: { limit: 100 } })

  const listaBitacoras = data.bitacoras || []
  
  // Mapeamos el backend a la interfaz del frontend justo aquí
  return data.bitacoras.map((b: any) => ({
    id: b.id_bitacora.toString(),
    patientName: b.nombre_paciente,
    patientId: `P${b.id_paciente}`,
    authorName: b.nombre_autor || 'Autor desconocido',
    authorRole: b.rol_autor || 'Staff',
    date: b.fecha_cita,
    appointmentType: b.accion_realizada,
    description: b.descripcion || 'Sin descripción.',
    status: b.estado_bitacora,
    tags: [b.accion_realizada]
  }))
}

export async function anularBitacoraRequest(id: string): Promise<void> {
  await httpClient.delete(`/bitacora/${id}/eliminar`)
}

export async function createBitacoraRequest(payload: { id_cita: number; descripcion: string }) {
  // Ojo: usa /bitacora o /bitacoras dependiendo de lo que te funcionó hace un momento
  const { data } = await httpClient.post('/bitacora', payload)
  return data
} 