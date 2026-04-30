<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  PatientCards,
  PatientTable,
  type PatientStatus,
  type PatientSummary,
} from '@/entities/patient'
import { PatientFilters } from '@/features/patient-filters'
import {
  listDentistAppointments,
  listPatientsForAppointments,
  type DentistAppointment,
  type DentistPatientOption,
} from '@/shared/api/dentistAppointments'
import { useSessionStore } from '@/entities/session'
import { normalizeRole } from '@/shared/routes'

const sessionStore = useSessionStore()
const role = computed(() => normalizeRole(sessionStore.role))

const search = ref('')
const rangeType = ref<'all' | 'week' | 'month' | 'date'>('all')
const rangeDate = ref('')

const patients = ref<DentistPatientOption[]>([])
const appointments = ref<DentistAppointment[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

const now = new Date()

const appointmentTypeLabel: Record<string, string> = {
  '1': 'Consulta general',
  '2': 'Seguimiento',
}

function calculateAge(birthDate?: string): string {
  if (!birthDate) return '—'
  const date = new Date(birthDate)
  if (Number.isNaN(date.getTime())) return '—'

  const today = new Date()
  let age = today.getFullYear() - date.getFullYear()
  const monthDiff = today.getMonth() - date.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age -= 1
  }

  return `${age}`
}

function formatDate(dateIso?: string): string {
  if (!dateIso) return '—'
  const date = new Date(dateIso)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function formatGender(gender?: string): string {
  if (!gender) return '—'
  const normalized = gender.trim().toLowerCase()
  if (normalized.startsWith('m')) return 'M'
  if (normalized.startsWith('f')) return 'F'
  return gender.slice(0, 1).toUpperCase()
}

function resolveStatus(appointment?: DentistAppointment): PatientStatus {
  if (!appointment) return 'Sin citas'
  if (appointment.status === 'Confirmada') return 'Confirmada'
  if (appointment.status === 'Cancelada') return 'Cancelada'
  return 'Pendiente'
}

function resolveRange(type: 'all' | 'week' | 'month' | 'date', value: string) {
  if (type === 'all') return null
  if (!value) return null

  const base = new Date(value)
  if (Number.isNaN(base.getTime())) return null

  if (type === 'date') {
    const start = new Date(base)
    start.setHours(0, 0, 0, 0)
    const end = new Date(base)
    end.setHours(23, 59, 59, 999)
    return { start, end }
  }

  if (type === 'week') {
    const start = new Date(base)
    const day = start.getDay()
    const diff = day === 0 ? -6 : 1 - day
    start.setDate(start.getDate() + diff)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    end.setHours(23, 59, 59, 999)
    return { start, end }
  }

  const start = new Date(base.getFullYear(), base.getMonth(), 1)
  start.setHours(0, 0, 0, 0)
  const end = new Date(base.getFullYear(), base.getMonth() + 1, 0)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

const appointmentsByPatient = computed(() => {
  const map = new Map<number, DentistAppointment[]>()
  appointments.value.forEach((appointment) => {
    const existing = map.get(appointment.patientId) ?? []
    existing.push(appointment)
    map.set(appointment.patientId, existing)
  })

  map.forEach((list) => {
    list.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
  })

  return map
})

const patientSummaries = computed<PatientSummary[]>(() =>
  patients.value.map((patient) => {
    const appts = appointmentsByPatient.value.get(patient.id) ?? []
    const pastAppointments = appts.filter((appt) => new Date(appt.startAt) <= now)
    const futureAppointments = appts.filter((appt) => new Date(appt.startAt) > now)

    const lastAppointment = pastAppointments[pastAppointments.length - 1]
    const nextAppointment = futureAppointments[0]

    return {
      id: patient.id,
      name: patient.fullName,
      age: calculateAge(patient.birthDate),
      gender: formatGender(patient.gender),
      lastAppointment: formatDate(lastAppointment?.startAt),
      lastTreatment: lastAppointment
        ? (appointmentTypeLabel[lastAppointment.type] ?? `Tipo ${lastAppointment.type}`)
        : '—',
      nextAppointment: formatDate(nextAppointment?.startAt),
      status: resolveStatus(lastAppointment),
      phone: patient.phone,
    }
  }),
)

const filteredPatients = computed(() => {
  let list = patientSummaries.value

  if (search.value.trim()) {
    const query = search.value.trim().toLowerCase()
    list = list.filter((patient) => patient.name.toLowerCase().includes(query))
  }

  const range = resolveRange(rangeType.value, rangeDate.value)
  if (!range) {
    if (rangeType.value === 'all') return list
    return []
  }

  return list.filter((patient) => {
    const appts = appointmentsByPatient.value.get(patient.id) ?? []
    return appts.some((appt) => {
      const date = new Date(appt.startAt)
      return date >= range.start && date <= range.end
    })
  })
})

const selectedDateCard = computed(() => {
  if (rangeType.value === 'all' || !rangeDate.value) return null

  const base = new Date(rangeDate.value)
  if (Number.isNaN(base.getTime())) return null

  const monthYear = new Intl.DateTimeFormat('es-MX', {
    month: 'long',
    year: 'numeric',
  }).format(base)

  const chip = new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
  })
    .format(base)
    .toUpperCase()

  const range = resolveRange(rangeType.value, rangeDate.value)
  const rangeFormatter = new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  const rangeLabel = range
    ? rangeType.value === 'date'
      ? rangeFormatter.format(base)
      : `${rangeFormatter.format(range.start)} – ${rangeFormatter.format(range.end)}`
    : ''

  const subtitle =
    rangeType.value === 'date'
      ? 'Fecha seleccionada'
      : rangeType.value === 'week'
        ? 'Semana seleccionada'
        : 'Mes seleccionado'

  return {
    chip,
    monthYear,
    rangeLabel,
    subtitle,
  }
})

