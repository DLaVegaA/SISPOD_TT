<script setup lang="ts">
import { computed, onMounted, ref, reactive } from 'vue'
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
import { normalizeRole, normalizeUserId, ROUTE_NAMES } from '@/shared/routes'
import { UserPlus } from 'lucide-vue-next'
import { UiToast } from '@/shared/ui/UiToast'

import PatientFormModal from '@/widgets/patient-form-modal/ui/PatientFormModal.vue'
import type { PatientFormDto } from '@/widgets/patient-form-modal/ui/PatientFormModal.vue'
import { httpClient } from '@/shared/api/http'

const sessionStore = useSessionStore()
const role = computed(() => normalizeRole(sessionStore.role))

// ID del dentista para la ruta del breadcrumb
const currentUserId = computed(() =>
  normalizeUserId(sessionStore.user?.id ?? (sessionStore.user as any)?.id_usuario) ?? '0'
)

// ── Toast ──────────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'info'
const toastShow    = ref(false)
const toastMessage = ref('')
const toastType    = ref<ToastType>('success')

function showToast(message: string, type: ToastType = 'success') {
  toastShow.value = false
  setTimeout(() => {
    toastMessage.value = message
    toastType.value    = type
    toastShow.value    = true
    setTimeout(() => { toastShow.value = false }, 3500)
  }, 50)
}

// ── State ──────────────────────────────────────────────────────────────────
const search    = ref('')
const rangeType = ref<'all' | 'week' | 'month' | 'date'>('all')
const rangeDate = ref('')

const patients     = ref<DentistPatientOption[]>([])
const appointments = ref<DentistAppointment[]>([])
const isLoading    = ref(false)
const error        = ref<string | null>(null)

const isModalOpen  = ref(false)
const isSubmitting = ref(false)

// ── Formulario (RN3 — datos mínimos) ──────────────────────────────────────
const initialFormState: PatientFormDto = {
  nombre: '',
  apellido_paterno: '',
  apellido_materno: '',
  correo: '',
  fecha_nacimiento: '',
  curp: '',
  id_rol: 3,
}

const patientForm = reactive<PatientFormDto>({ ...initialFormState })
const formErrors  = reactive<Record<string, string>>({})

function openAddPatientModal() {
  Object.assign(patientForm, initialFormState)
  Object.keys(formErrors).forEach((key) => delete formErrors[key])
  isModalOpen.value = true
}

// ── Validaciones RN4 ───────────────────────────────────────────────────────
function validateForm(): boolean {
  Object.keys(formErrors).forEach((key) => delete formErrors[key])
  let isValid = true

  const soloLetrasRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/
  const curpRegex       = /^[A-Z0-9]{18}$/

  if (!patientForm.nombre) {
    formErrors.nombre = 'Obligatorio'; isValid = false
  } else if (!soloLetrasRegex.test(patientForm.nombre)) {
    formErrors.nombre = 'Solo letras'; isValid = false
  }

  if (!patientForm.apellido_paterno) {
    formErrors.apellido_paterno = 'Obligatorio'; isValid = false
  } else if (!soloLetrasRegex.test(patientForm.apellido_paterno)) {
    formErrors.apellido_paterno = 'Solo letras'; isValid = false
  }

  if (patientForm.apellido_materno && !soloLetrasRegex.test(patientForm.apellido_materno)) {
    formErrors.apellido_materno = 'Solo letras'; isValid = false
  }

  if (!patientForm.correo) {
    formErrors.correo = 'Obligatorio'; isValid = false
  } else if (!/^\S+@\S+\.\S+$/.test(patientForm.correo)) {
    formErrors.correo = 'Correo inválido'; isValid = false
  }

  if (!patientForm.fecha_nacimiento) {
    formErrors.fecha_nacimiento = 'Obligatorio'; isValid = false
  }

  if (!patientForm.curp) {
    formErrors.curp = 'Obligatorio'; isValid = false
  } else if (!curpRegex.test(patientForm.curp.toUpperCase())) {
    formErrors.curp = 'Debe tener 18 caracteres alfanuméricos'; isValid = false
  }

  return isValid
}

// ── Submit ─────────────────────────────────────────────────────────────────
async function submitPatient() {
  patientForm.curp = patientForm.curp.toUpperCase()
  if (!validateForm()) return

  isSubmitting.value = true
  try {
    await httpClient.post('/pacientes', patientForm)
    isModalOpen.value = false
    showToast('Paciente registrado. Se envió correo de activación.', 'success')
    await loadData()
  } catch (err: any) {
    const msg = err.response?.data?.message ?? 'Ocurrió un error al crear el paciente'
    showToast(msg, 'error')
  } finally {
    isSubmitting.value = false
  }
}

