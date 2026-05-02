export const ROUTE_NAMES = {
  HOME: 'home',
  LOGIN: 'login',
  RECOVER_PASSWORD: 'recover-password',
  RESET_PASSWORD: 'reset-password',
  ADMIN_HOME: 'admin-home',
  ADMIN_USERS: 'admin-users',
  ADMIN_ROLES: 'admin-roles',
  ADMIN_STATS: 'admin-stats',
  DENTIST_HOME: 'dentist-home',
  DENTIST_CALENDAR: 'dentist-calendar',
  DENTIST_CLINICAL_HISTORY: 'dentist-clinical-history',
  DENTIST_PATIENTS: 'dentist-patients',
  DENTIST_BINNACLE: 'dentist-binnacle',
  DENTIST_CONSENT: 'dentist-consent',
  DENTIST_FOLLOW_UP: 'dentist-follow-up',
  DENTIST_QUESTIONNAIRES: 'dentist-questionnaires',
  DENTIST_NEW_QUESTIONNAIRES: 'dentist-new-questionnaires',
  PATIENT_HOME: 'patient-home',
  PATIENT_PROFILE: 'patient-profile',
  PATIENT_APPOINTMENT: 'patient-appointment',
  PATIENT_FOLLOW_UP: 'patient-follow-up',
  ASSISTANT_HOME: 'assistant-home',
  ASSISTANT_BINNACLE: 'assistant-binnacle',
} as const

export type RouteName = (typeof ROUTE_NAMES)[keyof typeof ROUTE_NAMES]

export type AppRole = 'admin' | 'dentist' | 'patient' | 'assistant'

const ROLE_SEGMENT_BY_ROLE: Record<AppRole, 'admin' | 'dentista' | 'paciente' | 'asistente'> = {
  admin: 'admin',
  dentist: 'dentista',
  patient: 'paciente',
  assistant: 'asistente',
}

export const ROUTE_PATHS = {
  HOME: '/home',
  LOGIN: '/login',
  RECOVER_PASSWORD: '/recuperar-contrasena',
  RESET_PASSWORD: '/restablecer-contrasena/:token',

  ADMIN_HOME: '/admin/:id/home',
  ADMIN_USERS: '/admin/:id/users',
  ADMIN_ROLES: '/admin/:id/roles',
  ADMIN_STATS: '/admin/:id/stats',
  
  DENTIST_HOME: '/dentista/:id/home',
  DENTIST_CALENDAR: '/dentista/:id/calendario',
  DENTIST_CLINICAL_HISTORY: '/dentista/:id/historial-clinico',
  DENTIST_PATIENTS: '/dentista/:id/pacientes',
  DENTIST_BINNACLE: '/dentista/:id/bitacora',
  DENTIST_CONSENT: '/dentista/:id/consentimiento',
  DENTIST_FOLLOW_UP: '/dentista/:id/seguimiento',
  DENTIST_QUESTIONNAIRES: '/dentista/:id/cuestionarios',
  DENTIST_NEW_QUESTIONNAIRES: '/dentista/:id/nuevos-cuestionarios',
  
  PATIENT_HOME: '/paciente/:id/home',
  PATIENT_PROFILE: '/paciente/:id/perfil',
  PATIENT_APPOINTMENT: '/paciente/:id/citas',
  PATIENT_FOLLOW_UP: '/paciente/:id/seguimiento',
  
  ASSISTANT_HOME: '/asistente/:id/home',
  ASSISTANT_BINNACLE: '/asistente/:id/bitacora',
} as const

const ID_ROLE_MAP: Record<number, AppRole> = {
  1: 'admin',
  2: 'dentist',
  3: 'patient',
  4: 'assistant',
}

const STRING_ROLE_MAP: Record<string, AppRole> = {
  admin: 'admin',
  administrador: 'admin',
  dentist: 'dentist',
  dentista: 'dentist',
  patient: 'patient',
  paciente: 'patient',
  assistant: 'assistant',
  asistente: 'assistant',
}

export function normalizeRole(value: unknown): AppRole | null {
  if (typeof value === 'number') {
    return ID_ROLE_MAP[value] ?? null
  }

  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim().toLowerCase()
  return STRING_ROLE_MAP[normalized] ?? null
}

export function normalizeUserId(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim()
  }

  return null
}

export function buildRoleHomePath(role: unknown, userId: unknown): string | null {
  const normalizedRole = normalizeRole(role)
  const normalizedId = normalizeUserId(userId)

  if (!normalizedRole || !normalizedId) {
    return null
  }

  return `/${ROLE_SEGMENT_BY_ROLE[normalizedRole]}/${normalizedId}/home`
}
