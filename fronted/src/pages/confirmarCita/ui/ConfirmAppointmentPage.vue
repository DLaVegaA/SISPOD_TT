<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  CalendarCheck, AlertCircle, CheckCircle2,
  Loader2, Clock, CalendarX,
} from 'lucide-vue-next'
import logoUrl from '@/shared/assets/logo_diente.png'
import { httpClient } from '@/shared/api/http'

type PageState = 'loading' | 'ready' | 'confirming' | 'success' | 'error'
type ErrorKind  = 'invalid_token' | 'already_confirmed' | 'cancelled' | 'not_found' | 'past' | 'unknown'

const route  = useRoute()
const router = useRouter()

// El link del correo es /confirmar-cita/:id  (sin token)
const idCita = route.params.id as string

const pageState = ref<PageState>('loading')
const errorKind = ref<ErrorKind>('unknown')
const errorMsg  = ref('')

const errorConfig = computed(() => {
  const map: Record<ErrorKind, { titulo: string; descripcion: string; icono: any; color: string }> = {
    invalid_token: {
      titulo:      'Enlace inválido',
      descripcion: 'El enlace de confirmación no es válido. Verifica que copiaste la URL completa del correo.',
      icono:  AlertCircle,
      color: 'text-red-300',
    },
    already_confirmed: {
      titulo:      'Cita ya confirmada',
      descripcion: '¡Esta cita ya fue confirmada! No es necesario hacer nada más. Te esperamos.',
      icono:  CheckCircle2,
      color: 'text-emerald-300',
    },
    cancelled: {
      titulo:      'Cita cancelada',
      descripcion: 'Esta cita fue cancelada y ya no está disponible para confirmar.',
      icono:  CalendarX,
      color: 'text-red-300',
    },
    not_found: {
      titulo:      'Cita no encontrada',
      descripcion: 'No encontramos la cita asociada a este enlace.',
      icono:  AlertCircle,
      color: 'text-red-300',
    },
    past: {
      titulo:      'Cita ya pasó',
      descripcion: 'La fecha de esta cita ya ocurrió. Si tienes dudas, comunícate con el consultorio.',
      icono:  CalendarX,
      color: 'text-amber-300',
    },
    unknown: {
      titulo:      'Algo salió mal',
      descripcion: errorMsg.value || 'Ocurrió un error inesperado. Intenta de nuevo o contacta al consultorio.',
      icono:  AlertCircle,
      color: 'text-red-300',
    },
  }
  return map[errorKind.value]
})

function clasificarError(message: string, status: number): ErrorKind {
  const msg = message.toLowerCase()
  if (msg.includes('ya está confirmada') || msg.includes('ya confirmada')) return 'already_confirmed'
  if (msg.includes('cancelada'))                                            return 'cancelled'
  if (msg.includes('ya pasó') || msg.includes('ya paso'))                  return 'past'
  if (status === 404)                                                       return 'not_found'
  return 'unknown'
}

onMounted(() => {
  if (!idCita) {
    errorKind.value = 'invalid_token'
    pageState.value = 'error'
    return
  }
  pageState.value = 'ready'
})

async function confirmarCita() {
  pageState.value = 'confirming'
  try {
    await httpClient.post(`/citas/${idCita}/confirmar`, {})
    pageState.value = 'success'
  } catch (err: any) {
    const status        = err?.response?.status  ?? 500
    const message       = err?.response?.data?.message ?? ''
    errorMsg.value      = message
    errorKind.value     = clasificarError(message, status)
    pageState.value     = 'error'
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a2f45] via-[#1e3a52] to-[#0f2030] px-4 py-10">
    <div class="w-full max-w-sm flex flex-col items-center gap-6">

      <img :src="logoUrl" alt="SISPOD" class="w-14 h-14 object-contain opacity-90" />

      <transition name="fade" mode="out-in">

        <!-- Cargando -->
        <div v-if="pageState === 'loading'" key="loading" class="flex flex-col items-center gap-4">
          <Loader2 class="w-8 h-8 text-white/60 animate-spin" />
          <p class="text-white/60 text-sm">Cargando...</p>
        </div>

        <!-- Listo para confirmar -->
        <div
          v-else-if="pageState === 'ready' || pageState === 'confirming'"
          key="ready"
          class="w-full flex flex-col gap-5"
        >
          <div class="text-center space-y-1">
            <h1 class="text-2xl font-bold text-white">Confirmar asistencia</h1>
            <p class="text-white/60 text-sm leading-relaxed">
              Al confirmar, el dentista sabrá que asistirás.
            </p>
          </div>

          <div class="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-4 flex items-center gap-3">
            <CalendarCheck class="w-5 h-5 text-white/60 shrink-0" />
            <div>
              <p class="text-[10px] font-bold text-white/50 uppercase tracking-wider">Cita #{{ idCita }}</p>
              <p class="text-sm text-white/80">Tu dentista recibirá la confirmación de inmediato.</p>
            </div>
          </div>

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

        <!-- Éxito -->
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
          <button
            class="mt-2 px-6 py-3 bg-white/10 border border-white/20 rounded-2xl text-white/80 text-sm font-medium hover:bg-white/20 transition-all"
            @click="router.push('/login')"
          >
            Ir al sistema
          </button>
        </div>

        <!-- Error -->
        <div v-else-if="pageState === 'error'" key="error" class="flex flex-col items-center gap-6 py-4">
          <div class="w-20 h-20 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
            <component :is="errorConfig.icono" class="w-10 h-10" :class="errorConfig.color" />
          </div>
          <div class="text-center space-y-2">
            <h1 class="text-xl font-bold text-white">{{ errorConfig.titulo }}</h1>
            <p class="text-white/60 text-sm leading-relaxed">{{ errorConfig.descripcion }}</p>
          </div>
        </div>

      </transition>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to       { opacity: 0; }
</style>