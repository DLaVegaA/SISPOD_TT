<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, ref, watch } from 'vue'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  Info,
  Pencil,
} from 'lucide-vue-next'
import { citasApi } from '@/entities/citaPaciente'
import { useSessionStore } from '@/entities/session'
import { normalizeRole } from '@/shared/routes'
import {
  createDentistAppointment,
  listDentistAppointments,
  listPatientsForAppointments,
  type DentistAppointment,
  type DentistPatientOption,
} from '@/shared/api/dentistAppointments'

interface Appointment {
  id: number
  title: string
  time: string
  status: string
  badgeClass?: string
}

interface CalendarCell {
  day: number
  current: boolean
  key: string
  isToday: boolean
  isValid: boolean
}

interface DisponibilidadResponse {
  disponibles: string[]
  message?: string
}

const sessionStore = useSessionStore()
const role = computed(() => normalizeRole(sessionStore.role))
const isPatient = computed(() => role.value === 'patient')
const isDentist = computed(() => role.value === 'dentist')

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

const patientAppointments = ref<Record<string, Appointment[]>>({})
const dentistAppointments = ref<DentistAppointment[]>([])
const dentistPatients = ref<DentistPatientOption[]>([])

const isLoadingPatients = ref(false)
const isLoadingAppointments = ref(false)
const isLoadingSlots = ref(false)
const isLoadingDentistSlots = ref(false)
const isLoadingEditSlots = ref(false)
const isSaving = ref(false)

const errorMsg = ref<string | null>(null)
const successMsg = ref<string | null>(null)

const selectedDate = ref<string | null>(null)
const showForm = ref(false)
const citaSeleccionada = ref<Appointment | null>(null)

const isEditing = ref(false)
const horaEditada = ref<string | null>(null)
const horariosEdicion = ref<string[]>([])
const horariosDisponibles = ref<string[]>([])
const horaSeleccionada = ref<string | null>(null)
const horariosDisponiblesDentista = ref<string[]>([])
const horaSeleccionadaDentista = ref<string | null>(null)
const dentistSelectedAppointment = ref<DentistAppointment | null>(null)
const isEditingDentist = ref(false)
const dentistEditSlots = ref<string[]>([])
const dentistEditTime = ref<string | null>(null)
const isLoadingDentistEditSlots = ref(false)

const ID_DENTISTA = 1
const formCita = ref({ tipo_cita: 1 })

const dentistForm = ref({
  patientId: '',
  date: '',
  startTime: '',
  type: '1',
})

const APPOINTMENT_TYPE_OPTIONS = [
  { value: '1', label: 'Consulta general (60 min)', duration: 60 },
  { value: '2', label: 'Seguimiento (30 min)', duration: 30 },
]

function toCalendarKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
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

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function fromInputDateToKey(date: string): string {
  const parts = date.split('-').map(Number)
  if (parts.length !== 3) {
    return ''
  }

  const [year, month, day] = parts as [number, number, number]
  if ([year, month, day].some((value) => Number.isNaN(value))) {
    return ''
  }

  return `${year}-${month}-${day}`
}

function appointmentBadgeClass(status: string): string {
  if (status === 'Confirmada') {
    return 'bg-emerald-500 text-white'
  }

  if (status === 'Cancelada') {
    return 'bg-red-500 text-white'
  }

  return 'bg-accent text-white'
}

function dentistTypeLabel(type: string): string {
  const match = APPOINTMENT_TYPE_OPTIONS.find((option) => option.value === type)
  return match?.label ?? `Tipo ${type}`
}

function formatHora(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Mexico_City',
  })
}

function formatHoraInput(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Mexico_City',
  })
}

// Helper para filtrar los slots que no cumplen con la anticipación mínima
function filterSlotsByAnticipation(slots: string[], hours: number): string[] {
  const limit = new Date()
  limit.setHours(limit.getHours() + hours)
  return slots.filter(slot => new Date(slot) > limit)
}

const dentistAppointmentsByDate = computed<Record<string, Appointment[]>>(() => {
  const map: Record<string, Appointment[]> = {}

  for (const appointment of dentistAppointments.value) {
    const start = new Date(appointment.startAt)
    const key = toCalendarKey(start)
    if (!map[key]) {
      map[key] = []
    }

    map[key].push({
      id: appointment.id,
      title: appointment.patientName,
      time: formatHora(appointment.startAt),
      status: appointment.status,
      badgeClass: appointmentBadgeClass(appointment.status),
    })
  }

  return map
})

const appointmentsByDate = computed<Record<string, Appointment[]>>(() =>
  isDentist.value ? dentistAppointmentsByDate.value : patientAppointments.value,
)

