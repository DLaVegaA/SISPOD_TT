<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search, FileText, Download, Pencil, X, Plus, Filter } from 'lucide-vue-next'
import { ROUTE_NAMES } from '@/shared/routes'
import { httpClient } from '@/shared/api/http'
import { UserAvatar } from '@/entities/user'

const searchQuery = ref('')
const selectedStatus = ref('todos')

type ExpedienteCard = {
  id: number
  expediente: string
  avatar: string
  nombre: string
  sexo: string
  edad: number | string
  localidad: string
  ultimaAtencion: string
  servicio: string
  diagnostico: string
  tratamiento: string
  odontologo: string
  fechaCreacion: string
  estado: string
}

type ResponseExpedientes = {
  message: string
  expedientes: ExpedienteCard[]
}

const records = ref<ExpedienteCard[]>([])
const isLoading = ref(false)

const mapExpediente = (item: ExpedienteCard): ExpedienteCard => {
  const id = Number(item.id ?? 0)
  return {
    id,
    expediente: String(item.expediente ?? id),
    avatar: '', // No se usa, se reemplaza con UserAvatar component
    nombre: item.nombre || 'Paciente',
    sexo: item.sexo || 'No especificado',
    edad: item.edad ?? '-',
    localidad: item.localidad || '',
    ultimaAtencion: item.ultimaAtencion || 'Sin cita previa',
    servicio: item.servicio || 'Ninguno',
    diagnostico: item.diagnostico || 'Sin diagnostico',
    tratamiento: item.tratamiento || 'Sin tratamiento',
    odontologo: item.odontologo || 'Dentista',
    fechaCreacion: item.fechaCreacion || '',
    estado: item.estado || 'Pendiente',
  }
}

const loadRecords = async () => {
  isLoading.value = true
  try {
    const data: ResponseExpedientes = await httpClient.get('/expediente', { params: { limit: 50 } })
    const lista = Array.isArray(data?.expedientes) ? data.expedientes : []
    records.value = lista.map(mapExpediente)
  } catch (error) {
    console.error('Error al cargar expedientes', error)
    records.value = []
  } finally {
    isLoading.value = false
  }
}

const filtered = computed(() => {
  let result = records.value
  const q = searchQuery.value.toLowerCase().trim()
  if (q) {
    result = result.filter(
      (r) => r.nombre.toLowerCase().includes(q) || r.expediente.toLowerCase().includes(q),
    )
  }
  if (selectedStatus.value !== 'todos') {
    result = result.filter((r) => r.estado === selectedStatus.value)
  }
  return result
})

// ── Estado config ─────────────────────────────────────────────────────────────
// Cada estado tiene: badge (pill), dot color, left border del card, label
type EstadoConfig = {
  badge: string // clases Tailwind para el pill
  dot: string // color del punto indicador
  label: string // texto normalizado
}

const ESTADO_CONFIG: Record<string, EstadoConfig> = {
  // 🟢 Activo, en proceso — verde
  'En Tratamiento': {
    badge: 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold',
    dot: 'bg-emerald-500',
    label: 'En Tratamiento',
  },
  // 🟣 Completado — violeta
  Finalizado: {
    badge: 'bg-red-100 text-red-800 border border-red-300 font-semibold',
    dot: 'bg-red-500',
    label: 'Finalizado',
  },
  // 🔴 Sin actividad — rojo
  'Sin Seguimiento': {
    badge: 'bg-amber-100 text-amber-800 border border-amber-300 font-semibold',
    dot: 'bg-amber-500',
    label: 'Sin Seguimiento',
  },
}

// Fallback para estados desconocidos
const DEFAULT_ESTADO: EstadoConfig = {
  badge: 'bg-gray-100 text-gray-600 border border-gray-300 font-semibold',
  dot: 'bg-gray-400',
  label: '',
}

function getEstadoConfig(estado: string): EstadoConfig {
  // Normalizar typo del backend ('En tratamientp' → 'En Tratamiento')
  const normalized = estado.replace(/tratamientp/i, 'Tratamiento').trim()
  return ESTADO_CONFIG[normalized] ?? { ...DEFAULT_ESTADO, label: estado }
}

