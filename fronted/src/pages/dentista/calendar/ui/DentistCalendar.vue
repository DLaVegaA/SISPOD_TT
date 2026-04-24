<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, ref, watch } from 'vue'
import {
  AlertCircle,
  CalendarPlus2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  RefreshCcw,
} from 'lucide-vue-next'
import { UiModal } from '@/shared/ui/UiModal'
import {
  createDentistAppointment,
  listDentistAppointments,
  listPatientsForAppointments,
  type DentistAppointment,
  type DentistPatientOption,
} from '@/shared/api/dentistAppointments'

const today = new Date()
const currentYear = ref(today.getFullYear())
const currentMonth = ref(today.getMonth())

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]
const DAY_NAMES = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB']

const patients = ref<DentistPatientOption[]>([])
const appointments = ref<DentistAppointment[]>([])

const isLoadingPatients = ref(false)
const isLoadingAppointments = ref(false)
const isSubmitting = ref(false)

const errorMessage = ref('')
const successMessage = ref('')

const showCreateModal = ref(false)
const createForm = ref({
  patientId: '',
  date: '',
  startTime: '10:00',
  type: '1',
})

const APPOINTMENT_TYPE_OPTIONS = [
  { value: '1', label: 'Consulta general (60 min)', duration: 60 },
  { value: '2', label: 'Seguimiento (30 min)', duration: 30 },
]

function toDateKey(dateIso: string): string {
  const date = new Date(dateIso)
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function toInputDateFromKey(key: string): string {
  const parts = key.split('-').map(Number)
  if (parts.length !== 3) {
    return ''
  }

  const [year, month, day] = parts as [number, number, number]

  if ([year, month, day].some((value) => Number.isNaN(value))) {
    return ''
  }

  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function formatHour(dateIso: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(dateIso))
}

function appointmentColor(status: string): string {
  if (status === 'Confirmada') {
    return 'indigo'
  }

  if (status === 'Cancelada') {
    return 'red'
  }

  return 'blue'
}

const appointmentsByDate = computed(() => {
  const grouped: Record<string, Array<{ id: number; title: string; color: string }>> = {}

  for (const appointment of appointments.value) {
    const key = toDateKey(appointment.startAt)

    if (!grouped[key]) {
      grouped[key] = []
    }

    grouped[key].push({
      id: appointment.id,
      title: `${formatHour(appointment.startAt)} - ${appointment.patientName}`,
      color: appointmentColor(appointment.status),
    })
  }

  return grouped
})

const calendarDays = computed(() => {
  const y = currentYear.value
  const m = currentMonth.value

  const firstDay = new Date(y, m, 1).getDay()
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const prevMonthDays = new Date(y, m, 0).getDate()

  const cells: Array<{ day: number; current: boolean; dateKey: string; isToday?: boolean }> = []

  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: prevMonthDays - i, current: false, dateKey: '' })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      day: d,
      current: true,
      dateKey: `${y}-${m}-${d}`,
      isToday: d === today.getDate() && m === today.getMonth() && y === today.getFullYear(),
    })
  }

  const remaining = 42 - cells.length
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, current: false, dateKey: '' })
  }

  return cells
})

function prevMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

function goToday() {
  currentMonth.value = today.getMonth()
  currentYear.value = today.getFullYear()
}

function openCreateModal(dateKey?: string) {
  successMessage.value = ''
  errorMessage.value = ''

  if (dateKey) {
    createForm.value.date = toInputDateFromKey(dateKey)
  }

  showCreateModal.value = true
}

function closeCreateModal() {
  showCreateModal.value = false
  errorMessage.value = ''
}

async function loadPatients() {
  isLoadingPatients.value = true

  try {
    patients.value = await listPatientsForAppointments()
  } catch (error) {
    errorMessage.value =
      axios.isAxiosError(error) && error.response?.data?.message
        ? error.response.data.message
        : 'No se pudo cargar la lista de pacientes'
  } finally {
    isLoadingPatients.value = false
  }
}

