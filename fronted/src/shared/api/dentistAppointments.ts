import { httpClient } from '@/shared/api/http'

interface BackendPacienteUsuario {
  id_usuario?: number
  nombre?: string
  apellido_paterno?: string
  apellido_materno?: string
  telefono?: string
  fecha_nacimiento?: string
  genero?: string
}

interface BackendPaciente {
  id_paciente: number
  usuario?: BackendPacienteUsuario
}

interface ListPacientesResponse {
  pacientes?: BackendPaciente[]
}

interface BackendCitaPaciente {
  id_paciente?: number
  usuario?: BackendPacienteUsuario
}

interface BackendCita {
  id_cita: number
  fecha_hora_inicio: string
  fecha_hora_fin: string
  estado: string
  // Anidamos id_paciente como lo manda el backend
  paciente?: {
    id_paciente: number
    usuario?: BackendPacienteUsuario
  }
  // Añadimos el tipo de cita como lo manda el backend
  tipo?: {
    nombre_corto: string
  }
}

interface ListCitasResponse {
  citas?: BackendCita[]
}

export interface DentistPatientOption {
  id: number
  fullName: string
  phone: string
  birthDate?: string
  gender?: string
}

export interface DentistAppointment {
  id: number
  patientId: number
  patientName: string
  startAt: string
  endAt: string
  type: string
  status: string
}

export interface ListAppointmentsFilters {
  desde?: string
  hasta?: string
  estado?: string
}

export interface CreateAppointmentPayload {
  idPaciente: number
  fecha: string
  horaInicio: string
  duracionMinutos: number
  tipoCita: number
}

export interface TipoCitaOption {
  value: string
  label: string
  duration: number
}

interface BackendTipoCita {
  id_tipocita: number
  nombre: string
  duracion?: number
}

interface ListTipoCitasResponse {
  tipoCitas?: BackendTipoCita[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function composePatientName(user?: BackendPacienteUsuario): string {
  if (!user) {
    return 'Paciente'
  }

  const parts = [user.nombre, user.apellido_paterno, user.apellido_materno]
    .filter((part) => typeof part === 'string' && part.trim().length > 0)
    .map((part) => (part as string).trim())

  return parts.join(' ') || 'Paciente'
}

export async function listPatientsForAppointments(): Promise<DentistPatientOption[]> {
  const payload = await httpClient.get<ListPacientesResponse>('/pacientes', {
    params: {
      pagina: 1,
      limit: 500,
    },
  })

  const maybeNested = isRecord(payload) && isRecord(payload.data) ? payload.data : payload
  const pacientes = Array.isArray((maybeNested as ListPacientesResponse).pacientes)
    ? ((maybeNested as ListPacientesResponse).pacientes ?? [])
    : []

  return pacientes.map((paciente) => ({
    id: paciente.id_paciente,
    fullName: composePatientName(paciente.usuario),
    phone: paciente.usuario?.telefono ?? 'Sin telefono',
    birthDate: paciente.usuario?.fecha_nacimiento,
    gender: paciente.usuario?.genero,
  }))
}

export async function listDentistAppointments(
  filters: ListAppointmentsFilters = {},
): Promise<DentistAppointment[]> {
  const payload = await httpClient.get<ListCitasResponse>('/citas', {
    params: {
      ...filters,
    },
  })

  const maybeNested = isRecord(payload) && isRecord(payload.data) ? payload.data : payload
  const citas = Array.isArray((maybeNested as ListCitasResponse).citas)
    ? ((maybeNested as ListCitasResponse).citas ?? [])
    : []

  return citas.map((cita) => ({
    id: cita.id_cita,
    // Aquí estaba el error que dejaba a todos "Sin citas":
    // Buscamos el ID dentro del objeto paciente
    patientId: cita.paciente?.id_paciente ?? 0,
    patientName: composePatientName(cita.paciente?.usuario),
    startAt: cita.fecha_hora_inicio,
    endAt: cita.fecha_hora_fin,
    // Extraemos el nombre_corto del tipo
    type: cita.tipo?.nombre_corto ?? 'General',
    status: cita.estado,
  }))
}

export async function createDentistAppointment(payload: CreateAppointmentPayload): Promise<void> {
  const startAt = new Date(`${payload.fecha}T${payload.horaInicio}:00`)
  if (Number.isNaN(startAt.getTime())) {
    throw new Error('Fecha y hora de inicio inválidas')
  }

  const endAt = new Date(startAt.getTime() + payload.duracionMinutos * 60 * 1000)

  await httpClient.post('/citas', {
    id_paciente: payload.idPaciente,
    fecha_hora_inicio: startAt.toISOString(),
    fecha_hora_fin: endAt.toISOString(),
    tipo_cita: payload.tipoCita,
  })
}

export async function listarTipoCitas(): Promise<TipoCitaOption[]> {
  const response =
    await httpClient.get<Array<{ id_tipocita: number; nombre: string }>>('/tipo-cita')

  const maybeNested = isRecord(response) && isRecord(response.data) ? response.data : response
  const tipoCitas = Array.isArray(maybeNested)
    ? maybeNested
    : Array.isArray((maybeNested as ListTipoCitasResponse).tipoCitas)
      ? ((maybeNested as ListTipoCitasResponse).tipoCitas ?? [])
      : []

  return tipoCitas.map((tipo) => ({
    value: String(tipo.id_tipocita),
    label: tipo.nombre,
    duration: 60, // Duración por defecto
  }))
}
