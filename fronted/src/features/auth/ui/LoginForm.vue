<script setup lang="ts">
import axios from 'axios'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from '@/entities/session'
import { buildRoleHomePath, ROUTE_PATHS } from '@/shared/routes'

const router = useRouter()
const sessionStore = useSessionStore()
const email = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMsg = ref('')
const showPassword = ref(false)

const handleSubmit = async () => {
  isLoading.value = true
  errorMsg.value = ''
  try {
    await sessionStore.login({
      correo: email.value,
      password: password.value,
    })

    if (!sessionStore.isAuthenticated) {
      errorMsg.value = 'No se pudo establecer la sesión. Intenta de nuevo.'
      return
    }

    const roleHomePath = buildRoleHomePath(sessionStore.role, sessionStore.user?.id)

    if (!roleHomePath) {
      errorMsg.value = 'Sesión iniciada pero no se pudo determinar tu perfil. Recarga la página.'
      return
    }

    await router.push(roleHomePath ?? ROUTE_PATHS.HOME)
  } catch (err) {
    if (axios.isAxiosError(err)) {
      errorMsg.value = err.response?.data?.message || 'Credenciales incorrectas. Intenta de nuevo.'
    } else {
      errorMsg.value = 'Ocurrió un error inesperado. Intenta de nuevo.'
    }

    console.error('Error en login:', err)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-4 w-full">
    <!-- Error -->
    <div
      v-if="errorMsg"
      class="p-3 bg-red-500/20 text-white text-sm rounded-xl border border-red-400/30 backdrop-blur-sm"
    >
      {{ errorMsg }}
    </div>

    <!-- Email -->
    <div class="relative">
      <!-- Ícono @ -->
      <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
          />
        </svg>
      </span>
      <input
        v-model="email"
        type="email"
        placeholder="correo electrónico"
        :disabled="isLoading"
        required
        class="w-full pl-10 pr-4 py-3 bg-white/80 border border-white/50 rounded-xl text-slate-700 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition"
      />
    </div>

    <!-- Contraseña -->
    <div class="relative">
      <!-- Ícono candado -->
      <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </span>
      <input
        v-model="password"
        :type="showPassword ? 'text' : 'password'"
        placeholder="contraseña"
        :disabled="isLoading"
        required
        class="w-full pl-10 pr-12 py-3 bg-white/80 border border-white/50 rounded-xl text-slate-700 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition"
      />
      <!-- Ícono ojo -->
      <button
        type="button"
        @click="showPassword = !showPassword"
        class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
      >
        <svg
          v-if="!showPassword"
          xmlns="http://www.w3.org/2000/svg"
          class="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          class="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
          />
        </svg>
      </button>
    </div>

    <!-- ¿Olvidé mi contraseña? -->
    <div class="text-right">
      <router-link
        to="/recuperar-contrasena"
        class="text-xs text-blue-200 hover:text-white transition"
      >
        ¿Olvidé mi contraseña?
      </router-link>
    </div>

    <!-- Botón submit -->
    <button
      type="submit"
      :disabled="isLoading"
      class="w-full bg-[#4382b59d] hover:bg-[#3a6d9c] text-white py-3 rounded-xl font-bold transition shadow-lg flex justify-center items-center gap-2 disabled:opacity-50 mt-2"
    >
      <span
        v-if="isLoading"
        class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
      ></span>
      {{ isLoading ? 'Validando...' : 'Iniciar Sesión' }}
    </button>
  </form>
</template>
