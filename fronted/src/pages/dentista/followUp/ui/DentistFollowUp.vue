<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  Plus,
  Search,
  X,
  Pencil,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  HeartPulse,
  ChevronDown,
  CalendarDays,
  Stethoscope,
  Eye,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-vue-next'
import { httpClient } from '@/shared/api/http'

interface Seguimiento {
  id_seguimiento: number
  id_cita: number
  id_procedimiento: number
  id_cuestionario_24h: number | null
  id_cuestionario_72h: number | null
  estado_seguimiento: 'en curso' | 'finalizado' | 'alerta' | 'cancelado'
  plan_cuidados: string
  indicaciones_medicas: string
  fecha_inicio: string
  fecha_fin: string | null
  pacienteNombre: string
  procedimientoNombre: string
  tiene_cuestionario_24h: boolean
  tiene_cuestionario_72h: boolean
  enviado_24h: boolean
  enviado_72h: boolean
}

interface RespuestaItem {
  id_pregunta_base: number
  texto_pregunta: string
  tipo_control: 'escala_1_10' | 'booleano_si_no' | 'texto_libre' | 'opcion_multiple'
  opciones: string[] | null
  valor_alerta: Record<string, any> | null
  valor_respuesta: string
  fecha_respuesta: string
  disparo_alerta: boolean
}

interface RespuestasDetalle {
  respuestas_24h: RespuestaItem[]
  respuestas_72h: RespuestaItem[]
  fecha_envio_24h: string | null
  fecha_envio_72h: string | null
}

interface Procedure {
  id_procedimiento: number
  nombre_procedimiento: string
}
interface CitaOpcion {
  id_cita: number
  label: string
  id_tipocita: number | null // ← para auto-mapear al procedimiento
  nombre_tipo: string // ← para mostrar en el modal read-only
}
interface Cuestionario {
  id_cuestionario: number
  nombre_cuestionario: string
  tipo_cuestionario: string
}

const seguimientos = ref<Seguimiento[]>([])
const searchQuery = ref('')
const isLoading = ref(true)
const isSaving = ref(false)
const successMsg = ref<string | null>(null)
const errorMsg = ref<string | null>(null)
const isModalOpen = ref(false)
const modalMode = ref<'crear' | 'editar'>('crear')
const itemEditando = ref<Seguimiento | null>(null)

const form = ref({
  id_seguimiento: 0,
  id_cita: '' as string,
  id_procedimiento: '' as string,
  plan_cuidados: '',
  indicaciones_medicas: '',
  id_cuestionario_24h: '' as string,
  id_cuestionario_72h: '' as string,
})

// Detalle
const isDetalleOpen = ref(false)
const isLoadingRespuestas = ref(false)
const seguimientoDetalle = ref<Seguimiento | null>(null)
const respuestasDetalle = ref<RespuestasDetalle | null>(null)
const tabActiva = ref<'24h' | '72h'>('24h')

// Catálogos
const procedures = ref<Procedure[]>([])
const citasOpciones = ref<CitaOpcion[]>([])
const cuestionarios24 = ref<Cuestionario[]>([])
const cuestionarios72 = ref<Cuestionario[]>([])
const isLoadingCatalogos = ref(false)

async function cargarCatalogos() {
  isLoadingCatalogos.value = true
  try {
    const [resProcedimientos, resCuest24, resCuest72, resCitas] = await Promise.all([
      httpClient.get<{ listaCatalogo: Procedure[] }>('/catalogo-procedimientos'),
      httpClient.get<{ cuestionarios: Cuestionario[] }>('/cuestionario?tipo=24h'),
      httpClient.get<{ cuestionarios: Cuestionario[] }>('/cuestionario?tipo=72h'),
      httpClient.get<{ citas: any[] }>(
        '/citas?estado=Confirmada&sinSeguimiento=true&pasadas=true&limit=200',
      ),
    ])
    procedures.value = resProcedimientos.listaCatalogo ?? []
    cuestionarios24.value = resCuest24.cuestionarios ?? []
    cuestionarios72.value = resCuest72.cuestionarios ?? []
    citasOpciones.value = (resCitas.citas ?? []).map((c: any) => {
      const paciente = c.paciente?.usuario
      const nombre = paciente
        ? `${paciente.nombre} ${paciente.apellido_paterno}`.trim()
        : `Paciente #${c.id_paciente}`
      const fecha = c.fecha_hora_inicio
        ? new Date(c.fecha_hora_inicio).toLocaleDateString('es-MX', {
            day: '2-digit',
            month: 'short',
          })
        : ''
      return {
        id_cita: c.id_cita,
        label: `Cita #${c.id_cita} — ${nombre} (${fecha})`,
        id_tipocita: c.tipo?.id_tipocita ?? null, // ← AGREGAR
        nombre_tipo: c.tipo?.nombre_corto ?? c.tipo?.nombre ?? '', // ← AGREGAR
      }
    })
  } catch {
    errorMsg.value = 'No se pudieron cargar los catálogos.'
  } finally {
    isLoadingCatalogos.value = false
  }
}

