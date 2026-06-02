<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-10 relative">

    <!-- Fondo con imagen de clínica -->
    <img 
      src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80"
      class="absolute inset-0 w-full h-full object-cover z-0"
      alt="Clínica Dental"
    />
    <!-- Overlay oscuro -->
    <div class="absolute inset-0 bg-black/50 z-10"></div>

    <!-- Botón regresar -->
    <router-link to="/"
      class="absolute top-6 left-6 z-30 flex items-center gap-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-xl text-sm font-medium transition">
      ← Regresar
    </router-link>

    <!-- Card glassmorphism -->
    <div class="relative z-20 bg-white/20 backdrop-blur-xl border border-white/30 shadow-2xl rounded-3xl p-8 sm:p-10 w-full max-w-2xl">

      <!-- Logo y nombre -->
      <div class="flex flex-col items-center mb-6 gap-1">
        <div class="flex items-center gap-2">
          <img :src="logoUrl" alt="Logo" class="h-7 w-auto brightness-0 invert" />
          <span class="text-white font-semibold text-sm">Consultorio González</span>
        </div>
      </div>

      <!-- Título -->
      <h1 class="text-2xl font-bold text-white text-center mb-2">Activa tu cuenta en SISPOD</h1>
      <p class="text-white/60 text-sm text-center mb-8">
        Para finalizar tu registro, completa los siguientes datos y establece una contraseña segura.
      </p>

      <form @submit.prevent="handleSubmit" class="space-y-8">

        <!-- SECCIÓN: DATOS DE CONTACTO -->
        <div>
          <h2 class="text-xs font-bold text-white/50 uppercase tracking-widest border-b border-white/20 pb-2 mb-4">
            Datos de Contacto
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div class="space-y-1.5">
              <label class="block text-xs font-semibold text-white/70 uppercase tracking-wider">Teléfono <span class="text-red-400">*</span></label>
              <input
                v-model="form.telefono"
                type="tel"
                placeholder="10 dígitos"
                :class="inputCls(!!errors.telefono)"
                maxlength="10"
              />
              <p v-if="errors.telefono" class="text-red-300 text-xs">{{ errors.telefono }}</p>
            </div>

            <div class="space-y-1.5">
              <label class="block text-xs font-semibold text-white/70 uppercase tracking-wider">Género <span class="text-red-400">*</span></label>
              <select v-model="form.genero" :class="inputCls(!!errors.genero)">
                <option value="" disabled class="bg-gray-800 text-white">Selecciona tu género</option>
                <option value="Femenino" class="bg-gray-800 text-white">Femenino</option>
                <option value="Masculino" class="bg-gray-800 text-white">Masculino</option>
                <option value="Otro" class="bg-gray-800 text-white">Otro / Prefiero no decirlo</option>
              </select>
              <p v-if="errors.genero" class="text-red-300 text-xs">{{ errors.genero }}</p>
            </div>

          </div>
        </div>

        <!-- SECCIÓN: DOMICILIO -->
        <div>
          <h2 class="text-xs font-bold text-white/50 uppercase tracking-widest border-b border-white/20 pb-2 mb-4">
            Domicilio
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div class="md:col-span-2 space-y-1.5">
              <label class="block text-xs font-semibold text-white/70 uppercase tracking-wider">Calle <span class="text-red-400">*</span></label>
              <input v-model="form.calle" type="text" placeholder="Ej. Av. Siempre Viva" :class="inputCls(!!errors.calle)" />
              <p v-if="errors.calle" class="text-red-300 text-xs">{{ errors.calle }}</p>
            </div>

            <div class="space-y-1.5">
              <label class="block text-xs font-semibold text-white/70 uppercase tracking-wider">Número Exterior</label>
              <input v-model="form.num_ext" type="text" placeholder="Ej. 123" :class="inputCls(!!errors.num_ext)" />
              <p v-if="errors.num_ext" class="text-red-300 text-xs">{{ errors.num_ext }}</p>
            </div>

            <div class="space-y-1.5">
              <label class="block text-xs font-semibold text-white/70 uppercase tracking-wider">Número Interior <span class="normal-case font-normal text-white/40">(Opcional)</span></label>
              <input v-model="form.num_int" type="text" placeholder="Ej. Depto 4" :class="inputCls(false)" />
            </div>

            <div class="space-y-1.5">
              <label class="block text-xs font-semibold text-white/70 uppercase tracking-wider">Colonia <span class="text-red-400">*</span></label>
              <input v-model="form.colonia" type="text" placeholder="Colonia" :class="inputCls(!!errors.colonia)" />
              <p v-if="errors.colonia" class="text-red-300 text-xs">{{ errors.colonia }}</p>
            </div>

            <div class="space-y-1.5">
              <label class="block text-xs font-semibold text-white/70 uppercase tracking-wider">
                {{ form.estado === 'Ciudad de México' || form.estado === 'CDMX' ? 'Alcaldía' : 'Municipio' }} <span class="text-red-400">*</span>
              </label>
              <input v-model="form.municipio" type="text" placeholder="Municipio o Alcaldía" :class="inputCls(!!errors.municipio)" />
              <p v-if="errors.municipio" class="text-red-300 text-xs">{{ errors.municipio }}</p>
            </div>

            <div class="space-y-1.5">
              <label class="block text-xs font-semibold text-white/70 uppercase tracking-wider">Estado <span class="text-red-400">*</span></label>
              <input v-model="form.estado" type="text" placeholder="Estado" :class="inputCls(!!errors.estado)" />
              <p v-if="errors.estado" class="text-red-300 text-xs">{{ errors.estado }}</p>
            </div>

            <div class="space-y-1.5">
              <label class="block text-xs font-semibold text-white/70 uppercase tracking-wider">Código Postal <span class="text-red-400">*</span></label>
              <input v-model="form.codigo_postal" type="text" placeholder="5 dígitos" maxlength="5" :class="inputCls(!!errors.codigo_postal)" />
              <p v-if="errors.codigo_postal" class="text-red-300 text-xs">{{ errors.codigo_postal }}</p>
            </div>

          </div>
        </div>

        <!-- SECCIÓN: SEGURIDAD -->
        <div>
          <h2 class="text-xs font-bold text-white/50 uppercase tracking-widest border-b border-white/20 pb-2 mb-4">
            Seguridad de la cuenta
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div class="space-y-1.5">
              <label class="block text-xs font-semibold text-white/70 uppercase tracking-wider">Contraseña <span class="text-red-400">*</span></label>
              <div class="relative">
                <input
                  v-model="form.contrasena"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Mínimo 12 caracteres"
                  :class="inputCls(!!errors.contrasena) + ' pr-12'"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute inset-y-0 right-0 pr-4 flex items-center text-white/50 hover:text-white transition-colors"
                >
                  <EyeOff v-if="showPassword" class="h-5 w-5" />
                  <Eye v-else class="h-5 w-5" />
                </button>
              </div>
              <ul class="text-[10px] mt-1 space-y-0.5" :class="errors.contrasena ? 'text-red-300' : 'text-white/40'">
                <li>• Mínimo 12 caracteres</li>
                <li>• Al menos una mayúscula y una minúscula</li>
                <li>• Al menos un número y un símbolo especial</li>
              </ul>
            </div>

            <div class="space-y-1.5">
              <label class="block text-xs font-semibold text-white/70 uppercase tracking-wider">Confirmar Contraseña <span class="text-red-400">*</span></label>
              <div class="relative">
                <input
                  v-model="confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  placeholder="Repite tu contraseña"
                  :class="inputCls(!!errors.confirmPassword) + ' pr-12'"
                />
                <button
                  type="button"
                  @click="showConfirmPassword = !showConfirmPassword"
                  class="absolute inset-y-0 right-0 pr-4 flex items-center text-white/50 hover:text-white transition-colors"
                >
                  <EyeOff v-if="showConfirmPassword" class="h-5 w-5" />
                  <Eye v-else class="h-5 w-5" />
                </button>
              </div>
              <p v-if="errors.confirmPassword" class="text-red-300 text-xs">{{ errors.confirmPassword }}</p>
            </div>

          </div>
        </div>

        <div class="flex items-start gap-3 pt-2">
          <button
            type="button"
            role="checkbox"
            :aria-checked="aceptaTerminos"
            :class="[
              'mt-0.5 w-5 h-5 shrink-0 rounded-md border-2 transition-all flex items-center justify-center',
              aceptaTerminos
                ? 'bg-white border-white'
                : 'border-white/40 bg-white/10 hover:border-white/70',
            ]"
            @click="aceptaTerminos = !aceptaTerminos"
          >
            <svg
              v-if="aceptaTerminos"
              class="w-3 h-3 text-black"
              viewBox="0 0 12 12"
              fill="none"
            >
              <path
                d="M2 6l3 3 5-5"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
          <p class="text-white/70 text-xs leading-relaxed">
            He leído y acepto los
            <router-link
              :to="{ name: ROUTE_NAMES.TERMS_CONDITIONS }"
              target="_blank"
              class="text-white underline underline-offset-2 hover:text-white/80 transition-colors"
            >
              Términos y Condiciones
            </router-link>
            y el
            <router-link
              :to="{ name: ROUTE_NAMES.PRIVACY_POLICY }"
              target="_blank"
              class="text-white underline underline-offset-2 hover:text-white/80 transition-colors"
            >
              Aviso de Privacidad
            </router-link>
            de SISPO  D. Entiendo que mis datos de salud serán tratados conforme a la LFPDPPP.
            <span class="text-red-400">*</span>
          </p>
        </div>

        <!-- MENSAJE GLOBAL -->
        <Transition name="fade">
          <div v-if="globalError" class="flex items-center gap-2 p-3 bg-red-500/30 border border-red-500/50 rounded-xl text-white text-sm">
            <span class="shrink-0">⚠</span>
            {{ globalError }}
          </div>
        </Transition>

        <!-- BOTÓN SUBMIT -->
        <button
          type="submit"
          :disabled="isLoading"
          class="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-gray-100 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 shadow-xl text-base"
        >
          <span v-if="isLoading" class="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
          {{ isLoading ? 'Activando cuenta...' : 'Completar registro y Activar' }}
        </button>

      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Eye, EyeOff } from 'lucide-vue-next'
