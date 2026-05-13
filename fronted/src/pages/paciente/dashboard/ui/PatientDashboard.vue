<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from '@/entities/session'
import { ROUTE_NAMES } from '@/shared/routes'
import { citasApi } from '@/entities/citaPaciente'
import {
  Plus,
  CalendarCheck,
  ClipboardCheck,
  Stethoscope,
  ArrowRight,
  BookOpen,
  CalendarClock,
  Ban,
  CalendarDays,
  Loader2,
  AlertCircle,
} from 'lucide-vue-next'

// ── Router ─────────────────────────────────────────────────────────────────
const router = useRouter()
const sessionStore = useSessionStore()
const currentUserId = computed(() =>
  String(sessionStore.user?.id ?? sessionStore.user?.id_usuario ?? 0),
)

// Computed para obtener el nombre dinámico del paciente
const patientName = computed(() => {
  const user = sessionStore.user
  if (!user) return 'Paciente'
  
  // Asumiendo que tu backend devuelve 'nombre' y 'apellido_paterno' (o 'name')
  const nombre = user.nombre || user.name || ''
  const apellido = (user as any).apellido_paterno || ''
  
  const fullName = `${nombre} ${apellido}`.trim()
  return fullName || 'Paciente'
})

// ── Types ──────────────────────────────────────────────────────────────────
// Refleja exactamente la respuesta del backend (modelo Cita de Sequelize)
interface CitaAPI {
  id_cita: number
  fecha_hora_inicio: string // ISO 8601 — ej. "2026-03-18T11:30:00.000Z"
  fecha_hora_fin: string
  tipo_cita: number // 1 = Consulta General (60 min) | 2 = Otro (30 min)
  estado: 'Pendiente' | 'Confirmada' | 'Cancelada'
  id_paciente: number
  id_dentista: number
  tipo?:{
    id_tipocita: number
    nombre_corto: string
  }
}

// Respuesta de GET /citas
interface ListarCitasResponse {
  total: number
  citas: CitaAPI[]
}

interface CitaDisplay {
  id: number
  date: string // "18 Mar 2026"
  time: string // "11:30 AM"
  title: string
  status: string
  badgeBg: string
  badgeText: string
}

