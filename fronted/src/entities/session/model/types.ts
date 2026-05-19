export interface SessionUser {
  id?: number | string
  id_usuario?: number | string
  id_paciente?: number | string   // ← agregar
  id_rol?: number
  correo?: string
  email?: string
  name?: string
  nombre?: string
  apellido_paterno?: string       // ← agregar
  apellido_materno?: string       // ← agregar
  rol?: string
  role?: string
}

export interface LoginCredentials {
  correo: string
  password: string
}

export type SessionStatus = 'unknown' | 'checking' | 'authenticated' | 'anonymous'
