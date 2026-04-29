<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  ChevronLeft, ChevronRight, Plus,
  Calendar as CalendarIcon,
  Clock, CheckCircle2, AlertCircle,
  Info, Pencil
} from 'lucide-vue-next'
import { citasApi } from '@/entities/citaPaciente'

// ── Tipos ─────────────────────────────────────────────────────────────────
interface Appointment {
  id: number
  title: string
  time: string
  status: string
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

interface TipoCitaInfo {
  id_tipocita: number;
  nombre_corto: string;
  duracion: number;
}

/* interface CitasResponse {
  citas: Array<{
    id_cita: number
    fecha_hora_inicio: string
    tipo_cita: number
    estado: string
  }>
  total: number
} */

// ── State del Calendario ──────────────────────────────────────────────────
const today = new Date()
const currentYear  = ref(today.getFullYear())
const currentMonth = ref(today.getMonth())

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DAY_NAMES = ['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB']

// ── Datos de Citas ────────────────────────────────────────────────────────
const appointments = ref<Record<string, Appointment[]>>({})

// ── Lógica de Selección ───────────────────────────────────────────────────
const selectedDate = ref<string | null>(null)
const showForm = ref(false)
const citaSeleccionada = ref<Appointment | null>(null)

// ── Estado de Edición ─────────────────────────────────────────────────────
const isEditing = ref(false)
const horaEditada = ref<string | null>(null)
const isLoadingEditSlots = ref(false)
const horariosEdicion = ref<string[]>([])

const isLoadingSlots = ref(false)
const isSaving = ref(false)
const errorMsg = ref<string | null>(null)
const successMsg = ref<string | null>(null)
const horariosDisponibles = ref<string[]>([])
const horaSeleccionada = ref<string | null>(null)

const ID_DENTISTA = 1
const infoTipoCita = ref<TipoCitaInfo | null>(null);
const formCita = ref({ id_tipocita: 1 })
const isLoadingTipo = ref(false) 

// ── Carga Centralizada de Citas ───────────────────────────────────────────
async function cargarCitasDelCalendario() {
  try {
    const response = await citasApi.listarMisCitas();
    // Extraemos la data de Axios de forma segura
    const res = (response as any).data || response;
    
    const map: Record<string, Appointment[]> = {}

    if (res?.citas) {
      res.citas.forEach((cita: any) => {
        if (cita.estado === 'Cancelada') return

        const d = new Date(cita.fecha_hora_inicio)
        const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
        if (!map[key]) map[key] = []
        map[key].push({
          id: cita.id_cita,
          title: cita.tipo.nombre_corto,
          time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: cita.estado,
        })
      })
    }
    appointments.value = map
  } catch (error) {
    console.error('Error al recargar citas:', error)
  }
}
async function cargarDetalleTipoCita() {
  isLoadingTipo.value = true // 1. Empezamos a cargar
  try {
    const res = await citasApi.obtenerDetalleTipoCita(1)
    const data = (res as any).data || res
    infoTipoCita.value = data
    formCita.value.id_tipocita = data.id_tipocita 
  } catch (error) {
    console.error('Error:', error)
  } finally {
    isLoadingTipo.value = false // 2. Terminamos de cargar (pase lo que pase)
  }
}

// ── Carga Inicial ─────────────────────────────────────────────────────────
onMounted(() => {
  cargarCitasDelCalendario();
  cargarDetalleTipoCita();
})

// ── Grid del Calendario ───────────────────────────────────────────────────
const calendarDays = computed<CalendarCell[]>(() => {
  const y = currentYear.value
  const m = currentMonth.value
  const firstDay = new Date(y, m, 1).getDay()
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const prevDays = new Date(y, m, 0).getDate()

  const limite48h = new Date()
  limite48h.setHours(limite48h.getHours() + 48)

  const cells: CalendarCell[] = []

  for (let i = firstDay - 1; i >= 0; i--)
    cells.push({ day: prevDays - i, current: false, key: '', isToday: false, isValid: false })

  for (let d = 1; d <= daysInMonth; d++) {
    const finDelDia = new Date(y, m, d, 23, 59, 59)
    const isValid = finDelDia > limite48h

    cells.push({
      day: d,
      current: true,
      key: `${y}-${m + 1}-${d}`,
      isToday: d === today.getDate() && m === today.getMonth() && y === today.getFullYear(),
      isValid,
    })
  }

  const remaining = 42 - cells.length
  for (let d = 1; d <= remaining; d++)
    cells.push({ day: d, current: false, key: '', isToday: false, isValid: false })

  return cells
})

// ── Computed: key de la celda seleccionada ────────────────────────────────
const selectedCellKey = computed(() => {
  if (!selectedDate.value) return null
  const [y, m, d] = selectedDate.value.split('-')
  return `${y}-${parseInt(m ?? '0')}-${parseInt(d ?? '0')}`
})

// ── Handlers de Navegación ────────────────────────────────────────────────
function prevMonth() {
  if (currentMonth.value === 0) { currentMonth.value = 11; currentYear.value-- }
  else currentMonth.value--
}

function nextMonth() {
  if (currentMonth.value === 11) { currentMonth.value = 0; currentYear.value++ }
  else currentMonth.value++
}

// ── Seleccionar cita existente desde el calendario ────────────────────────
function selectAppointment(appt: Appointment, cellKey: string) {
  const [y, m, d] = cellKey.split('-')
  selectedDate.value = `${y}-${(m ?? '').padStart(2, '0')}-${(d ?? '').padStart(2, '0')}`
  citaSeleccionada.value = appt
  showForm.value = false
  isEditing.value = false
  horaEditada.value = null
  errorMsg.value = null
  successMsg.value = null
}

// ── Seleccionar día vacío para agendar ────────────────────────────────────
async function selectDay(cell: CalendarCell) {
  if (!cell.current || !cell.isValid) return

  const [y, m, d] = cell.key.split('-')
  selectedDate.value = `${y}-${(m ?? '').padStart(2, '0')}-${(d ?? '').padStart(2, '0')}`

  citaSeleccionada.value = null
  isEditing.value = false
  horaSeleccionada.value = null
  errorMsg.value = null
  successMsg.value = null
  if(!infoTipoCita.value){
    await cargarDetalleTipoCita()
  }
  showForm.value = true
  await fetchDisponibilidad()
}

async function fetchDisponibilidad() {
  if (!selectedDate.value) return

  isLoadingSlots.value = true
  horariosDisponibles.value = []

  try {
    const res = await citasApi.obtenerDisponibilidad(
      selectedDate.value,
      formCita.value.id_tipocita,
      ID_DENTISTA,
    ) as DisponibilidadResponse

    horariosDisponibles.value = res?.disponibles ?? []
  } catch (error) {
    console.error('Error al buscar horarios:', error)
    horariosDisponibles.value = []
  } finally {
    isLoadingSlots.value = false
  }
}

function onTipoCitaChange() {
  horaSeleccionada.value = null
  fetchDisponibilidad()
}

// ── Activar modo edición ──────────────────────────────────────────────────
async function activarEdicion() {
  if (!selectedDate.value || !citaSeleccionada.value) return

  isEditing.value = true
  horaEditada.value = null
  errorMsg.value = null
  isLoadingEditSlots.value = true
  horariosEdicion.value = []

  try {
    // Tipo de cita inferido del título de la cita seleccionada
    const tipoCita = citaSeleccionada.value.title.includes('60m') ? 1 : 2
    const res = await citasApi.obtenerDisponibilidad(
      selectedDate.value,
      tipoCita,
      ID_DENTISTA,
    ) as DisponibilidadResponse

    horariosEdicion.value = res?.disponibles ?? []
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

// ── Confirmar edición ─────────────────────────────────────────────────────
async function handleConfirmarEdicion() {
  if (!citaSeleccionada.value || !horaEditada.value) return

  isSaving.value = true
  errorMsg.value = null

  await handleGuardarEdicion(citaSeleccionada.value.id, horaEditada.value)

  isSaving.value = false
}

async function handleConfirmarCita() {
  if (!selectedDate.value || !horaSeleccionada.value) return

  isSaving.value = true
  errorMsg.value = null

  try {
    const inicio = new Date(horaSeleccionada.value)

    await citasApi.crearCita({
      fecha_hora_inicio: inicio.toISOString(),
      tipo_cita: formCita.value.id_tipocita,
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

function formatHora(isoString: string) {
  return new Date(isoString).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Mexico_City'
  })
}
</script>

<template>
  <div class="fade-in max-w-7xl mx-auto">

    <!-- ── Header ──────────────────────────────────────────────────────── -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <div class="flex items-center gap-1.5 text-xs text-muted font-medium mb-2">
          <span class="text-muted/60">🏠</span> 



          
          <span class="text-muted/60">&gt;</span>
          <span class="bg-card border border-border px-2 py-0.5 rounded-lg">Citas</span>
        </div>
        <h1 class="font-display text-2xl font-extrabold text-black">Gestión de Citas</h1>
        <p class="text-sm text-muted">Agenda, consulta o modifica tus visitas al dentista.</p>
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

    <!-- ── Toast de éxito ─────────────────────────────────────────────── -->
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

      <!-- ── Calendario ─────────────────────────────────────────────────── -->
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
              cell.current && cell.isValid
                ? 'hover:bg-accent/5 cursor-pointer'
                : 'bg-surface/20 opacity-40 cursor-not-allowed',
              selectedCellKey === cell.key
                ? 'bg-accent/10 ring-2 ring-inset ring-accent/30'
                : ''
            ]"
            @click="selectDay(cell)"
          >
            <div class="flex justify-between items-start mb-2">
              <span
                :class="[
                  'text-sm font-bold',
                  cell.isToday
                    ? 'bg-accent text-white w-7 h-7 flex items-center justify-center rounded-full shadow-md'
                    : 'text-black'
                ]"
              >
                {{ cell.day }}
              </span>
              <Plus
                v-if="cell.current && cell.isValid"
                class="w-4 h-4 text-accent opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </div>

            <!-- Citas del día — @click.stop evita abrir el formulario de agendar -->
            <div class="space-y-1">
              <div
                v-for="appt in (appointments[cell.key] ?? [])"
                :key="appt.id"
                class="px-2 py-1 bg-accent text-white text-[10px] font-bold rounded-lg truncate shadow-sm cursor-pointer hover:ring-2 ring-offset-1 ring-accent"
                @click.stop="selectAppointment(appt, cell.key)"
              >
                {{ appt.time }} - {{ appt.title }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Panel lateral ─────────────────────────────────────────────── -->
      <aside class="space-y-6">
        <div class="bg-card border border-border rounded-3xl p-6 shadow-sm">

          <h2 class="font-display font-bold text-black mb-4 flex items-center gap-2">
            <CalendarIcon class="w-5 h-5 text-accent" />
            {{
              citaSeleccionada
                ? isEditing ? 'Modificar Horario' : 'Detalles de la Cita'
                : showForm
                  ? 'Agendar Cita'
                  : 'Selecciona una fecha'
            }}
          </h2>

          <!-- ① Detalles / Edición de cita existente -->
          <div v-if="citaSeleccionada" class="space-y-4">

            <!-- Info de la cita (siempre visible) -->
            <div class="p-4 bg-surface rounded-2xl border border-border">
              <p class="text-xs text-muted font-bold uppercase mb-1">Cita Programada</p>
              <p class="text-sm font-bold text-black">{{ selectedDate }} · {{ citaSeleccionada.time }}</p>
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
                <AlertCircle
                  v-else
                  class="w-4 h-4 text-red-500"
                />
                <span class="text-xs font-bold text-black">{{ citaSeleccionada.status }}</span>
              </div>
            </div>

            <!-- Selector de nuevo horario (modo edición) -->
            <div v-if="isEditing" class="space-y-3">
              <label class="text-[10px] font-bold text-muted uppercase px-1">
                Selecciona un nuevo horario
              </label>

              <div v-if="isLoadingEditSlots" class="text-center py-4 text-xs text-muted animate-pulse">
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
                      : 'bg-white border-border text-black hover:border-accent/50 hover:bg-accent/5'
                  ]"
                  @click="horaEditada = slot"
                >
                  {{ formatHora(slot) }}
                </button>
              </div>
            </div>

            <!-- Error -->
            <div
              v-if="errorMsg"
              class="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-400/30 text-red-600 rounded-xl text-xs font-medium"
            >
              <AlertCircle class="w-3.5 h-3.5 shrink-0" />
              {{ errorMsg }}
            </div>

            <!-- Botones modo edición -->
            <template v-if="isEditing">
              <button
                :disabled="!horaEditada || isSaving"
                :class="[
                  'w-full py-3 rounded-2xl text-sm font-bold transition-all',
                  horaEditada && !isSaving
                    ? 'bg-accent text-white shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-95'
                    : 'bg-surface text-muted cursor-not-allowed border border-border'
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

            <!-- Botones modo detalle -->
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
                @click="citaSeleccionada = null; errorMsg = null"
              >
                Cerrar Detalles
              </button>
            </template>
          </div>

          <!-- ② Formulario para agendar nueva cita -->
          <div v-else-if="showForm" class="space-y-4">

            <div class="p-4 bg-surface rounded-2xl border border-border">
              <p class="text-xs text-muted font-bold uppercase mb-1">Fecha seleccionada</p>
              <p class="text-sm font-bold text-black">{{ selectedDate }}</p>
            </div>

            <div class="space-y-2">
              <label class="text-[10px] font-bold text-muted uppercase px-1">Motivo de consulta</label>
              
              <div v-if="isLoadingTipo" class="animate-pulse h-20 bg-surface border border-border rounded-2xl flex items-center px-4 gap-3">
                <div class="w-10 h-10 bg-border rounded-xl"></div>
                <div class="flex-1 space-y-2">
                  <div class="h-3 bg-border rounded w-1/2"></div>
                </div>
              </div>

              <div v-else-if="infoTipoCita" class="p-4 bg-accent/5 border border-accent/20 rounded-2xl flex items-start gap-3">
                <Info class="w-4 h-4 text-accent mt-1" />
                <div>
                  <p class="text-sm font-bold text-black">{{ infoTipoCita.nombre_corto }} ({{ infoTipoCita.duracion }} min)</p>
                </div>
                <CheckCircle2 class="w-4 h-4 text-emerald-500 ml-auto" />
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-[10px] font-bold text-muted uppercase px-1">Horarios Disponibles</label>

              <div v-if="isLoadingSlots" class="text-center py-4 text-xs text-muted animate-pulse">
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
                      : 'bg-white border-border text-black hover:border-accent/50 hover:bg-accent/5'
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
                  : 'bg-surface text-muted cursor-not-allowed border border-border'
              ]"
              @click="handleConfirmarCita"
            >
              {{ isSaving ? 'Guardando...' : 'Confirmar Cita' }}
            </button>

            <button
              class="w-full py-2 text-xs font-bold text-muted hover:text-black transition-colors"
              @click="showForm = false; errorMsg = null"
            >
              Cancelar
            </button>
          </div>

          <!-- ③ Estado vacío -->
          <div v-else class="text-center py-8">
            <div class="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
              <Info class="w-8 h-8 text-muted/30" />
            </div>
            <p class="text-xs text-muted leading-relaxed px-4">
              Haz clic en un día disponible para agendar, o en una cita existente para ver sus detalles.
            </p>
          </div>
        </div>

        <!-- Leyenda -->
        <div class="bg-card border border-border rounded-3xl p-6 shadow-sm">
          <h3 class="text-xs font-bold text-black mb-4 uppercase tracking-wider">Estado de tus citas</h3>
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
