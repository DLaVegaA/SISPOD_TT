<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  AlertTriangle,
  CalendarCheck,
  ClipboardList,
  FileText,
  Files,
  Loader2,
  NotebookText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
} from 'lucide-vue-next'
import { useSessionStore } from '@/entities/session'
import { getBitacorasByEstado } from '@/entities/bitacora/api/bitacoraApi'
import type { LogEntry } from '@/entities/bitacora/model/types'
import { seguimientoApi, type SeguimientoListItem } from '@/entities/seguimiento'
import { httpClient } from '@/shared/api/http'
import { ROUTE_NAMES } from '@/shared/routes'
import { listDentistAppointments, type DentistAppointment } from '@/shared/api/dentistAppointments'

const router = useRouter()
const sessionStore = useSessionStore()

const appointments = ref<DentistAppointment[]>([])
const alertasSeguimiento = ref<SeguimientoListItem[]>([])
const bitacoras = ref<LogEntry[]>([])
const cuestionariosRecientes = ref<CuestionarioResumen[]>([])
const totalCuestionarios = ref(0)
const isLoading = ref(false)
const errorMessage = ref('')

type CuestionarioResumen = {
  id_cuestionario: number
  nombre_cuestionario: string
  tipo_cuestionario: '24h' | '72h'
  procedimiento: string
}

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

const todayLabel = computed(() => {
  const formatter = new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
  const value = formatter.format(new Date())
  return value.charAt(0).toUpperCase() + value.slice(1)
})

const citasHoy = computed(() =>
  [...citasDelDia.value]
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
    .map((appointment, index) => {
      const start = new Date(appointment.startAt)
      const end = new Date(appointment.endAt)
      const durationMin = Number.isFinite(end.getTime())
        ? Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000))
        : 0
      return {
        id: appointment.id,
        paciente: appointment.patientName,
        hora: formatHour(appointment.startAt),
        duracion: durationMin,
        tipo: appointment.type,
        estado: appointment.status,
        isNext: index === 0,
      }
    }),
)

const nextCitaLabel = computed(() => {
  const next = citasHoy.value[0]
  if (!next) return 'Sin citas programadas hoy'
  return `Próxima: ${next.hora} — ${next.paciente}`
})

const moreCitasCount = computed(() =>
  Math.max(0, citasHoy.value.length - Math.min(citasHoy.value.length, 4)),
)

function formatHour(value: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(value))
}

function formatShortDate(value: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(value))
}

// Alertas basadas en seguimientos con estado "alerta"
const alertas = computed(() => {
  return alertasSeguimiento.value.slice(0, 7).map((seguimiento) => ({
    tipo: `Seguimiento: ${seguimiento.procedimiento}`,
    paciente: seguimiento.nombre,
    hora: formatHour(seguimiento.fecha_inicio),
    kind: 'error',
  }))
})

const alertCount = computed(() => alertas.value.length)

const userDisplayName = computed(() => {
  const user = sessionStore.user as
    | { nombre?: string; apellido_paterno?: string; name?: string }
    | undefined
  if (!user) return 'Usuario'
  if (user.nombre || user.apellido_paterno) {
    return [user.nombre, user.apellido_paterno].filter(Boolean).join(' ')
  }
  return user.name || 'Usuario'
})

const userInitials = computed(() => {
  const parts = userDisplayName.value.trim().split(/\s+/)
  const first = parts[0]?.charAt(0) || 'U'
  const second = parts[1]?.charAt(0) || parts[0]?.charAt(1) || 'S'
  return `${first}${second}`.toUpperCase()
})

const cuestionariosPendientes = computed(() =>
  cuestionariosRecientes.value.map((item) => ({
    id: item.id_cuestionario.toString(),
    paciente: item.nombre_cuestionario,
    status: item.tipo_cuestionario,
    nota: item.procedimiento,
    alerta: false,
  })),
)

