<script setup lang="ts">
/**
 * @layer  pages / asistente / dashboard / ui
 * @file   AssistantDashboard.vue
 */

import { ref } from 'vue'
import {
  CalendarCheck,
  ClipboardX,
  AlertCircle,
  CalendarClock,
  Ban,
  RefreshCw,
  FolderOpen,
  CalendarDays,
  Loader2,
} from 'lucide-vue-next'
import { useAssistantDashboard } from '@/features/assistant-dashboard'
import type { EstadoCita } from '@/features/assistant-dashboard'

// ── Feature ───────────────────────────────────────────────────────────────────
const {
  isLoading,
  error,
  nombreAsistente,
  totalCitasHoy,
  citasPorConfirmar,
  citasCanceladas,
  totalSinExpediente,
  agendaHoy,
  irACalendario,
  irAPacientes,
  cancelarCita,
  refetch,
} = useAssistantDashboard()

// ── Estado UI local ───────────────────────────────────────────────────────────
type ToastKind = 'success' | 'error'

const toastVisible = ref(false)
const toastMessage = ref('')
const toastKind    = ref<ToastKind>('success')
let   toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(message: string, kind: ToastKind = 'success'): void {
  if (toastTimer) clearTimeout(toastTimer)
  toastMessage.value = message
  toastKind.value    = kind
  toastVisible.value = true
  toastTimer = setTimeout(() => { toastVisible.value = false }, 3500)
}

const cancellingId = ref<number | null>(null)

async function handleCancelar(id: number, paciente: string): Promise<void> {
  if (cancellingId.value !== null) return
  cancellingId.value = id
  try {
    await cancelarCita(id)
    showToast(`Cita de ${paciente} cancelada`, 'success')
  } catch {
    showToast('No se pudo cancelar la cita. Intenta de nuevo.', 'error')
  } finally {
    cancellingId.value = null
  }
}

// ── Helpers de estilos ────────────────────────────────────────────────────────
const ESTADO_BADGE: Record<EstadoCita, string> = {
  Confirmada: 'bg-emerald-100 text-emerald-700',
  Pendiente:  'bg-amber-100  text-amber-700',
  Cancelada:  'bg-red-100    text-red-600',
  Atendida:   'bg-blue-100   text-blue-700',
}

function estadoBadgeClass(estado: EstadoCita): string {
  return ESTADO_BADGE[estado] ?? 'bg-surface text-muted'
}
</script>