const columns = [
  {
    key: 'alerta',
    label: 'Alerta',
    icon: AlertCircle,
    accent: 'text-red-500',
    borderLeft: 'border-l-red-400',
    badge: 'bg-red-500/10 text-red-600 border-red-400/30',
    headerBg: 'bg-red-500/5 border-red-400/20',
  },
  {
    key: 'en curso',
    label: 'En Curso',
    icon: Clock,
    accent: 'text-accent',
    borderLeft: 'border-l-accent',
    badge: 'bg-accent/10 text-accent border-accent/20',
    headerBg: 'bg-accent/5 border-accent/20',
  },
  {
    key: 'finalizado',
    label: 'Finalizado',
    icon: CheckCircle2,
    accent: 'text-emerald-500',
    borderLeft: 'border-l-emerald-400',
    badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-400/30',
    headerBg: 'bg-emerald-500/5 border-emerald-400/20',
  },
]

const filtered = computed(() => {
  if (!searchQuery.value.trim()) return seguimientos.value
  const q = searchQuery.value.toLowerCase()
  return seguimientos.value.filter(
    (s) =>
      s.pacienteNombre.toLowerCase().includes(q) || s.procedimientoNombre.toLowerCase().includes(q),
  )
})

// ── Cita actualmente seleccionada (datos enriquecidos) ────────────────────
const citaSeleccionadaData = computed<CitaOpcion | null>(() => {
  if (!form.value.id_cita) return null
  return (
    citasOpciones.value.find(
      (c) => String(c.id_cita) === String(form.value.id_cita), // ← String() en ambos lados
    ) ?? null
  )
})

// ── Procedimiento derivado automáticamente de la cita ─────────────────────
// Estrategia 1: id_tipocita === id_procedimiento (convención del proyecto)
// Estrategia 2: fallback por nombre si los IDs no corresponden
const procedimientoDerivado = computed<Procedure | null>(() => {
  const cita = citaSeleccionadaData.value
  if (!cita?.nombre_tipo || !procedures.value.length) return null

  const palabrasClave = cita.nombre_tipo.toLowerCase().split(/\s+/)

  for (const palabra of palabrasClave) {
    if (palabra.length < 4) continue
    const match = procedures.value.find((p) => {
      const nombreProc = p.nombre_procedimiento.toLowerCase()
      const raiz = nombreProc.split(' ')[0] ?? '' // ← ?? '' elimina el undefined
      return nombreProc.includes(palabra) || palabra.includes(raiz)
    })
    if (match) return match
  }
  return null
})

// ── Watch: auto-populate id_procedimiento al seleccionar una cita ─────────
watch(
  () => form.value.id_cita,
  () => {
    if (modalMode.value !== 'crear') return
    const proc = procedimientoDerivado.value
    form.value.id_procedimiento = proc ? String(proc.id_procedimiento) : ''
  },
)

function columnItems(key: string) {
  return filtered.value.filter((s) => s.estado_seguimiento === key)
}

function formatearFecha(fechaStr: string) {
  if (!fechaStr) return '—'
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(fechaStr))
}
function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n.charAt(0))
    .join('')
    .toUpperCase()
}
function diasTranscurridos(fecha: string) {
  return Math.floor((Date.now() - new Date(fecha).getTime()) / 86400000)
}
function clearSearch() {
  searchQuery.value = ''
}

async function fetchSeguimientos() {
  isLoading.value = true
  try {
    const res = await httpClient.get<{ seguimientos: any[] }>('/seguimiento?limit=100')
    seguimientos.value = (res.seguimientos ?? []).map((s: any) => ({
      id_seguimiento: s.id_seguimiento,
      id_cita: s.id_cita ?? 0,
      id_procedimiento: s.id_procedimiento ?? 0,
      id_cuestionario_24h: s.id_cuestionario_24h ?? null,
      id_cuestionario_72h: s.id_cuestionario_72h ?? null,
      estado_seguimiento: s.estado_seguimiento,
      plan_cuidados: s.plan_cuidados ?? '',
      indicaciones_medicas: s.indicaciones_medicas ?? '',
      fecha_inicio: s.fecha_inicio,
      fecha_fin: s.fecha_fin,
      pacienteNombre: s.nombre ?? '—',
      procedimientoNombre: s.procedimiento ?? '—',
      tiene_cuestionario_24h: s.tiene_cuestionario_24h ?? false,
      tiene_cuestionario_72h: s.tiene_cuestionario_72h ?? false,
      enviado_24h: s.enviado_24h ?? false,
      enviado_72h: s.enviado_72h ?? false,
    }))
  } catch {
    errorMsg.value = 'No se pudieron cargar los seguimientos.'
  } finally {
    isLoading.value = false
  }
}