const calendarDays = computed<CalendarCell[]>(() => {
  const y = currentYear.value
  const m = currentMonth.value
  const firstDay = new Date(y, m, 1).getDay()
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const prevDays = new Date(y, m, 0).getDate()

  const limite48h = new Date()
  limite48h.setHours(limite48h.getHours() + 48)

  const cells: CalendarCell[] = []

  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: prevDays - i, current: false, key: '', isToday: false, isValid: false })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const finDelDia = new Date(y, m, d, 23, 59, 59)
    const isValid = isPatient.value ? finDelDia > limite48h : true

    cells.push({
      day: d,
      current: true,
      key: `${y}-${m + 1}-${d}`,
      isToday: d === today.getDate() && m === today.getMonth() && y === today.getFullYear(),
      isValid,
    })
  }

  const remaining = 42 - cells.length
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, current: false, key: '', isToday: false, isValid: false })
  }

  return cells
})

const selectedCellKey = computed(() => {
  if (!selectedDate.value) return null
  const [y, m, d] = selectedDate.value.split('-')
  return `${y}-${parseInt(m ?? '0')}-${parseInt(d ?? '0')}`
})

const dentistAppointmentsForSelectedDate = computed(() => {
  if (!selectedDate.value) return []
  const key = fromInputDateToKey(selectedDate.value)
  return dentistAppointments.value
    .filter((appointment) => {
      const start = new Date(appointment.startAt)
      return toCalendarKey(start) === key
    })
    .sort((a, b) => a.startAt.localeCompare(b.startAt))
})