<template>
  <div class="fade-in">

    <!-- ── Toast ──────────────────────────────────────────────────────────── -->
    <Transition name="toast-slide">
      <div
        v-if="toastVisible"
        :class="[
          'fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl',
          'text-sm font-semibold shadow-lg',
          toastKind === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white',
        ]"
      >
        {{ toastMessage }}
      </div>
    </Transition>

    <!-- ── Header ─────────────────────────────────────────────────────────── -->
    <div class="mb-8">
      <div class="flex items-center gap-1.5 text-xs text-muted font-medium mb-2">
        <span class="text-muted/60">🏠</span>
        <span class="text-muted/60">&gt;</span>
        <span class="bg-card border border-border px-2 py-0.5 rounded-lg">Panel de Control</span>
      </div>

      <div class="flex items-center justify-between">
        <div>
          <h1 class="font-display text-2xl font-extrabold text-black">Dashboard Recepción</h1>
          <p class="text-sm text-muted mt-1">
            Bienvenida,
            <span class="font-semibold text-black">{{ nombreAsistente }}</span>.
            Gestión rápida de agenda y pacientes.
          </p>
        </div>

        <button
          class="p-2 rounded-xl text-muted hover:text-black hover:bg-surface border border-border transition-colors disabled:opacity-50"
          title="Actualizar datos"
          :disabled="isLoading"
          @click="refetch"
        >
          <Loader2 v-if="isLoading" class="w-4 h-4 animate-spin" />
          <RefreshCw v-else class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- ── Error global ───────────────────────────────────────────────────── -->
    <div
      v-if="error"
      class="mb-6 flex items-center gap-3 bg-red-500/10 border border-red-400/30 text-red-600 rounded-2xl px-5 py-4 text-sm font-medium"
    >
      <AlertCircle class="w-4 h-4 flex-shrink-0" />
      <span>{{ error }}</span>
      <button class="ml-auto underline text-xs hover:no-underline" @click="refetch">
        Reintentar
      </button>
    </div>

    <!-- ── Metric cards ────────────────────────────────────────────────────── -->
    <section class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

      <!-- Citas del Día -->
      <div class="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-accent-dim">
            <CalendarCheck class="w-4 h-4 text-accent" />
          </div>
          <p class="text-sm font-semibold text-black">Citas del Día</p>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-3xl font-display font-extrabold text-black">
            <span v-if="isLoading" class="inline-block w-8 h-8 bg-surface rounded-lg animate-pulse" />
            <template v-else>{{ totalCitasHoy }}</template>
          </span>
          <span class="text-xs font-semibold text-muted px-3 py-1 bg-surface border border-border rounded-full">
            {{ citasPorConfirmar }} por confirmar
          </span>
          <button
            class="flex items-center gap-2 bg-ink/65 text-text-secondary hover:bg-ink/80 px-3 py-2 rounded-2xl text-xs font-medium transition-all hover:scale-105 active:scale-95"
            @click="irACalendario"
          >
            Ver Agenda
          </button>
        </div>
      </div>

      <!-- Sin Expediente -->
      <div class="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-500/10">
            <FolderOpen class="w-4 h-4 text-emerald-500" />
          </div>
          <p class="text-sm font-semibold text-black">Sin Expediente</p>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-3xl font-display font-extrabold text-black">
            <span v-if="isLoading" class="inline-block w-8 h-8 bg-surface rounded-lg animate-pulse" />
            <template v-else>{{ totalSinExpediente }}</template>
          </span>
          <span class="text-xs font-semibold text-muted px-3 py-1 bg-surface border border-border rounded-full">
            Pendientes
          </span>
          <button
            class="flex items-center gap-2 bg-ink/65 text-text-secondary hover:bg-ink/80 px-3 py-2 rounded-2xl text-xs font-medium transition-all hover:scale-105 active:scale-95"
            @click="irAPacientes"
          >
            Gestionar
          </button>
        </div>
      </div>

      <!-- Citas Canceladas -->
      <div class="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-amber-500/10">
            <ClipboardX class="w-4 h-4 text-amber-500" />
          </div>
          <p class="text-sm font-semibold text-black">Citas Canceladas</p>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-3xl font-display font-extrabold text-black">
            <span v-if="isLoading" class="inline-block w-8 h-8 bg-surface rounded-lg animate-pulse" />
            <template v-else>{{ citasCanceladas }}</template>
          </span>
          <span class="text-xs font-semibold text-muted px-3 py-1 bg-surface border border-border rounded-full">
            Requieren atención
          </span>
          <button
            class="flex items-center gap-2 bg-ink/65 text-text-secondary hover:bg-ink/80 px-3 py-2 rounded-2xl text-xs font-medium transition-all hover:scale-105 active:scale-95"
            @click="irACalendario"
          >
            Revisar
          </button>
        </div>
      </div>

    </section>

    <!-- ── Agenda del Día (ancho completo) ────────────────────────────────── -->
    <section class="bg-card border border-border rounded-2xl p-6 flex flex-col">
      <h2 class="font-display font-bold text-black text-lg mb-5">Control de Agenda (Hoy)</h2>

      <!-- Skeleton -->
      <template v-if="isLoading">
        <div class="flex-1 space-y-2 mb-6">
          <div
            v-for="i in 4"
            :key="i"
            class="bg-surface border border-border rounded-xl px-4 py-3 flex justify-between items-center animate-pulse"
          >
            <div class="w-1/3 space-y-1.5">
              <div class="h-3.5 bg-border rounded w-3/4" />
              <div class="h-2.5 bg-border rounded w-1/2" />
            </div>
            <div class="h-3.5 bg-border rounded w-16" />
            <div class="flex gap-1">
              <div class="w-8 h-8 bg-border rounded-lg" />
              <div class="w-8 h-8 bg-border rounded-lg" />
            </div>
          </div>
        </div>
      </template>

      <!-- Empty state -->
      <template v-else-if="agendaHoy.length === 0">
        <div class="flex flex-col items-center justify-center py-12 text-center">
          <CalendarDays class="w-10 h-10 text-muted/40 mb-3" />
          <p class="text-sm font-semibold text-black">Sin citas para hoy</p>
          <p class="text-xs text-muted mt-1">No hay citas activas programadas para hoy.</p>
        </div>
      </template>

      <!-- Lista de citas -->
      <template v-else>
        <div class="space-y-2 mb-6">
          <div
            v-for="cita in agendaHoy"
            :key="cita.id"
            class="bg-surface border border-border rounded-xl px-4 py-3 flex justify-between items-center text-sm group hover:border-accent/30 transition-colors"
          >
            <!-- Paciente + tipo -->
            <div class="w-1/3">
              <span class="font-bold text-black block truncate">{{ cita.paciente }}</span>
              <span class="text-xs text-muted">{{ cita.tipo }}</span>
            </div>

            <!-- Hora + badge de estado -->
            <div class="w-1/3 flex flex-col items-center gap-1">
              <span class="text-sm font-medium text-black">{{ cita.hora }}</span>
              <span
                :class="[
                  'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                  estadoBadgeClass(cita.estado),
                ]"
              >
                {{ cita.estado }}
              </span>
            </div>

            <!-- Acciones -->
            <div class="w-1/3 flex justify-end gap-1">
              <button
                class="p-2 rounded-lg text-muted hover:text-accent hover:bg-accent-dim transition-colors"
                title="Ir al calendario para reprogramar"
                @click="irACalendario"
              >
                <CalendarClock class="w-4 h-4" />
              </button>
              <button
                class="p-2 rounded-lg text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title="Cancelar cita"
                :disabled="cancellingId === cita.id || cita.estado === 'Cancelada'"
                @click="handleCancelar(cita.id, cita.paciente)"
              >
                <Loader2 v-if="cancellingId === cita.id" class="w-4 h-4 animate-spin" />
                <Ban v-else class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </template>

      <div class="flex justify-center mt-auto pt-2">
        <button
          class="flex items-center gap-2 bg-ink/65 text-text-secondary hover:bg-ink/80 px-5 py-2.5 rounded-2xl text-sm font-medium transition-all hover:scale-105 active:scale-95"
          @click="irACalendario"
        >
          Ver Calendario Completo
        </button>
      </div>
    </section>

  </div>
</template>

<style scoped>
.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.toast-slide-enter-from,
.toast-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>