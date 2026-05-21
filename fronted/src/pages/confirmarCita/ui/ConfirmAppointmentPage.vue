<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  CalendarCheck, AlertCircle, CheckCircle2,
  Loader2, Clock, CalendarX,
} from 'lucide-vue-next'
import logoUrl from '@/shared/assets/logo_diente.png'
import { httpClient } from '@/shared/api/http'

// ── Tipos de estado de la página ──────────────────────────────────────────
type PageState = 'loading' | 'ready' | 'confirming' | 'success' | 'error'

// ── Códigos de error posibles ─────────────────────────────────────────────
type ErrorKind = 'invalid_token' | 'expired' | 'already_confirmed' | 'cancelled' | 'not_found' | 'unknown'

// ── Route ─────────────────────────────────────────────────────────────────
const route  = useRoute()
const router = useRouter()

const idCita = route.params.id as string
const token  = route.query.token as string | undefined

// ── Estado reactivo ───────────────────────────────────────────────────────
const pageState  = ref<PageState>('loading')
const errorKind  = ref<ErrorKind>('unknown')
const errorMsg   = ref('')

// ── Computed: configuración del estado de error ───────────────────────────
const errorConfig = computed(() => {
  const map: Record<ErrorKind, { titulo: string; descripcion: string; icono: any; color: string }> = {
    invalid_token: {
      titulo: 'Enlace inválido',
      descripcion: 'El enlace de confirmación no es válido. Verifica que copiaste la URL completa del correo.',
      icono: AlertCircle,
      color: 'text-red-300',
    },
    expired: {
      titulo: 'Enlace caducado',
      descripcion: 'Este enlace de confirmación ha expirado. Los enlaces son válidos por 3 días desde que se generó la cita.',
      icono: Clock,
      color: 'text-amber-300',
    },
    already_confirmed: {
      titulo: 'Cita ya confirmada',
      descripcion: 'Esta cita ya fue confirmada anteriormente. No es necesario hacer nada más. ¡Te esperamos!',
      icono: CheckCircle2,
      color: 'text-emerald-300',
    },
    cancelled: {
      titulo: 'Cita cancelada',
      descripcion: 'Esta cita fue cancelada y ya no está disponible para confirmar.',
      icono: CalendarX,
      color: 'text-red-300',
    },
    not_found: {
      titulo: 'Cita no encontrada',
      descripcion: 'No encontramos la cita asociada a este enlace.',
      icono: AlertCircle,
      color: 'text-red-300',
    },
    unknown: {
      titulo: 'Algo salió mal',
      descripcion: errorMsg.value || 'Ocurrió un error inesperado. Intenta de nuevo o contacta al consultorio.',
      icono: AlertCircle,
      color: 'text-red-300',
    },
  }
  return map[errorKind.value]
})

// ── Clasificar el error del backend ──────────────────────────────────────
function clasificarError(message: string, status: number): ErrorKind {
  const msg = message.toLowerCase()
  if (status === 400 && (msg.includes('expiró') || msg.includes('expirado') || msg.includes('inválido') || msg.includes('invalido'))) return 'expired'
  if (msg.includes('ya está confirmada') || msg.includes('ya confirmada')) return 'already_confirmed'
  if (msg.includes('cancelada')) return 'cancelled'
  if (status === 404) return 'not_found'
  if (status === 400) return 'invalid_token'
  return 'unknown'
}

// ── onMounted: validar parámetros mínimos antes de mostrar la página ──────
onMounted(() => {
  // Sin token o sin id → error inmediato, sin hacer petición
  if (!token || !idCita) {
    errorKind.value = 'invalid_token'
    pageState.value = 'error'
    return
  }
  // Todo OK → mostrar el botón de confirmación
  pageState.value = 'ready'
})

// ── Confirmar cita ────────────────────────────────────────────────────────
async function confirmarCita() {
  pageState.value = 'confirming'
  try {
    await httpClient.post(`/citas/${idCita}/confirmar`, { token })
    pageState.value = 'success'
  } catch (err: any) {
    const status  = err?.response?.status ?? 500
    const message = err?.response?.data?.message ?? ''
    errorKind.value = clasificarError(message, status)
    errorMsg.value  = message
    pageState.value = 'error'
  }
}