function abrirModal(modo: 'crear' | 'editar', item?: Seguimiento) {
  modalMode.value = modo
  errorMsg.value = null
  itemEditando.value = modo === 'editar' ? (item ?? null) : null
  form.value =
    modo === 'editar' && item
      ? {
          id_seguimiento: item.id_seguimiento,
          id_cita: item.id_cita.toString(),
          id_procedimiento: item.id_procedimiento.toString(),
          plan_cuidados: item.plan_cuidados,
          indicaciones_medicas: item.indicaciones_medicas,
          id_cuestionario_24h: item.id_cuestionario_24h?.toString() ?? '',
          id_cuestionario_72h: item.id_cuestionario_72h?.toString() ?? '',
        }
      : {
          id_seguimiento: 0,
          id_cita: '',
          id_procedimiento: '',
          plan_cuidados: '',
          indicaciones_medicas: '',
          id_cuestionario_24h: '',
          id_cuestionario_72h: '',
        }
  isModalOpen.value = true
}
function cerrarModal() {
  isModalOpen.value = false
  errorMsg.value = null
  itemEditando.value = null
}

async function guardarSeguimiento() {
  errorMsg.value = null
  if (modalMode.value === 'crear') {
    if (!form.value.id_cita) {
      errorMsg.value = 'Selecciona una cita quirúrgica.'
      return
    }
    if (!form.value.id_procedimiento) {
      errorMsg.value = 'No se pudo determinar el procedimiento. Selecciónalo manualmente.'
      return
    }
  }

  isSaving.value = true
  try {
    if (modalMode.value === 'crear') {
      await httpClient.post('/seguimiento', {
        id_cita: Number(form.value.id_cita),
        id_procedimiento: Number(form.value.id_procedimiento),
        plan_cuidados: form.value.plan_cuidados || null,
        indicaciones_medicas: form.value.indicaciones_medicas || null,
        id_cuestionario_24h: form.value.id_cuestionario_24h
          ? Number(form.value.id_cuestionario_24h)
          : null,
        id_cuestionario_72h: form.value.id_cuestionario_72h
          ? Number(form.value.id_cuestionario_72h)
          : null,
      })
      successMsg.value = 'Seguimiento creado correctamente.'
    } else {
      await httpClient.put(`/seguimiento/${form.value.id_seguimiento}`, {
        plan_cuidados: form.value.plan_cuidados || null,
        indicaciones_medicas: form.value.indicaciones_medicas || null,
        id_cuestionario_24h: form.value.id_cuestionario_24h
          ? Number(form.value.id_cuestionario_24h)
          : null,
        id_cuestionario_72h: form.value.id_cuestionario_72h
          ? Number(form.value.id_cuestionario_72h)
          : null,
      })
      successMsg.value = 'Seguimiento actualizado correctamente.'
    }
    cerrarModal()
    setTimeout(() => {
      successMsg.value = null
    }, 3500)
    await fetchSeguimientos()
  } catch (error: any) {
    errorMsg.value = error?.response?.data?.message ?? 'Error al guardar el seguimiento.'
  } finally {
    isSaving.value = false
  }
}

async function terminarSeguimiento(id: number) {
  if (!confirm('¿Marcar este seguimiento como Finalizado? Esta acción no se puede deshacer.'))
    return
  try {
    await httpClient.patch(`/seguimiento/${id}/finalizar`)
    successMsg.value = 'Seguimiento finalizado correctamente.'
    setTimeout(() => {
      successMsg.value = null
    }, 3500)
    await fetchSeguimientos()
  } catch (error: any) {
    errorMsg.value = error?.response?.data?.message ?? 'No se pudo finalizar el seguimiento.'
    setTimeout(() => {
      errorMsg.value = null
    }, 4000)
  }
}

const isResolvingAlerta = ref(false)

async function resolverAlerta(id: number) {
  if (!confirm('¿Marcar la alerta como atendida? El seguimiento volverá a "en curso".')) return
  isResolvingAlerta.value = true
  try {
    await httpClient.patch(`/seguimiento/${id}/resolver-alerta`)
    successMsg.value = 'Alerta resuelta. El seguimiento está en curso nuevamente.'
    setTimeout(() => {
      successMsg.value = null
    }, 3500)
    seguimientoDetalle.value = null
    cerrarDetalle()
    await fetchSeguimientos()
  } catch (error: any) {
    errorMsg.value = error?.response?.data?.message ?? 'No se pudo resolver la alerta.'
    setTimeout(() => {
      errorMsg.value = null
    }, 4000)
  } finally {
    isResolvingAlerta.value = false
  }
}

// ─── Detalle ──────────────────────────────────────────────────────────────────

async function abrirDetalle(item: Seguimiento) {
  seguimientoDetalle.value = item
  respuestasDetalle.value = null
  isDetalleOpen.value = true
  isLoadingRespuestas.value = true
  tabActiva.value = item.tiene_cuestionario_24h ? '24h' : '72h'
  try {
    const res = await httpClient.get<any>(`/seguimiento/${item.id_seguimiento}/respuestas`)
    respuestasDetalle.value = {
      respuestas_24h: res.respuestas_24h ?? [],
      respuestas_72h: res.respuestas_72h ?? [],
      fecha_envio_24h: res.fecha_envio_24h ?? null,
      fecha_envio_72h: res.fecha_envio_72h ?? null,
    }
  } catch {
    respuestasDetalle.value = {
      respuestas_24h: [],
      respuestas_72h: [],
      fecha_envio_24h: null,
      fecha_envio_72h: null,
    }
  } finally {
    isLoadingRespuestas.value = false
  }
}
function cerrarDetalle() {
  isDetalleOpen.value = false
  seguimientoDetalle.value = null
  respuestasDetalle.value = null
}