const filterStatuses = [
  { value: 'todos', label: 'Todos' },
  { value: 'En Tratamiento', label: 'En tratamiento' },
  { value: 'Finalizado', label: 'Finalizado' },
  { value: 'Sin Seguimiento', label: 'Sin seguimiento' },
]

const clearSearch = () => {
  searchQuery.value = ''
}

const router = useRouter()
const route = useRoute()
const dentistId = computed(() => String(route.params.id ?? '0'))

onMounted(loadRecords)

function openClinicalHistory(recordId: number, mode: 'edit' | 'view') {
  router.push({
    name: ROUTE_NAMES.DENTIST_CLINICAL_HISTORY_DETAIL,
    params: { id: dentistId.value, patientId: String(recordId) },
    query: { mode },
  })
}
</script>

<template>
  <div class="fade-in max-w-7xl">
    <!-- ── Header ───────────────────────────────────────────────────── -->
    <div class="mb-8">
      <div class="flex items-center gap-2 text-sm text-muted/60 mb-3">
        <span>🏠</span>
        <span>/</span>
        <span class="font-medium text-muted">Historial Clínico</span>
      </div>
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="font-display text-3xl sm:text-4xl font-bold text-muted tracking-tight">
            Historial Clínico
          </h1>
          <p class="text-sm text-muted/60 mt-1">Gestión de expedientes y atención odontológica</p>
        </div>
        <button
          class="inline-flex items-center gap-2 px-4 py-2 bg-ink/65 hover:bg-accent-light text-white text-sm font-semibold rounded-xl transition-all shadow-sm"
        >
          <Plus class="w-4 h-4" />
          Nuevo Expediente
        </button>
      </div>
    </div>

    <!-- ── Búsqueda y filtros ────────────────────────────────────────── -->
    <div class="mb-8 space-y-4">
      <div class="relative max-w-md">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/40" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar por nombre o número de expediente..."
          class="w-full pl-10 pr-10 py-2.5 bg-card border border-border rounded-xl text-sm text-muted placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
        />
        <button
          v-if="searchQuery"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-muted/40 hover:text-muted/70"
          @click="clearSearch"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Filtros de estado -->
      <div class="flex flex-wrap items-center gap-2">
        <Filter class="w-4 h-4 text-muted/40" />
        <span class="text-xs font-medium text-muted/60 mr-1">Filtrar por:</span>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="fs in filterStatuses"
            :key="fs.value"
            :class="[
              'px-3 py-1.5 text-xs font-medium rounded-full transition-all',
              selectedStatus === fs.value
                ? 'bg-accent text-white shadow-sm'
                : 'bg-card text-muted hover:bg-surface border border-border',
            ]"
            @click="selectedStatus = fs.value"
          >
            <!-- Dot de color para estados específicos -->
            <span
              v-if="fs.value !== 'todos'"
              :class="[
                'inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle',
                getEstadoConfig(fs.value).dot,
              ]"
            />
            {{ fs.label }}
          </button>
        </div>
      </div>

      <div class="text-sm text-muted/60">
        {{ filtered.length }} expediente{{ filtered.length !== 1 ? 's' : '' }} encontrado
        <span v-if="searchQuery || selectedStatus !== 'todos'">(filtrado)</span>
      </div>
    </div>

    <!-- ── Grid de tarjetas ──────────────────────────────────────────── -->
    <div class="bg-card border border-border rounded-2xl shadow-sm p-5">
      <!-- Loading -->
      <div v-if="isLoading" class="py-20 text-center text-muted/50 flex flex-col items-center">
        <Search class="w-12 h-12 mb-3 opacity-40" />
        <p class="text-sm font-medium">Cargando expedientes...</p>
      </div>

      <!-- Empty -->
      <div
        v-else-if="filtered.length === 0"
        class="py-20 text-center text-muted/50 flex flex-col items-center"
      >
        <Search class="w-12 h-12 mb-3 opacity-40" />
        <p class="text-sm font-medium">No se encontraron expedientes</p>
        <p class="text-xs mt-1">Intenta con otros criterios de búsqueda</p>
      </div>

      <!-- Cards -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="record in filtered"
          :key="record.id"
          :class="[
            'group bg-surface rounded-2xl border border-border overflow-hidden',
            'hover:shadow-md transition-all duration-300',
          ]"
        >
          <!-- Cabecera -->
          <div class="relative p-4 pb-3 border-b border-border bg-card/30">
            <div class="flex items-center gap-3">
              <UserAvatar :name="record.nombre" role="patient" size="lg" />
              <div class="flex-1 min-w-0">
                <h3
                  class="font-display font-semibold text-muted text-base truncate"
                  :title="record.nombre"
                >
                  {{ record.nombre.split(' ').slice(0, 2).join(' ') }}
                </h3>
                <p class="text-xs text-muted/50 font-mono mt-0.5">No.{{ record.expediente }}</p>
              </div>

              <!-- Badge de estado con dot animado -->
              <span
                :class="[
                  'inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] rounded-full whitespace-nowrap',
                  getEstadoConfig(record.estado).badge,
                ]"
              >
                <span
                  :class="[
                    'w-1.5 h-1.5 rounded-full shrink-0',
                    getEstadoConfig(record.estado).dot,
                    record.estado === 'En Tratamiento' ? 'animate-pulse' : '',
                  ]"
                />
                {{ getEstadoConfig(record.estado).label || record.estado }}
              </span>
            </div>
          </div>

          <!-- Cuerpo -->
          <div class="p-4 space-y-3">
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span class="text-muted/50">Sexo / Edad</span>
                <p class="font-medium text-muted">{{ record.sexo }}, {{ record.edad }} años</p>
              </div>
              <div>
                <span class="text-muted/50">Localidad</span>
                <p class="font-medium text-muted truncate" :title="record.localidad">
                  {{ record.localidad.split(',')[0] }}
                </p>
              </div>
            </div>

            <div class="bg-card rounded-xl p-3 space-y-1.5">
              <div class="flex items-center justify-between text-xs">
                <span class="font-semibold text-muted">Última atención</span>
                <span class="text-muted/50 text-[10px]">{{ record.ultimaAtencion }}</span>
              </div>
              <p class="text-xs text-muted/80">
                <span class="font-medium">Servicio:</span> {{ record.servicio }}
              </p>
              <p class="text-xs text-muted/80">
                <span class="font-medium">Diagnóstico:</span>
                <span
                  class="truncate inline-block max-w-45 align-bottom"
                  :title="record.diagnostico"
                >
                  {{ record.diagnostico }}
                </span>
              </p>
              <p class="text-xs text-muted/80">
                <span class="font-medium">Tratamiento:</span> {{ record.tratamiento }}
              </p>
            </div>

            <div class="flex items-center justify-between text-[11px] text-muted/60 pt-1">
              <div class="flex gap-1">
                <span class="font-medium">Odontólogo:</span>
                <span class="truncate max-w-24" :title="record.odontologo">{{
                  record.odontologo
                }}</span>
              </div>
              <div>
                <span class="font-medium">Creación:</span>
                <span class="ml-1">{{ record.fechaCreacion }}</span>
              </div>
            </div>
          </div>

          <!-- Acciones -->
          <div class="grid grid-cols-3 divide-x divide-border border-t border-border bg-card/50">
            <button
              class="flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-muted/70 hover:text-accent hover:bg-card transition-colors"
              type="button"
              @click="openClinicalHistory(record.id, 'view')"
            >
              <FileText class="w-3.5 h-3.5" />
              Historial
            </button>
            <button
              class="flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-muted/70 hover:text-accent hover:bg-card transition-colors"
              type="button"
            >
              <Download class="w-3.5 h-3.5" />
              Descargar
            </button>
            <button
              class="flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-muted/70 hover:text-accent hover:bg-card transition-colors"
              type="button"
              @click="openClinicalHistory(record.id, 'edit')"
            >
              <Pencil class="w-3.5 h-3.5" />
              Editar
            </button>
          </div>
        </div>
      </div>
    </div>
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
</style>