const bitacorasPendientes = computed(() =>
  bitacoras.value.map((bitacora) => ({
    id: bitacora.id,
    paciente: bitacora.patientName,
    nota: `${bitacora.appointmentType} — ${formatShortDate(bitacora.date)}`,
    urgente: false,
  })),
)

const historialesHoy = computed(() => {
  const now = new Date().getTime()
  return citasDelDia.value
    .filter((cita) => new Date(cita.startAt).getTime() < now)
    .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime())
    .slice(0, 5)
    .map((cita) => ({
      paciente: cita.patientName,
      ultimaVisita: `${cita.type} · ${formatHour(cita.startAt)}`,
      esPrimera: !cita.type?.includes('Extracción') && !cita.type?.includes('Limpieza'),
    }))
})

async function loadDashboardAppointments() {
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
  }
}

async function loadDashboardAlerts() {
  try {
    const response = await seguimientoApi.listar('alerta')
    alertasSeguimiento.value = response.seguimientos ?? []
  } catch {
    errorMessage.value = 'No se pudieron cargar las alertas de seguimiento'
  }
}

async function loadDashboardBinnacles() {
  try {
    bitacoras.value = await getBitacorasByEstado('Pendiente')
  } catch {
    errorMessage.value = 'No se pudieron cargar las bitácoras pendientes'
  }
}

async function loadDashboardQuestionnaires() {
  try {
    const response = await httpClient.get<{ cuestionarios: any[] }>('/cuestionario?todos=true')
    const lista = response.cuestionarios ?? []
    totalCuestionarios.value = lista.length
    cuestionariosRecientes.value = lista.slice(0, 5).map((item) => ({
      id_cuestionario: item.id_cuestionario,
      nombre_cuestionario: item.nombre_cuestionario,
      tipo_cuestionario: item.tipo_cuestionario,
      procedimiento:
        item.procedimiento_asociado?.nombre_procedimiento ??
        `Procedimiento #${item.id_procedimiento}`,
    }))
  } catch {
    errorMessage.value = 'No se pudieron cargar los cuestionarios recientes'
  }
}

function goToCalendar() {
  router.push({ name: ROUTE_NAMES.DENTIST_CALENDAR, params: { id: currentUserId.value } })
}

function goToClinicalHistory() {
  router.push({ name: ROUTE_NAMES.DENTIST_CLINICAL_HISTORY, params: { id: currentUserId.value } })
}

function goToBinnacle() {
  router.push({ name: ROUTE_NAMES.DENTIST_BINNACLE, params: { id: currentUserId.value } })
}

function goToQuestionnaires() {
  router.push({ name: ROUTE_NAMES.DENTIST_QUESTIONNAIRES, params: { id: currentUserId.value } })
}

function goToFollowUp() {
  router.push({ name: ROUTE_NAMES.DENTIST_FOLLOW_UP, params: { id: currentUserId.value } })
}

onMounted(async () => {
  isLoading.value = true
  errorMessage.value = ''

  await Promise.all([
    loadDashboardAppointments(),
    loadDashboardAlerts(),
    loadDashboardBinnacles(),
    loadDashboardQuestionnaires(),
  ])

  isLoading.value = false
})
</script>