async function loadAppointmentsByMonth() {
  isLoadingAppointments.value = true

  const start = new Date(currentYear.value, currentMonth.value, 1, 0, 0, 0)
  const end = new Date(currentYear.value, currentMonth.value + 1, 0, 23, 59, 59)

  try {
    appointments.value = await listDentistAppointments({
      desde: start.toISOString(),
      hasta: end.toISOString(),
    })
  } catch (error) {
    errorMessage.value =
      axios.isAxiosError(error) && error.response?.data?.message
        ? error.response.data.message
        : 'No se pudieron cargar las citas del mes seleccionado'
  } finally {
    isLoadingAppointments.value = false
  }
}

function selectedDuration(): number {
  const selectedType = APPOINTMENT_TYPE_OPTIONS.find(
    (option) => option.value === createForm.value.type,
  )
  return selectedType?.duration ?? 60
}

async function submitAppointment() {
  errorMessage.value = ''
  successMessage.value = ''

  if (!createForm.value.patientId || !createForm.value.date || !createForm.value.startTime) {
    errorMessage.value = 'Selecciona paciente, fecha y hora para agendar la cita'
    return
  }

  isSubmitting.value = true

  try {
    await createDentistAppointment({
      idPaciente: Number(createForm.value.patientId),
      fecha: createForm.value.date,
      horaInicio: createForm.value.startTime,
      duracionMinutos: selectedDuration(),
      tipoCita: Number(createForm.value.type),
    })

    closeCreateModal()
    successMessage.value = 'Cita creada correctamente'
    await loadAppointmentsByMonth()
  } catch (error) {
    errorMessage.value =
      axios.isAxiosError(error) && error.response?.data?.message
        ? error.response.data.message
        : 'No se pudo crear la cita'
  } finally {
    isSubmitting.value = false
  }
}

watch([currentYear, currentMonth], () => {
  void loadAppointmentsByMonth()
})

onMounted(async () => {
  await Promise.all([loadPatients(), loadAppointmentsByMonth()])
})
</script>

