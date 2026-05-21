<script setup lang="ts">// vesión que funciona
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
  listarTipoCitas,
  type DentistAppointment,
  type DentistPatientOption,
  type TipoCitaOption,
} from '@/shared/api/dentistAppointments'

interface Appointment {
  id: number
  title: string
  time: string
  status: string
  typeId?: number
  typeLabel?: string
  typeDuration?: number
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

interface PatientCita {
  id_cita: number
  fecha_hora_inicio: string
  tipo_cita?: number
  estado: string
  tipo?: {
    id_tipocita?: number
    nombre?: string
    nombre_corto?: string
    duracion?: number
  }
}

interface PatientCitasResponse {
  citas: PatientCita[]
}

interface AppointmentListItem {
  id: number
  status: string
  timeLabel: string
  titleLabel: string
  subtitle?: string
  kind: 'patient' | 'dentist'
  appointment: Appointment | DentistAppointment
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
const isLoadingAppointmentTypes = ref(false)
const isSaving = ref(false)
const pacienteTieneCitaActiva = ref(false)

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

const fechaEdicion = ref<string>('')   // fecha elegida para reprogramar
const fechaEdicionDentista = ref<string>('')
 
// Fecha mínima seleccionable: ahora + 36h (regla de anticipación para editar)
const editDateMin = computed(() => {
  const d = new Date()
  d.setHours(d.getHours() + 36)
  return d.toISOString().split('T')[0] ?? ''
})

const dentistForm = ref({
  patientId: '',
  date: '',
  startTime: '',
  type: '1',
})

const appointmentTypeOptions = ref<TipoCitaOption[]>([])

function toCalendarKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
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

  if (status === 'Pendiente') {
    return 'bg-amber-500 text-white'
  }

  return 'bg-accent text-white'
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

function getResponseData<T>(response: unknown): T | undefined {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as { data?: T }).data
  }

  return response as T
}

