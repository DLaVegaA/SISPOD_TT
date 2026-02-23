import { createApp } from 'vue';
import App from './App.vue';
import router from '../router'; // Importamos la configuración del router
import '../styles/main.css'; // Tus estilos de Tailwind v4

const app = createApp(App);

app.use(router); // <-- Esto es lo que activa las rutas
app.mount('#app');