// ── Ir al sistema ─────────────────────────────────────────────────────────
function irAlSistema() {
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4 relative">
    <!-- Fondo -->
    <img
      src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80"
      class="absolute inset-0 w-full h-full object-cover z-0"
      alt="Consultorio Dental"
    />
    <div class="absolute inset-0 bg-black/45 z-10" />

    <!-- Card principal -->
    <div class="relative z-20 bg-white/20 backdrop-blur-xl border border-white/30 shadow-2xl rounded-3xl p-10 w-full max-w-md">

      <!-- Logo -->
      <div class="flex flex-col items-center mb-8 gap-1">
        <div class="flex items-center gap-2">
          <img :src="logoUrl" alt="Logo" class="h-7 w-auto brightness-0 invert" />
          <span class="text-white font-semibold text-sm">Consultorio González</span>
        </div>
      </div>

      <!-- ── Estado: cargando ──────────────────────────────────────────── -->
      <Transition name="fade" mode="out-in">
        <div v-if="pageState === 'loading'" key="loading" class="flex flex-col items-center gap-4 py-8">
          <Loader2 class="w-10 h-10 text-white/70 animate-spin" />
          <p class="text-white/70 text-sm">Verificando enlace...</p>
        </div>

        <!-- ── Estado: listo para confirmar ─────────────────────────────── -->
        <div v-else-if="pageState === 'ready' || pageState === 'confirming'" key="ready" class="flex flex-col items-center gap-6">
          <div class="w-20 h-20 rounded-full bg-white/15 border border-white/30 flex items-center justify-center">
            <CalendarCheck class="w-10 h-10 text-white" />
          </div>

          <div class="text-center space-y-2">
            <h1 class="text-2xl font-bold text-white">Confirmar asistencia</h1>
            <p class="text-white/70 text-sm leading-relaxed">
              Estás a punto de confirmar tu cita en el <strong class="text-white">Consultorio Dental González</strong>.
              Al confirmar, el dentista sabrá que asistirás.
            </p>
          </div>

          <!-- Info de la cita -->
          <div class="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-4 flex items-center gap-3">
            <CalendarCheck class="w-5 h-5 text-white/60 shrink-0" />
            <div>
              <p class="text-[10px] font-bold text-white/50 uppercase tracking-wider">Cita #{{ idCita }}</p>
              <p class="text-sm text-white/80">Tu dentista recibirá la confirmación de inmediato.</p>
            </div>
          </div>

          <!-- Botón confirmar -->
          <button
            :disabled="pageState === 'confirming'"
            class="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-gray-100 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60 disabled:hover:scale-100 flex items-center justify-center gap-2 shadow-xl text-base"
            @click="confirmarCita"
          >
            <Loader2 v-if="pageState === 'confirming'" class="w-5 h-5 animate-spin" />
            <CheckCircle2 v-else class="w-5 h-5" />
            {{ pageState === 'confirming' ? 'Confirmando...' : 'Confirmar mi asistencia' }}
          </button>

          <p class="text-white/40 text-xs text-center">
            Si no puedes asistir, cancela tu cita desde el sistema o comunícate al consultorio.
          </p>
        </div>

        <!-- ── Estado: éxito ─────────────────────────────────────────────── -->
        <div v-else-if="pageState === 'success'" key="success" class="flex flex-col items-center gap-6 py-4">
          <div class="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
            <CheckCircle2 class="w-10 h-10 text-emerald-300" />
          </div>

          <div class="text-center space-y-2">
            <h1 class="text-2xl font-bold text-white">¡Cita confirmada!</h1>
            <p class="text-white/70 text-sm leading-relaxed">
              Tu asistencia ha sido registrada. El Consultorio Dental González ya sabe que te esperará.
            </p>
          </div>

          <div class="w-full bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-5 py-4">
            <p class="text-emerald-200 text-sm text-center">
              ✓ Confirmación registrada correctamente para la Cita #{{ idCita }}
            </p>
          </div>

          <button
            class="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-gray-100 transition-all shadow-xl text-sm"
            @click="irAlSistema"
          >
            Ir al sistema SISPOD
          </button>
        </div>

        <!-- ── Estado: error ─────────────────────────────────────────────── -->
        <div v-else-if="pageState === 'error'" key="error" class="flex flex-col items-center gap-6 py-4">
          <div
            :class="[
              'w-20 h-20 rounded-full border flex items-center justify-center',
              errorKind === 'already_confirmed'
                ? 'bg-emerald-500/20 border-emerald-500/40'
                : 'bg-red-500/20 border-red-500/40',
            ]"
          >
            <component :is="errorConfig.icono" :class="['w-10 h-10', errorConfig.color]" />
          </div>

          <div class="text-center space-y-2">
            <h1 class="text-2xl font-bold text-white">{{ errorConfig.titulo }}</h1>
            <p class="text-white/70 text-sm leading-relaxed">
              {{ errorConfig.descripcion }}
            </p>
          </div>

          <button
            class="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-gray-100 transition-all shadow-xl text-sm"
            @click="irAlSistema"
          >
            Ir al sistema SISPOD
          </button>
        </div>
      </Transition>

    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: all 0.25s ease; }
.fade-enter-from, .fade-leave-to       { opacity: 0; transform: translateY(8px); }

input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0 30px rgba(255,255,255,0.01) inset !important;
  -webkit-text-fill-color: white !important;
}
</style>