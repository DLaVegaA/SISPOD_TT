<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-vue-next'
import logoUrl from '@/shared/assets/logo_diente.png'
import { validarTokenResetRequest, resetPasswordRequest } from '@/features/auth/api/authApi'

const route = useRoute()
const router = useRouter()
const token = route.params.token as string

const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const isLoading = ref(false)
const isCheckingToken = ref(true) // Estado de carga inicial
const isTokenValid = ref(false)   // Si el token es válido o no
const errorMsg = ref<string | null>(null)
const successMsg = ref<string | null>(null)

// 1. VERIFICAR EL TOKEN APENAS EL USUARIO ABRE LA PÁGINA
onMounted(async () => {
  try {
    // Si el backend responde 200 OK, el token es válido
    await validarTokenResetRequest(token)
    isTokenValid.value = true
  } catch (error: unknown) {
    // Si el backend responde 400 o 404, el token es inválido o caducado
    isTokenValid.value = false
    const err = error as { response?: { data?: { message?: string } } }
    errorMsg.value = err.response?.data?.message || 'El enlace de recuperación es inválido o ha caducado.'
  } finally {
    isCheckingToken.value = false
  }
})

// 2. ENVIAR LA NUEVA CONTRASEÑA
async function handleSubmit() {
  errorMsg.value = null
  successMsg.value = null
  
  // 1. Validaciones locales primero
  if (password.value.length < 8) {
    errorMsg.value = 'La contraseña debe tener al menos 8 caracteres'
    return
  }
  if (password.value !== confirmPassword.value) {
    errorMsg.value = 'Las contraseñas no coinciden'
    return
  }

  isLoading.value = true

  try {
    // 2. Solo llamamos a resetPasswordRequest. 
    // No hace falta llamar a validarTokenResetRequest aquí porque 
    // ya lo hicimos en el onMounted al cargar la página.
    await resetPasswordRequest(token, password.value)

    successMsg.value = '¡Contraseña actualizada correctamente! Redirigiendo...'
    
    setTimeout(() => {
      router.push('/login')
    }, 2000)

  } catch (error: unknown) {
    // Ahora cualquier error (token expirado, error de red, etc.) 
    // caerá aquí y se mostrará en el cuadro rojo de la pantalla.
    const err = error as { response?: { data?: { message?: string } } }
    errorMsg.value = err.response?.data?.message || 'El enlace caducó o hubo un error al actualizar.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4 relative">
    <img 
      src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80"
      class="absolute inset-0 w-full h-full object-cover z-0"
      alt="Clínica Dental"
    />
    <div class="absolute inset-0 bg-black/40 z-10"></div>

    <router-link to="/login"
      class="absolute top-6 left-6 z-30 flex items-center gap-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-xl text-sm font-medium transition">
      ← Regresar al Login
    </router-link>

    <div class="relative z-20 bg-white/20 backdrop-blur-xl border border-white/30 shadow-2xl rounded-3xl p-10 w-full max-w-md">

      <div class="flex flex-col items-center mb-6 gap-1">
        <div class="flex items-center gap-2">
          <img :src="logoUrl" alt="Logo" class="h-7 w-auto brightness-0 invert" />
          <span class="text-white font-semibold text-sm">Consultorio González</span>
        </div>
      </div>

      <div v-if="isCheckingToken" class="text-center py-8">
        <span class="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin inline-block"></span>
        <p class="text-white/80 mt-4 text-sm">Verificando enlace seguro...</p>
      </div>

      <div v-else-if="!isTokenValid" class="text-center py-6">
        <div class="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/50">
          <AlertCircle class="w-8 h-8 text-red-300" />
        </div>
        <p class="text-white text-lg font-bold mb-2">Enlace Caducado</p>
        <p class="text-white/70 text-sm mb-6">{{ errorMsg }}</p>
        <router-link to="/recuperar-password" class="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-colors inline-block text-sm">
          Solicitar nuevo enlace
        </router-link>
      </div>

      <div v-else>
        <h1 class="text-2xl font-bold text-white text-center mb-6">Nueva Contraseña</h1>
        <p class="text-white/70 text-sm text-center mb-6">Escribe y confirma tu nueva contraseña de acceso.</p>

        <form @submit.prevent="handleSubmit" class="space-y-5">
          
          <div class="space-y-2">
            <label class="text-sm font-bold text-white ml-1">Nueva Contraseña</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock class="h-5 w-5 text-white/60" />
              </div>
              <input 
                :type="showPassword ? 'text' : 'password'" 
                v-model="password"
                placeholder="Mínimo 8 caracteres"
                class="w-full pl-11 pr-12 py-3.5 bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-2xl focus:ring-2 focus:ring-white/50 focus:border-white/50 outline-none transition-all backdrop-blur-sm"
                required
              />
              <button 
                type="button" 
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 pr-4 flex items-center text-white/60 hover:text-white transition-colors"
              >
                <EyeOff v-if="showPassword" class="h-5 w-5" />
                <Eye v-else class="h-5 w-5" />
              </button>
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-bold text-white ml-1">Confirmar Contraseña</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock class="h-5 w-5 text-white/60" />
              </div>
              <input 
                :type="showConfirmPassword ? 'text' : 'password'" 
                v-model="confirmPassword"
                placeholder="Repite tu contraseña"
                class="w-full pl-11 pr-12 py-3.5 bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-2xl focus:ring-2 focus:ring-white/50 focus:border-white/50 outline-none transition-all backdrop-blur-sm"
                required
              />
              <button 
                type="button" 
                @click="showConfirmPassword = !showConfirmPassword"
                class="absolute inset-y-0 right-0 pr-4 flex items-center text-white/60 hover:text-white transition-colors"
              >
                <EyeOff v-if="showConfirmPassword" class="h-5 w-5" />
                <Eye v-else class="h-5 w-5" />
              </button>
            </div>
          </div>

          <Transition name="fade">
            <div v-if="errorMsg && isTokenValid" class="flex items-center gap-2 p-3 bg-red-500/30 border border-red-500/50 rounded-xl text-white text-sm">
              <AlertCircle class="h-5 w-5 shrink-0 text-red-300" />
              {{ errorMsg }}
            </div>
          </Transition>

          <Transition name="fade">
            <div v-if="successMsg" class="flex items-center gap-2 p-3 bg-emerald-500/30 border border-emerald-500/50 rounded-xl text-white text-sm">
              <CheckCircle2 class="h-5 w-5 shrink-0 text-emerald-300" />
              {{ successMsg }}
            </div>
          </Transition>

          <button 
            type="submit" 
            :disabled="isLoading || !password || !confirmPassword"
            class="w-full py-4 mt-2 bg-white text-black font-bold rounded-2xl hover:bg-gray-100 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 shadow-xl text-base"
          >
            <span v-if="isLoading" class="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
            {{ isLoading ? 'Actualizando...' : 'Actualizar Contraseña' }}
          </button>

        </form>
      </div>

    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

input:-webkit-autofill,
input:-webkit-autofill:hover, 
input:-webkit-autofill:focus, 
input:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 30px rgba(255,255,255,0.01) inset !important;
    transition: background-color 5000s ease-in-out 0s;
    -webkit-text-fill-color: white !important;
}
</style>