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

export async function createUser(dto: CreateUserDto): Promise<User> {
  const payload = {
    nombre: dto.name,
    correo: dto.email,
    contrasena: dto.password,
    id_rol: ROLE_TO_ID[dto.role],
    estado: FRONT_TO_BACK_STATUS[dto.status],
    apellido_paterno: 'Pendiente',
    apellido_materno: 'Pendiente',
    telefono: Date.now().toString().slice(-10).padStart(10, '0'),
    fecha_nacimiento: '2000-01-01',
    curp: buildCurpSeed(),
    genero: 'No especificado',
  }

  const data = await httpClient.post<CreateUserResponse, typeof payload>('/usuarios', payload)

  return {
    id: data.usuario?.id ?? Date.now(),
    name: data.usuario?.nombre ?? dto.name,
    email: data.usuario?.correo ?? dto.email,
    role: toRole(data.usuario?.id_rol ?? payload.id_rol),
    status: dto.status,
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
