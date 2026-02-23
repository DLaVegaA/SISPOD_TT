import { createRouter, createWebHistory } from 'vue-router';
// Importamos usando el alias @ y apuntando a la carpeta de la página
import { HomePage } from '@/pages/home'; 

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
  ],
});

export default router;