import { httpClient } from '@/shared/api/http'
import type { LogEntry } from '../model/types'

function mapBitacoras(data: any): LogEntry[] {
  const listaBitacoras = data?.bitacoras || []

  return listaBitacoras.map((b: any) => ({
    id: b.id_bitacora.toString(),
    patientName: b.nombre_paciente,
    patientId: `P${b.id_paciente}`,
    authorName: b.nombre_autor || 'Autor desconocido',
    authorRole: b.rol_autor || 'Staff',
    date: b.fecha_cita,
    appointmentType: b.accion_realizada,
    description: b.descripcion || 'Sin descripcion.',
    status: b.estado_bitacora,
    tags: [b.accion_realizada],
  }))
}

export async function getBitacoras(): Promise<LogEntry[]> {
  const data: any = await httpClient.get('/bitacora', { params: { limit: 100 } })

  // Mapeamos el backend a la interfaz del frontend justo aquí
  return mapBitacoras(data)
}

export async function getBitacorasByEstado(estado: string): Promise<LogEntry[]> {
  const data: any = await httpClient.get('/bitacora', {
    params: { limit: 100, estado },
  })

  return mapBitacoras(data)
}

export async function anularBitacoraRequest(id: string): Promise<void> {
  await httpClient.delete(`/bitacora/${id}/eliminar`)
}

export async function createBitacoraRequest(payload: { id_cita: number; descripcion: string }) {
  // Ojo: usa /bitacora o /bitacoras dependiendo de lo que te funcionó hace un momento
  const data: any = await httpClient.post('/bitacora', payload)
  return data
}

export async function revisarBitacoraRequest(id: string): Promise<void> {
  // Usamos /bitacora en singular para que coincida con tu backend
  await httpClient.put(`/bitacora/${id}/revisar`)
}

export async function editarBitacoraRequest(id: string, descripcion: string): Promise<void> {
  await httpClient.put(`/bitacora/${id}`, { descripcion })
}
