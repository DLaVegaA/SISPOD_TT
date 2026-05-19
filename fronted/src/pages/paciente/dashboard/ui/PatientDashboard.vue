<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from '@/entities/session'
import { ROUTE_NAMES } from '@/shared/routes'
import { citasApi } from '@/entities/citaPaciente'
import { seguimientoApi, type SeguimientoListItem, type SeguimientoDetalle } from '@/entities/seguimiento'
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
  X,
} from 'lucide-vue-next'

// ── Router ─────────────────────────────────────────────────────────────────
const router = useRouter()
const sessionStore = useSessionStore()
const currentUserId = computed(() =>
  String(sessionStore.user?.id ?? sessionStore.user?.id_usuario ?? 0),
)

const patientName = computed(() => {
  const user = sessionStore.user
  if (!user) return 'Paciente'
  const nombre = user.nombre || user.name || ''
  const apellido = (user as any).apellido_paterno || ''
  const fullName = `${nombre} ${apellido}`.trim()
  return fullName || 'Paciente'
})

// ── Types ──────────────────────────────────────────────────────────────────
interface CitaAPI {
  id_cita: number
  fecha_hora_inicio: string
  fecha_hora_fin: string
  tipo_cita: number
  estado: 'Pendiente' | 'Confirmada' | 'Cancelada'
  id_paciente: number
  id_dentista: number
  tipo?: {
    id_tipocita: number
    nombre_corto: string
  }
}

interface ListarCitasResponse {
  total: number
  citas: CitaAPI[]
}

interface CitaDisplay {
  id: number
  date: string
  time: string
  title: string
  status: string
  badgeBg: string
  badgeText: string
}

// ── Estado ─────────────────────────────────────────────────────────────────
const proximasCitas = ref<CitaDisplay[]>([])
const followUps     = ref<SeguimientoListItem[]>([])
const isLoading     = ref(false)
const error         = ref<string | null>(null)

// Modal modificar cita
const citasRawMap         = ref<Map<number, CitaAPI>>(new Map())
const modalVisible        = ref(false)
const modalCita           = ref<CitaDisplay | null>(null)
const modalSlots          = ref<string[]>([])
const modalSlotsLoading   = ref(false)
const modalHoraSeleccionada = ref<string | null>(null)
const modalSaving         = ref(false)
const modalError          = ref<string | null>(null)

// Modal Plan de Cuidados
const modalCuidadosVisible = ref(false)
const selectedFollowUp     = ref<SeguimientoDetalle | null>(null)
const isLoadingCuidados    = ref(false)

