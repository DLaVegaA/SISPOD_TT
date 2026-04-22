export const ROUTE_NAMES = {
  HOME: 'home',
  LOGIN: 'login',
  USERS: 'users',
  ROLES: 'roles',
  STATS: 'stats',
  DENTIST_CALENDAR: 'dentist-calendar',
  DENTIST_CLINICAL_HISTORY: 'dentist-clinical-history',
  DENTIST_DASHBOARD: 'dentist-dashboard',
  DENTIST_PATIENTS: 'dentist-patients',
  PATIENT_APPOINTMENT: 'patient-appointment',
  ASSISTANT_DASHBOARD: 'assistant-dashboard',
} as const

export type RouteName = (typeof ROUTE_NAMES)[keyof typeof ROUTE_NAMES]

export const ROUTE_PATHS = {
  HOME: '/home',
  LOGIN: '/login',
  USERS: '/users',
  ROLES: '/roles',
  STATS: '/stats',
  DENTIST_CALENDAR: '/dentist/calendar',
  DENTIST_CLINICAL_HISTORY: '/dentist/clinical-history',
  DENTIST_DASHBOARD: '/dentist/dashboard',
  DENTIST_PATIENTS: '/dentist/patients',
  PATIENT_APPOINTMENT: '/patient/appointment',
  ASSISTANT_DASHBOARD: '/assistant/dashboard',
} as const
