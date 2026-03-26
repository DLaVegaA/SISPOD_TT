// Importamos usando el alias @ y apuntando a la carpeta de la página
// import { HomePage } from '@/pages/home'
// import { LoginPage } from '@/pages/login'
// import { DentistaDashboard } from '@/pages/dentista/dashboard'
// import { DentistCalendar } from '@/pages/dentista/calendar'
// import { DentistPatient } from '@/pages/dentista/patient'
// import { ClinicalHistory } from '@/pages/dentista/clinicalHistory'

// const router = createRouter({
//   history: createWebHistory(import.meta.env.BASE_URL),
//   routes: [
//     {
//       path: '/',
//       name: 'home',
//       component: HomePage,
//     },
//     // Aquí irás agregando las rutas de los actores después
//     // { path: '/login', component: () => import('@/pages/login/ui/LoginPage.vue') }
//     {
//       path: '/login',
//       name: 'login',
//       component: LoginPage, // Esta es la ruta para tu formulario
//     },
//     {
//       path: '/dentista/dashboard',
//       name: 'dentista-dashboard',
//       component: DentistaDashboard, // Ruta para el dashboard del dentista
//     },
//     {
//       path: '/dentista/calendar',
//       name: 'dentista-calendar',
//       component: DentistCalendar, // Ruta para el calendario del dentista
//     },
//     {
//       path: '/dentista/patient',
//       name: 'dentista-patient',
//       component: DentistPatient, // Ruta para la gestión de pacientes del dentista
//     },
//     {
//       path: '/dentista/clinical-history',
//       name: 'dentista-clinical-history',
//       component: ClinicalHistory, // Ruta para la historia clínica del dentista
//     },
//   ],
// });
import { createRouter, createWebHistory } from 'vue-router'
import { ROUTE_NAMES, ROUTE_PATHS } from '@/shared/routes'

const HomePage = () => import('@/pages/home/ui/HomePage.vue')
const LoginPage = () => import('@/pages/login/ui/LoginPage.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: ROUTE_PATHS.HOME,
    },
    {
      path: ROUTE_PATHS.HOME,
      name: ROUTE_NAMES.HOME,
      component: HomePage,
      meta: { title: 'Página Principal' },
    },
    {
      path: ROUTE_PATHS.LOGIN,
      name: ROUTE_NAMES.LOGIN,
      component: LoginPage,
      meta: { title: 'Inicio de Sésion' },
    },
  ],
})

// Guard global: actualiza el título del documento en cada navegación
router.afterEach((to) => {
  const title = to.meta.title as string | undefined
  document.title = title ? `${title}` : ''
})

export default router
