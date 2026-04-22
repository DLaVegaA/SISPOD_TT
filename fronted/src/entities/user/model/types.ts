// Tipos del dominio User. Fuente de verdad para toda la app.
import type { RoleId } from '@/shared/config'

export type UserStatus = 'active' | 'inactive'

export interface User {
  id: number
  name: string
  email: string
  role: RoleId
  status: UserStatus
  createdAt: string
}

export interface CreateUserDto {
  name: string
  email: string
  password: string
  role: RoleId
  status: UserStatus
  apellidoPaterno: string
  apellidoMaterno: string
  telefono: string
  fechaNacimiento: string
  curp: string
  genero: string
  noCedula: string
  calle: string
  numExt: string
  numInt: string
  colonia: string
  municipio: string
  estadoDireccion: string
  codigoPostal: string
}

export interface UpdateUserDto {
  name?: string
  email?: string
  role?: RoleId
  status?: UserStatus
}
