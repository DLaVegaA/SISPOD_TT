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
const UsersPage = () => import('@/pages/users')
const RolesPage = () => import('@/pages/roles/ui/RolesPage.vue')
const StatsPage = () => import('@/pages/stats/ui/StatsPage.vue')
const DentistCalendar = () => import('@/pages/dentista/calendar/ui/DentistCalendar.vue')
const DentistClinicalHistory = () => import('@/pages/dentista/clinicalHistory/ui/DentistClinicalHistory.vue')
const DentistDashboard = () => import('@/pages/dentista/dashboard/ui/DentistDashboard.vue')
const DentistPatients = () => import('@/pages/dentista/patient/ui/DentistPatient.vue')
const PatientDashboard = () => import('@/pages/paciente/dashboard/ui/PatientDashboard.vue')
const PatientAppointment = () => import('@/pages/paciente/appointment/ui/PatientAppointment.vue')
const AssistantDashboard = () => import('@/pages/asistente/dashboard/ui/AssistantDashboard.vue')

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
    {
      path: ROUTE_PATHS.USERS,
      name: ROUTE_NAMES.USERS,
      component: UsersPage,
      meta: { title: 'Usuarios' },
    },
    {
      path: ROUTE_PATHS.ROLES,
      name: ROUTE_NAMES.ROLES,
      component: RolesPage,
      meta: { title: 'Roles del Sistema' },
    },
    {
      path: ROUTE_PATHS.STATS,
      name: ROUTE_NAMES.STATS,
      component: StatsPage,
      meta: { title: 'Estadísticas' },
    },
    {
      path: ROUTE_PATHS.DENTIST_CALENDAR,
      name: ROUTE_NAMES.DENTIST_CALENDAR,
      component: DentistCalendar,
      meta: { title: 'Calendario del Dentista' },
    },
    {
      path: ROUTE_PATHS.DENTIST_CLINICAL_HISTORY,
      name: ROUTE_NAMES.DENTIST_CLINICAL_HISTORY,
      component: DentistClinicalHistory,
      meta: { title: 'Historia Clínica del Dentista' },
    },
    {
      path: ROUTE_PATHS.DENTIST_DASHBOARD,
      name: ROUTE_NAMES.DENTIST_DASHBOARD,
      component: DentistDashboard,
      meta: { title: 'Dashboard del Dentista' },
    },
    {
      path: ROUTE_PATHS.DENTIST_PATIENTS,
      name: ROUTE_NAMES.DENTIST_PATIENTS,
      component: DentistPatients,
      meta: { title: 'Pacientes del Dentista' },
    },
    {
      path: ROUTE_PATHS.PATIENT_DASHBOARD,
      name: ROUTE_NAMES.PATIENT_DASHBOARD,
      component: PatientDashboard,
      meta: { title: 'Dashboard del Paciente' },
    },
    {
      path: ROUTE_PATHS.PATIENT_APPOINTMENT,
      name: ROUTE_NAMES.PATIENT_APPOINTMENT,
      component: PatientAppointment,
      meta: { title: 'Citas del Paciente' },
    },
    {
      path: ROUTE_PATHS.ASSISTANT_DASHBOARD,
      name: ROUTE_NAMES.ASSISTANT_DASHBOARD,
      component: AssistantDashboard,
      meta: { title: 'Dashboard del Asistente' },
    },
  ],
})

// Guard global: actualiza el título del documento en cada navegación
router.afterEach((to) => {
  const title = to.meta.title as string | undefined
  document.title = title ? `${title}` : ''
})

export default router