<template>
  <div class="fade-in py-4 px-2 md:px-4">
    <div
      v-if="errorMessage"
      class="mb-6 rounded-xl border-l-4 border-red-500 bg-red-50/80 p-3 text-sm font-medium text-red-700 shadow-sm"
    >
      {{ errorMessage }}
    </div>

    <div v-if="isLoading" class="mb-4 inline-flex items-center gap-2 text-sm text-muted/80">
      <Loader2 class="h-4 w-4 animate-spin text-accent" />
      Cargando información del panel...
    </div>

    <!-- Topbar -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl md:text-3xl font-semibold text-black">Panel del dentista</h1>
        <p class="text-sm text-muted flex flex-wrap items-center gap-2 mt-1">
          <Calendar class="h-3.5 w-3.5" />
          {{ todayLabel }}
          <span class="text-muted/40">·</span>
          <span class="font-semibold text-accent"
            >{{ citasDelDia.length }} citas programadas hoy</span
          >
        </p>
      </div>
      <div class="flex items-center gap-4">
        <!-- <button
          class="relative h-10 w-10 rounded-full border border-border bg-white/60 text-muted transition-all hover:bg-white hover:shadow-sm"
          type="button"
          aria-label="Notificaciones"
        >
          <Bell class="h-4 w-4 mx-auto" />
          <span
            v-if="alertCount > 0"
            class="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-1 ring-white"
          ></span>
        </button> -->
        <div
          class="h-10 w-10 rounded-full bg-gradient-to-br from-accent to-ink text-white text-sm font-bold flex items-center justify-center shadow-sm"
        >
          {{ userInitials }}
        </div>
      </div>
    </div>

    <!-- Stats Row -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="bg-card border border-border rounded-2xl p-4 shadow-sm">
        <div class="flex items-start justify-between">
          <div class="stat-label text-sm font-medium text-muted flex items-center gap-1">
            <AlertTriangle class="h-4 w-4 text-red-500" />
            Alertas activas
          </div>
          <div class="stat-val text-2xl font-bold text-red-700">{{ alertCount }}</div>
        </div>
        <div class="stat-sub text-xs text-muted mt-2">Respuestas de riesgo en cuestionarios</div>
      </div>

      <div class="bg-card border border-border rounded-2xl p-4 shadow-sm">
        <div class="flex items-start justify-between">
          <div class="stat-label text-sm font-medium text-muted flex items-center gap-1">
            <CalendarCheck class="h-4 w-4 text-accent" />
            Citas hoy
          </div>
          <div class="stat-val text-2xl font-bold text-black">{{ citasDelDia.length }}</div>
        </div>
        <div class="stat-sub text-xs text-muted mt-2">{{ nextCitaLabel }}</div>
      </div>

      <div class="bg-card border border-border rounded-2xl p-4 shadow-sm">
        <div class="flex items-start justify-between">
          <div class="stat-label text-sm font-medium text-muted flex items-center gap-1">
            <ClipboardList class="h-4 w-4 text-amber-700" />
            Total de cuestionarios
          </div>
          <div class="stat-val text-2xl font-bold text-amber-700">
            {{ totalCuestionarios }}
          </div>
        </div>
        <div class="stat-sub text-xs text-muted mt-2">Incluye activos e inactivos</div>
      </div>

      <div class="bg-card border border-border rounded-2xl p-4 shadow-sm">
        <div class="flex items-start justify-between">
          <div class="stat-label text-sm font-medium text-muted flex items-center gap-1">
            <NotebookText class="h-4 w-4 text-green-700" />
            Bitácoras pendientes
          </div>
          <div class="stat-val text-2xl font-bold text-black">{{ bitacorasPendientes.length }}</div>
        </div>
        <div class="stat-sub text-xs text-muted mt-2">Por completar después de la consulta</div>
      </div>
    </div>

    <!-- Main Grid: Alertas y Citas del día -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- Alertas de citas (estilo mejorado) -->
      <div class="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div class="flex items-center justify-between p-4 border-b border-border bg-surface/30">
          <div class="flex items-center gap-2 font-semibold text-black">
            <AlertTriangle class="h-5 w-5 text-red-500" />
            Alertas de seguimiento
            <span
              class="bg-red-500 text-white text-[11px] font-bold rounded-full px-2 py-0.5 ml-1"
              >{{ alertCount }}</span
            >
          </div>
          <button @click="goToFollowUp" class="text-xs text-accent hover:underline font-medium">
            Ver todas ↗
          </button>
        </div>
        <div v-if="alertas.length === 0" class="p-6 text-center text-sm text-muted">
          <CheckCircle2 class="h-8 w-8 mx-auto text-muted/30 mb-2" />
          Sin alertas activas
        </div>
        <div class="divide-y divide-border">
          <div
            v-for="(alerta, idx) in alertas.slice(0, 3)"
            :key="idx"
            class="flex gap-3 p-4 hover:bg-accent/5 transition"
          >
            <div
              :class="[
                'h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold',
                alerta.kind === 'error' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700',
              ]"
            >
              {{ alerta.paciente.slice(0, 2).toUpperCase() }}
            </div>
            <div class="flex-1">
              <div class="font-semibold text-black">{{ alerta.paciente }}</div>
              <div class="text-xs text-muted">{{ alerta.tipo }}</div>
              <div class="flex items-center gap-2 mt-1">
                <span
                  :class="[
                    'text-[10px] font-bold px-2 py-0.5 rounded-full',
                    alerta.kind === 'error'
                      ? 'bg-red-100 text-red-600'
                      : 'bg-amber-100 text-amber-700',
                  ]"
                >
                  {{ alerta.kind === 'error' ? 'URGENTE' : 'PENDIENTE' }}
                </span>
                <span class="text-[11px] text-muted/60">{{ alerta.hora }}</span>
              </div>
            </div>
            <button @click="goToClinicalHistory" class="text-accent text-sm font-medium">
              Revisar
            </button>
          </div>
        </div>
      </div>

      <!-- Citas del día (estilo timeline) -->
      <div class="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div class="flex items-center justify-between p-4 border-b border-border bg-surface/30">
          <div class="flex items-center gap-2 font-semibold text-black">
            <Clock class="h-5 w-5 text-accent" />
            Citas del día
          </div>
          <button @click="goToCalendar" class="text-xs text-accent hover:underline font-medium">
            Ver agenda ↗
          </button>
        </div>
        <div v-if="citasHoy.length === 0" class="p-6 text-center text-sm text-muted">
          <Calendar class="h-8 w-8 mx-auto text-muted/30 mb-2" />
          No hay citas programadas hoy
        </div>
        <div class="divide-y divide-border">
          <div
            v-for="(cita, idx) in citasHoy.slice(0, 4)"
            :key="cita.id"
            class="p-4 hover:bg-accent/5 transition"
            :class="{ 'bg-accent/5 border-l-4 border-accent': idx === 0 && citasHoy.length > 0 }"
          >
            <div class="flex items-start gap-3">
              <div class="min-w-[70px] text-center bg-surface/60 rounded-lg px-2 py-1">
                <div class="text-sm font-bold text-black">{{ cita.hora }}</div>
                <div class="text-[10px] text-muted">{{ cita.duracion }} min</div>
              </div>
              <div class="flex-1">
                <div class="font-semibold text-black">{{ cita.paciente }}</div>
                <div class="text-xs text-muted">{{ cita.tipo }}</div>
              </div>
              <div class="flex gap-1">
                <span
                  v-if="cita.isNext"
                  class="text-[10px] font-bold px-2 py-1 rounded-full bg-accent/15 text-accent"
                  >PRÓXIMA</span
                >
                <button
                  @click="goToClinicalHistory"
                  class="h-8 w-8 rounded-lg border border-accent/30 text-accent hover:bg-accent/10 flex items-center justify-center"
                >
                  <FileText class="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div v-if="moreCitasCount > 0" class="p-3 border-t border-border text-center text-sm">
          <button @click="goToCalendar" class="text-accent font-medium">
            + {{ moreCitasCount }} citas más →
          </button>
        </div>
      </div>
    </div>

    <!-- Bottom Grid: Cuestionarios, Bitácoras e Historiales -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Cuestionarios 72h/24h -->
      <div class="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div class="flex items-center justify-between p-4 border-b border-border bg-surface/30">
          <div class="flex items-center gap-2 font-semibold text-black">
            <ClipboardList class="h-5 w-5 text-amber-600" />
            Últimos cuestionarios creados
          </div>
          <button
            @click="goToQuestionnaires"
            class="text-xs text-accent hover:underline font-medium"
          >
            Gestionar ↗
          </button>
        </div>
        <div class="divide-y divide-border">
          <div
            v-for="item in cuestionariosPendientes"
            :key="item.id"
            class="flex items-center gap-3 p-4 hover:bg-accent/5 transition"
          >
            <div
              :class="[
                'h-8 w-8 rounded-full flex items-center justify-center',
                item.status === '24h' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700',
              ]"
            >
              <Clock v-if="item.status === '72h'" class="h-4 w-4" />
              <AlertCircle v-else class="h-4 w-4" />
            </div>
            <div class="flex-1">
              <div class="font-medium text-black">{{ item.paciente }}</div>
              <div class="text-xs text-muted">{{ item.nota }}</div>
            </div>
            <span
              :class="[
                'text-[10px] font-bold px-2 py-1 rounded-full',
                item.status === '24h' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700',
              ]"
            >
              {{ item.status }}
            </span>
          </div>
        </div>
      </div>

      <!-- Bitácoras pendientes -->
      <div class="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div class="flex items-center justify-between p-4 border-b border-border bg-surface/30">
          <div class="flex items-center gap-2 font-semibold text-black">
            <NotebookText class="h-5 w-5 text-green-700" />
            Bitácoras pendientes
          </div>
          <button @click="goToBinnacle" class="text-xs text-accent hover:underline font-medium">
            Completar ↗
          </button>
        </div>
        <div v-if="bitacorasPendientes.length === 0" class="p-6 text-center text-sm text-muted">
          <CheckCircle2 class="h-8 w-8 mx-auto text-muted/30 mb-2" />
          Sin bitácoras pendientes
        </div>
        <div v-else class="divide-y divide-border">
          <div
            v-for="bit in bitacorasPendientes"
            :key="bit.id"
            class="flex items-center gap-3 p-4 hover:bg-accent/5 transition"
          >
            <div
              class="h-2 w-2 rounded-full"
              :class="bit.urgente ? 'bg-red-500' : 'bg-amber-500'"
            ></div>
            <div class="flex-1">
              <div class="font-medium text-black">{{ bit.paciente }}</div>
              <div class="text-xs text-muted">{{ bit.nota }}</div>
            </div>
            <span
              :class="[
                'text-[10px] font-bold px-2 py-1 rounded-full',
                bit.urgente ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700',
              ]"
            >
              {{ bit.urgente ? 'Urgente' : 'Pendiente' }}
            </span>
          </div>
        </div>
        <!-- <div class="p-4 border-t border-border">
          <div class="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div class="h-full bg-green-600 rounded-full" style="width: 0%"></div>
          </div>
          <p class="text-[11px] text-muted mt-2">
            0 de {{ bitacorasPendientes.length }} bitácoras completadas hoy
          </p>
        </div> -->
      </div>

      <!-- Historiales de citas de hoy -->
      <div class="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div class="flex items-center justify-between p-4 border-b border-border bg-surface/30">
          <div class="flex items-center gap-2 font-semibold text-black">
            <Files class="h-5 w-5 text-indigo-500" />
            Historial de citas de hoy
          </div>
          <button
            @click="goToClinicalHistory"
            class="text-xs text-accent hover:underline font-medium"
          >
            Ver expedientes ↗
          </button>
        </div>
        <div v-if="historialesHoy.length === 0" class="p-6 text-center text-sm text-muted">
          <CheckCircle2 class="h-8 w-8 mx-auto text-muted/30 mb-2" />
          No se han atendido citas el día de hoy
        </div>
        <div v-else class="divide-y divide-border">
          <div
            v-for="(hist, idx) in historialesHoy.slice(0, 5)"
            :key="idx"
            class="flex items-center gap-3 p-4 hover:bg-accent/5 transition"
          >
            <div
              class="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center"
            >
              {{ hist.paciente.slice(0, 2).toUpperCase() }}
            </div>
            <div class="flex-1">
              <div class="font-medium text-black">{{ hist.paciente }}</div>
              <div class="text-xs text-muted">
                {{ hist.ultimaVisita || 'Consulta programada hoy' }}
              </div>
            </div>
            <button @click="goToClinicalHistory" class="text-accent text-sm font-medium">
              {{ hist.esPrimera ? 'Crear ↗' : 'Abrir ↗' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