// ── Helpers ────────────────────────────────────────────────────────────────
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function formatFecha(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`
}

function formatHora(iso: string): string {
  const d    = new Date(iso)
  const h    = d.getHours()
  const min  = d.getMinutes().toString().padStart(2, '0')
  const suf  = h >= 12 ? 'PM' : 'AM'
  const h12  = h % 12 || 12
  return `${h12}:${min} ${suf}`
}

const BADGE_MAP: Record<string, { bg: string; text: string; label: string }> = {
  Confirmada: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Confirmada' },
  Pendiente:  { bg: 'bg-amber-100',   text: 'text-amber-700',   label: 'Pendiente'  },
  Cancelada:  { bg: 'bg-red-100',     text: 'text-red-600',     label: 'Cancelada'  },
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
    title:     cita.tipo?.nombre_corto ?? 'Consulta General',
    status:    badge.label,
    badgeBg:   badge.bg,
    badgeText: badge.text,
  }
}

// ── Fetch ──────────────────────────────────────────────────────────────────
async function fetchData() {
  isLoading.value = true
  error.value     = null
  try {
    const [citasRes, followRes] = await Promise.all([
      citasApi.listarMisCitas() as Promise<ListarCitasResponse>,
      seguimientoApi.listar(),
    ])

    const ahora       = new Date()
    const citasFuturas = (citasRes?.citas ?? [])
      .filter(c => new Date(c.fecha_hora_inicio) >= ahora && c.estado !== 'Cancelada')
      .sort((a, b) => new Date(a.fecha_hora_inicio).getTime() - new Date(b.fecha_hora_inicio).getTime())

    citasRawMap.value    = new Map(citasFuturas.map(c => [c.id_cita, c]))
    proximasCitas.value  = citasFuturas.map(transformarCita)
    followUps.value      = followRes.seguimientos
  } catch (err: any) {
    console.error('[fetchData] ERROR:', err?.message ?? err)
    error.value = 'No se pudo cargar tu información. Intenta de nuevo.'
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchData)

// ── Métricas ───────────────────────────────────────────────────────────────
const proximaCitaDisplay = computed(() => {
  const primera = proximasCitas.value[0]
  if (!primera) return { numero: '—', subtitulo: 'Sin citas' }
  const [dia, mes] = primera.date.split(' ')
  return { numero: `${dia} ${mes}`, subtitulo: primera.time }
})

const cuestionariosPendientes = computed(() =>
  followUps.value.reduce((total, s) => {
    let count = 0
    if (s.tiene_cuestionario_24h && !s.enviado_24h) count++
    if (s.tiene_cuestionario_72h && !s.enviado_72h) count++
    return total + count
  }, 0),
)

const activeFollowUp = computed(() =>
  followUps.value.find(s => s.estado_seguimiento === 'en curso' || s.estado_seguimiento === 'alerta'),
)

// FIX: icono siempre indigo — la alerta se muestra como badge contextual
const metricas = computed(() => [
  {
    titulo:    'Próxima Cita',
    numero:    proximaCitaDisplay.value.numero,
    subtitulo: proximaCitaDisplay.value.subtitulo,
    icon:      CalendarCheck,
    iconBg:    'bg-accent-dim',
    iconClass: 'text-accent',
    badge:     null as { text: string; cls: string } | null,
  },
  {
    titulo:    'Cuestionarios',
    numero:    cuestionariosPendientes.value,
    subtitulo: 'Pendientes',
    icon:      ClipboardCheck,
    iconBg:    'bg-emerald-500/10',
    iconClass: 'text-emerald-500',
    badge:     null as { text: string; cls: string } | null,
  },
  {
    titulo:    'Seguimiento',
    numero:    activeFollowUp.value ? 'Activo' : 'Ninguno',
    subtitulo: activeFollowUp.value ? activeFollowUp.value.procedimiento : 'Postoperatorio',
    icon:      Stethoscope,
    iconBg:    'bg-indigo-500/10',   // ← siempre indigo
    iconClass: 'text-indigo-500',    // ← siempre indigo
    badge:     activeFollowUp.value?.estado_seguimiento === 'alerta'
      ? { text: '⚠ Alerta', cls: 'bg-red-100 text-red-700' }
      : null,
  },
])

// ── Handlers ──────────────────────────────────────────────────────────────
function handleAgendar() {
  router.push({ name: ROUTE_NAMES.PATIENT_APPOINTMENT, params: { id: currentUserId.value } })
}
function handleVerCalendario() {
  router.push({ name: ROUTE_NAMES.PATIENT_APPOINTMENT, params: { id: currentUserId.value } })
}
function handleVerSeguimiento() {
  router.push({ name: ROUTE_NAMES.PATIENT_FOLLOW_UP, params: { id: currentUserId.value } })
}

async function handleVerCuidados() {
  if (!activeFollowUp.value) { handleVerSeguimiento(); return }
  modalCuidadosVisible.value = true
  isLoadingCuidados.value    = true
  selectedFollowUp.value     = null
  try {
    const res = await seguimientoApi.obtener(activeFollowUp.value.id_seguimiento)
    selectedFollowUp.value = res.seguimiento
  } catch (err) {
    console.error('Error al cargar cuidados:', err)
  } finally {
    isLoadingCuidados.value = false
  }
}

function cerrarModalCuidados() {
  modalCuidadosVisible.value = false
  selectedFollowUp.value     = null
}

async function handleReprogramar(cita: CitaDisplay) {
  const raw = citasRawMap.value.get(cita.id)
  if (!raw) return
  modalCita.value           = cita
  modalHoraSeleccionada.value = null
  modalError.value          = null
  modalSlots.value          = []
  modalVisible.value        = true
  modalSlotsLoading.value   = true
  try {
    const fecha     = raw.fecha_hora_inicio.slice(0, 10)
    const idTipo    = raw.tipo?.id_tipocita || 1
    const idDentista = raw.id_dentista || 1
    const res = await citasApi.obtenerDisponibilidad(fecha, idTipo, idDentista) as { disponibles: string[] }
    modalSlots.value = res?.disponibles ?? []
  } catch {
    modalError.value = 'No se pudieron cargar los horarios.'
  } finally {
    modalSlotsLoading.value = false
  }
}

function cerrarModal() {
  modalVisible.value          = false
  modalCita.value             = null
  modalHoraSeleccionada.value = null
  modalError.value            = null
  modalSlots.value            = []
}

async function confirmarModificacion() {
  if (!modalCita.value || !modalHoraSeleccionada.value) return
  modalSaving.value = true
  modalError.value  = null
  try {
    await citasApi.editarCita(modalCita.value.id, { fecha_hora_inicio: modalHoraSeleccionada.value })
    cerrarModal()
    await fetchData()
  } catch (err: any) {
    modalError.value = err?.response?.data?.message ?? 'Error al modificar la cita.'
  } finally {
    modalSaving.value = false
  }
}

function formatSlot(iso: string): string {
  if (iso.includes('T') || iso.includes(' ')) return formatHora(iso)
  const parts = iso.split(':')
  if (parts.length !== 2) return iso
  const h   = Number(parts[0])
  const m   = Number(parts[1])
  const suf = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${suf}`
}

