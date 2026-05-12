import type { CreateUserDto, UpdateUserDto, User } from '../model/types'
import type { RoleId } from '@/shared/config'
import { formatDate } from '@/shared/lib'
import { httpClient } from '@/shared/api/http'

interface BackendRole {
  id_rol: number
  nombre_rol: string
}

interface BackendUser {
  id_usuario: number
  nombre: string
  correo: string
  estado: string
  id_rol: number
  createdAt?: string
  role?: BackendRole
}

interface ListUsersResponse {
  usuarios: BackendUser[]
}

interface CreateUserResponse {
  usuario?: {
    id?: number
    id_usuario?: number
    id_rol?: number
    nombre?: string
    correo?: string
  }
}

interface UpdateUserResponse {
  usuario?: BackendUser
}

const ROLE_TO_ID: Record<RoleId, number> = {
  admin: 1,
  dentist: 2,
  patient: 3,
  assistant: 4,
}

const ID_TO_ROLE: Record<number, RoleId> = {
  1: 'admin',
  2: 'dentist',
  3: 'patient',
  4: 'assistant',
}

const FRONT_TO_BACK_STATUS = {
  active: 'activo',
  inactive: 'eliminado',
} as const

const BACK_TO_FRONT_STATUS: Record<string, 'active' | 'inactive'> = {
  activo: 'active',
  eliminado: 'inactive',
  pendiente: 'inactive',
}

function toRole(id: number): RoleId {
  return ID_TO_ROLE[id] ?? 'patient'
}

function toStatus(status: string): 'active' | 'inactive' {
  return BACK_TO_FRONT_STATUS[status] ?? 'inactive'
}

function buildCurpSeed(): string {
  const stamp = Date.now().toString().slice(-10)
  const random = Math.floor(Math.random() * 99999)
    .toString()
    .padStart(5, '0')
  return `TMP${stamp}${random}`.padEnd(18, 'X').slice(0, 18).toUpperCase()
}

function mapBackendUser(user: BackendUser): User {
  return {
    id: user.id_usuario,
    name: user.nombre,
    email: user.correo,
    role: toRole(user.id_rol ?? user.role?.id_rol ?? 3),
    status: toStatus(user.estado),
    createdAt: user.createdAt ? formatDate(new Date(user.createdAt)) : formatDate(),
  }
}

export async function getUsers(): Promise<User[]> {
  const data = await httpClient.get<ListUsersResponse>('/usuarios', {
    params: {
      estado: 'todos',
      pagina: 1,
      limit: 500,
      _ts: Date.now(),
    },
  })

  const directUsers = Array.isArray((data as ListUsersResponse).usuarios)
    ? (data as ListUsersResponse).usuarios
    : []

  const nestedUsers = Array.isArray((data as { data?: ListUsersResponse }).data?.usuarios)
    ? ((data as { data?: ListUsersResponse }).data?.usuarios ?? [])
    : []

  const users = directUsers.length ? directUsers : nestedUsers

  return users.map(mapBackendUser)
}

/* export async function createUser(dto: CreateUserDto): Promise<User> {
  const basePersona = {
    nombre: dto.name,
    apellido_paterno: dto.apellidoPaterno.trim(),
    apellido_materno: dto.apellidoMaterno.trim(),
    correo: dto.email,
    telefono: dto.telefono.trim(),
    fecha_nacimiento: dto.fechaNacimiento,
    curp: dto.curp.trim().toUpperCase(),
    genero: dto.genero.trim(),
  }

  let endpoint: '/usuarios' | '/dentistas' | '/pacientes' = '/usuarios'
  let payload: Record<string, unknown>

  if (dto.role === 'dentist') {
    endpoint = '/dentistas'
    payload = {
      ...basePersona,
      contrasena: dto.password,
      id_rol: ROLE_TO_ID.dentist,
      no_cedula: dto.noCedula.trim(),
    }
  } else if (dto.role === 'patient') {
    endpoint = '/pacientes'
    payload = {
      ...basePersona,
      id_rol: ROLE_TO_ID.patient,
      calle: dto.calle.trim(),
      num_ext: dto.numExt.trim(),
      num_int: dto.numInt.trim() || null,
      colonia: dto.colonia.trim(),
      municipio: dto.municipio.trim(),
      estado: dto.estadoDireccion.trim(),
      codigo_postal: dto.codigoPostal.trim(),
    }
  } else {
    payload = {
      nombre: dto.name,
      correo: dto.email,
      contrasena: dto.password,
      id_rol: ROLE_TO_ID[dto.role],
      estado: FRONT_TO_BACK_STATUS[dto.status],
      apellido_paterno: dto.apellidoPaterno.trim() || 'Pendiente',
      apellido_materno: dto.apellidoMaterno.trim() || 'Pendiente',
      telefono: dto.telefono.trim() || Date.now().toString().slice(-10).padStart(10, '0'),
      fecha_nacimiento: dto.fechaNacimiento || '2000-01-01',
      curp: dto.curp.trim().toUpperCase() || buildCurpSeed(),
      genero: dto.genero.trim() || 'No especificado',
    }
  }

  const data = await httpClient.post<CreateUserResponse, Record<string, unknown>>(endpoint, payload)

  const createdRoleId = data.usuario?.id_rol ?? ROLE_TO_ID[dto.role]
  const createdStatus = dto.role === 'patient' ? 'inactive' : dto.status

  return {
    id: data.usuario?.id ?? data.usuario?.id_usuario ?? Date.now(),
    name: data.usuario?.nombre ?? dto.name,
    email: data.usuario?.correo ?? dto.email,
    role: toRole(createdRoleId),
    status: createdStatus,
    createdAt: formatDate(),
  }
} */

