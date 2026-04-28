// Configuración global e inmutable de roles. Sin lógica de negocio.

export const ROLES = {
  ADMIN: 'admin',
  DENTIST: 'dentist',
  ASSISTANT: 'assistant',
  PATIENT: 'patient',
} as const

export type RoleId = (typeof ROLES)[keyof typeof ROLES]

export interface RoleMeta {
  id: RoleId
  label: string
  icon: string
  bgClass: string
  textClass: string
  barClass: string
  badgeClass: string
  avatarClass: string
  description: string
  permissions: string[]
}

export const ROLE_META: Record<RoleId, RoleMeta> = {
  admin: {
    id: 'admin',
    label: 'Administrador',
    icon: 'Shield',
    bgClass: 'bg-violet-50',
    textClass: 'text-violet-700',
    barClass: 'bg-violet-600',
    badgeClass: 'bg-violet-50 text-violet-700',
    avatarClass: 'bg-violet-700 text-white',
    description: 'Acceso completo al sistema. Gestiona usuarios, configuración y reportes.',
    permissions: ['Gestionar usuarios'],
  },
  dentist: {
    id: 'dentist',
    label: 'Dentista',
    icon: 'Stethoscope',
    bgClass: 'bg-sky-50',
    textClass: 'text-sky-700',
    barClass: 'bg-sky-600',
    badgeClass: 'bg-sky-50 text-sky-700',
    avatarClass: 'bg-sky-700 text-white',
    description: 'Profesional médico con acceso a expedientes clínicos y agenda.',
    permissions: [
      'Ver expedientes clínicos',
      'Gestionar citas',
      'Generar Expedientes',
      'Ver calendario',
    ],
  },
  assistant: {
    id: 'assistant',
    label: 'Asistente',
    icon: 'Headset',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-700',
    barClass: 'bg-amber-600',
    badgeClass: 'bg-amber-50 text-amber-700',
    avatarClass: 'bg-amber-700 text-white',
    description: 'Apoyo administrativo para gestión de citas y recepción.',
    permissions: ['Agendar citas', 'Ver calendario'],
  },
  patient: {
    id: 'patient',
    label: 'Paciente',
    icon: 'User',
    bgClass: 'bg-pink-50',
    textClass: 'text-pink-700',
    barClass: 'bg-pink-600',
    badgeClass: 'bg-pink-50 text-pink-700',
    avatarClass: 'bg-pink-700 text-white',
    description: 'Acceso limitado al portal del paciente y citas personales.',
    permissions: ['Ver mis citas', 'Ver mi expediente', 'Solicitar cita'],
  },
}

export const ROLES_LIST: RoleMeta[] = Object.values(ROLE_META)