async function handleCancelar(id: number) {
  if (!window.confirm('¿Estás seguro de que deseas cancelar esta cita?')) return
  try {
    await citasApi.cancelarCita(id)
    await fetchData()
  } catch {
    // FIX: usar estado reactivo en lugar de alert() nativo
    error.value = 'No se pudo cancelar la cita. Intenta de nuevo.'
    setTimeout(() => { error.value = null }, 4000)
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
          <span class="bg-card border border-border px-2 py-0.5 rounded-lg shadow-sm">Inicio</span>
        </div>
        <h1 class="font-display text-4xl font-semibold text-black">Hola, {{ patientName }}</h1>
        <p class="text-sm text-muted mt-1">Este es el resumen de tu actividad.</p>
      </div>

      <!-- FIX: bg-accent en lugar de bg-black -->
      <button
        class="flex items-center gap-2 bg-accent text-white hover:bg-accent/90 px-5 py-3 rounded-2xl text-sm font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-accent/20"
        @click="handleAgendar"
      >
        <Plus class="w-4 h-4" />
        Agendar Nueva Cita
      </button>
    </div>

    <!-- ── Métricas ──────────────────────────────────────────────────────── -->
    <!-- FIX: badge contextual para alerta, icono siempre indigo -->
    <section class="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
      <div
        v-for="item in metricas"
        :key="item.titulo"
        class="bg-card border border-border rounded-3xl p-6 flex flex-col gap-3 shadow-sm hover:shadow-md transition-all"
      >
        <div class="flex items-center gap-2">
          <div :class="['w-9 h-9 rounded-xl flex items-center justify-center shrink-0', item.iconBg]">
            <component :is="item.icon" :class="['w-5 h-5', item.iconClass]" />
          </div>
          <p class="text-xs font-bold text-muted uppercase tracking-widest">{{ item.titulo }}</p>
        </div>
        <div class="flex items-end justify-between">
          <span class="text-3xl font-display font-black text-black tabular-nums">{{ item.numero }}</span>
          <!-- Badge alerta clínica (solo cuando existe) -->
          <span
            v-if="item.badge"
            :class="['text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter', item.badge.cls]"
          >
            {{ item.badge.text }}
          </span>
          <!-- Subtítulo normal -->
          <span
            v-else
            class="text-[10px] font-black text-muted px-3 py-1 bg-surface border border-border rounded-full uppercase tracking-tighter"
          >
            {{ item.subtitulo }}
          </span>
        </div>
      </div>
    </section>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- ── Agenda ─────────────────────────────────────────────────────── -->
      <section class="lg:col-span-2">
        <div class="bg-card border border-border rounded-3xl overflow-hidden shadow-sm flex flex-col h-full">
          <div class="flex items-center justify-between px-6 py-5 border-b border-border bg-surface/30">
            <h2 class="font-display font-bold text-black text-lg">Próximas Citas</h2>
            <button
              @click="handleVerCalendario"
              class="flex items-center gap-1.5 text-xs font-bold text-accent hover:underline transition-colors"
            >
              <CalendarDays class="w-4 h-4" />
              Ver Calendario
            </button>
          </div>

          <div class="p-6 flex-1">
            <div v-if="isLoading" class="flex flex-col items-center justify-center py-16 gap-3 text-muted">
              <Loader2 class="w-6 h-6 animate-spin text-accent" />
              <span class="text-sm font-medium">Sincronizando agenda...</span>
            </div>

            <div v-else-if="error" class="flex flex-col items-center justify-center py-16 gap-3">
              <AlertCircle class="w-8 h-8 text-red-400" />
              <p class="text-sm text-muted font-medium text-center max-w-xs">{{ error }}</p>
              <button @click="fetchData" class="text-xs font-bold text-accent hover:underline">
                Reintentar carga
              </button>
            </div>

            <div v-else class="space-y-4">
              <div
                v-for="cita in proximasCitas"
                :key="cita.id"
                class="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-border bg-surface/20 hover:bg-surface/50 hover:border-accent/30 transition-all gap-4"
              >
                <div class="flex items-center gap-5">
                  <div class="bg-card border border-border rounded-2xl p-3 text-center min-w-[70px] shadow-sm group-hover:border-accent/20">
                    <span class="block text-[10px] uppercase font-black text-muted tracking-tight">{{ cita.date.split(' ')[1] }}</span>
                    <span class="block text-2xl font-black text-black">{{ cita.date.split(' ')[0] }}</span>
                  </div>
                  <div>
                    <h3 class="font-bold text-black text-sm">{{ cita.title }}</h3>
                    <div class="flex items-center gap-2 mt-1.5">
                      <span class="text-xs font-bold text-muted/80 uppercase tracking-tighter">{{ cita.time }}</span>
                      <span class="w-1 h-1 rounded-full bg-border"></span>
                      <span :class="['text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest', cita.badgeBg, cita.badgeText]">
                        {{ cita.status }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <button
                    @click="handleReprogramar(cita)"
                    class="flex items-center gap-1.5 px-3 py-2 bg-white border border-border rounded-xl text-[10px] font-bold text-black hover:bg-surface transition-all shadow-sm active:scale-95"
                  >
                    <CalendarClock class="w-3.5 h-3.5 text-muted" />
                    Cambiar
                  </button>
                  <button
                    @click="handleCancelar(cita.id)"
                    class="p-2 text-muted hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    title="Cancelar Cita"
                  >
                    <Ban class="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div v-if="proximasCitas.length === 0" class="text-center py-16">
                <div class="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
                  <CalendarCheck class="w-8 h-8 text-muted/30" />
                </div>
                <p class="text-sm text-muted font-medium mb-4">No tienes citas programadas.</p>
                <button @click="handleAgendar" class="text-xs font-black text-accent hover:underline">
                  Agendar tu primera cita ahora
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Sidebar ────────────────────────────────────────────────────── -->
      <section class="space-y-6">
        <!-- Guía de Cuidados -->
        <div class="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col h-[280px]">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-2xl bg-accent-dim flex items-center justify-center text-accent">
              <BookOpen class="w-5 h-5" />
            </div>
            <h3 class="font-display font-bold text-black text-base">Guía de Cuidados</h3>
          </div>
          <p class="text-xs text-muted mb-6 leading-relaxed flex-1">
            Consulta las recomendaciones y los cuidados específicos registrados por tu dentista para tu recuperación.
          </p>
          <!-- FIX: bg-accent en lugar de bg-black -->
          <button
            class="w-full flex items-center gap-2 justify-center bg-accent text-white hover:bg-accent/90 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all shadow-lg shadow-accent/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            @click="handleVerCuidados"
            :disabled="!activeFollowUp"
          >
            <BookOpen class="w-4 h-4" />
            {{ activeFollowUp ? 'Ver Plan de Cuidados' : 'Sin plan activo' }}
          </button>
        </div>

        <!-- Seguimiento Card -->
        <div class="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col h-[280px]">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                <Stethoscope class="w-5 h-5" />
              </div>
              <h3 class="font-display font-bold text-black text-base">Seguimiento</h3>
            </div>
            <!-- FIX: badge "Alerta" solo cuando hay alerta real, badge "Activo" en verde si está en curso -->
            <span
              v-if="activeFollowUp?.estado_seguimiento === 'alerta'"
              class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-[9px] font-black uppercase tracking-widest"
            >
              <span class="w-1 h-1 rounded-full bg-red-500 animate-pulse"></span>
              Alerta
            </span>
            <span
              v-else-if="activeFollowUp"
              class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest"
            >
              <span class="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
              Activo
            </span>
          </div>

          <p class="text-xs text-muted mb-6 leading-relaxed flex-1">
            {{ activeFollowUp
               ? `Actualmente estás en seguimiento por: ${activeFollowUp.procedimiento}. Responde tus cuestionarios para informar tu progreso.`
               : 'Registra tu progreso y revisa si hay alertas sobre tu estado de salud después de un tratamiento.'
            }}
          </p>

          <button
            class="w-full flex items-center justify-between p-4 bg-surface border border-border rounded-2xl hover:border-indigo-400/40 hover:bg-surface/80 transition-all cursor-pointer group active:scale-[0.98]"
            @click="handleVerSeguimiento"
          >
            <span class="text-xs font-black text-black">Ver mi Seguimiento</span>
            <ArrowRight class="w-4 h-4 text-indigo-600 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>
    </div>
  </div>

  <!-- ════════════════════════════════════════════════════════════ -->
  <!-- Overlays                                                     -->
  <!-- ════════════════════════════════════════════════════════════ -->
  <Teleport to="body">
    <!-- Modal Modificar Cita -->
    <Transition name="modal">
      <div
        v-if="modalVisible"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="cerrarModal"
      >
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="cerrarModal" />
        <div class="relative bg-card border border-border rounded-[2rem] shadow-2xl w-full max-w-sm p-8 flex flex-col gap-6">
          <div class="flex items-start justify-between">
            <div>
              <h3 class="font-display font-bold text-black text-lg tracking-tight">Modificar Cita</h3>
              <p class="text-xs font-bold text-muted mt-0.5 uppercase tracking-widest">{{ modalCita?.title }}</p>
            </div>
            <button @click="cerrarModal" class="p-2 rounded-xl hover:bg-surface transition-all text-muted hover:text-black">
              <X class="w-5 h-5" />
            </button>
          </div>

          <div class="flex items-center gap-4 p-4 bg-surface rounded-2xl border border-border shadow-inner">
            <CalendarClock class="w-5 h-5 text-muted shrink-0" />
            <div>
              <p class="text-[9px] font-black text-muted uppercase tracking-widest">Horario actual</p>
              <p class="text-sm font-bold text-black">{{ modalCita?.date }} · {{ modalCita?.time }}</p>
            </div>
          </div>

          <div class="space-y-4">
            <p class="text-[10px] font-black text-muted uppercase px-1 tracking-widest text-center">
              Selecciona un nuevo horario
            </p>
            <div v-if="modalSlotsLoading" class="flex flex-col items-center justify-center py-6 gap-2 text-muted">
              <Loader2 class="w-5 h-5 animate-spin text-accent" />
              <span class="text-xs font-bold">Buscando espacios...</span>
            </div>
            <div
              v-else-if="modalSlots.length === 0 && !modalError"
              class="text-center py-6 px-4 text-xs font-bold text-red-500 bg-red-50 rounded-2xl border border-red-100"
            >
              No hay horarios disponibles para hoy.
            </div>
            <div v-else-if="modalSlots.length > 0" class="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
              <button
                v-for="slot in modalSlots"
                :key="slot"
                :class="[
                  'py-2.5 text-[11px] font-black rounded-xl transition-all border-2',
                  modalHoraSeleccionada === slot
                    ? 'bg-accent border-accent text-white shadow-md'
                    : 'bg-white border-border text-black hover:border-accent/40 hover:bg-accent/5',
                ]"
                @click="modalHoraSeleccionada = slot"
              >
                {{ formatSlot(slot) }}
              </button>
            </div>
          </div>

          <div v-if="modalError" class="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-[10px] font-bold border border-red-100">
            <AlertCircle class="w-4 h-4 shrink-0" />
            {{ modalError }}
          </div>

          <button
            :disabled="!modalHoraSeleccionada || modalSaving"
            class="w-full py-4 rounded-2xl text-sm font-black transition-all bg-black text-white hover:bg-black/80 disabled:bg-surface disabled:text-muted disabled:cursor-not-allowed shadow-xl active:scale-95"
            @click="confirmarModificacion"
          >
            {{ modalSaving ? 'Guardando...' : 'Confirmar Cambio' }}
          </button>
        </div>
      </div>
    </Transition>

    <!-- Modal Plan de Cuidados -->
    <Transition name="modal">
      <div v-if="modalCuidadosVisible" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="cerrarModalCuidados"></div>
        <div class="relative bg-card border border-border rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
          <div class="px-8 py-6 border-b border-border bg-surface/50 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-accent-dim flex items-center justify-center text-accent">
                <BookOpen class="w-6 h-6" />
              </div>
              <div>
                <h3 class="font-display font-bold text-black text-xl tracking-tight">Plan de Cuidados</h3>
                <p class="text-[10px] font-black text-muted uppercase tracking-widest mt-1">
                  {{ activeFollowUp?.procedimiento }}
                </p>
              </div>
            </div>
            <button @click="cerrarModalCuidados" class="p-2 rounded-xl hover:bg-surface text-muted transition-all">
              <X class="w-6 h-6" />
            </button>
          </div>

          <div class="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div v-if="isLoadingCuidados" class="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 class="w-10 h-10 animate-spin text-accent" />
              <span class="text-sm font-bold text-muted">Obteniendo indicaciones...</span>
            </div>
            <div v-else-if="selectedFollowUp" class="space-y-10">
              <div class="relative pl-6 border-l-4 border-accent">
                <h4 class="text-xs font-black text-accent uppercase tracking-widest mb-3">Recomendaciones</h4>
                <p class="text-sm text-black leading-relaxed whitespace-pre-line font-medium italic">
                  {{ selectedFollowUp.plan_cuidados || 'No se han registrado recomendaciones específicas.' }}
                </p>
              </div>
              <div class="relative pl-6 border-l-4 border-indigo-500">
                <h4 class="text-xs font-black text-indigo-600 uppercase tracking-widest mb-3">Indicaciones Médicas</h4>
                <p class="text-sm text-black leading-relaxed whitespace-pre-line font-medium">
                  {{ selectedFollowUp.indicaciones_medicas || 'Sin indicaciones adicionales.' }}
                </p>
              </div>
              <div class="p-5 rounded-2xl bg-amber-50 border border-amber-200">
                <p class="text-[10px] font-bold text-amber-800 leading-relaxed">
                  Nota: Sigue estas indicaciones para asegurar una recuperación óptima. Si tienes dudas, usa el seguimiento para informar a tu dentista.
                </p>
              </div>
            </div>
          </div>

          <div class="p-8 border-t border-border bg-surface/30">
            <button
              @click="cerrarModalCuidados"
              class="w-full bg-black text-white py-4 rounded-2xl text-sm font-black hover:bg-black/80 transition-all shadow-xl active:scale-95"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-in {
  animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0);    }
}

.modal-enter-active, .modal-leave-active { transition: all 0.3s ease; }
.modal-enter-from,   .modal-leave-to     { opacity: 0; }
.modal-enter-from .relative, .modal-leave-to .relative { transform: scale(0.95) translateY(20px); }

.custom-scrollbar::-webkit-scrollbar       { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
</style>