async function loadData() {
  isLoading.value = true
  error.value = null

  try {
    const [patientsList, appointmentList] = await Promise.all([
      listPatientsForAppointments(),
      listDentistAppointments(),
    ])

    patients.value = patientsList
    appointments.value = appointmentList
  } catch (err) {
    console.error('Error al cargar pacientes:', err)
    error.value = 'No se pudieron cargar los pacientes. Intenta de nuevo.'
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  if (sessionStore.status === 'unknown') {
    await sessionStore.bootstrap()
  }

  if (!role.value) return
  await loadData()
})
</script>

<template>
  <div class="fade-in">
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
      <div>
        <h1 class="font-display text-4xl font-semibold text-blackk">Pacientes</h1>
        <p class="text-sm text-muted">Consulta rapida de pacientes registrados en el sistema.</p>
      </div>
    </div>
    <div
      v-if="selectedDateCard"
      class="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3 w-fit mb-3"
    >
      <div class="text-center">
        <p class="text-xs font-semibold text-accent font-display leading-none">
          {{ selectedDateCard.chip }}
        </p>
      </div>
      <div class="w-px h-8 bg-border" />
      <div>
        <p class="text-sm font-bold text-black capitalize">
          {{ selectedDateCard.monthYear }}
        </p>
        <p class="text-xs text-muted">{{ selectedDateCard.rangeLabel }}</p>
        <p class="text-[10px] text-muted uppercase tracking-wide">
          {{ selectedDateCard.subtitle }}
        </p>
      </div>
    </div>
    <PatientFilters
      :search="search"
      :range-type="rangeType"
      :date-value="rangeDate"
      @update:search="search = $event"
      @update:rangeType="rangeType = $event"
      @update:dateValue="rangeDate = $event"
    />

    <div v-if="error" class="mt-4 text-xs text-red-500">{{ error }}</div>
    <div v-else-if="isLoading" class="mt-4 text-xs text-muted">Cargando pacientes...</div>

    <div v-else class="mt-6">
      <PatientTable :patients="filteredPatients" />
      <PatientCards :patients="filteredPatients" />
      <div v-if="filteredPatients.length === 0" class="mt-4 text-xs text-muted">
        No se encontraron pacientes con los filtros actuales.
      </div>
    </div>
  </div>
</template>
