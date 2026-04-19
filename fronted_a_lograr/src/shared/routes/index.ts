// shared/routes/index.ts
// Constantes de rutas. Unico lugar donde viven los nombres de rutas.
// Las pages y el router las consumen desde aquí.

export const ROUTE_NAMES = {
  USERS: 'users',
  ROLES: 'roles',
  STATS: 'stats',
} as const

export type RouteName = (typeof ROUTE_NAMES)[keyof typeof ROUTE_NAMES]

export const ROUTE_PATHS = {
  USERS: '/users',
  ROLES: '/roles',
  STATS: '/stats',
} as const