const panelTitle = computed(() => {
  if (isPatient.value && citaSeleccionada.value) {
    return isEditing.value ? 'Modificar Horario' : 'Detalles de la Cita'
  }

  if (isDentist.value && isEditingDentist.value) {
    return 'Editar Cita'
  }

  if (showForm.value) {
    return 'Agendar Cita'
  }

  if (isDentist.value && selectedDate.value) {
    return 'Citas del Día'
  }

  return 'Selecciona una fecha'
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

function resetPanelState() {
  citaSeleccionada.value = null
  isEditing.value = false
  horaEditada.value = null
  horaSeleccionada.value = null
  horaSeleccionadaDentista.value = null
  dentistSelectedAppointment.value = null
  isEditingDentist.value = false
  dentistEditSlots.value = []
  dentistEditTime.value = null
  horariosDisponibles.value = []
  horariosEdicion.value = []
  horariosDisponiblesDentista.value = []
  dentistForm.value.startTime = ''
  errorMsg.value = null
  successMsg.value = null
}

function selectAppointment(appt: Appointment, cellKey: string) {
  if (!isPatient.value) return

  const [y, m, d] = cellKey.split('-')
  selectedDate.value = `${y}-${(m ?? '').padStart(2, '0')}-${(d ?? '').padStart(2, '0')}`
  citaSeleccionada.value = appt
  showForm.value = false
  isEditing.value = false
  horaEditada.value = null
  errorMsg.value = null
  successMsg.value = null
}

function onAppointmentClick(appt: Appointment, cellKey: string) {
  if (!isPatient.value) return
  selectAppointment(appt, cellKey)
}

async function selectDay(cell: CalendarCell) {
  if (!cell.current) return
  if (isPatient.value && !cell.isValid) return

  const [y, m, d] = cell.key.split('-')
  const formattedDate = `${y}-${(m ?? '').padStart(2, '0')}-${(d ?? '').padStart(2, '0')}`
  selectedDate.value = formattedDate

  resetPanelState()
  showForm.value = isPatient.value

  if (isDentist.value) {
    dentistForm.value.date = formattedDate
  }

  if (isPatient.value) {
    await fetchDisponibilidad()
  }
}

async function fetchDisponibilidad() {
  if (!selectedDate.value) return

  isLoadingSlots.value = true
  horariosDisponibles.value = []

  try {
    const res = (await citasApi.obtenerDisponibilidad(
      selectedDate.value,
      formCita.value.tipo_cita,
      ID_DENTISTA,
    )) as DisponibilidadResponse

    // Filtramos usando la regla de 48 hrs para agendar
    horariosDisponibles.value = filterSlotsByAnticipation(res?.disponibles ?? [], 48)
  } catch (error) {
    console.error('Error al buscar horarios:', error)
    horariosDisponibles.value = []
  } finally {
    isLoadingSlots.value = false
  }
}

function onTipoCitaChange() {
  if (!isPatient.value) return
  horaSeleccionada.value = null
  fetchDisponibilidad()
}

function openDentistCreateForm() {
  if (!isDentist.value) return
  errorMsg.value = null
  dentistSelectedAppointment.value = null
  isEditingDentist.value = false
  showForm.value = true
  if (selectedDate.value) {
    dentistForm.value.date = selectedDate.value
  }
  void fetchDisponibilidadDentista()
}

async function selectDentistAppointment(appointment: DentistAppointment) {
  if (!isDentist.value) return

  const date = new Date(appointment.startAt)
  const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`

  selectedDate.value = dateKey
  dentistForm.value.date = dateKey
  dentistForm.value.type = appointment.type
  dentistSelectedAppointment.value = appointment
  isEditingDentist.value = true
  showForm.value = false
  errorMsg.value = null
  dentistEditTime.value = null
  await fetchDentistEditSlots(dateKey, appointment.type)
}

async function fetchDentistEditSlots(date: string, tipo: string) {
  if (!isDentist.value) return

  isLoadingDentistEditSlots.value = true
  dentistEditSlots.value = []

  try {
    const res = (await citasApi.obtenerDisponibilidad(
      date,
      Number(tipo),
      ID_DENTISTA,
    )) as DisponibilidadResponse

    // Filtramos usando la regla de 36 hrs para editar
    dentistEditSlots.value = filterSlotsByAnticipation(res?.disponibles ?? [], 36)
  } catch (error) {
    console.error('Error al buscar horarios para edición dentista:', error)
    dentistEditSlots.value = []
  } finally {
    isLoadingDentistEditSlots.value = false
  }
}

async function fetchDisponibilidadDentista() {
  if (!isDentist.value || !dentistForm.value.date) return

  isLoadingDentistSlots.value = true
  horariosDisponiblesDentista.value = []

  try {
    const res = (await citasApi.obtenerDisponibilidad(
      dentistForm.value.date,
      Number(dentistForm.value.type),
      ID_DENTISTA,
    )) as DisponibilidadResponse

    // Filtramos usando la regla de 48 hrs para agendar
    horariosDisponiblesDentista.value = filterSlotsByAnticipation(res?.disponibles ?? [], 48)
  } catch (error) {
    console.error('Error al buscar horarios para dentista:', error)
    horariosDisponiblesDentista.value = []
  } finally {
    isLoadingDentistSlots.value = false
  }
}

async function activarEdicion() {
  if (!selectedDate.value || !citaSeleccionada.value || !isPatient.value) return

  isEditing.value = true
  horaEditada.value = null
  errorMsg.value = null
  isLoadingEditSlots.value = true
  horariosEdicion.value = []

  try {
    const tipoCita = citaSeleccionada.value.title.includes('60m') ? 1 : 2
    const res = (await citasApi.obtenerDisponibilidad(
      selectedDate.value,
      tipoCita,
      ID_DENTISTA,
    )) as DisponibilidadResponse

    // Filtramos usando la regla de 36 hrs para editar
    horariosEdicion.value = filterSlotsByAnticipation(res?.disponibles ?? [], 36)
  } catch (error) {
    console.error('Error al buscar horarios para edición:', error)
    horariosEdicion.value = []
  } finally {
    isLoadingEditSlots.value = false
  }
}

function cancelarEdicion() {
  isEditing.value = false
  horaEditada.value = null
  errorMsg.value = null
}

async function handleConfirmarEdicion() {
  if (!citaSeleccionada.value || !horaEditada.value || !isPatient.value) return

  isSaving.value = true
  errorMsg.value = null

  await handleGuardarEdicion(citaSeleccionada.value.id, horaEditada.value)

  isSaving.value = false
}

async function handleConfirmarCitaPaciente() {
  if (!selectedDate.value || !horaSeleccionada.value || !isPatient.value) return

  isSaving.value = true
  errorMsg.value = null

  try {
    const inicio = new Date(horaSeleccionada.value)

    await citasApi.crearCita({
      fecha_hora_inicio: inicio.toISOString(),
      tipo_cita: formCita.value.tipo_cita,
      id_dentista: ID_DENTISTA,
    })

    await cargarCitasDelCalendario()
    successMsg.value = '¡Cita agendada con éxito!'
    showForm.value = false
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } }
    errorMsg.value = err.response?.data?.message ?? 'No se pudo agendar la cita. Intenta de nuevo.'
  } finally {
    isSaving.value = false
  }
}

async function handleCancelarCita(idCita: number) {
  if (!isPatient.value) return
  if (!confirm('¿Estás seguro de que deseas cancelar esta cita?')) return

  try {
    await citasApi.cancelarCita(idCita)
    successMsg.value = '¡Cita cancelada correctamente!'
    citaSeleccionada.value = null
    isEditing.value = false
    await cargarCitasDelCalendario()
    showForm.value = false
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } }
    errorMsg.value = err.response?.data?.message ?? 'No se pudo cancelar la cita.'
  }
}

async function handleGuardarEdicion(idCita: number, nuevaFechaIso: string) {
  if (!isPatient.value) return

  try {
    await citasApi.editarCita(idCita, { fecha_hora_inicio: nuevaFechaIso })
    successMsg.value = '¡Horario actualizado correctamente!'
    citaSeleccionada.value = null
    isEditing.value = false
    horaEditada.value = null
    await cargarCitasDelCalendario()
    showForm.value = false
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } }
    errorMsg.value = err.response?.data?.message ?? 'No se pudo editar la cita.'
  }
}

async function cargarCitasDelCalendario() {
  if (!isPatient.value) return

  try {
    const response = await citasApi.listarMisCitas()
    const res = (response as any).data || response

    const map: Record<string, Appointment[]> = {}

    if (res?.citas) {
      res.citas.forEach((cita: any) => {
        if (cita.estado === 'Cancelada') return

        const d = new Date(cita.fecha_hora_inicio)
        const key = toCalendarKey(d)
        if (!map[key]) map[key] = []
        map[key].push({
          id: cita.id_cita,
          title: cita.tipo_cita === 1 ? 'Revisión (60m)' : 'Consulta (30m)',
          time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: cita.estado,
        })
      })
    }
    patientAppointments.value = map
  } catch (error) {
    console.error('Error al recargar citas:', error)
  }
}

async function loadDentistPatients() {
  if (!isDentist.value) return
  isLoadingPatients.value = true

  try {
    dentistPatients.value = await listPatientsForAppointments()
  } catch (error) {
    errorMsg.value =
      axios.isAxiosError(error) && error.response?.data?.message
        ? error.response.data.message
        : 'No se pudo cargar la lista de pacientes'
  } finally {
    isLoadingPatients.value = false
  }
}

async function loadDentistAppointmentsByMonth() {
  if (!isDentist.value) return
  isLoadingAppointments.value = true

  const start = new Date(currentYear.value, currentMonth.value, 1, 0, 0, 0)
  const end = new Date(currentYear.value, currentMonth.value + 1, 0, 23, 59, 59)

  try {
    dentistAppointments.value = await listDentistAppointments({
      desde: start.toISOString(),
      hasta: end.toISOString(),
    })
  } catch (error) {
    errorMsg.value =
      axios.isAxiosError(error) && error.response?.data?.message
        ? error.response.data.message
        : 'No se pudieron cargar las citas del mes seleccionado'
  } finally {
    isLoadingAppointments.value = false
  }
}

function selectedDuration(): number {
  const selectedType = APPOINTMENT_TYPE_OPTIONS.find(
    (option) => option.value === dentistForm.value.type,
  )
  return selectedType?.duration ?? 60
}

async function handleCrearCitaDentista() {
  if (!isDentist.value) return

  errorMsg.value = null
  successMsg.value = null

  if (!dentistForm.value.patientId || !dentistForm.value.date || !horaSeleccionadaDentista.value) {
    errorMsg.value = 'Selecciona paciente, fecha y un horario disponible'
    return
  }

  isSaving.value = true

  try {
    await createDentistAppointment({
      idPaciente: Number(dentistForm.value.patientId),
      fecha: dentistForm.value.date,
      horaInicio: dentistForm.value.startTime,
      duracionMinutos: selectedDuration(),
      tipoCita: Number(dentistForm.value.type),
    })

    successMsg.value = 'Cita creada correctamente'
    showForm.value = false
    await loadDentistAppointmentsByMonth()
  } catch (error) {
    errorMsg.value =
      axios.isAxiosError(error) && error.response?.data?.message
        ? error.response.data.message
        : 'No se pudo crear la cita'
  } finally {
    isSaving.value = false
  }
}

async function handleGuardarEdicionDentista() {
  if (!isDentist.value || !dentistSelectedAppointment.value || !dentistEditTime.value) return

  isSaving.value = true
  errorMsg.value = null

  try {
    await citasApi.editarCita(dentistSelectedAppointment.value.id, {
      fecha_hora_inicio: dentistEditTime.value,
    })

    successMsg.value = 'Horario actualizado correctamente'
    dentistSelectedAppointment.value = null
    isEditingDentist.value = false
    dentistEditTime.value = null
    await loadDentistAppointmentsByMonth()
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } }
    errorMsg.value = err.response?.data?.message ?? 'No se pudo editar la cita.'
  } finally {
    isSaving.value = false
  }
}

function cancelarEdicionDentista() {
  isEditingDentist.value = false
  dentistSelectedAppointment.value = null
  dentistEditTime.value = null
  errorMsg.value = null
}

watch([currentYear, currentMonth], () => {
  if (isDentist.value) {
    void loadDentistAppointmentsByMonth()
  }
})

watch(
  () => dentistForm.value.date,
  (value) => {
    if (!isDentist.value) return

    if (!value) {
      selectedDate.value = null
      horariosDisponiblesDentista.value = []
      horaSeleccionadaDentista.value = null
      dentistForm.value.startTime = ''
      dentistEditSlots.value = []
      dentistEditTime.value = null
      return
    }

    selectedDate.value = value
    const key = fromInputDateToKey(value)
    if (!key) {
      return
    }

    const [yearStr, monthStr] = key.split('-')
    const year = Number(yearStr)
    const month = Number(monthStr)
    if (!Number.isNaN(year) && !Number.isNaN(month)) {
      currentYear.value = year
      currentMonth.value = month - 1
    }

    void fetchDisponibilidadDentista()
  },
)

watch(
  () => dentistForm.value.type,
  () => {
    if (!isDentist.value || !dentistForm.value.date) return
    horaSeleccionadaDentista.value = null
    dentistForm.value.startTime = ''
    void fetchDisponibilidadDentista()
    if (dentistSelectedAppointment.value) {
      void fetchDentistEditSlots(dentistForm.value.date, dentistForm.value.type)
    }
  },
)

watch(
  () => role.value,
  (value) => {
    if (!value) return

    resetPanelState()
    showForm.value = false

    if (value === 'patient') {
      void cargarCitasDelCalendario()
      return
    }

    if (value === 'dentist') {
      void loadDentistPatients()
      void loadDentistAppointmentsByMonth()
    }
  },
  { immediate: true },
)

onMounted(async () => {
  if (sessionStore.status === 'unknown') {
    await sessionStore.bootstrap()
  }
})
</script>

<template>
  <div class="fade-in max-w-7xl mx-auto">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <div class="flex items-center gap-1.5 text-xs text-muted font-medium my-2">
          <span class="text-muted/60">🏠</span>
          <span class="text-muted/60">&gt;</span>
          <span class="bg-card border border-border px-2 py-0.5 rounded-lg">Citas</span>
        </div>
        <h1 class="font-display text-4xl font-semibold text-black">Gestión de Citas</h1>
        <p class="text-sm text-muted">
          {{
            isDentist
              ? 'Agenda y gestiona las citas de tus pacientes.'
              : 'Agenda, consulta o modifica tus visitas al dentista.'
          }}
        </p>
      </div>

      <div class="flex items-center gap-3">
        <div class="flex items-center bg-card border border-border rounded-2xl p-1 shadow-sm">
          <button class="p-2 hover:bg-surface rounded-xl transition-colors" @click="prevMonth">
            <ChevronLeft class="w-4 h-4" />
          </button>
          <span class="px-4 text-sm font-bold text-black min-w-35 text-center">
            {{ MONTH_NAMES[currentMonth] }} {{ currentYear }}
          </span>
          <button class="p-2 hover:bg-surface rounded-xl transition-colors" @click="nextMonth">
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <Transition name="toast">
      <div
        v-if="successMsg"
        class="mb-4 flex items-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 rounded-2xl text-sm font-medium"
      >
        <CheckCircle2 class="w-4 h-4 shrink-0" />
        {{ successMsg }}
      </div>
    </Transition>

    <div class="grid grid-cols-1 xl:grid-cols-4 gap-8">
      <div class="xl:col-span-3 bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div class="grid grid-cols-7 text-center bg-surface/50 border-b border-border">
          <div
            v-for="d in DAY_NAMES"
            :key="d"
            class="py-4 text-[10px] font-bold text-muted tracking-widest uppercase"
          >
            {{ d }}
          </div>
        </div>

        <div class="grid grid-cols-7">
          <div
            v-for="(cell, i) in calendarDays"
            :key="i"
            :class="[
              'min-h-30 p-3 border-r border-b border-border transition-all relative group',
              cell.current && (!isPatient || cell.isValid)
                ? 'hover:bg-accent/5 cursor-pointer'
                : 'bg-surface/20 opacity-40 cursor-not-allowed',
              selectedCellKey === cell.key ? 'bg-accent/10 ring-2 ring-inset ring-accent/30' : '',
            ]"
            @click="selectDay(cell)"
          >
            <div class="flex justify-between items-start mb-2">
              <span
                :class="[
                  'text-sm font-bold',
                  cell.isToday
                    ? 'bg-accent text-white w-7 h-7 flex items-center justify-center rounded-full shadow-md'
                    : 'text-black',
                ]"
              >
                {{ cell.day }}
              </span>
              <Plus
                v-if="cell.current && (!isPatient || cell.isValid)"
                class="w-4 h-4 text-accent opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </div>

            <div class="space-y-1">
              <div
                v-for="appt in appointmentsByDate[cell.key] ?? []"
                :key="appt.id"
                :class="[
                  'px-2 py-1 text-[10px] font-bold rounded-lg truncate shadow-sm',
                  appt.badgeClass ?? 'bg-accent text-white',
                  isPatient ? 'cursor-pointer hover:ring-2 ring-offset-1 ring-accent' : '',
                ]"
                @click.stop="onAppointmentClick(appt, cell.key)"
              >
                {{ appt.time }} - {{ appt.title }}
              </div>

              <div
                v-if="
                  isDentist &&
                  isLoadingAppointments &&
                  cell.current &&
                  (appointmentsByDate[cell.key] ?? []).length === 0
                "
                class="text-[10px] text-muted"
              >
                Cargando...
              </div>
            </div>
          </div>
        </div>
      </div>

      <aside class="space-y-6">
        <div class="bg-card border border-border rounded-3xl p-6 shadow-sm">
          <h2 class="font-display font-bold text-black mb-4 flex items-center gap-2">
            <CalendarIcon class="w-5 h-5 text-accent" />
            {{ panelTitle }}
          </h2>

          <div v-if="isPatient && citaSeleccionada" class="space-y-4">
            <div class="p-4 bg-surface rounded-2xl border border-border">
              <p class="text-xs text-muted font-bold uppercase mb-1">Cita Programada</p>
              <p class="text-sm font-bold text-black">
                {{ selectedDate }} · {{ citaSeleccionada.time }}
              </p>
              <p class="text-sm text-muted mt-0.5">{{ citaSeleccionada.title }}</p>

              <div class="mt-3 flex items-center gap-2">
                <Clock
                  v-if="citaSeleccionada.status === 'Pendiente'"
                  class="w-4 h-4 text-amber-500"
                />
                <CheckCircle2
                  v-else-if="citaSeleccionada.status === 'Confirmada'"
                  class="w-4 h-4 text-emerald-500"
                />
                <AlertCircle v-else class="w-4 h-4 text-red-500" />
                <span class="text-xs font-bold text-black">{{ citaSeleccionada.status }}</span>
              </div>
            </div>

            <div v-if="isEditing" class="space-y-3">
              <label class="text-[10px] font-bold text-muted uppercase px-1">
                Selecciona un nuevo horario
              </label>

              <div
                v-if="isLoadingEditSlots"
                class="text-center py-4 text-xs text-muted animate-pulse"
              >
                Buscando horarios disponibles...
              </div>

              <div
                v-else-if="horariosEdicion.length === 0"
                class="text-center py-4 text-xs text-red-500 font-bold bg-red-50 rounded-xl border border-red-200"
              >
                No hay otros horarios disponibles este día.
              </div>

              <div v-else class="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                <button
                  v-for="slot in horariosEdicion"
                  :key="slot"
                  :class="[
                    'py-2 text-xs font-bold rounded-xl transition-all border',
                    horaEditada === slot
                      ? 'bg-accent text-white border-accent shadow-sm'
                      : 'bg-white border-border text-black hover:border-accent/50 hover:bg-accent/5',
                  ]"
                  @click="horaEditada = slot"
                >
                  {{ formatHora(slot) }}
                </button>
              </div>
            </div>

            <div
              v-if="errorMsg"
              class="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-400/30 text-red-600 rounded-xl text-xs font-medium"
            >
              <AlertCircle class="w-3.5 h-3.5 shrink-0" />
              {{ errorMsg }}
            </div>

            <template v-if="isEditing">
              <button
                :disabled="!horaEditada || isSaving"
                :class="[
                  'w-full py-3 rounded-2xl text-sm font-bold transition-all',
                  horaEditada && !isSaving
                    ? 'bg-accent text-white shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-95'
                    : 'bg-surface text-muted cursor-not-allowed border border-border',
                ]"
                @click="handleConfirmarEdicion"
              >
                {{ isSaving ? 'Guardando...' : 'Guardar Cambios' }}
              </button>

              <button
                class="w-full py-2 text-xs font-bold text-muted hover:text-black transition-colors"
                @click="cancelarEdicion"
              >
                Cancelar Edición
              </button>
            </template>

            <template v-else>
              <button
                class="w-full py-3 flex items-center justify-center gap-2 bg-surface border border-border rounded-2xl text-sm font-bold text-black hover:border-accent/50 hover:bg-accent/5 transition-all"
                @click="activarEdicion"
              >
                <Pencil class="w-4 h-4 text-accent" />
                Modificar Horario
              </button>

              <button
                class="w-full py-3 bg-red-50 text-red-600 border border-red-200 rounded-2xl text-sm font-bold hover:bg-red-500 hover:text-white transition-all"
                @click="handleCancelarCita(citaSeleccionada.id)"
              >
                Cancelar Cita
              </button>

              <button
                class="w-full py-2 text-xs font-bold text-muted hover:text-black transition-colors"
                @click="((citaSeleccionada = null), (errorMsg = null))"
              >
                Cerrar Detalles
              </button>
            </template>
          </div>

          <div
            v-else-if="isDentist && isEditingDentist && dentistSelectedAppointment"
            class="space-y-4"
          >
            <div class="p-4 bg-surface rounded-2xl border border-border">
              <p class="text-xs text-muted font-bold uppercase mb-1">Cita Programada</p>
              <p class="text-sm font-bold text-black">
                {{ selectedDate }} · {{ formatHora(dentistSelectedAppointment.startAt) }}
              </p>
              <p class="text-sm text-muted mt-0.5">
                {{ dentistSelectedAppointment.patientName }} ·
                {{ dentistTypeLabel(dentistSelectedAppointment.type) }}
              </p>

              <div class="mt-3 flex items-center gap-2">
                <span
                  :class="[
                    'text-xs font-bold px-2 py-1 rounded-full',
                    appointmentBadgeClass(dentistSelectedAppointment.status),
                  ]"
                >
                  {{ dentistSelectedAppointment.status }}
                </span>
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-[10px] font-bold text-muted uppercase px-1">
                Selecciona un nuevo horario
              </label>

              <div
                v-if="isLoadingDentistEditSlots"
                class="text-center py-4 text-xs text-muted animate-pulse"
              >
                Buscando horarios disponibles...
              </div>

              <div
                v-else-if="dentistEditSlots.length === 0"
                class="text-center py-4 text-xs text-red-500 font-bold bg-red-50 rounded-xl border border-red-200"
              >
                No hay otros horarios disponibles este día.
              </div>

              <div v-else class="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                <button
                  v-for="slot in dentistEditSlots"
                  :key="slot"
                  :class="[
                    'py-2 text-xs font-bold rounded-xl transition-all border',
                    dentistEditTime === slot
                      ? 'bg-accent text-white border-accent shadow-sm'
                      : 'bg-white border-border text-black hover:border-accent/50 hover:bg-accent/5',
                  ]"
                  @click="dentistEditTime = slot"
                >
                  {{ formatHora(slot) }}
                </button>
              </div>
            </div>

            <div
              v-if="errorMsg"
              class="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-400/30 text-red-600 rounded-xl text-xs font-medium"
            >
              <AlertCircle class="w-3.5 h-3.5 shrink-0" />
              {{ errorMsg }}
            </div>

            <button
              :disabled="!dentistEditTime || isSaving"
              :class="[
                'w-full py-3 rounded-2xl text-sm font-bold transition-all',
                dentistEditTime && !isSaving
                  ? 'bg-accent text-white shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-95'
                  : 'bg-surface text-muted cursor-not-allowed border border-border',
              ]"
              @click="handleGuardarEdicionDentista"
            >
              {{ isSaving ? 'Guardando...' : 'Guardar Cambios' }}
            </button>

            <button
              class="w-full py-2 text-xs font-bold text-muted hover:text-black transition-colors"
              @click="cancelarEdicionDentista"
            >
              Cancelar Edición
            </button>
          </div>

          <div v-else-if="showForm" class="space-y-4">
            <div class="p-4 bg-surface rounded-2xl border border-border">
              <p class="text-xs text-muted font-bold uppercase mb-1">Fecha seleccionada</p>
              <p class="text-sm font-bold text-black">
                {{ selectedDate || (isDentist ? 'Selecciona una fecha' : '') }}
              </p>
            </div>

            <template v-if="isPatient">
              <div class="space-y-2">
                <label class="text-[10px] font-bold text-muted uppercase px-1"
                  >Motivo de consulta</label
                >
                <select
                  v-model="formCita.tipo_cita"
                  class="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                  @change="onTipoCitaChange"
                >
                  <option :value="1">Revisión o Tratamiento Mayor (60 min)</option>
                  <option :value="2">Revisión de Rutina (30 min)</option>
                </select>
              </div>

              <div class="space-y-2">
                <label class="text-[10px] font-bold text-muted uppercase px-1"
                  >Horarios Disponibles</label
                >

                <div
                  v-if="isLoadingSlots"
                  class="text-center py-4 text-xs text-muted animate-pulse"
                >
                  Buscando espacios...
                </div>

                <div
                  v-else-if="horariosDisponibles.length === 0"
                  class="text-center py-4 text-xs text-red-500 font-bold bg-red-50 rounded-xl border border-red-200"
                >
                  No hay espacios disponibles este día.
                </div>

                <div v-else class="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  <button
                    v-for="slot in horariosDisponibles"
                    :key="slot"
                    :class="[
                      'py-2 text-xs font-bold rounded-xl transition-all border',
                      horaSeleccionada === slot
                        ? 'bg-accent text-white border-accent shadow-sm'
                        : 'bg-white border-border text-black hover:border-accent/50 hover:bg-accent/5',
                    ]"
                    @click="horaSeleccionada = slot"
                  >
                    {{ formatHora(slot) }}
                  </button>
                </div>
              </div>

              <div
                v-if="errorMsg"
                class="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-400/30 text-red-600 rounded-xl text-xs font-medium"
              >
                <AlertCircle class="w-3.5 h-3.5 shrink-0" />
                {{ errorMsg }}
              </div>

              <button
                :disabled="!horaSeleccionada || isSaving"
                :class="[
                  'w-full py-3 rounded-2xl text-sm font-bold transition-all',
                  horaSeleccionada && !isSaving
                    ? 'bg-accent text-white shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-95'
                    : 'bg-surface text-muted cursor-not-allowed border border-border',
                ]"
                @click="handleConfirmarCitaPaciente"
              >
                {{ isSaving ? 'Guardando...' : 'Confirmar Cita' }}
              </button>
            </template>

            <template v-else-if="isDentist">
              <div>
                <label class="text-[10px] font-bold text-muted uppercase px-1">Paciente</label>
                <select
                  v-model="dentistForm.patientId"
                  class="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-black focus:outline-none focus:border-accent transition-colors"
                  :disabled="isLoadingPatients"
                >
                  <option value="">Selecciona un paciente</option>
                  <option
                    v-for="patient in dentistPatients"
                    :key="patient.id"
                    :value="String(patient.id)"
                  >
                    {{ patient.fullName }} · {{ patient.phone }}
                  </option>
                </select>
              </div>

              <div>
                <label class="text-[10px] font-bold text-muted uppercase px-1">Tipo de cita</label>
                <select
                  v-model="dentistForm.type"
                  class="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-black focus:outline-none focus:border-accent transition-colors"
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

              <div class="space-y-2">
                <label class="text-[10px] font-bold text-muted uppercase px-1">
                  Horarios Disponibles
                </label>

                <div
                  v-if="isLoadingDentistSlots"
                  class="text-center py-4 text-xs text-muted animate-pulse"
                >
                  Buscando espacios...
                </div>

                <div
                  v-else-if="horariosDisponiblesDentista.length === 0"
                  class="text-center py-4 text-xs text-red-500 font-bold bg-red-50 rounded-xl border border-red-200"
                >
                  No hay espacios disponibles este día.
                </div>

                <div v-else class="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  <button
                    v-for="slot in horariosDisponiblesDentista"
                    :key="slot"
                    :class="[
                      'py-2 text-xs font-bold rounded-xl transition-all border',
                      horaSeleccionadaDentista === slot
                        ? 'bg-accent text-white border-accent shadow-sm'
                        : 'bg-white border-border text-black hover:border-accent/50 hover:bg-accent/5',
                    ]"
                    @click="
                      ((horaSeleccionadaDentista = slot),
                      (dentistForm.startTime = formatHoraInput(slot)))
                    "
                  >
                    {{ formatHora(slot) }}
                  </button>
                </div>
              </div>

              <div
                v-if="errorMsg"
                class="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-400/30 text-red-600 rounded-xl text-xs font-medium"
              >
                <AlertCircle class="w-3.5 h-3.5 shrink-0" />
                {{ errorMsg }}
              </div>

              <button
                :disabled="
                  isSaving ||
                  !dentistForm.patientId ||
                  !dentistForm.date ||
                  !horaSeleccionadaDentista
                "
                :class="[
                  'w-full py-3 rounded-2xl text-sm font-bold transition-all',
                  !isSaving && dentistForm.patientId && dentistForm.date && horaSeleccionadaDentista
                    ? 'bg-accent text-white shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-95'
                    : 'bg-surface text-muted cursor-not-allowed border border-border',
                ]"
                @click="handleCrearCitaDentista"
              >
                {{ isSaving ? 'Guardando...' : 'Crear cita' }}
              </button>
            </template>

            <button
              class="w-full py-2 text-xs font-bold text-muted hover:text-black transition-colors"
              @click="((showForm = false), (errorMsg = null))"
            >
              Cancelar
            </button>
          </div>

          <div v-else-if="isDentist" class="space-y-4">
            <div class="flex items-center justify-between">
              <p class="text-xs text-muted font-bold uppercase">
                {{ selectedDate ? 'Citas del día' : 'Selecciona una fecha' }}
              </p>
              <button
                v-if="selectedDate"
                class="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-accent text-white shadow-sm hover:scale-[1.02] active:scale-95 transition-all"
                @click="openDentistCreateForm"
              >
                <Plus class="w-3.5 h-3.5" />
                Crear cita
              </button>
            </div>

            <div v-if="!selectedDate" class="text-center py-6 text-xs text-muted">
              Selecciona una fecha para crear o ver las citas.
            </div>

            <div
              v-else-if="dentistAppointmentsForSelectedDate.length === 0"
              class="text-center py-6 text-xs text-red-500 font-bold bg-red-50 rounded-xl border border-red-200"
            >
              No hay citas registradas para este día.
            </div>

            <div v-else class="space-y-2">
              <button
                v-for="appt in dentistAppointmentsForSelectedDate"
                :key="appt.id"
                class="w-full text-left p-3 rounded-2xl border border-border bg-surface hover:border-accent/50 hover:bg-accent/5 transition-all"
                @click="selectDentistAppointment(appt)"
              >
                <div class="flex items-center justify-between">
                  <span class="text-sm font-bold text-black">
                    {{ formatHora(appt.startAt) }} · {{ appt.patientName }}
                  </span>
                  <span
                    :class="[
                      'text-[10px] font-bold px-2 py-1 rounded-full',
                      appointmentBadgeClass(appt.status),
                    ]"
                  >
                    {{ appt.status }}
                  </span>
                </div>
                <p class="text-xs text-muted mt-1">
                  {{ dentistTypeLabel(appt.type) }}
                </p>
              </button>
            </div>
          </div>

          <div v-else class="text-center py-8">
            <div
              class="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4 border border-border"
            >
              <Info class="w-8 h-8 text-muted/30" />
            </div>
            <p class="text-xs text-muted leading-relaxed px-4">
              Haz clic en un día disponible para agendar, o en una cita existente para ver sus
              detalles.
            </p>
          </div>
        </div>

        <div v-if="isPatient" class="bg-card border border-border rounded-3xl p-6 shadow-sm">
          <h3 class="text-xs font-bold text-black mb-4 uppercase tracking-wider">
            Estado de tus citas
          </h3>
          <div class="space-y-3">
            <div class="flex items-center gap-3 text-xs">
              <CheckCircle2 class="w-4 h-4 text-emerald-500" />
              <span class="text-muted font-medium">Confirmada</span>
            </div>
            <div class="flex items-center gap-3 text-xs">
              <Clock class="w-4 h-4 text-amber-500" />
              <span class="text-muted font-medium">Pendiente</span>
            </div>
            <div class="flex items-center gap-3 text-xs">
              <AlertCircle class="w-4 h-4 text-red-500" />
              <span class="text-muted font-medium">Requiere Atención</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