// ── Carga de datos ─────────────────────────────────────────────────────────
const now = new Date()

async function loadData() {
  isLoading.value = true
  error.value     = null
  try {
    const [patientsList, appointmentList] = await Promise.all([
      listPatientsForAppointments(),
      listDentistAppointments(),
    ])
    patients.value     = patientsList
    appointments.value = appointmentList
  } catch (err) {
    console.error('Error al cargar pacientes:', err)
    error.value = 'No se pudieron cargar los pacientes. Intenta de nuevo.'
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  if (sessionStore.status === 'unknown') await sessionStore.bootstrap()
  if (!role.value) return
  await loadData()
})

// ── Helpers ────────────────────────────────────────────────────────────────
function calculateAge(birthDate?: string): string {
  if (!birthDate) return '—'
  const date = new Date(birthDate)
  if (Number.isNaN(date.getTime())) return '—'
  const today = new Date()
  let age = today.getFullYear() - date.getFullYear()
  const m = today.getMonth() - date.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < date.getDate())) age--
  return `${age}`
}

function formatDate(dateIso?: string): string {
  if (!dateIso) return '—'
  const date = new Date(dateIso)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

function formatGender(gender?: string): string {
  if (!gender) return '—'
  const n = gender.trim().toLowerCase()
  if (n.startsWith('m')) return 'M'
  if (n.startsWith('f')) return 'F'
  return gender.slice(0, 1).toUpperCase()
}

function resolveStatus(
  lastPast?: DentistAppointment,
  nextFuture?: DentistAppointment,
): PatientStatus {
  // Prioridad: cita futura activa (refleja el estado real del paciente)
  if (nextFuture) {
    return nextFuture.status === 'Confirmada' ? 'Confirmada' : 'Pendiente'
  }
  // Sin citas futuras: miramos la última pasada
  if (lastPast) {
    if (lastPast.status === 'Confirmada') return 'Confirmada'
    if (lastPast.status === 'Cancelada')  return 'Cancelada'
    return 'Pendiente'
  }
  return 'Sin citas'
}

function resolveRange(type: 'all' | 'week' | 'month' | 'date', value: string) {
  if (type === 'all' || !value) return null
  const base = new Date(value)
  if (Number.isNaN(base.getTime())) return null

  if (type === 'date') {
    const start = new Date(base); start.setHours(0, 0, 0, 0)
    const end   = new Date(base); end.setHours(23, 59, 59, 999)
    return { start, end }
  }
  if (type === 'week') {
    const start = new Date(base)
    const day   = start.getDay()
    start.setDate(start.getDate() + (day === 0 ? -6 : 1 - day))
    start.setHours(0, 0, 0, 0)
    const end = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23, 59, 59, 999)
    return { start, end }
  }
  const start = new Date(base.getFullYear(), base.getMonth(), 1)
  start.setHours(0, 0, 0, 0)
  const end = new Date(base.getFullYear(), base.getMonth() + 1, 0)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

// ── Computeds ──────────────────────────────────────────────────────────────
const appointmentsByPatient = computed(() => {
  const map = new Map<number, DentistAppointment[]>()
  appointments.value.forEach((appt) => {
    const list = map.get(appt.patientId) ?? []
    list.push(appt)
    map.set(appt.patientId, list)
  })
  map.forEach((list) => list.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()))
  return map
})

const patientSummaries = computed<PatientSummary[]>(() =>
  patients.value.map((patient) => {
    const appts           = appointmentsByPatient.value.get(patient.id) ?? []
    const past            = appts.filter((a) => new Date(a.startAt) <= now)
    const future          = appts.filter((a) => new Date(a.startAt) > now && a.status !== 'Cancelada')
    const lastAppointment = past[past.length - 1]
    const nextAppointment = future[0]
    return {
      id:              patient.id,
      name:            patient.fullName,
      age:             calculateAge(patient.birthDate),
      gender:          formatGender(patient.gender),
      lastAppointment: formatDate(lastAppointment?.startAt),
      lastTreatment:   lastAppointment ? lastAppointment.type : '—',
      nextAppointment: formatDate(nextAppointment?.startAt),
      status:          resolveStatus(lastAppointment, nextAppointment),
      phone:           patient.phone,
    }
  }),
)

