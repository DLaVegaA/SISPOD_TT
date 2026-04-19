export const ROUTE_NAMES = {
  HOME: 'home',
  LOGIN: 'login',
  USERS: 'users',
  ROLES: 'roles',
  STATS: 'stats',
} as const

export type RouteName = (typeof ROUTE_NAMES)[keyof typeof ROUTE_NAMES]

export const ROUTE_PATHS = {
  HOME: '/home',
  LOGIN: '/login',
  USERS: '/users',
  ROLES: '/roles',
  STATS: '/stats',
} as const