function formatearRespuesta(tipoControl: string, valor: string): string {
  if (tipoControl === 'booleano_si_no') return valor === 'true' ? 'Sí' : 'No'
  if (tipoControl === 'opcion_multiple')
    return valor
      .split(',')
      .map((v: string) => v.trim())
      .join(', ')
  return valor
}
function respuestasDeTab(tab: '24h' | '72h') {
  return !respuestasDetalle.value
    ? []
    : tab === '24h'
      ? respuestasDetalle.value.respuestas_24h
      : respuestasDetalle.value.respuestas_72h
}
function fechaEnvioDeTab(tab: '24h' | '72h') {
  if (!respuestasDetalle.value) return null
  const f =
    tab === '24h'
      ? respuestasDetalle.value.fecha_envio_24h
      : respuestasDetalle.value.fecha_envio_72h
  return f
    ? new Date(f).toLocaleString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null
}
function tabEnviado(tab: '24h' | '72h') {
  return !seguimientoDetalle.value
    ? false
    : tab === '24h'
      ? seguimientoDetalle.value.enviado_24h
      : seguimientoDetalle.value.enviado_72h
}
function tabTiene(tab: '24h' | '72h') {
  return !seguimientoDetalle.value
    ? false
    : tab === '24h'
      ? seguimientoDetalle.value.tiene_cuestionario_24h
      : seguimientoDetalle.value.tiene_cuestionario_72h
}
function hayAlertas(tab: '24h' | '72h') {
  return respuestasDeTab(tab).some((r) => r.disparo_alerta)
}

onMounted(async () => {
  await Promise.all([fetchSeguimientos(), cargarCatalogos()])
})
</script>

