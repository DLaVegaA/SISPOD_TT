import { useSessionStore } from '@/entities/session'
import { createRouter, createWebHistory } from 'vue-router'
import {
  buildRoleHomePath,
  normalizeRole,
  normalizeUserId,
  ROUTE_NAMES,
  ROUTE_PATHS,
  type AppRole,
} from '@/shared/routes'

const HomePage = () => import('@/pages/home/ui/HomePage.vue')
const LoginPage = () => import('@/pages/login/ui/LoginPage.vue')
const RecoverPasswordPage = () => import('@/pages/recuperarContrasena/ui/RecoverPasswordPage.vue')
const ResetPasswordPage = () => import('@/pages/restablecerContrasena/ui/ResetPasswordPage.vue')
const UsersPage = () => import('@/pages/users')
const RolesPage = () => import('@/pages/roles/ui/RolesPage.vue')
const StatsPage = () => import('@/pages/stats/ui/StatsPage.vue')
const DentistCalendar = () => import('@/pages/dentista/calendar/ui/DentistCalendar.vue')
const DentistClinicalHistory = () =>
  import('@/pages/dentista/clinicalHistory/ui/DentistClinicalHistory.vue')
const DentistDashboard = () => import('@/pages/dentista/dashboard/ui/DentistDashboard.vue')
const DentistBinnacle = () => import('@/pages/dentista/binnacle/ui/DentistBinnacle.vue')
const DentistPatients = () => import('@/pages/patients/ui/PatientsPage.vue')
const PatientDashboard = () => import('@/pages/paciente/dashboard/ui/PatientDashboard.vue')
const PatientProfile = () => import('@/pages/paciente/profile/ui/PatientProfile.vue')
const PatientAppointment = () => import('@/pages/paciente/appointment/ui/PatientAppointment.vue')
const PatientFollowUp = () => import('@/pages/paciente/followUp/ui/PatientFollowUp.vue')
const AssistantDashboard = () => import('@/pages/asistente/dashboard/ui/AssistantDashboard.vue')
const AssistantBinnacle = () => import('@/pages/asistente/binnacle/ui/AssistantBinnacle.vue')

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
      meta: { title: 'Inicio de Sésion', guestOnly: true },
    },
    {
      path: ROUTE_PATHS.RECOVER_PASSWORD,
      name: ROUTE_NAMES.RECOVER_PASSWORD,
      component: RecoverPasswordPage,
      meta: { title: 'Recuperar Contraseña', guestOnly: true },
    },
    {
      path: ROUTE_PATHS.RESET_PASSWORD,
      name: ROUTE_NAMES.RESET_PASSWORD,
      component: ResetPasswordPage,
      meta: { title: 'Restablecer Contraseña', guestOnly: true },
    },
    {
      path: ROUTE_PATHS.ADMIN_HOME,
      name: ROUTE_NAMES.ADMIN_HOME,
      component: UsersPage,
      meta: { title: 'Panel de Administrador', requiresAuth: true, allowedRoles: ['admin'] },
    },
    {
      path: ROUTE_PATHS.ADMIN_USERS,
      name: ROUTE_NAMES.ADMIN_USERS,
      component: UsersPage,
      meta: { title: 'Usuarios', requiresAuth: true, allowedRoles: ['admin'] },
    },
    {
      path: ROUTE_PATHS.ADMIN_ROLES,
      name: ROUTE_NAMES.ADMIN_ROLES,
      component: RolesPage,
      meta: { title: 'Roles del Sistema', requiresAuth: true, allowedRoles: ['admin'] },
    },
    {
      path: ROUTE_PATHS.ADMIN_STATS,
      name: ROUTE_NAMES.ADMIN_STATS,
      component: StatsPage,
      meta: { title: 'Estadísticas', requiresAuth: true, allowedRoles: ['admin'] },
    },
    {
      path: ROUTE_PATHS.DENTIST_HOME,
      name: ROUTE_NAMES.DENTIST_HOME,
      component: DentistDashboard,
      meta: { title: 'Dashboard del Dentista', requiresAuth: true, allowedRoles: ['dentist'] },
    },
    {
      path: ROUTE_PATHS.DENTIST_CALENDAR,
      name: ROUTE_NAMES.DENTIST_CALENDAR,
      component: DentistCalendar,
      meta: { title: 'Calendario del Dentista', requiresAuth: true, allowedRoles: ['dentist'] },
    },
    {
      path: ROUTE_PATHS.DENTIST_CLINICAL_HISTORY,
      name: ROUTE_NAMES.DENTIST_CLINICAL_HISTORY,
      component: DentistClinicalHistory,
      meta: {
        title: 'Historia Clínica del Dentista',
        requiresAuth: true,
        allowedRoles: ['dentist'],
      },
    },
    {
      path: ROUTE_PATHS.DENTIST_PATIENTS,
      name: ROUTE_NAMES.DENTIST_PATIENTS,
      component: DentistPatients,
      meta: { title: 'Pacientes del Dentista', requiresAuth: true, allowedRoles: ['dentist'] },
    },
    {
      path: ROUTE_PATHS.DENTIST_BINNACLE,
      name: ROUTE_NAMES.DENTIST_BINNACLE,
      component: DentistBinnacle,
      meta: { title: 'Bitácora del Dentista', requiresAuth: true, allowedRoles: ['dentist'] },
    },
    {
      path: ROUTE_PATHS.PATIENT_HOME,
      name: ROUTE_NAMES.PATIENT_HOME,
      component: PatientDashboard,
      meta: { title: 'Dashboard del Paciente', requiresAuth: true, allowedRoles: ['patient'] },
    },
    {
      path: ROUTE_PATHS.PATIENT_PROFILE,
      name: ROUTE_NAMES.PATIENT_PROFILE,
      component: PatientProfile,
      meta: { title: 'Perfil del Paciente', requiresAuth: true, allowedRoles: ['patient'] },
    },
    {
      path: ROUTE_PATHS.PATIENT_APPOINTMENT,
      name: ROUTE_NAMES.PATIENT_APPOINTMENT,
      component: PatientAppointment,
      meta: { title: 'Citas del Paciente', requiresAuth: true, allowedRoles: ['patient'] },
    },
    {
      path: ROUTE_PATHS.PATIENT_FOLLOW_UP,
      name: ROUTE_NAMES.PATIENT_FOLLOW_UP,
      component: PatientFollowUp,
      meta: { title: 'Seguimiento del Paciente', requiresAuth: true, allowedRoles: ['patient'] },
    },
    {
      path: ROUTE_PATHS.ASSISTANT_HOME,
      name: ROUTE_NAMES.ASSISTANT_HOME,
      component: AssistantDashboard,
      meta: { title: 'Dashboard del Asistente', requiresAuth: true, allowedRoles: ['assistant'] },
    },
    {
      path: ROUTE_PATHS.ASSISTANT_BINNACLE,
      name: ROUTE_NAMES.ASSISTANT_BINNACLE,
      component: AssistantBinnacle,
      meta: { title: 'Bitácora del Asistente', requiresAuth: true, allowedRoles: ['assistant'] },
    },
  ],
})