// Helper para filtrar los slots que no cumplen con la anticipación mínima
function filterSlotsByAnticipation(slots: string[], hours: number): string[] {
  const limit = new Date()
  limit.setHours(limit.getHours() + hours)
  return slots.filter((slot) => new Date(slot) > limit)
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
      typeId: appointment.typeId,
      typeLabel: appointment.typeDuration
        ? `${appointment.type} (${appointment.typeDuration} min)`
        : appointment.type,
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
  const diaSemana = new Date(y, m, d).getDay()
  const esDomingo = diaSemana === 0

  const primerSlot = new Date(y, m, d, 9, 0, 0)
  const isValid = esDomingo
    ? false
    : isPatient.value
      ? primerSlot > limite48h
      : true

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

const appointmentsForSelectedDate = computed<AppointmentListItem[]>(() => {
  if (!selectedDate.value) return []

  if (isDentist.value) {
    return dentistAppointmentsForSelectedDate.value.map((appointment) => ({
      id: appointment.id,
      status: appointment.status,
      timeLabel: formatHora(appointment.startAt),
      titleLabel: appointment.patientName,
      subtitle: appointment.typeDuration
        ? `${appointment.type} (${appointment.typeDuration} min)`
        : appointment.type,
      kind: 'dentist',
      appointment,
    }))
  }

  const key = fromInputDateToKey(selectedDate.value)
  return (appointmentsByDate.value[key] ?? [])
    .slice()
    .sort((a, b) => a.time.localeCompare(b.time))
    .map((appointment) => ({
      id: appointment.id,
      status: appointment.status,
      timeLabel: appointment.time,
      titleLabel: appointment.title,
      kind: 'patient',
      appointment,
    }))
})

const panelTitle = computed(() => {
  if (isPatient.value && citaSeleccionada.value) {
    return isEditing.value ? 'Modificar Horario' : 'Detalles de la Cita'
  }

  if (isDentist.value && dentistSelectedAppointment.value) {
    return isEditingDentist.value ? 'Editar Cita' : 'Detalles de la Cita'
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

const selectedDetail = computed(() =>
  isDentist.value ? dentistSelectedAppointment.value : citaSeleccionada.value,
)

const selectedDetailTime = computed(() => {
  if (isDentist.value && dentistSelectedAppointment.value) {
    return formatHora(dentistSelectedAppointment.value.startAt)
  }

  if (citaSeleccionada.value) {
    return citaSeleccionada.value.time
  }

  return ''
})

const selectedDetailSubtitle = computed(() => {
  if (isDentist.value && dentistSelectedAppointment.value) {
    const appointmentType = dentistSelectedAppointment.value.typeDuration
      ? `${dentistSelectedAppointment.value.type} (${dentistSelectedAppointment.value.typeDuration} min)`
      : dentistSelectedAppointment.value.type
    return `${dentistSelectedAppointment.value.patientName} · ${appointmentType}`
  }

  if (citaSeleccionada.value) {
    return citaSeleccionada.value.title
  }

  return ''
})

const selectedDetailStatus = computed(() => {
  if (isDentist.value && dentistSelectedAppointment.value) {
    return dentistSelectedAppointment.value.status
  }

  if (citaSeleccionada.value) {
    return citaSeleccionada.value.status
  }

  return ''
})

const selectedDetailDateTime = computed(() => {
  if (!selectedDate.value) return ''
  if (!selectedDetailTime.value) return selectedDate.value
  return `${selectedDate.value} · ${selectedDetailTime.value}`
})

const selectedIsEditing = computed(() =>
  isDentist.value ? isEditingDentist.value : isEditing.value,
)
const selectedEditSlots = computed(() =>
  isDentist.value ? dentistEditSlots.value : horariosEdicion.value,
)
const selectedEditTime = computed(() =>
  isDentist.value ? dentistEditTime.value : horaEditada.value,
)
const isLoadingSelectedEditSlots = computed(() =>
  isDentist.value ? isLoadingDentistEditSlots.value : isLoadingEditSlots.value,
)
const isCitaSeleccionadaCancelada = computed<boolean>(() => {
  if (isDentist.value) {
    return dentistSelectedAppointment.value?.status === 'Cancelada'
  }
  return citaSeleccionada.value?.status === 'Cancelada'
})

const appointmentTypeModel = computed({
  get() {
    return isDentist.value ? dentistForm.value.type : String(formCita.value.tipo_cita)
  },
  set(value: string) {
    if (isDentist.value) {
      dentistForm.value.type = value
    } else {
      formCita.value.tipo_cita = Number(value)
    }
  },
})

const availableSlots = computed(() =>
  isDentist.value ? horariosDisponiblesDentista.value : horariosDisponibles.value,
)
const selectedSlot = computed(() =>
  isDentist.value ? horaSeleccionadaDentista.value : horaSeleccionada.value,
)
const isLoadingAvailableSlots = computed(() =>
  isDentist.value ? isLoadingDentistSlots.value : isLoadingSlots.value,
)
const isCreateDisabled = computed(() => {
  if (isDentist.value) {
    return (
      isSaving.value ||
      !dentistForm.value.patientId ||
      !dentistForm.value.date ||
      !horaSeleccionadaDentista.value
    )
  }

  return isSaving.value || !horaSeleccionada.value
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

async function selectDay(cell: CalendarCell) {
  if (!cell.current) return

  if (isPatient.value && !cell.isValid) {
    resetPanelState()
    showForm.value = false
    return
  }

  const [y, m, d] = cell.key.split('-')
  const formattedDate = `${y}-${(m ?? '').padStart(2, '0')}-${(d ?? '').padStart(2, '0')}`

  // ← MODIFICAR: bloquear reprogramación si la cita ya está cancelada
  if (isPatient.value && isEditing.value && !isCitaSeleccionadaCancelada.value) {
    fechaEdicion.value = formattedDate
    await fetchSlotsEdicion(formattedDate)
    return
  }

  // ← MODIFICAR: igual para dentista
  if (isDentist.value && isEditingDentist.value && !isCitaSeleccionadaCancelada.value) {
    fechaEdicionDentista.value = formattedDate
    await fetchDentistEditSlots(formattedDate, dentistSelectedAppointment.value?.typeId ?? 1)
    return
  }

  selectedDate.value = formattedDate
  resetPanelState()
  showForm.value = false

  if (isDentist.value) {
    dentistForm.value.date = formattedDate
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

function setSelectedSlot(slot: string) {
  if (isDentist.value) {
    horaSeleccionadaDentista.value = slot
    dentistForm.value.startTime = formatHoraInput(slot)
  } else {
    horaSeleccionada.value = slot
  }
}

function openCreateForm() {
  // RN17 — paciente con cita activa no puede agendar otra
  if (isPatient.value && pacienteTieneCitaActiva.value) {
    errorMsg.value =
      'Ya tienes una cita activa. Cancela o completa tu cita actual antes de agendar una nueva.'
    return
  }
 
  errorMsg.value = null
  dentistSelectedAppointment.value = null
  citaSeleccionada.value = null
  isEditingDentist.value = false
  isEditing.value = false
  showForm.value = true
 
  if (isDentist.value) {
    if (selectedDate.value) {
      dentistForm.value.date = selectedDate.value
    }
    return
  }
 
  void fetchDisponibilidad()
}

async function selectDentistAppointment(appointment: DentistAppointment) {
  if (!isDentist.value) return

  const date = new Date(appointment.startAt)
  const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`

  selectedDate.value = dateKey
  dentistForm.value.date = dateKey
  dentistForm.value.type = String(appointment.typeId)
  dentistSelectedAppointment.value = appointment
  isEditingDentist.value = false
  showForm.value = false
  errorMsg.value = null
  dentistEditTime.value = null
}

async function activarEdicionDentista() {
  if (!isDentist.value || !dentistSelectedAppointment.value || !selectedDate.value) return
  errorMsg.value = null
  isEditingDentist.value = true
  dentistEditTime.value = null
  fechaEdicionDentista.value = selectedDate.value  // parte desde el día actual de la cita
  await fetchDentistEditSlots(selectedDate.value, dentistSelectedAppointment.value.typeId)
}

function setSelectedEditTime(slot: string) {
  if (isDentist.value) {
    dentistEditTime.value = slot
  } else {
    horaEditada.value = slot
  }
}

function handleStartEdit() {
  if (isDentist.value) {
    void activarEdicionDentista()
  } else {
    void activarEdicion()
  }
}

function handleCancelEditMode() {
  if (isDentist.value) {
    cancelarEdicionDentista()
  } else {
    cancelarEdicion()
  }
}

function handleSaveEdit() {
  if (isDentist.value) {
    void handleGuardarEdicionDentista()
  } else {
    void handleConfirmarEdicion()
  }
}

function handleCancelAppointment() {
  if (isDentist.value && dentistSelectedAppointment.value) {
    void handleCancelarCitaDentista(dentistSelectedAppointment.value.id)
    return
  }

  if (citaSeleccionada.value) {
    void handleCancelarCita(citaSeleccionada.value.id)
  }
}

function handleCloseDetails() {
  if (isDentist.value) {
    dentistSelectedAppointment.value = null
  } else {
    citaSeleccionada.value = null
  }
  errorMsg.value = null
}

function handleCreateAppointment() {
  if (isDentist.value) {
    void handleCrearCitaDentista()
  } else {
    void handleConfirmarCitaPaciente()
  }
}

function handleSelectFromList(item: AppointmentListItem) {
  if (!selectedDate.value) return

  if (item.kind === 'dentist') {
    void selectDentistAppointment(item.appointment as DentistAppointment)
    return
  }

  selectAppointment(item.appointment as Appointment, fromInputDateToKey(selectedDate.value))
}

async function fetchDentistEditSlots(date: string, tipoId: number) {
  if (!isDentist.value) return

  isLoadingDentistEditSlots.value = true
  dentistEditSlots.value = []

  try {
    const res = (await citasApi.obtenerDisponibilidad(
      date,
      tipoId,
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
      Number(dentistForm.value.type) || 1,
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

async function fetchSlotsEdicion(fecha: string) {
  if (!citaSeleccionada.value) return
  isLoadingEditSlots.value = true
  horariosEdicion.value = []
  horaEditada.value = null
  try {
    const tipoCita = citaSeleccionada.value.typeId ?? 1
    const res = (await citasApi.obtenerDisponibilidad(
      fecha,
      tipoCita,
      ID_DENTISTA,
    )) as DisponibilidadResponse
    horariosEdicion.value = filterSlotsByAnticipation(res?.disponibles ?? [], 36)
  } catch (error) {
    console.error('Error al buscar horarios para edición:', error)
    horariosEdicion.value = []
  } finally {
    isLoadingEditSlots.value = false
  }
}

async function activarEdicion() {
  if (!selectedDate.value || !citaSeleccionada.value || !isPatient.value) return
  isEditing.value = true
  horaEditada.value = null
  errorMsg.value = null
  fechaEdicion.value = selectedDate.value   // parte desde el día actual de la cita
  await fetchSlotsEdicion(selectedDate.value)
}

function cancelarEdicion() {
  isEditing.value = false
  horaEditada.value = null
  fechaEdicion.value = ''
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

  isSaving.value = true          // ← AGREGAR: bloquea UI durante el call
  errorMsg.value = null

  try {
    await citasApi.cancelarCita(idCita)
    successMsg.value = '¡Cita cancelada correctamente!'
    citaSeleccionada.value = null
    selectedDate.value = null    // ← AGREGAR: limpia el día resaltado
    isEditing.value = false
    fechaEdicion.value = ''      // ← AGREGAR: limpia fecha en modo edición
    horaEditada.value = null
    await cargarCitasDelCalendario()
    showForm.value = false
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } }
    errorMsg.value = err.response?.data?.message ?? 'No se pudo cancelar la cita.'
  } finally {
    isSaving.value = false       // ← AGREGAR
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
    const res = getResponseData<PatientCitasResponse>(response)

    const map: Record<string, Appointment[]> = {}

    if (res?.citas) {
      res.citas.forEach((cita) => {
        if (cita.estado === 'Cancelada') return

        const d = new Date(cita.fecha_hora_inicio)
        const key = toCalendarKey(d)
        if (!map[key]) map[key] = []
        map[key].push({
          id: cita.id_cita,
          title: cita.tipo?.nombre_corto
            ? cita.tipo.duracion
              ? `${cita.tipo.nombre_corto} (${cita.tipo.duracion} min)`
              : cita.tipo.nombre_corto
            : (cita.tipo?.nombre ?? 'Cita'),
          time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: cita.estado,
          typeId: cita.tipo_cita ?? cita.tipo?.id_tipocita,
          typeLabel: cita.tipo?.nombre ?? cita.tipo?.nombre_corto,
          typeDuration: cita.tipo?.duracion,
          badgeClass: appointmentBadgeClass(cita.estado),
        })
      })
    }

    patientAppointments.value = map
 
    // RN17 — detectar si el paciente ya tiene alguna cita activa futura
    const ahora = new Date()
    pacienteTieneCitaActiva.value = (res?.citas ?? []).some(
      (c) =>
        (c.estado === 'Pendiente' || c.estado === 'Confirmada') &&
        new Date(c.fecha_hora_inicio) > ahora,
    )
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
  const selectedType = appointmentTypeOptions.value.find(
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

async function handleCancelarCitaDentista(idCita: number) {
  if (!isDentist.value) return
  if (!confirm('¿Estás seguro de que deseas cancelar esta cita?')) return

  isSaving.value = true          // ← AGREGAR
  errorMsg.value = null

  try {
    await citasApi.cancelarCita(idCita)
    successMsg.value = '¡Cita cancelada correctamente!'
    dentistSelectedAppointment.value = null
    selectedDate.value = null    // ← AGREGAR
    isEditingDentist.value = false
    fechaEdicionDentista.value = ''  // ← AGREGAR
    dentistEditTime.value = null
    await loadDentistAppointmentsByMonth()
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } }
    errorMsg.value = err.response?.data?.message ?? 'No se pudo cancelar la cita.'
  } finally {
    isSaving.value = false       // ← AGREGAR
  }
}

function cancelarEdicionDentista() {
  isEditingDentist.value = false
  dentistEditTime.value = null
  fechaEdicionDentista.value = ''
  errorMsg.value = null
}

/* watch(fechaEdicion, (nuevaFecha) => {
  if (!isEditing.value || !nuevaFecha || !isPatient.value) return
  void fetchSlotsEdicion(nuevaFecha)
}) */

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
    if (dentistSelectedAppointment.value && isEditingDentist.value) {
      void fetchDentistEditSlots(dentistForm.value.date, Number(dentistForm.value.type))
    }
  },
)

watch(
  () => formCita.value.tipo_cita,
  () => {
    if (!isPatient.value) return
    horaSeleccionada.value = null
    void fetchDisponibilidad()
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

  // Cargar tipos de citas desde la API
  isLoadingAppointmentTypes.value = true
  try {
    appointmentTypeOptions.value = await listarTipoCitas()
  } catch (error) {
    console.error('Error al cargar tipos de citas:', error)
    // Usar valores por defecto en caso de error
    appointmentTypeOptions.value = [{ value: '1', label: 'Cita por defecto', duration: 60 }]
  } finally {
    isLoadingAppointmentTypes.value = false
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

    <!-- RN17 — Aviso cita activa -->
    <div
      v-if="isPatient && pacienteTieneCitaActiva"
      class="mb-4 flex items-start gap-3 px-4 py-3.5 bg-amber-500/10 border border-amber-400/30 text-amber-800 rounded-2xl text-sm"
    >
      <Info class="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
      <div>
        <p class="font-bold text-sm">Ya tienes una cita activa</p>
        <p class="text-xs text-amber-700 mt-0.5">
          Solo puedes tener una cita pendiente o confirmada a la vez.
          Si necesitas cambiar el horario, usa la opción <strong>Modificar Horario</strong>
          en tu cita existente.
        </p>
      </div>
    </div>

    <!-- CU8: banner modo reprogramación -->
    <Transition name="toast">
      <div
        v-if="isPatient && isEditing"
        class="mb-4 flex items-center gap-3 px-4 py-3 bg-accent/10 border border-accent/30 text-accent rounded-2xl text-sm font-medium"
      >
        <CalendarIcon class="w-4 h-4 shrink-0" />
        <span>
          Selecciona el <strong>nuevo día</strong> en el calendario para reprogramar tu cita.
        </span>
      </div>
    </Transition>

    <!-- CU8: banner modo reprogramación dentista -->
    <Transition name="toast">
      <div
        v-if="isDentist && isEditingDentist"
        class="mb-4 flex items-center gap-3 px-4 py-3 bg-accent/10 border border-accent/30 text-accent rounded-2xl text-sm font-medium"
      >
        <CalendarIcon class="w-4 h-4 shrink-0" />
        <span>
          Selecciona el <strong>nuevo día</strong> en el calendario para reprogramar la cita.
        </span>
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
              (isEditing && isPatient && fromInputDateToKey(fechaEdicion) === cell.key) ||
              (isEditingDentist && isDentist && fromInputDateToKey(fechaEdicionDentista) === cell.key)
                ? 'bg-emerald-500/10 ring-2 ring-inset ring-emerald-400/40'
                : selectedCellKey === cell.key
                  ? 'bg-accent/10 ring-2 ring-inset ring-accent/30'
                  : '',
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
                ]"
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

          <div v-if="selectedDetail" class="space-y-4">
            <div class="p-4 bg-surface rounded-2xl border border-border">
              <p class="text-xs text-muted font-bold uppercase mb-1">Cita Programada</p>
              <p class="text-sm font-bold text-black">
                {{ selectedDetailDateTime }}
              </p>
              <p class="text-sm text-muted mt-0.5">{{ selectedDetailSubtitle }}</p>

              <div class="mt-3 flex items-center gap-2">
                <span
                  :class="[
                    'text-xs font-bold px-2 py-1 rounded-full',
                    appointmentBadgeClass(selectedDetailStatus),
                  ]"
                >
                  {{ selectedDetailStatus }}
                </span>
              </div>
            </div>

          <div v-if="selectedIsEditing" class="space-y-4">
 
            <!-- Fecha elegida para reprogramar (solo paciente) -->
            <div
              v-if="isPatient && fechaEdicion"
              class="p-3 bg-surface rounded-xl border border-border flex items-center gap-2"
            >
              <CalendarIcon class="w-4 h-4 text-accent shrink-0" />
              <div>
                <p class="text-[10px] text-muted font-bold uppercase">Nueva fecha</p>
                <p class="text-sm font-bold text-black">{{ fechaEdicion }}</p>
              </div>
            </div>

            <!-- Fecha elegida para reprogramar (dentista) -->
            <div
              v-if="isDentist && fechaEdicionDentista"
              class="p-3 bg-surface rounded-xl border border-border flex items-center gap-2"
            >
              <CalendarIcon class="w-4 h-4 text-accent shrink-0" />
              <div>
                <p class="text-[10px] text-muted font-bold uppercase">Nueva fecha</p>
                <p class="text-sm font-bold text-black">{{ fechaEdicionDentista }}</p>
              </div>
            </div>
 
            <!-- Slots del nuevo día -->
            <div class="space-y-2">
              <label class="text-[10px] font-bold text-muted uppercase px-1">
                Nuevo horario
              </label>
 
              <div
                v-if="isLoadingSelectedEditSlots"
                class="text-center py-4 text-xs text-muted animate-pulse"
              >
                Buscando horarios disponibles...
              </div>
 
              <div
                v-else-if="selectedEditSlots.length === 0"
                class="text-center py-4 text-xs text-red-500 font-bold bg-red-50 rounded-xl border border-red-200"
              >
                No hay horarios disponibles para este día.
              </div>
 
              <div v-else class="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                <button
                  v-for="slot in selectedEditSlots"
                  :key="slot"
                  :class="[
                    'py-2 text-xs font-bold rounded-xl transition-all border',
                    selectedEditTime === slot
                      ? 'bg-accent text-white border-accent shadow-sm'
                      : 'bg-white border-border text-black hover:border-accent/50 hover:bg-accent/5',
                  ]"
                  @click="setSelectedEditTime(slot)"
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
              :disabled="!selectedEditTime || isSaving"
              :class="[
                'w-full py-3 rounded-2xl text-sm font-bold transition-all',
                selectedEditTime && !isSaving
                  ? 'bg-accent text-white shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-95'
                  : 'bg-surface text-muted cursor-not-allowed border border-border',
              ]"
              @click="handleSaveEdit"
            >
              {{ isSaving ? 'Guardando...' : 'Confirmar Reprogramación' }}
            </button>
 
            <button
              class="w-full py-2 text-xs font-bold text-muted hover:text-black transition-colors"
              @click="handleCancelEditMode"
            >
              Cancelar
            </button>
          </div>

            <template v-else>

              <!-- ← AGREGAR: badge informativo cuando la cita está cancelada -->
              <div
                v-if="isCitaSeleccionadaCancelada"
                class="flex items-center gap-2 px-4 py-3 rounded-2xl bg-red-50 border border-red-200"
              >
                <AlertCircle class="w-4 h-4 text-red-500 shrink-0" />
                <p class="text-sm text-red-600 font-medium">Esta cita fue cancelada</p>
              </div>

              <!-- ← AGREGAR v-if: solo mostrar acciones si la cita NO está cancelada -->
              <template v-if="!isCitaSeleccionadaCancelada">
                <button
                  class="w-full py-3 flex items-center justify-center gap-2 bg-surface border border-border rounded-2xl text-sm font-bold text-black hover:border-accent/50 hover:bg-accent/5 transition-all"
                  @click="handleStartEdit"
                >
                  <Pencil class="w-4 h-4 text-accent" />
                  Modificar Horario
                </button>

                <button
                  class="w-full py-3 bg-red-50 text-red-600 border border-red-200 rounded-2xl text-sm font-bold hover:bg-red-500 hover:text-white transition-all"
                  @click="handleCancelAppointment"
                >
                  Cancelar Cita
                </button>
              </template>

              <button
                class="w-full py-2 text-xs font-bold text-muted hover:text-black transition-colors"
                @click="handleCloseDetails"
              >
                Cerrar Detalles
              </button>
            </template>
          </div>

          <div v-else-if="showForm" class="space-y-4">
            <div class="p-4 bg-surface rounded-2xl border border-border">
              <p class="text-xs text-muted font-bold uppercase mb-1">Fecha seleccionada</p>
              <p class="text-sm font-bold text-black">
                {{ selectedDate || (isDentist ? 'Selecciona una fecha' : '') }}
              </p>
            </div>

            <div v-if="isDentist">
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
                v-model="appointmentTypeModel"
                :disabled="isPatient"
                class="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-black focus:outline-none focus:border-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option
                  v-for="option in appointmentTypeOptions"
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
                v-if="isLoadingAvailableSlots"
                class="text-center py-4 text-xs text-muted animate-pulse"
              >
                Buscando espacios...
              </div>

              <div
                v-else-if="availableSlots.length === 0"
                class="text-center py-4 text-xs text-red-500 font-bold bg-red-50 rounded-xl border border-red-200"
              >
                No hay espacios disponibles este día.
              </div>

              <div v-else class="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                <button
                  v-for="slot in availableSlots"
                  :key="slot"
                  :class="[
                    'py-2 text-xs font-bold rounded-xl transition-all border',
                    selectedSlot === slot
                      ? 'bg-accent text-white border-accent shadow-sm'
                      : 'bg-white border-border text-black hover:border-accent/50 hover:bg-accent/5',
                  ]"
                  @click="setSelectedSlot(slot)"
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
              :disabled="isCreateDisabled"
              :class="[
                'w-full py-3 rounded-2xl text-sm font-bold transition-all',
                !isCreateDisabled
                  ? 'bg-accent text-white shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-95'
                  : 'bg-surface text-muted cursor-not-allowed border border-border',
              ]"
              @click="handleCreateAppointment"
            >
              {{ isSaving ? 'Guardando...' : isDentist ? 'Crear cita' : 'Confirmar Cita' }}
            </button>

            <button
              class="w-full py-2 text-xs font-bold text-muted hover:text-black transition-colors"
              @click="((showForm = false), (errorMsg = null))"
            >
              Cancelar
            </button>
          </div>

          <div v-else-if="selectedDate" class="space-y-4">
            <div class="flex items-center justify-between">
              <p class="text-xs text-muted font-bold uppercase">Citas del día</p>
              <button
                v-if="!showForm"
                class="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-accent text-white shadow-sm hover:scale-[1.02] active:scale-95 transition-all"
                @click="openCreateForm"
              >
                <Plus class="w-3.5 h-3.5" />
                Crear cita
              </button>
            </div>

            <div
              v-if="appointmentsForSelectedDate.length === 0"
              class="text-center py-6 text-xs text-red-500 font-bold bg-red-50 rounded-xl border border-red-200"
            >
              No hay citas registradas para este día.
            </div>

            <div v-else class="space-y-2">
              <button
                v-for="appt in appointmentsForSelectedDate"
                :key="appt.id"
                class="w-full text-left p-3 rounded-2xl border border-border bg-surface hover:border-accent/50 hover:bg-accent/5 transition-all"
                @click="handleSelectFromList(appt)"
              >
                <div class="flex items-center justify-between">
                  <span class="text-sm font-bold text-black">
                    {{ appt.timeLabel }} · {{ appt.titleLabel }}
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
                <p v-if="appt.subtitle" class="text-xs text-muted mt-1">
                  {{ appt.subtitle }}
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

        <!-- Leyenda -->
        <div class="bg-card border border-border rounded-3xl p-6 shadow-sm">
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
