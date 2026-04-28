<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  CalendarCheck,
  Activity,
  ClipboardList,
  AlertTriangle,
  AlertCircle,
  Loader2,
} from 'lucide-vue-next'
import { useSessionStore } from '@/entities/session'
import { ROUTE_NAMES } from '@/shared/routes'
import { listDentistAppointments, type DentistAppointment } from '@/shared/api/dentistAppointments'

const router = useRouter()
const sessionStore = useSessionStore()

const appointments = ref<DentistAppointment[]>([])
const isLoading = ref(false)
const errorMessage = ref('')

const currentUserId = computed(() =>
  String(sessionStore.user?.id ?? sessionStore.user?.id_usuario ?? 0),
)

const todayKey = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`
})

const citasDelDia = computed(() =>
  appointments.value.filter((appointment) => {
    const date = new Date(appointment.startAt)
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}` === todayKey.value
  }),
)

const citasPendientes = computed(
  () => appointments.value.filter((appointment) => appointment.status === 'Pendiente').length,
)

const citasConfirmadas = computed(
  () => appointments.value.filter((appointment) => appointment.status === 'Confirmada').length,
)

const metricas = computed(() => [
  {
    titulo: 'Citas del Día',
    numero: citasDelDia.value.length,
    subtitulo: `${citasPendientes.value} Sin Confirmar`,
    textoBoton: 'Ver Agenda',
    icon: CalendarCheck,
    iconClass: 'text-accent',
    iconBg: 'bg-accent-dim',
  },
  {
    titulo: 'Citas Confirmadas',
    numero: citasConfirmadas.value,
    subtitulo: 'Próximas atenciones',
    textoBoton: 'Ver Calendario',
    icon: Activity,
    iconClass: 'text-emerald-500',
    iconBg: 'bg-emerald-500/10',
  },
  {
    titulo: 'Citas Pendientes',
    numero: citasPendientes.value,
    subtitulo: 'Requieren seguimiento',
    textoBoton: 'Revisar',
    icon: ClipboardList,
    iconClass: 'text-amber-500',
    iconBg: 'bg-amber-500/10',
  },
])

function formatDay(value: string): string {
  return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short' }).format(
    new Date(value),
  )
}

function formatHour(value: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(value))
}

const proximasCitas = computed(() =>
  [...appointments.value]
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
    .slice(0, 15)
    .map((appointment) => ({
      paciente: appointment.patientName,
      fecha: formatDay(appointment.startAt),
      hora: formatHour(appointment.startAt),
      tipo: appointment.type === '1' ? 'Consulta General' : 'Seguimiento',
      estado: appointment.status,
    })),
)

const alertas = computed(() =>
  [...appointments.value]
    .filter(
      (appointment) => appointment.status === 'Cancelada' || appointment.status === 'Pendiente',
    )
    .slice(0, 7)
    .map((appointment) => ({
      tipo: appointment.status === 'Cancelada' ? 'Cita cancelada' : 'Cita pendiente',
      paciente: appointment.patientName,
      hora: formatHour(appointment.startAt),
      kind: appointment.status === 'Cancelada' ? 'error' : 'warning',
    })),
)

async function loadDashboardAppointments() {
  isLoading.value = true
  errorMessage.value = ''

  const start = new Date()
  const end = new Date()
  end.setDate(end.getDate() + 45)

  try {
    appointments.value = await listDentistAppointments({
      desde: start.toISOString(),
      hasta: end.toISOString(),
    })
  } catch {
    errorMessage.value = 'No se pudieron cargar las citas del dentista'
  } finally {
    isLoading.value = false
  }
}

function goToCalendar() {
  router.push({ name: ROUTE_NAMES.DENTIST_CALENDAR, params: { id: currentUserId.value } })
}

function alertClass(kind: string) {
  return kind === 'error'
    ? 'bg-red-500/10 border border-red-400/30 text-red-600'
    : 'bg-amber-400/10 border border-amber-400/30 text-amber-700'
}

function alertIcon(kind: string) {
  return kind === 'error' ? AlertCircle : AlertTriangle
}

onMounted(async () => {
  await loadDashboardAppointments()
})
</script>