<template>
  <div class="fade-in mx-auto pb-10">
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
      <div>
        <div class="flex items-center gap-1.5 text-xs text-muted font-medium mb-2">
          <span class="text-muted/60">🏠</span><span class="text-muted/60">&gt;</span>
          <span class="bg-card border border-border px-2 py-0.5 rounded-lg">Seguimiento</span>
        </div>
        <h1 class="font-display text-4xl font-semibold text-black">Seguimiento Postoperatorio</h1>
        <p class="text-sm text-muted mt-1">
          Planes de cuidado e indicaciones médicas para pacientes en recuperación.
        </p>
      </div>
      <button
        class="flex items-center gap-2 bg-ink/65 text-text-secondary hover:bg-ink/80 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all hover:scale-105 active:scale-95 self-start md:self-auto"
        @click="abrirModal('crear')"
      >
        <Plus class="w-4 h-4" /> Nuevo Seguimiento
      </button>
    </div>

    <Transition name="toast">
      <div
        v-if="successMsg"
        class="mb-6 flex items-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 rounded-2xl text-sm font-medium"
      >
        <CheckCircle2 class="w-4 h-4 shrink-0" /> {{ successMsg }}
      </div>
    </Transition>
    <Transition name="toast">
      <div
        v-if="errorMsg && !isModalOpen"
        class="mb-6 flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-400/30 text-red-600 rounded-2xl text-sm font-medium"
      >
        <AlertCircle class="w-4 h-4 shrink-0" /> {{ errorMsg }}
      </div>
    </Transition>

    <div class="relative max-w-md mb-8">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/40" />
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Buscar paciente o procedimiento..."
        class="w-full pl-10 pr-9 py-2.5 bg-card border border-border rounded-2xl text-sm text-black placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
      />
      <button
        v-if="searchQuery"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-muted/40 hover:text-muted/70"
        @click="clearSearch"
      >
        <X class="w-4 h-4" />
      </button>
    </div>

    <div
      v-if="isLoading"
      class="flex flex-col items-center justify-center py-32 gap-3 text-muted/50"
    >
      <Loader2 class="w-10 h-10 animate-spin text-accent/50" />
      <p class="text-sm font-medium">Cargando seguimientos...</p>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
      <div v-for="col in columns" :key="col.key" class="flex flex-col gap-3">
        <div
          :class="['flex items-center justify-between px-4 py-3 rounded-2xl border', col.headerBg]"
        >
          <div class="flex items-center gap-2">
            <component :is="col.icon" :class="['w-4 h-4', col.accent]" />
            <span class="text-sm font-bold text-black">{{ col.label }}</span>
          </div>
          <span
            class="text-xs font-bold bg-card border border-border text-muted px-2.5 py-0.5 rounded-full"
            >{{ columnItems(col.key).length }}</span
          >
        </div>

        <div
          v-if="columnItems(col.key).length === 0"
          class="bg-card border border-dashed border-border rounded-2xl py-12 flex flex-col items-center gap-2 text-muted/30"
        >
          <HeartPulse class="w-8 h-8" />
          <p class="text-xs">Sin registros</p>
        </div>

        <div
          v-for="item in columnItems(col.key)"
          :key="item.id_seguimiento"
          :class="[
            'bg-card border border-border border-l-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 group',
            col.borderLeft,
          ]"
        >
          <div class="p-4 space-y-3">
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2.5">
                <div
                  class="w-8 h-8 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-bold text-xs shrink-0"
                >
                  {{ getInitials(item.pacienteNombre) }}
                </div>
                <div>
                  <p class="text-sm font-bold text-black leading-tight">
                    {{ item.pacienteNombre }}
                  </p>
                  <p class="text-[10px] text-muted font-mono">Cita #{{ item.id_cita }}</p>
                </div>
              </div>
              <span
                :class="['text-[10px] font-bold px-2 py-0.5 rounded-lg border shrink-0', col.badge]"
                >{{ col.label }}</span
              >
            </div>

            <div
              class="flex items-center gap-1.5 px-3 py-2 bg-surface rounded-xl border border-border"
            >
              <Stethoscope class="w-3.5 h-3.5 text-muted/50 shrink-0" />
              <p class="text-xs font-semibold text-black truncate">
                {{ item.procedimientoNombre }}
              </p>
            </div>

            <!-- Badges estado cuestionarios: — / ⏳ pendiente / ✓ respondido -->
            <div class="flex gap-1.5">
              <span
                v-if="!item.tiene_cuestionario_24h"
                class="text-[10px] font-medium px-2 py-0.5 rounded-lg border bg-gray-50 text-gray-400 border-gray-200"
                >24h —</span
              >
              <span
                v-else-if="!item.enviado_24h"
                class="text-[10px] font-medium px-2 py-0.5 rounded-lg border bg-amber-50 text-amber-600 border-amber-200"
                >24h ⏳</span
              >
              <span
                v-else
                class="text-[10px] font-medium px-2 py-0.5 rounded-lg border bg-green-50 text-green-700 border-green-200"
                >24h ✓</span
              >

              <span
                v-if="!item.tiene_cuestionario_72h"
                class="text-[10px] font-medium px-2 py-0.5 rounded-lg border bg-gray-50 text-gray-400 border-gray-200"
                >72h —</span
              >
              <span
                v-else-if="!item.enviado_72h"
                class="text-[10px] font-medium px-2 py-0.5 rounded-lg border bg-amber-50 text-amber-600 border-amber-200"
                >72h ⏳</span
              >
              <span
                v-else
                class="text-[10px] font-medium px-2 py-0.5 rounded-lg border bg-green-50 text-green-700 border-green-200"
                >72h ✓</span
              >
            </div>

            <div v-if="item.plan_cuidados">
              <p class="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
                Plan de Cuidados
              </p>
              <p class="text-xs text-black leading-relaxed line-clamp-2">
                {{ item.plan_cuidados }}
              </p>
            </div>
          </div>

          <div
            class="px-4 py-2.5 bg-surface/60 border-t border-border rounded-b-2xl flex items-center justify-between"
          >
            <div class="flex items-center gap-1.5 text-[10px] text-muted">
              <CalendarDays class="w-3 h-3 shrink-0" />
              <span>Inicio: {{ formatearFecha(item.fecha_inicio) }}</span>
              <span>·</span>
              <span class="font-semibold text-black">{{ diasTranscurridos(item.fecha_inicio) }} días</span>
            </div>

            <div
              class="flex items-center gap-0.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
            >
              <!-- Ver: disponible en TODAS las cards -->
              <button
                class="p-1.5 rounded-lg text-muted hover:text-accent hover:bg-accent/5 transition-colors"
                title="Ver respuestas"
                @click="abrirDetalle(item)"
              >
                <Eye class="w-3.5 h-3.5" />
              </button>
              <!-- Editar / Finalizar: solo activos -->
              <template
                v-if="
                  item.estado_seguimiento !== 'finalizado' &&
                  item.estado_seguimiento !== 'cancelado'
                "
              >
                <button
                  class="p-1.5 rounded-lg text-muted hover:text-accent hover:bg-accent/5 transition-colors"
                  title="Editar"
                  @click="abrirModal('editar', item)"
                >
                  <Pencil class="w-3.5 h-3.5" />
                </button>
                <button
                  class="p-1.5 rounded-lg text-muted hover:text-emerald-600 hover:bg-emerald-500/10 transition-colors"
                  title="Finalizar"
                  @click="terminarSeguimiento(item.id_seguimiento)"
                >
                  <CheckCircle2 class="w-3.5 h-3.5" />
                </button>
              </template>
              <span v-else class="text-[10px] text-muted/50 italic ml-1">{{
                item.estado_seguimiento
              }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Modal crear/editar ─────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="isModalOpen"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          @click.self="cerrarModal"
        >
          <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="cerrarModal" />
          <div
            class="relative bg-card border border-border rounded-3xl shadow-2xl w-full max-w-lg flex flex-col gap-5 max-h-[90dvh] overflow-y-auto p-6"
          >
            <div class="flex items-start justify-between shrink-0">
              <div>
                <h3 class="font-display font-bold text-black text-base">
                  {{ modalMode === 'crear' ? 'Nuevo Seguimiento' : 'Editar Seguimiento' }}
                </h3>
                <p class="text-xs text-muted mt-0.5">
                  {{
                    modalMode === 'crear'
                      ? 'Selecciona la cita y asigna los cuestionarios.'
                      : 'Modifica el plan y los cuestionarios asignados.'
                  }}
                </p>
              </div>
              <button
                class="p-1.5 rounded-xl hover:bg-surface transition-colors text-muted hover:text-black shrink-0"
                @click="cerrarModal"
              >
                <X class="w-4 h-4" />
              </button>
            </div>
            <div class="space-y-4">
              <template v-if="modalMode === 'crear'">
                <div class="space-y-1.5">
                  <label class="text-[10px] font-bold text-muted uppercase tracking-wider px-1"
                    >Cita Quirúrgica *</label
                  >
                  <div class="relative">
                    <select
                      v-model="form.id_cita"
                      class="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all appearance-none"
                    >
                      <option value="">
                        {{
                          isLoadingCatalogos
                            ? 'Cargando...'
                            : citasOpciones.length === 0
                              ? 'Sin citas disponibles'
                              : 'Selecciona la cita...'
                        }}
                      </option>
                      <option
                        v-for="c in citasOpciones"
                        :key="c.id_cita"
                        :value="String(c.id_cita)"
                      >
                        {{ c.label }}
                      </option>
                    </select>
                    <ChevronDown
                      class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/40 pointer-events-none"
                    />
                  </div>
                </div>
                <div class="space-y-1.5">
                  <label class="text-[10px] font-bold text-muted uppercase tracking-wider px-1">
                    Procedimiento realizado *
                  </label>

                  <!-- Sin cita seleccionada aún -->
                  <p v-if="!form.id_cita" class="text-xs text-muted px-1 italic">
                    Selecciona primero una cita.
                  </p>

                  <template v-else>
                    <!-- Badge de sugerencia si hubo match automático -->
                    <p
                      v-if="procedimientoDerivado"
                      class="text-[10px] text-accent font-semibold px-1 flex items-center gap-1 mb-1"
                    >
                      <CheckCircle2 class="w-3 h-3 shrink-0" />
                      Sugerido por tipo de cita · puedes cambiarlo si es necesario
                    </p>
                    <p v-else class="text-[10px] text-amber-600 px-1 flex items-center gap-1 mb-1">
                      <AlertCircle class="w-3 h-3 shrink-0" />
                      Selecciona el procedimiento realizado en esta cita
                    </p>

                    <!-- Siempre editable — pre-seleccionado si hubo match -->
                    <div class="relative">
                      <select
                        v-model="form.id_procedimiento"
                        class="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all appearance-none"
                      >
                        <option value="">Selecciona el procedimiento...</option>
                        <option
                          v-for="p in procedures"
                          :key="p.id_procedimiento"
                          :value="String(p.id_procedimiento)"
                        >
                          {{ p.nombre_procedimiento }}
                        </option>
                      </select>
                      <ChevronDown
                        class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/40 pointer-events-none"
                      />
                    </div>
                  </template>
                </div>
              </template>
              <template v-else-if="itemEditando">
                <div class="flex gap-3 px-4 py-3 bg-surface rounded-xl border border-border">
                  <div class="flex-1 min-w-0">
                    <p class="text-[10px] font-bold text-muted uppercase tracking-wider mb-0.5">
                      Paciente · Cita
                    </p>
                    <p class="text-sm font-semibold text-black truncate">
                      {{ itemEditando.pacienteNombre }}
                    </p>
                    <p class="text-xs text-muted font-mono">Cita #{{ itemEditando.id_cita }}</p>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-[10px] font-bold text-muted uppercase tracking-wider mb-0.5">
                      Procedimiento
                    </p>
                    <p class="text-sm font-semibold text-black truncate">
                      {{ itemEditando.procedimientoNombre }}
                    </p>
                  </div>
                </div>
              </template>
              <div class="space-y-1.5">
                <label class="text-[10px] font-bold text-muted uppercase tracking-wider px-1"
                  >Cuestionario 24h</label
                >
                <div class="relative">
                  <select
                    v-model="form.id_cuestionario_24h"
                    class="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all appearance-none"
                  >
                    <option value="">Sin cuestionario de 24h</option>
                    <option
                      v-for="c in cuestionarios24"
                      :key="c.id_cuestionario"
                      :value="c.id_cuestionario"
                    >
                      {{ c.nombre_cuestionario }}
                    </option>
                  </select>
                  <ChevronDown
                    class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/40 pointer-events-none"
                  />
                </div>
              </div>
              <div class="space-y-1.5">
                <label class="text-[10px] font-bold text-muted uppercase tracking-wider px-1"
                  >Cuestionario 72h</label
                >
                <div class="relative">
                  <select
                    v-model="form.id_cuestionario_72h"
                    class="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all appearance-none"
                  >
                    <option value="">Sin cuestionario de 72h</option>
                    <option
                      v-for="c in cuestionarios72"
                      :key="c.id_cuestionario"
                      :value="c.id_cuestionario"
                    >
                      {{ c.nombre_cuestionario }}
                    </option>
                  </select>
                  <ChevronDown
                    class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/40 pointer-events-none"
                  />
                </div>
              </div>
              <div class="space-y-1.5">
                <label class="text-[10px] font-bold text-muted uppercase tracking-wider px-1"
                  >Plan de Cuidados</label
                >
                <textarea
                  v-model="form.plan_cuidados"
                  rows="3"
                  placeholder="Ej. Dieta blanda, aplicar hielo..."
                  class="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-black placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-none"
                />
              </div>
              <div class="space-y-1.5">
                <label class="text-[10px] font-bold text-muted uppercase tracking-wider px-1"
                  >Indicaciones Médicas</label
                >
                <textarea
                  v-model="form.indicaciones_medicas"
                  rows="3"
                  placeholder="Ej. Paracetamol 500mg cada 8 hrs..."
                  class="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-black placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-none"
                />
              </div>
            </div>
            <div
              v-if="errorMsg"
              class="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-400/30 text-red-600 rounded-xl text-xs font-medium"
            >
              <AlertCircle class="w-3.5 h-3.5 shrink-0" /> {{ errorMsg }}
            </div>
            <div class="flex flex-col gap-2">
              <button
                :disabled="isSaving"
                :class="[
                  'w-full py-3 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2',
                  !isSaving
                    ? 'bg-accent text-white shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-95'
                    : 'bg-surface text-muted cursor-not-allowed border border-border',
                ]"
                @click="guardarSeguimiento"
              >
                <Loader2 v-if="isSaving" class="w-4 h-4 animate-spin" />
                {{
                  isSaving
                    ? 'Guardando...'
                    : modalMode === 'crear'
                      ? 'Crear Seguimiento'
                      : 'Guardar Cambios'
                }}
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

    <!-- ── Modal detalle — respuestas del paciente ────────────────────── -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="isDetalleOpen"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          @click.self="cerrarDetalle"
        >
          <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="cerrarDetalle" />
          <div
            class="relative bg-card border border-border rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90dvh]"
          >
            <!-- Header -->
            <div
              class="px-6 py-5 border-b border-border flex items-start justify-between gap-4 shrink-0"
            >
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <p class="font-display font-bold text-black text-lg">
                    {{ seguimientoDetalle?.pacienteNombre }}
                  </p>
                  <span
                    v-if="seguimientoDetalle?.estado_seguimiento === 'alerta'"
                    class="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-red-500/10 text-red-600 border border-red-400/30"
                  >
                    <AlertTriangle class="w-3 h-3" /> Alerta activa
                  </span>
                </div>
                <p class="text-sm text-muted">
                  {{ seguimientoDetalle?.procedimientoNombre }} · Cita #{{
                    seguimientoDetalle?.id_cita
                  }}
                </p>
              </div>
              <button
                class="p-1.5 rounded-xl hover:bg-surface transition-colors text-muted hover:text-black shrink-0"
                @click="cerrarDetalle"
              >
                <X class="w-4 h-4" />
              </button>
            </div>

            <!-- Cuerpo -->
            <div class="flex-1 overflow-y-auto">
              <!-- Plan e indicaciones -->
              <div
                v-if="seguimientoDetalle?.plan_cuidados || seguimientoDetalle?.indicaciones_medicas"
                class="px-6 pt-5 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div
                  v-if="seguimientoDetalle?.plan_cuidados"
                  class="bg-surface rounded-2xl border border-border p-4"
                >
                  <p class="text-[10px] font-bold text-muted uppercase tracking-wide mb-2">
                    Plan de cuidados
                  </p>
                  <p class="text-sm text-black leading-relaxed">
                    {{ seguimientoDetalle.plan_cuidados }}
                  </p>
                </div>
                <div
                  v-if="seguimientoDetalle?.indicaciones_medicas"
                  class="bg-surface rounded-2xl border border-border p-4"
                >
                  <p class="text-[10px] font-bold text-muted uppercase tracking-wide mb-2">
                    Indicaciones médicas
                  </p>
                  <p class="text-sm text-black leading-relaxed">
                    {{ seguimientoDetalle.indicaciones_medicas }}
                  </p>
                </div>
              </div>

              <!-- Tabs + Respuestas -->
              <div class="px-6 pb-6">
                <!-- Tabs: solo muestra las que tienen cuestionario asignado -->
                <div class="flex gap-2 mb-4">
                  <template v-for="tab in ['24h', '72h'] as const" :key="tab">
                    <button
                      v-if="tabTiene(tab)"
                      :class="[
                        'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold border transition-all',
                        tabActiva === tab
                          ? 'bg-accent text-white border-accent shadow-sm'
                          : 'bg-surface text-muted border-border hover:border-accent/30',
                      ]"
                      @click="tabActiva = tab"
                    >
                      Cuestionario {{ tab }}
                      <span
                        v-if="tabEnviado(tab) && hayAlertas(tab)"
                        class="w-2 h-2 rounded-full bg-red-400 shrink-0"
                      />
                    </button>
                  </template>
                  <!-- Si no tiene ningún cuestionario -->
                  <p
                    v-if="
                      !seguimientoDetalle?.tiene_cuestionario_24h &&
                      !seguimientoDetalle?.tiene_cuestionario_72h
                    "
                    class="text-sm text-muted"
                  >
                    Este seguimiento no tiene cuestionarios asignados.
                  </p>
                </div>

                <!-- Loading -->
                <div
                  v-if="isLoadingRespuestas"
                  class="flex items-center justify-center py-12 gap-2 text-muted/50"
                >
                  <Loader2 class="w-6 h-6 animate-spin text-accent/50" /><span class="text-sm"
                    >Cargando respuestas...</span
                  >
                </div>

                <!-- Sin cuestionario en este tab -->
                <div
                  v-else-if="!tabTiene(tabActiva)"
                  class="flex flex-col items-center gap-2 py-12 text-muted/40"
                >
                  <HeartPulse class="w-8 h-8" />
                  <p class="text-sm">
                    No se asignó cuestionario de {{ tabActiva }} a este seguimiento.
                  </p>
                </div>

                <!-- Pendiente -->
                <div
                  v-else-if="!tabEnviado(tabActiva)"
                  class="flex flex-col items-center gap-2 py-12 text-muted/40"
                >
                  <Clock class="w-8 h-8" />
                  <p class="text-sm font-medium">
                    El paciente aún no ha respondido el cuestionario de {{ tabActiva }}.
                  </p>
                </div>

                <!-- Respuestas -->
                <div v-else class="space-y-3">
                  <p class="text-xs text-muted mb-4">
                    Respondido el
                    <span class="font-semibold text-black">{{ fechaEnvioDeTab(tabActiva) }}</span>
                    <span v-if="hayAlertas(tabActiva)" class="ml-2 text-red-600 font-bold">
                      ·
                      {{
                        respuestasDeTab(tabActiva).filter((r) => r.disparo_alerta).length
                      }}
                      signo(s) de alarma detectado(s)
                    </span>
                  </p>

                  <div
                    v-for="(r, idx) in respuestasDeTab(tabActiva)"
                    :key="r.id_pregunta_base"
                    :class="[
                      'rounded-2xl border p-4',
                      r.disparo_alerta ? 'border-red-300 bg-red-50' : 'border-border bg-surface',
                    ]"
                  >
                    <div class="flex items-start gap-3">
                      <span
                        :class="[
                          'w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0',
                          r.disparo_alerta
                            ? 'bg-red-500/15 text-red-600'
                            : 'bg-accent/10 text-accent',
                        ]"
                      >
                        {{ idx + 1 }}
                      </span>
                      <div class="min-w-0 flex-1">
                        <p class="text-sm font-semibold text-black leading-snug">
                          {{ r.texto_pregunta }}
                        </p>
                        <div class="mt-2 flex items-center gap-2 flex-wrap">
                          <span
                            :class="[
                              'text-sm font-bold px-3 py-1 rounded-xl border',
                              r.disparo_alerta
                                ? 'bg-red-100 text-red-700 border-red-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200',
                            ]"
                          >
                            {{ formatearRespuesta(r.tipo_control, r.valor_respuesta) }}
                          </span>
                          <span
                            v-if="r.disparo_alerta"
                            class="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-red-500/10 text-red-600 border border-red-300"
                          >
                            <AlertTriangle class="w-3 h-3" /> Signo de alarma
                          </span>
                        </div>
                        <p
                          v-if="r.tipo_control === 'opcion_multiple' && r.opciones?.length"
                          class="text-[10px] text-muted mt-1.5"
                        >
                          Opciones: {{ r.opciones.join(', ') }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div
              class="px-6 py-4 border-t border-border shrink-0 flex justify-between items-center"
            >
              <p class="text-xs text-muted">
                Inicio: {{ formatearFecha(seguimientoDetalle?.fecha_inicio ?? '') }}
              </p>
              <div class="flex items-center gap-2">
                <button
                  v-if="seguimientoDetalle?.estado_seguimiento === 'alerta'"
                  :disabled="isResolvingAlerta"
                  class="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-amber-700 text-sm font-bold hover:bg-amber-500/20 transition-all disabled:opacity-60"
                  @click="resolverAlerta(seguimientoDetalle!.id_seguimiento)"
                >
                  <ShieldCheck class="w-4 h-4" />
                  {{ isResolvingAlerta ? 'Resolviendo...' : 'Marcar como atendida' }}
                </button>
                <button
                  class="px-4 py-2 rounded-2xl border border-border text-sm font-bold text-muted hover:text-black hover:bg-surface transition-all"
                  @click="cerrarDetalle"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.fade-in {
  animation: fadeIn 0.25s ease;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
.modal-enter-active,
.modal-leave-active {
  transition: all 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