router.beforeEach(async (to) => {
  const sessionStore = useSessionStore()

  if (sessionStore.status === 'unknown') {
    await sessionStore.bootstrap()
  }

  const requiresAuth = Boolean(to.meta.requiresAuth)
  const guestOnly = Boolean(to.meta.guestOnly)
  const roleHomePath = buildRoleHomePath(sessionStore.role, sessionStore.user?.id)
  const allowedRoles = Array.isArray(to.meta.allowedRoles)
    ? (to.meta.allowedRoles as AppRole[])
    : null
  const currentRole = normalizeRole(sessionStore.role)
  const currentUserId = normalizeUserId(sessionStore.user?.id)
  const targetUserId = normalizeUserId(to.params.id)

  if (to.name === ROUTE_NAMES.HOME && sessionStore.isAuthenticated && roleHomePath) {
    return { path: roleHomePath }
  }

  if (requiresAuth && !sessionStore.isAuthenticated) {
    return { path: ROUTE_PATHS.LOGIN }
  }

  if (requiresAuth && currentUserId && targetUserId && currentUserId !== targetUserId) {
    return { path: roleHomePath ?? ROUTE_PATHS.HOME }
  }

  if (requiresAuth && allowedRoles?.length) {
    if (!currentRole || !allowedRoles.includes(currentRole)) {
      return { path: roleHomePath ?? ROUTE_PATHS.HOME }
    }
  }

  if (guestOnly && sessionStore.isAuthenticated) {
    return { path: roleHomePath ?? ROUTE_PATHS.HOME }
  }

  return true
})

// Guard global: actualiza el título del documento en cada navegación
router.afterEach((to) => {
  const title = to.meta.title as string | undefined
  document.title = title ? `${title}` : ''
})

export default router
