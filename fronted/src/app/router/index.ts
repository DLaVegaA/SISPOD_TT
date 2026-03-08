import { createRouter, createWebHistory } from 'vue-router';
// Importamos usando el alias @ y apuntando a la carpeta de la página
import { HomePage } from '@/pages/home'; 
import { LoginPage } from '@/pages/login';
import { DentistaDashboard } from '@/pages/dentista/dashboard';
import { DentistCalendar } from '@/pages/dentista/calendar';
import { DentistPatient } from '@/pages/dentista/patient';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
    },
    // Aquí irás agregando las rutas de los actores después
    // { path: '/login', component: () => import('@/pages/login/ui/LoginPage.vue') }
    {
      path: '/login',
      name: 'login',
      component: LoginPage, // Esta es la ruta para tu formulario
    },
    {
      path: '/dentista/dashboard',
      name: 'dentista-dashboard',
      component: DentistaDashboard, // Ruta para el dashboard del dentista
    },
    {
      path: '/dentista/calendar',
      name: 'dentista-calendar',
      component: DentistCalendar, // Ruta para el calendario del dentista
    },
    {
      path: '/dentista/patient',
      name: 'dentista-patient',
      component: DentistPatient, // Ruta para la gestión de pacientes del dentista
    },
  ],
});

export default router;