export async function createUser(dto: CreateUserDto): Promise<User> {
  let endpoint: '/usuarios' | '/dentistas' | '/pacientes' = '/usuarios'
  let payload: Record<string, unknown>

  if (dto.role === 'dentist') {
    endpoint = '/dentistas'
    payload = {
      nombre: dto.name,
      apellido_paterno: dto.apellidoPaterno.trim(),
      apellido_materno: dto.apellidoMaterno?.trim() || null,
      correo: dto.email,
      telefono: dto.telefono?.trim(),
      fecha_nacimiento: dto.fechaNacimiento,
      curp: dto.curp.trim().toUpperCase(),
      genero: dto.genero?.trim(),
      contrasena: dto.password,
      id_rol: ROLE_TO_ID.dentist,
      no_cedula: dto.noCedula?.trim(),
    }
  } else if (dto.role === 'patient') {
    // RN3: Pre-registro solo con la información mínima requerida
    endpoint = '/pacientes'
    payload = {
      nombre: dto.name,
      apellido_paterno: dto.apellidoPaterno.trim(),
      apellido_materno: dto.apellidoMaterno?.trim() || null,
      correo: dto.email,
      fecha_nacimiento: dto.fechaNacimiento,
      curp: dto.curp.trim().toUpperCase(),
      id_rol: ROLE_TO_ID.patient,
    }
  } else {
    // Para roles Administrativos y Asistentes
    payload = {
      nombre: dto.name,
      correo: dto.email,
      contrasena: dto.password,
      id_rol: ROLE_TO_ID[dto.role],
      estado: dto.status ? FRONT_TO_BACK_STATUS[dto.status] : 'activo',
      // Mapeo real de los datos del formulario (se quitan los hardcodes)
      apellido_paterno: dto.apellidoPaterno.trim(),
      apellido_materno: dto.apellidoMaterno?.trim() || null,
      telefono: dto.telefono?.trim(),
      fecha_nacimiento: dto.fechaNacimiento,
      curp: dto.curp.trim().toUpperCase(),
      genero: dto.genero?.trim(),
    }
  }

  const data = await httpClient.post<CreateUserResponse, Record<string, unknown>>(endpoint, payload)

  const createdRoleId = data.usuario?.id_rol ?? ROLE_TO_ID[dto.role]
  // El paciente siempre inicia como inactivo (pendiente) hasta que activa su cuenta
  const createdStatus = dto.role === 'patient' ? 'inactive' : (dto.status || 'active')

  return {
    id: data.usuario?.id ?? data.usuario?.id_usuario ?? Date.now(),
    name: data.usuario?.nombre ?? dto.name,
    email: data.usuario?.correo ?? dto.email,
    role: toRole(createdRoleId),
    status: createdStatus,
    createdAt: formatDate(),
  }
}

export async function updateUser(id: number, dto: UpdateUserDto): Promise<User> {
  const payload = {
    nombre: dto.name,
    correo: dto.email,
    id_rol: dto.role ? ROLE_TO_ID[dto.role] : undefined,
    estado: dto.status ? FRONT_TO_BACK_STATUS[dto.status] : undefined,
  }

  const data = await httpClient.put<UpdateUserResponse, typeof payload>(`/usuarios/${id}`, payload)

  if (data.usuario) {
    return mapBackendUser(data.usuario)
  }

  return {
    id,
    name: dto.name ?? 'Usuario',
    email: dto.email ?? '',
    role: dto.role ?? 'patient',
    status: dto.status ?? 'active',
    createdAt: formatDate(),
  }
}

export async function deleteUser(id: number): Promise<void> {
  await httpClient.delete(`/usuarios/${id}`)
}
