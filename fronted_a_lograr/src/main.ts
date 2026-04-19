// src/main.ts
// Punto de entrada de la aplicación.
// Registra plugins (router) y monta el componente raíz.

import { createApp } from 'vue'

// app layer — estilos globales y componente raíz
import App from './app/App.vue'
import './app/styles/global.css'

// app/routes — configuración de Vue Router
import { router } from './app/routes'

const app = createApp(App)

// Instalar plugins (Vue Router)
app.use(router)

// Montar en el DOM
app.mount('#app')
