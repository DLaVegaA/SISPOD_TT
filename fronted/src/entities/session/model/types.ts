export interface SessionUser {
  id?: number | string
  id_usuario?: number | string
  id_rol?: number
  correo?: string
  email?: string
  name?: string
  nombre?: string
  rol?: string
  role?: string
}

export interface LoginCredentials {
  correo: string
  password: string
}

export type SessionStatus = 'unknown' | 'checking' | 'authenticated' | 'anonymous'
