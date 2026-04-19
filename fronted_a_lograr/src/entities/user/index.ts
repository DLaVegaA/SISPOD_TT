// entities/user/index.ts
// Public API de la entidad User.
// Solo se exporta lo necesario. Nunca se importa desde rutas internas.

export { useUserStore }        from './model/store'
export type { User, CreateUserDto, UpdateUserDto, UserStatus } from './model/types'
export { default as UserAvatar }     from './ui/UserAvatar.vue'
export { default as UserRoleBadge }  from './ui/UserRoleBadge.vue'