import { httpClient } from '@/shared/api/http'
import logoUrl from '@/shared/assets/logo_diente.png'
import { ROUTE_NAMES } from '@/shared/routes';

const route = useRoute()
const router = useRouter()

const isLoading = ref(false)
const globalError = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const aceptaTerminos = ref(false)

const form = reactive({
  telefono: '',
  genero: '',
  calle: '',
  num_ext: '',
  num_int: '',
  colonia: '',
  municipio: '',
  estado: '',
  codigo_postal: '',
  contrasena: ''
})

const errors = reactive<Record<string, string>>({})

const inputCls = (hasError: boolean) => {
  return `w-full px-4 py-3.5 bg-white/10 border text-white placeholder-white/50 rounded-2xl focus:ring-2 focus:ring-white/50 outline-none transition-all backdrop-blur-sm text-sm ${
    hasError
      ? 'border-red-400/70 bg-red-500/10'
      : 'border-white/20 focus:border-white/50'
  }`
}

const validateForm = () => {
  Object.keys(errors).forEach(key => delete errors[key])
  globalError.value = ''

  let isValid = true

  if (!/^\d{10}$/.test(form.telefono)) {
    errors.telefono = 'El teléfono debe tener 10 dígitos.'
    isValid = false
  }
  if (!form.genero) {
    errors.genero = 'Selecciona un género.'
    isValid = false
  }
  if (!form.calle.trim()) {
    errors.calle = 'La calle es obligatoria.'
    isValid = false
  }
  if (!form.num_ext.trim()) {
    errors.num_ext = 'El número exterior es obligatorio.'
    isValid = false
  }
  if (!form.colonia.trim()) {
    errors.colonia = 'La colonia es obligatoria.'
    isValid = false
  }
  if (!form.municipio.trim()) {
    errors.municipio = 'El municipio es obligatorio.'
    isValid = false
  }
  if (!form.estado.trim()) {
    errors.estado = 'El estado es obligatorio.'
    isValid = false
  }
  if (!/^\d{5}$/.test(form.codigo_postal)) {
    errors.codigo_postal = 'El código postal debe tener 5 dígitos.'
    isValid = false
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-={}[\]|;:,.<>?]).{12,}$/
  if (!passwordRegex.test(form.contrasena)) {
    errors.contrasena = 'La contraseña no cumple con los requisitos de seguridad.'
    isValid = false
  }

  if (form.contrasena !== confirmPassword.value) {
    errors.confirmPassword = 'Las contraseñas no coinciden.'
    isValid = false
  }

  if (!aceptaTerminos.value) {
    globalError.value = 'Debes aceptar los Términos y Condiciones y el Aviso de Privacidad para continuar.'
    isValid = false
  }

  return isValid
}

const handleSubmit = async () => {
  if (!validateForm()) return

  const token = route.params.token as string
  if (!token) {
    globalError.value = 'No se encontró un token válido en la URL. Revisa el enlace de tu correo.'
    return
  }

  try {
    isLoading.value = true
    await httpClient.post(`/auth/activar-cuenta/${token}`, form)
    router.push('/login?activated=true')
  } catch (error: any) {
    console.error('Error al activar cuenta:', error)
    globalError.value = error.response?.data?.message || 'Ocurrió un error al intentar activar la cuenta. Intenta de nuevo.'
  } finally {
    isLoading.value = false
  }
}
</script>

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

select option {
  background-color: #1f2937;
  color: white;
}
</style>