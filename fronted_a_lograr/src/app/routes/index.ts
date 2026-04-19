// app/routes/index.ts
// Configuración de Vue Router.
// La capa App es la única que conoce todas las páginas y las ensambla.

import { createRouter, createWebHistory } from 'vue-router'
import { ROUTE_NAMES, ROUTE_PATHS } from '@/shared/routes'

// Importaciones lazy para code-splitting automático por ruta
const UsersPage = () => import('@/pages/users/ui/UsersPage.vue')
const RolesPage = () => import('@/pages/roles/ui/RolesPage.vue')
const StatsPage = () => import('@/pages/stats/ui/StatsPage.vue')

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: ROUTE_PATHS.USERS,
    },
    {
      path:      ROUTE_PATHS.USERS,
      name:      ROUTE_NAMES.USERS,
      component: UsersPage,
      meta: { title: 'Gestión de Usuarios' },
    },
    {
      path:      ROUTE_PATHS.ROLES,
      name:      ROUTE_NAMES.ROLES,
      component: RolesPage,
      meta: { title: 'Roles del Sistema' },
    },
    {
      path:      ROUTE_PATHS.STATS,
      name:      ROUTE_NAMES.STATS,
      component: StatsPage,
      meta: { title: 'Estadísticas' },
    },
    // Ruta comodín — redirige rutas desconocidas a /users
    {
      path:     '/:pathMatch(.*)*',
      redirect: ROUTE_PATHS.USERS,
    },
  ],
})

// Guard global: actualiza el título del documento en cada navegación
router.afterEach((to) => {
  const title = to.meta.title as string | undefined
  document.title = title ? `${title} · SuperAdmin` : 'SuperAdmin'
})