// ── Estado ─────────────────────────────────────────────────────────────────
const proximasCitas = ref<CitaDisplay[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

// Mapa id_cita → datos crudos (necesarios para pedir disponibilidad al modificar)
const citasRawMap = ref<Map<number, CitaAPI>>(new Map())

// Estado del modal de modificación
const modalVisible = ref(false)
const modalCita = ref<CitaDisplay | null>(null)
const modalSlots = ref<string[]>([])
const modalSlotsLoading = ref(false)
const modalHoraSeleccionada = ref<string | null>(null)
const modalSaving = ref(false)
const modalError = ref<string | null>(null)

// ── Helpers de transformación ──────────────────────────────────────────────
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function formatFecha(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`
}

function formatHora(iso: string): string {
  const d = new Date(iso)
  const horas = d.getHours()
  const minutos = d.getMinutes().toString().padStart(2, '0')
  const sufijo = horas >= 12 ? 'PM' : 'AM'
  const h12 = horas % 12 || 12
  return `${h12}:${minutos} ${sufijo}`
}

// tipo_cita es siempre un número según el backend
// 1 → Consulta General | cualquier otro → Limpieza / Tratamiento
const TIPO_CITA_MAP: Record<number, string> = {
  1: 'Consulta General',
  2: 'Limpieza Dental',
}

function resolverNombreTipoCita(cita: CitaAPI): string {
  return cita.tipo?.nombre_corto ?? 'Consulta General'
}

// Estado viene capitalizado desde el backend: 'Pendiente' | 'Confirmada' | 'Cancelada'

const BADGE_MAP: Record<string, { bg: string; text: string; label: string }> = {
  Confirmada: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Confirmada' },
  Pendiente: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pendiente' },
  Cancelada: { bg: 'bg-red-100', text: 'text-red-600', label: 'Cancelada' },
}

function resolverBadge(estado: string) {
  return BADGE_MAP[estado] ?? { bg: 'bg-gray-100', text: 'text-gray-600', label: estado }
}

function transformarCita(cita: CitaAPI): CitaDisplay {
  const badge = resolverBadge(cita.estado)
  return {
    id:        cita.id_cita,
    date:      formatFecha(cita.fecha_hora_inicio),
    time:      formatHora(cita.fecha_hora_inicio),
    title:     resolverNombreTipoCita(cita),
    status:    badge.label,
    badgeBg:   badge.bg,
    badgeText: badge.text,
  }
}

// ── Fetch citas ─────────────────────────────────────────────────────────────
async function fetchCitas() {
  isLoading.value = true
  error.value = null
  try {
    // httpClient ya devuelve response.data directamente (igual que en PatientAppointment)
    // Respuesta: { total: number, citas: CitaAPI[] }
    const res = (await citasApi.listarMisCitas()) as ListarCitasResponse

    const ahora = new Date()
    const citasFuturas = (res?.citas ?? [])
      .filter((c) => new Date(c.fecha_hora_inicio) >= ahora && c.estado !== 'Cancelada')
      .sort(
        (a, b) => new Date(a.fecha_hora_inicio).getTime() - new Date(b.fecha_hora_inicio).getTime(),
      )

    // Guardar datos crudos para usarlos al abrir el modal de modificación
    citasRawMap.value = new Map(citasFuturas.map((c) => [c.id_cita, c]))
    proximasCitas.value = citasFuturas.map(transformarCita)
  } catch (err: any) {
    console.error('[fetchCitas] ERROR:', err?.message ?? err)
    error.value = 'No se pudieron cargar tus citas. Intenta de nuevo.'
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchCitas)

// ── Metrics ────────────────────────────────────────────────────────────────
// La primera cita próxima alimenta dinámicamente la tarjeta "Próxima Cita"
const proximaCitaDisplay = computed(() => {
  const primera = proximasCitas.value[0]
  if (!primera) return { numero: '—', subtitulo: 'Sin citas' }
  const [dia, mes] = primera.date.split(' ')
  return { numero: `${dia} ${mes}`, subtitulo: primera.time }
})

const metricas = computed(() => [
  {
    titulo: 'Próxima Cita',
    numero: proximaCitaDisplay.value.numero,
    subtitulo: proximaCitaDisplay.value.subtitulo,
    icon: CalendarCheck,
    iconBg: 'bg-accent-dim',
    iconClass: 'text-accent',
  },
  {
    titulo: 'Cuestionarios',
    numero: 2,
    subtitulo: 'Pendientes',
    icon: ClipboardCheck,
    iconBg: 'bg-emerald-500/10',
    iconClass: 'text-emerald-500',
  },
  {
    titulo: 'Seguimiento',
    numero: 'Activo',
    subtitulo: 'Postoperatorio',
    icon: Stethoscope,
    iconBg: 'bg-indigo-500/10',
    iconClass: 'text-indigo-500',
  },
])

// ── Handlers ──────────────────────────────────────────────────────────────
function handleAgendar() {
  router.push({ name: ROUTE_NAMES.PATIENT_APPOINTMENT, params: { id: currentUserId.value } })
}

function handleVerCalendario() {
  router.push({ name: ROUTE_NAMES.PATIENT_APPOINTMENT, params: { id: currentUserId.value } })
}

// ── Modal de modificación ─────────────────────────────────────────────────
async function handleReprogramar(cita: CitaDisplay) {
  const raw = citasRawMap.value.get(cita.id)
  if (!raw) return

  modalCita.value = cita
  modalHoraSeleccionada.value = null
  modalError.value = null
  modalSlots.value = []
  modalVisible.value = true
  modalSlotsLoading.value = true

  try {
    // Extraer la fecha en YYYY-MM-DD desde el ISO del backend
    const fecha = raw.fecha_hora_inicio.slice(0, 10)
    const idTipo = raw.tipo?.id_tipocita || 1
    const idDentista = raw.id_dentista || 1
    const res = await citasApi.obtenerDisponibilidad(fecha,  idTipo, idDentista) as { disponibles: string[] }
    modalSlots.value = res?.disponibles ?? []
  } catch (err) {
    console.error('Error al obtener horarios:', err)
    modalError.value = 'No se pudieron cargar los horarios. Intenta de nuevo.'
  } finally {
    modalSlotsLoading.value = false
  }
}

function cerrarModal() {
  modalVisible.value = false
  modalCita.value = null
  modalHoraSeleccionada.value = null
  modalError.value = null
  modalSlots.value = []
}

async function confirmarModificacion() {
  if (!modalCita.value || !modalHoraSeleccionada.value) return
  modalSaving.value = true
  modalError.value = null
  try {
    await citasApi.editarCita(modalCita.value.id, {
      fecha_hora_inicio: modalHoraSeleccionada.value,
    })
    cerrarModal()
    await fetchCitas()
  } catch (err: any) {
    const msg = err?.response?.data?.message ?? 'No se pudo modificar la cita. Intenta de nuevo.'
    modalError.value = msg
  } finally {
    modalSaving.value = false
  }
}

function formatSlot(iso: string): string {
  // Los slots llegan como ISO o como "HH:MM" — manejamos ambos
  if (iso.includes('T') || iso.includes(' ')) return formatHora(iso)
  // Si viene como "HH:MM" directo
  const parts = iso.split(':')
  if (parts.length !== 2) return iso
  const h = Number(parts[0])
  const m = Number(parts[1])
  const sufijo = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${sufijo}`
}

async function handleCancelar(id: number) {
  const confirmar = window.confirm('¿Estás seguro de que deseas cancelar esta cita?')
  if (!confirmar) return
  try {
    await citasApi.cancelarCita(id)
    // Refresca la lista tras cancelar
    await fetchCitas()
  } catch (err) {
    console.error('Error al cancelar cita:', err)
    alert('No se pudo cancelar la cita. Intenta de nuevo.')
  }
}
</script>

<template>
  <div class="fade-in max-w-6xl mx-auto pb-10">
    <div class="flex items-end justify-between mb-8">
      <div>
        <div class="flex items-center gap-1.5 text-xs text-muted font-medium mb-2">
          <span class="text-muted/60">🏠</span>
          <span class="text-muted/60">&gt;</span>
          <span class="bg-card border border-border px-2 py-0.5 rounded-lg">Inicio</span>
        </div>
        <h1 class="font-display text-4xl font-semibold text-black">Hola, {{ patientName }}</h1>
        <p class="text-sm text-muted mt-1">Este es el resumen de tu actividad.</p>
      </div>

      <button
        class="flex items-center gap-2 bg-ink/65 text-text-secondary hover:bg-ink/80 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all hover:scale-105 active:scale-95"
        @click="handleAgendar"
      >
        <Plus class="w-4 h-4" />
        Agendar Nueva Cita
      </button>
    </div>

    <section class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div
        v-for="item in metricas"
        :key="item.titulo"
        class="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3 shadow-sm"
      >
        <div class="flex items-center gap-2">
          <div
            :class="['w-8 h-8 rounded-xl flex items-center justify-center shrink-0', item.iconBg]"
          >
            <component :is="item.icon" :class="['w-4 h-4', item.iconClass]" />
          </div>
          <p class="text-sm font-semibold text-black">{{ item.titulo }}</p>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-2xl font-display font-extrabold text-black">{{ item.numero }}</span>
          <span
            class="text-[10px] font-bold text-muted px-3 py-1 bg-surface border border-border rounded-full uppercase tracking-wide"
          >
            {{ item.subtitulo }}
          </span>
        </div>
      </div>
    </section>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <section class="lg:col-span-2">
        <div
          class="bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col h-full"
        >
          <div
            class="flex items-center justify-between px-6 py-5 border-b border-border bg-surface/50"
          >
            <h2 class="font-display font-bold text-black text-lg">Próximas Citas</h2>
            <button
              @click="handleVerCalendario"
              class="flex items-center gap-1.5 text-xs font-bold text-accent hover:text-accent-dark transition-colors"
            >
              <CalendarDays class="w-4 h-4" />
              Ver Calendario
            </button>
          </div>

          <div class="p-6 flex-1">
            <div v-if="isLoading" class="flex items-center justify-center py-10 gap-2 text-muted">
              <Loader2 class="w-5 h-5 animate-spin" />
              <span class="text-sm font-medium">Cargando citas...</span>
            </div>

            <div v-else-if="error" class="flex flex-col items-center justify-center py-10 gap-3">
              <AlertCircle class="w-6 h-6 text-red-400" />
              <p class="text-sm text-muted font-medium text-center">{{ error }}</p>
              <button @click="fetchCitas" class="text-xs font-bold text-accent hover:underline">
                Reintentar
              </button>
            </div>

            <div v-else class="space-y-4">
              <div
                v-for="cita in proximasCitas"
                :key="cita.id"
                class="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border bg-surface/30 hover:bg-surface/60 transition-colors gap-4"
              >
                <div class="flex items-center gap-4">
                  <div
                    class="bg-card border border-border rounded-xl p-3 text-center min-w-18.75 shadow-sm"
                  >
                    <span class="block text-[10px] uppercase font-bold text-muted">{{
                      cita.date.split(' ')[1]
                    }}</span>
                    <span class="block text-xl font-extrabold text-black">{{
                      cita.date.split(' ')[0]
                    }}</span>
                  </div>
                  <div>
                    <h3 class="font-bold text-black text-sm">{{ cita.title }}</h3>
                    <div class="flex items-center gap-2 mt-1.5">
                      <span class="text-xs font-medium text-muted">{{ cita.time }}</span>
                      <span class="w-1 h-1 rounded-full bg-border"></span>
                      <span
                        :class="[
                          'text-[10px] font-bold px-2 py-0.5 rounded-md',
                          cita.badgeBg,
                          cita.badgeText,
                        ]"
                      >
                        {{ cita.status }}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  class="flex items-center gap-2 opacity-90 group-hover:opacity-100 transition-opacity"
                >
                  <button
                    @click="handleReprogramar(cita)"
                    class="flex items-center gap-1.5 px-3 py-2 bg-white border border-border rounded-lg text-xs font-bold text-black hover:bg-surface transition-colors shadow-sm"
                  >
                    <CalendarClock class="w-3.5 h-3.5 text-muted" />
                    Modificar
                  </button>
                  <button
                    @click="handleCancelar(cita.id)"
                    class="p-2 text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Cancelar Cita"
                  >
                    <Ban class="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div v-if="proximasCitas.length === 0" class="text-center py-10">
                <p class="text-sm text-muted font-medium mb-3">No tienes citas programadas.</p>
                <button
                  @click="handleAgendar"
                  class="text-xs font-bold text-accent hover:underline"
                >
                  Agendar tu primera cita ahora
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="space-y-4">
        <div class="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-8 h-8 rounded-xl bg-accent-dim flex items-center justify-center">
              <BookOpen class="w-4 h-4 text-accent" />
            </div>
            <h3 class="font-display font-bold text-black text-sm">Guía de Cuidados</h3>
          </div>
          <p class="text-xs text-muted mb-4 leading-relaxed">
            Consulta las recomendaciones y los cuidados específicos para tu recuperación
            postoperatoria.
          </p>
          <button
            class="w-full flex items-center gap-2 justify-center bg-ink/65 text-text-secondary hover:bg-ink/80 px-4 py-2.5 rounded-2xl text-xs font-medium transition-all hover:scale-105 active:scale-95"
          >
            <BookOpen class="w-4 h-4" />
            Ver Plan de Cuidados
          </button>
        </div>

        <div class="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <Stethoscope class="w-4 h-4 text-indigo-600" />
            </div>
            <h3 class="font-display font-bold text-black text-sm">Seguimiento Postoperatorio</h3>
          </div>
          <p class="text-xs text-muted mb-4 leading-relaxed">
            Registra tu progreso y revisa si hay alertas sobre tu estado de salud actual.
          </p>
          <button
            class="w-full flex items-center justify-between p-3 bg-surface border border-border rounded-xl hover:border-indigo-400/30 transition-colors cursor-pointer group"
          >
            <span class="text-xs font-bold text-black">Entrar a tu seguimiento</span>
            <ArrowRight
              class="w-4 h-4 text-indigo-600 group-hover:translate-x-1 transition-transform"
            />
          </button>
        </div>
      </section>
    </div>
  </div>

  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modalVisible"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="cerrarModal"
      >
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="cerrarModal" />

        <div
          class="relative bg-card border border-border rounded-3xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-5"
        >
          <div class="flex items-start justify-between">
            <div>
              <h3 class="font-display font-bold text-black text-base">Modificar Cita</h3>
              <p class="text-xs text-muted mt-0.5">{{ modalCita?.title }}</p>
            </div>
            <button
              @click="cerrarModal"
              class="p-1.5 rounded-xl hover:bg-surface transition-colors text-muted hover:text-black"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="flex items-center gap-3 p-3 bg-surface rounded-2xl border border-border">
            <CalendarClock class="w-4 h-4 text-muted shrink-0" />
            <div>
              <p class="text-[10px] font-bold text-muted uppercase">Horario actual</p>
              <p class="text-sm font-bold text-black">
                {{ modalCita?.date }} · {{ modalCita?.time }}
              </p>
            </div>
          </div>

          <div class="space-y-3">
            <p class="text-[10px] font-bold text-muted uppercase px-1">
              Selecciona un nuevo horario
            </p>

            <div
              v-if="modalSlotsLoading"
              class="flex items-center justify-center py-6 gap-2 text-muted"
            >
              <Loader2 class="w-4 h-4 animate-spin" />
              <span class="text-xs font-medium">Buscando horarios...</span>
            </div>

            <div
              v-else-if="!modalSlotsLoading && modalSlots.length === 0 && !modalError"
              class="text-center py-5 text-xs text-red-500 font-bold bg-red-50 rounded-xl border border-red-200"
            >
              No hay horarios disponibles para ese día.
            </div>

            <div
              v-else-if="modalSlots.length > 0"
              class="grid grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1"
            >
              <button
                v-for="slot in modalSlots"
                :key="slot"
                :class="[
                  'py-2 text-xs font-bold rounded-xl transition-all border',
                  modalHoraSeleccionada === slot
                    ? 'bg-accent text-white border-accent shadow-sm'
                    : 'bg-white border-border text-black hover:border-accent/50 hover:bg-accent/5',
                ]"
                @click="modalHoraSeleccionada = slot"
              >
                {{ formatSlot(slot) }}
              </button>
            </div>
          </div>

          <div
            v-if="modalError"
            class="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-400/30 text-red-600 rounded-xl text-xs font-medium"
          >
            <AlertCircle class="w-3.5 h-3.5 shrink-0" />
            {{ modalError }}
          </div>

          <div class="flex flex-col gap-2">
            <button
              :disabled="!modalHoraSeleccionada || modalSaving"
              :class="[
                'w-full py-3 rounded-2xl text-sm font-bold transition-all',
                modalHoraSeleccionada && !modalSaving
                  ? 'bg-accent text-white shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-95'
                  : 'bg-surface text-muted cursor-not-allowed border border-border',
              ]"
              @click="confirmarModificacion"
            >
              {{ modalSaving ? 'Guardando...' : 'Confirmar Cambio' }}
            </button>
            <button
              class="w-full py-2 text-xs font-bold text-muted hover:text-black transition-colors"
              @click="cerrarModal"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.95) translateY(8px);
}
</style>