const filteredPatients = computed(() => {
  let list = patientSummaries.value
  if (search.value.trim()) {
    const q = search.value.trim().toLowerCase()
    list = list.filter((p) => p.name.toLowerCase().includes(q))
  }
  const range = resolveRange(rangeType.value, rangeDate.value)
  if (!range) {
    if (rangeType.value === 'all') return list
    return []
  }
  return list.filter((p) => {
    const appts = appointmentsByPatient.value.get(p.id) ?? []
    return appts.some((a) => {
      const d = new Date(a.startAt)
      return d >= range.start && d <= range.end
    })
  })
})

const selectedDateCard = computed(() => {
  if (rangeType.value === 'all' || !rangeDate.value) return null
  const base = new Date(rangeDate.value)
  if (Number.isNaN(base.getTime())) return null

  const monthYear = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' }).format(base)
  const chip      = new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short' }).format(base).toUpperCase()
  const range     = resolveRange(rangeType.value, rangeDate.value)
  const fmt       = new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
  const rangeLabel = range
    ? rangeType.value === 'date'
      ? fmt.format(base)
      : `${fmt.format(range.start)} – ${fmt.format(range.end)}`
    : ''
  const subtitle = rangeType.value === 'date' ? 'Fecha seleccionada' : rangeType.value === 'week' ? 'Semana seleccionada' : 'Mes seleccionado'
  return { chip, monthYear, rangeLabel, subtitle }
})
</script>

<template>
  <div class="fade-in">

    <!-- ── Breadcrumb + header ─────────────────────────────────────────── -->
    <div class="mb-8">
      <div class="flex items-center gap-2 text-xs text-muted/60 mb-2">
        <RouterLink
          :to="{ name: ROUTE_NAMES.DENTIST_HOME, params: { id: currentUserId } }"
          class="hover:text-muted transition-colors"
        >
          🏠
        </RouterLink>
        <span>/</span>
        <span class="font-medium text-muted">Pacientes</span>
      </div>

      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 class="font-display text-4xl font-semibold text-black">Pacientes</h1>
          <p class="text-sm text-muted mt-1">Consulta rápida de pacientes registrados en el sistema.</p>
        </div>

        <button
          @click="openAddPatientModal"
          class="flex items-center gap-2 bg-ink/65 text-text-secondary hover:bg-ink/80 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all hover:scale-105 active:scale-95"
        >
          <UserPlus class="h-4 w-4" />
          Nuevo Paciente
        </button>
      </div>
    </div>

    <!-- ── Chip de fecha seleccionada ─────────────────────────────────── -->
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
        <p class="text-sm font-bold text-black capitalize">{{ selectedDateCard.monthYear }}</p>
        <p class="text-xs text-muted">{{ selectedDateCard.rangeLabel }}</p>
        <p class="text-[10px] text-muted uppercase tracking-wide">{{ selectedDateCard.subtitle }}</p>
      </div>
    </div>

    <!-- ── Filtros ─────────────────────────────────────────────────────── -->
    <PatientFilters
      :search="search"
      :range-type="rangeType"
      :date-value="rangeDate"
      @update:search="search = $event"
      @update:rangeType="rangeType = $event"
      @update:dateValue="rangeDate = $event"
    />

    <!-- ── Error / Loading / Tabla ────────────────────────────────────── -->
    <div v-if="error" class="mt-4 text-xs text-red-500">{{ error }}</div>
    <div v-else-if="isLoading" class="mt-8 flex items-center justify-center gap-2 text-sm text-muted">
      <span class="animate-spin w-4 h-4 border-2 border-accent border-t-transparent rounded-full inline-block" />
      Cargando pacientes...
    </div>

    <div v-else class="mt-6">
      <PatientTable :patients="filteredPatients" />
      <PatientCards :patients="filteredPatients" />
      <div v-if="filteredPatients.length === 0" class="mt-6 text-center text-sm text-muted py-12 bg-card border border-border rounded-2xl">
        No se encontraron pacientes con los filtros actuales.
      </div>
    </div>

    <!-- ── Modal registro ─────────────────────────────────────────────── -->
    <PatientFormModal
      v-model="isModalOpen"
      :form="patientForm"
      :errors="formErrors"
      :is-loading="isSubmitting"
      @submit="submitPatient"
    />

    <!-- ── Toast ──────────────────────────────────────────────────────── -->
    <UiToast v-model="toastShow" :message="toastMessage" :type="toastType" />
  </div>
</template>