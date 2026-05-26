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

// Alertas basadas en citas (canceladas/pendientes) como en el original
const alertas = computed(() => {
  const fromAppointments = [...appointments.value]
    .filter(
      (appointment) => appointment.status === 'Cancelada' || appointment.status === 'Pendiente',
    )
    .slice(0, 7)
    .map((appointment) => ({
      tipo: appointment.status === 'Cancelada' ? 'Cita cancelada' : 'Cita pendiente',
      paciente: appointment.patientName,
      hora: formatHour(appointment.startAt),
      kind: appointment.status === 'Cancelada' ? 'error' : 'warning',
    }))

  if (fromAppointments.length > 0) return fromAppointments

  return [
    { tipo: 'Cita pendiente', paciente: 'Maria Ramirez', hora: '08:30', kind: 'warning' },
    { tipo: 'Cita cancelada', paciente: 'Jorge Torres', hora: '10:15', kind: 'error' },
    { tipo: 'Cita pendiente', paciente: 'Sofia Lopez', hora: '11:00', kind: 'warning' },
  ]
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

const cuestionariosPendientes = ref([
  { id: 'q1', paciente: 'Ana Flores', status: '72h', nota: 'Respondido', alerta: false },
  { id: 'q2', paciente: 'Jorge Torres', status: '72h', nota: 'Con alerta', alerta: true },
  { id: 'q3', paciente: 'Patricia Soto', status: '72h', nota: 'Pendiente de envío', alerta: false },
  {
    id: 'q4',
    paciente: 'María Ramírez',
    status: '24h',
    nota: 'Respondido · Alerta crítica',
    alerta: true,
  },
  {
    id: 'q5',
    paciente: 'Sofía López',
    status: '24h',
    nota: 'Enviado hace 22 hrs · Pendiente',
    alerta: false,
  },
] as Array<{ id: string; paciente: string; status: '72h' | '24h'; nota: string; alerta: boolean }>)

const bitacorasPendientes = ref([
  { id: 'b1', paciente: 'María Ramírez', nota: 'Extracción premolar — 24/05', urgente: true },
  { id: 'b2', paciente: 'Jorge Torres', nota: 'Tratamiento de conducto — 23/05', urgente: false },
  { id: 'b3', paciente: 'Sofía López', nota: 'Colocación corona — 22/05', urgente: false },
  { id: 'b4', paciente: 'Roberto Vega', nota: 'Revisión brackets — 21/05', urgente: false },
] as Array<{ id: string; paciente: string; nota: string; urgente: boolean }>)

const historialesHoy = computed(() => {
  const citasUnicas = citasHoy.value.slice(0, 5).map((cita) => ({
    paciente: cita.paciente,
    ultimaVisita: cita.tipo,
    esPrimera: !cita.tipo?.includes('Extracción') && !cita.tipo?.includes('Limpieza'),
  }))
  if (citasUnicas.length === 0) {
    return [
      { paciente: 'Carlos Mendoza', ultimaVisita: 'Limpieza · 15/04', esPrimera: false },
      { paciente: 'Ana Flores', ultimaVisita: 'Extracción · 03/04', esPrimera: false },
      { paciente: 'Roberto Vega', ultimaVisita: 'Ortodoncia · 28/03', esPrimera: false },
      { paciente: 'Patricia Soto', ultimaVisita: 'Primera visita hoy', esPrimera: true },
    ]
  }
  return citasUnicas
})

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
  await loadDashboardAppointments()
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
            Cuestionarios pendientes
          </div>
          <div class="stat-val text-2xl font-bold text-amber-700">
            {{ cuestionariosPendientes.length }}
          </div>
        </div>
        <div class="stat-sub text-xs text-muted mt-2">3 de 72 hrs · 2 de 24 hrs</div>
      </div>

      <div class="bg-card border border-border rounded-2xl p-4 shadow-sm">
        <div class="flex items-start justify-between">
          <div class="stat-label text-sm font-medium text-muted flex items-center gap-1">
            <NotebookText class="h-4 w-4 text-green-700" />
            Bitácoras pendientes
          </div>
          <div class="stat-val text-2xl font-bold text-black">{{ bitacorasPendientes.length }}</div>
        </div>
        <div class="stat-sub text-xs text-muted mt-2">Por completar después de consulta</div>
      </div>
    </div>

    <!-- Main Grid: Alertas y Citas del día -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- Alertas de citas (estilo mejorado) -->
      <div class="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div class="flex items-center justify-between p-4 border-b border-border bg-surface/30">
          <div class="flex items-center gap-2 font-semibold text-black">
            <AlertTriangle class="h-5 w-5 text-red-500" />
            Alertas de citas
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
            Cuestionarios 72h y 24h
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
        <div class="divide-y divide-border">
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
        <div class="p-4 border-t border-border">
          <div class="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div class="h-full bg-green-600 rounded-full" style="width: 0%"></div>
          </div>
          <p class="text-[11px] text-muted mt-2">
            0 de {{ bitacorasPendientes.length }} bitácoras completadas hoy
          </p>
        </div>
      </div>

      <!-- Historiales de citas de hoy -->
      <div class="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div class="flex items-center justify-between p-4 border-b border-border bg-surface/30">
          <div class="flex items-center gap-2 font-semibold text-black">
            <Files class="h-5 w-5 text-indigo-500" />
            Historiales — citas de hoy
          </div>
          <button
            @click="goToClinicalHistory"
            class="text-xs text-accent hover:underline font-medium"
          >
            Ver expedientes ↗
          </button>
        </div>
        <div class="divide-y divide-border">
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