<template>
  <div class="fade-in">
    <div
      v-if="errorMessage"
      class="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-600"
    >
      {{ errorMessage }}
    </div>

    <div v-if="isLoading" class="mb-4 inline-flex items-center gap-2 text-sm text-muted">
      <Loader2 class="h-4 w-4 animate-spin" />
      Cargando métricas del dentista...
    </div>

    <!-- ── Header ──────────────────────────────────────────────────────── -->
    <div class="mb-8">
      <div class="flex items-center gap-1.5 text-xs text-muted font-medium mb-2">
        <span class="text-muted/60">🏠</span>
        <span class="text-muted/60">&gt;</span>
        <span class="bg-card border border-border px-2 py-0.5 rounded-lg">Resumen</span>
      </div>
      <h1 class="font-display text-4xl font-semibold text-black">Resumen</h1>
    </div>

    <!-- ── Metric cards ─────────────────────────────────────────────────── -->
    <section class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div
        v-for="item in metricas"
        :key="item.titulo"
        class="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4"
      >
        <!-- Title row -->
        <div class="flex items-center gap-2">
          <div
            :class="['w-8 h-8 rounded-xl flex items-center justify-center shrink-0', item.iconBg]"
          >
            <component :is="item.icon" :class="['w-4 h-4', item.iconClass]" />
          </div>
          <p class="text-sm font-semibold text-black">{{ item.titulo }}</p>
        </div>

        <!-- Number + badge + button -->
        <div class="flex items-center justify-between">
          <span class="text-4xl font-display font-semibold text-black">{{ item.numero }}</span>

          <span
            class="text-xs font-semibold text-muted px-3 py-1 bg-surface border border-border rounded-full"
          >
            {{ item.subtitulo }}
          </span>

          <button
            class="flex items-center gap-2 bg-ink/65 text-text-secondary hover:bg-ink/80 px-3 py-2 rounded-2xl text-xs font-medium transition-all hover:scale-105 active:scale-95"
            @click="goToCalendar"
          >
            {{ item.textoBoton }}
          </button>
        </div>
      </div>
    </section>

    <!-- ── Próximas Citas ───────────────────────────────────────────────── -->
    <section class="bg-card border border-border rounded-2xl p-6 mb-6">
      <h2 class="font-display font-bold text-black text-lg mb-5 text-center">Próximas Citas</h2>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-x-4 gap-y-2 mb-6">
        <div
          v-for="(cita, i) in proximasCitas"
          :key="i"
          class="bg-surface border border-border rounded-xl px-4 py-2 flex justify-between items-center text-xs text-muted"
        >
          <span class="font-bold text-black truncate w-1/3">{{ cita.paciente }}</span>
          <span class="w-1/3 text-center">{{ cita.fecha }} · {{ cita.hora }}</span>
          <span class="w-1/3 text-right truncate">{{ cita.tipo }}</span>
        </div>

        <div
          v-if="!isLoading && proximasCitas.length === 0"
          class="col-span-full rounded-xl border border-border bg-surface/50 px-4 py-6 text-center text-sm text-muted"
        >
          No hay citas próximas registradas.
        </div>
      </div>

      <div class="flex justify-center">
        <button
          class="flex items-center gap-2 bg-ink/65 text-text-secondary hover:bg-ink/80 px-5 py-2.5 rounded-2xl text-sm font-medium transition-all hover:scale-105 active:scale-95"
          @click="goToCalendar"
        >
          Ver Agenda
        </button>
      </div>
    </section>

    <!-- ── Alertas ─────────────────────────────────────────────────────── -->
    <section class="bg-card border border-border rounded-2xl p-6">
      <h2 class="font-display font-bold text-black text-lg mb-5 text-center">Alertas</h2>

      <div class="space-y-2 mb-6">
        <div
          v-for="(alerta, i) in alertas"
          :key="i"
          :class="[
            'flex items-center justify-between rounded-xl px-5 py-2.5 text-xs font-semibold',
            alertClass(alerta.kind),
          ]"
        >
          <div class="flex items-center gap-2 w-1/3">
            <component :is="alertIcon(alerta.kind)" class="w-3.5 h-3.5 shrink-0" />
            <span>{{ alerta.tipo }}</span>
          </div>
          <span class="w-1/3 text-center font-medium">{{ alerta.paciente }}</span>
          <span class="w-1/3 text-right font-medium">{{ alerta.hora }}</span>
        </div>

        <div
          v-if="!isLoading && alertas.length === 0"
          class="rounded-xl border border-border bg-surface/50 px-4 py-3 text-center text-sm text-muted"
        >
          No hay alertas para mostrar.
        </div>
      </div>

      <div class="flex justify-center">
        <button
          class="flex items-center gap-2 bg-ink/65 text-text-secondary hover:bg-ink/80 px-5 py-2.5 rounded-2xl text-sm font-medium transition-all hover:scale-105 active:scale-95"
        >
          Ver Más
        </button>
      </div>
    </section>
  </div>
</template>