<template>
  <div class="fade-in">
    <div
      v-if="successMessage"
      class="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-600"
    >
      {{ successMessage }}
    </div>

    <div
      v-if="errorMessage"
      class="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-600"
    >
      <span class="inline-flex items-center gap-2">
        <AlertCircle class="h-4 w-4" />
        {{ errorMessage }}
      </span>
    </div>

    <!-- ── Header ──────────────────────────────────────────────────────── -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <!-- Breadcrumb -->
        <!-- <div class="flex items-center gap-1.5 text-xs text-muted font-medium mb-2">
          <span class="text-muted/60">🏠</span>
          <span class="text-muted/60">&gt;</span>
          <span class="bg-card border border-border px-2 py-0.5 rounded-lg">Calendario</span>
        </div> -->
        <h1 class="font-display text-4xl font-semibold text-black">
          {{ MONTH_NAMES[currentMonth] }} {{ currentYear }}
        </h1>
      </div>

      <div class="flex items-center gap-3">
        <button
          class="inline-flex items-center justify-center rounded-2xl border border-border bg-card px-3 py-2.5 text-muted hover:bg-ghost hover:text-black transition-colors"
          @click="loadAppointmentsByMonth"
          :disabled="isLoadingAppointments"
          aria-label="Recargar citas"
        >
          <RefreshCcw :class="['h-4 w-4', isLoadingAppointments ? 'animate-spin' : '']" />
        </button>

        <!-- Month nav -->
        <div class="flex items-center border border-border rounded-2xl overflow-hidden bg-card">
          <button
            class="px-3 py-2.5 hover:bg-ghost text-muted hover:text-black transition-colors"
            @click="prevMonth"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>
          <button
            class="px-4 py-2.5 text-sm font-semibold text-black hover:bg-ghost transition-colors border-x border-border"
            @click="goToday"
          >
            Hoy
          </button>
          <button
            class="px-3 py-2.5 hover:bg-ghost text-muted hover:text-black transition-colors"
            @click="nextMonth"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>

        <!-- New appointment button -->
        <button
          class="flex items-center gap-2 bg-ink/65 text-text-secondary hover:bg-ink/80 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all hover:scale-105 active:scale-95"
          @click="openCreateModal()"
        >
          <Plus class="w-4 h-4" />
          Nueva Cita
        </button>
      </div>
    </div>

    <!-- ── Calendar card ───────────────────────────────────────────────── -->
    <div class="bg-card border border-border rounded-2xl overflow-hidden">
      <!-- Day-of-week header -->
      <div class="grid grid-cols-7 border-b border-border bg-surface">
        <div
          v-for="name in DAY_NAMES"
          :key="name"
          class="py-3 text-center text-xs font-semibold text-muted uppercase tracking-wider"
        >
          {{ name }}
        </div>
      </div>

      <!-- Grid -->
      <div class="grid grid-cols-7">
        <div
          v-for="(cell, idx) in calendarDays"
          :key="idx"
          @click="cell.current && openCreateModal(cell.dateKey)"
          :class="[
            'min-h-28 p-2 border-r border-b border-border last:border-r-0',
            'transition-colors cursor-pointer group',
            cell.current ? 'hover:bg-surface' : 'bg-surface/40',
            (idx + 1) % 7 === 0 ? 'border-r-0' : '',
          ]"
        >
          <!-- Day number -->
          <div class="flex justify-end mb-1">
            <span
              :class="[
                'w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold transition-colors',
                cell.isToday
                  ? 'bg-accent text-white shadow-sm'
                  : cell.current
                    ? 'text-black group-hover:bg-ghost'
                    : 'text-muted/40',
              ]"
            >
              {{ cell.day }}
            </span>
          </div>

          <!-- Appointments -->
          <div class="space-y-1">
            <div
              v-for="appt in appointmentsByDate[cell.dateKey] ?? []"
              :key="appt.id"
              :class="[
                'text-[10px] px-2 py-1 rounded-lg text-white font-semibold truncate',
                appt.color === 'blue' ? 'bg-accent' : '',
                appt.color === 'indigo' ? 'bg-indigo-500' : '',
                appt.color === 'red' ? 'bg-red-500' : '',
              ]"
            >
              {{ appt.title }}
            </div>

            <div
              v-if="
                isLoadingAppointments &&
                cell.current &&
                (appointmentsByDate[cell.dateKey] ?? []).length === 0
              "
              class="text-[10px] text-muted"
            >
              Cargando...
            </div>
          </div>
        </div>
      </div>
    </div>

    <UiModal v-model="showCreateModal" title="Agendar Nueva Cita" max-width="md">
      <div class="p-6 space-y-4">
        <div class="rounded-xl border border-accent/20 bg-accent-dim/60 p-3 text-xs text-muted">
          Las citas deben agendarse con al menos 48 horas de anticipación.
        </div>

        <div>
          <label class="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
            Paciente
          </label>
          <select
            v-model="createForm.patientId"
            class="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-black focus:outline-none focus:border-accent transition-colors"
            :disabled="isLoadingPatients"
          >
            <option value="">Selecciona un paciente</option>
            <option v-for="patient in patients" :key="patient.id" :value="String(patient.id)">
              {{ patient.fullName }} · {{ patient.phone }}
            </option>
          </select>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
              Fecha
            </label>
            <input
              v-model="createForm.date"
              type="date"
              class="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-black focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div>
            <label class="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
              Hora de inicio
            </label>
            <input
              v-model="createForm.startTime"
              type="time"
              class="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-black focus:outline-none focus:border-accent transition-colors"
            />
          </div>
        </div>

        <div>
          <label class="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
            Tipo de cita
          </label>
          <select
            v-model="createForm.type"
            class="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-black focus:outline-none focus:border-accent transition-colors"
          >
            <option
              v-for="option in APPOINTMENT_TYPE_OPTIONS"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            class="px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted hover:text-black hover:bg-ghost transition-colors"
            @click="closeCreateModal"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-2 bg-ink/65 text-text-secondary hover:bg-ink/80 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            :disabled="isSubmitting"
            @click="submitAppointment"
          >
            <Loader2 v-if="isSubmitting" class="h-4 w-4 animate-spin" />
            <CalendarPlus2 v-else class="h-4 w-4" />
            {{ isSubmitting ? 'Guardando...' : 'Crear cita' }}
          </button>
        </div>
      </div>
    </UiModal>
  </div>
</template>
