<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search, FileText, Download, Pencil, X, Plus, Filter } from 'lucide-vue-next'
import { ROUTE_NAMES } from '@/shared/routes'
import { httpClient } from '@/shared/api/http'
import { UserAvatar } from '@/entities/user'
import { UiModal } from '@/shared/ui/UiModal'
import { UiInput } from '@/shared/ui/UiInput'

const searchQuery = ref('')
const selectedStatus = ref('todos')

type ExpedienteCard = {
  id: number
  id_expediente?: number
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

type PacienteSinExpediente = {
  id_paciente: number
  usuario: {
    id_usuario: number
    nombre: string
    apellido_paterno?: string
    apellido_materno?: string
    correo: string
  }
}

type ResponsePacientesSinExpediente = {
  message: string
  total: number
  pagina: number
  totalPaginas: number
  limit: number
  pacientes: PacienteSinExpediente[]
}

const records = ref<ExpedienteCard[]>([])
const isLoading = ref(false)
const showNewExpedienteModal = ref(false)
const pacientesAll = ref<PacienteSinExpediente[]>([])
const isLoadingPacientes = ref(false)
const pacientesQuery = ref('')
const pacientesPage = ref(1)
const PACIENTES_PAGE_SIZE = 5

const mapExpediente = (item: ExpedienteCard): ExpedienteCard => {
  const id = Number(item.id ?? 0)
  const idExpediente = Number((item as any).id_expediente ?? 0)
  console.log(item.estado)
  return {
    id,
    id_expediente: Number.isFinite(idExpediente) ? idExpediente : undefined,
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
    estado: item.estado || 'finalizado',
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

const buildNombrePaciente = (paciente: PacienteSinExpediente) => {
  const usuario = paciente.usuario
  return [usuario.nombre, usuario.apellido_paterno, usuario.apellido_materno]
    .filter(Boolean)
    .join(' ')
    .trim()
}

const loadPacientesSinExpediente = async () => {
  isLoadingPacientes.value = true
  try {
    const limit = 500
    const first: ResponsePacientesSinExpediente = await httpClient.get(
      '/pacientes/sin-expediente',
      { params: { pagina: 1, limit } },
    )
    const totalPaginas = first?.totalPaginas ?? 1
    const all = Array.isArray(first?.pacientes) ? [...first.pacientes] : []

    for (let page = 2; page <= totalPaginas; page += 1) {
      const data: ResponsePacientesSinExpediente = await httpClient.get(
        '/pacientes/sin-expediente',
        { params: { pagina: page, limit } },
      )
      if (Array.isArray(data?.pacientes)) {
        all.push(...data.pacientes)
      }
    }

    pacientesAll.value = all
  } catch (error) {
    console.error('Error al cargar pacientes sin expediente', error)
    pacientesAll.value = []
  } finally {
    isLoadingPacientes.value = false
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

const filteredPacientes = computed(() => {
  const q = pacientesQuery.value.toLowerCase().trim()
  if (!q) return pacientesAll.value

  return pacientesAll.value.filter((paciente) => {
    const nombre = buildNombrePaciente(paciente).toLowerCase()
    const correo = paciente.usuario.correo.toLowerCase()
    return nombre.includes(q) || correo.includes(q)
  })
})

const pacientesTotal = computed(() => filteredPacientes.value.length)
const pacientesTotalPages = computed(() =>
  Math.max(1, Math.ceil(pacientesTotal.value / PACIENTES_PAGE_SIZE)),
)

const pagedPacientes = computed(() => {
  const start = (pacientesPage.value - 1) * PACIENTES_PAGE_SIZE
  return filteredPacientes.value.slice(start, start + PACIENTES_PAGE_SIZE)
})

// ── Estado config ─────────────────────────────────────────────────────────────
// Cada estado tiene: badge (pill), dot color, left border del card, label
type EstadoConfig = {
  badge: string // clases Tailwind para el pill
  dot: string // color del punto indicador
  label: string // texto normalizado
}

const ESTADO_CONFIG: Record<string, EstadoConfig> = {
  'en curso': {
    badge: 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold',
    dot: 'bg-emerald-500',
    label: 'En curso',
  },
  alerta: {
    badge: 'bg-red-100 text-red-800 border border-red-300 font-semibold',
    dot: 'bg-red-500',
    label: 'Alerta',
  },
  finalizado: {
    badge: 'bg-amber-100 text-amber-800 border border-amber-300 font-semibold',
    dot: 'bg-amber-500',
    label: 'Finalizado',
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
  { value: 'en curso', label: 'En curso' },
  { value: 'alerta', label: 'Alerta' },
  { value: 'finalizado', label: 'Finalizado' },
]

const clearSearch = () => {
  searchQuery.value = ''
}

const router = useRouter()
const route = useRoute()
const dentistId = computed(() => String(route.params.id ?? '0'))

onMounted(loadRecords)

const openNewExpedienteModal = async () => {
  showNewExpedienteModal.value = true
  pacientesQuery.value = ''
  pacientesPage.value = 1
  await loadPacientesSinExpediente()
}

const goToPacientesPage = (page: number) => {
  if (page < 1 || page > pacientesTotalPages.value) return
  pacientesPage.value = page
}

watch(pacientesQuery, () => {
  pacientesPage.value = 1
})

watch(pacientesTotalPages, (total) => {
  if (pacientesPage.value > total) {
    pacientesPage.value = total
  }
})

const selectPaciente = (pacienteId: number) => {
  showNewExpedienteModal.value = false
  openClinicalHistory(pacienteId, 'edit')
}

function openClinicalHistory(recordId: number, mode: 'edit' | 'view', expedienteId?: number) {
  const query: Record<string, string> = { mode }
  if (expedienteId) {
    query.expedienteId = String(expedienteId)
  }
  router.push({
    name: ROUTE_NAMES.DENTIST_CLINICAL_HISTORY_DETAIL,
    params: { id: dentistId.value, patientId: String(recordId) },
    query,
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
          @click="openNewExpedienteModal"
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
              @click="openClinicalHistory(record.id, 'view', record.id_expediente)"
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
              @click="openClinicalHistory(record.id, 'edit', record.id_expediente)"
            >
              <Pencil class="w-3.5 h-3.5" />
              Editar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <UiModal
    :model-value="showNewExpedienteModal"
    title="Pacientes sin expediente"
    max-width="lg"
    @update:model-value="showNewExpedienteModal = $event"
  >
    <div class="px-6 py-5 space-y-4">
      <UiInput
        v-model="pacientesQuery"
        label="Buscar paciente"
        placeholder="Buscar por nombre o correo"
        :prefix-icon="Search"
      />

      <div class="text-xs text-muted">
        {{ pacientesTotal }} paciente{{ pacientesTotal !== 1 ? 's' : '' }} disponible{{
          pacientesTotal !== 1 ? 's' : ''
        }}
      </div>

      <div class="border border-border rounded-2xl overflow-hidden bg-card">
        <div v-if="isLoadingPacientes" class="py-8 text-center text-sm text-muted">
          Cargando pacientes...
        </div>
        <div v-else-if="filteredPacientes.length === 0" class="py-8 text-center text-sm text-muted">
          No hay pacientes sin expediente.
        </div>
        <div v-else class="divide-y divide-border">
          <div
            v-for="paciente in pagedPacientes"
            :key="paciente.id_paciente"
            class="flex items-center justify-between px-4 py-3"
          >
            <div class="flex items-center gap-3 min-w-0">
              <UserAvatar :name="buildNombrePaciente(paciente)" role="patient" size="md" />
              <div class="min-w-0">
                <p class="text-sm font-semibold text-black truncate">
                  {{ buildNombrePaciente(paciente) }}
                </p>
                <p class="text-xs text-muted truncate">{{ paciente.usuario.correo }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-[10px] font-mono text-muted">#{{ paciente.id_paciente }}</span>
              <button
                type="button"
                class="px-3 py-1.5 rounded-xl text-xs font-semibold text-accent bg-accent-dim border border-accent/20 hover:bg-accent-light/30 transition-colors"
                @click="selectPaciente(paciente.id_paciente)"
              >
                Seleccionar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between text-xs text-muted">
        <span>Pagina {{ pacientesPage }} de {{ pacientesTotalPages }}</span>
        <div class="flex gap-2">
          <button
            type="button"
            class="px-3 py-1 rounded-lg border border-border text-muted hover:text-black hover:bg-ghost transition-colors disabled:opacity-50 disabled:pointer-events-none"
            :disabled="pacientesPage <= 1 || isLoadingPacientes"
            @click="goToPacientesPage(pacientesPage - 1)"
          >
            Anterior
          </button>
          <button
            type="button"
            class="px-3 py-1 rounded-lg border border-border text-muted hover:text-black hover:bg-ghost transition-colors disabled:opacity-50 disabled:pointer-events-none"
            :disabled="pacientesPage >= pacientesTotalPages || isLoadingPacientes"
            @click="goToPacientesPage(pacientesPage + 1)"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>

    <div class="px-6 py-4 border-t border-border flex justify-end">
      <button
        type="button"
        class="border-accent/10 bg-accent-dim text-accent px-4 py-2 rounded-xl border text-sm hover:bg-accent-light/30 transition-all"
        @click="showNewExpedienteModal = false"
      >
        Cerrar
      </button>
    </div>
  </UiModal>
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
