<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search, FileText, Download, Pencil, X, Plus, Filter } from 'lucide-vue-next'
import { ROUTE_NAMES } from '@/shared/routes'

const searchQuery = ref('')
const selectedStatus = ref('todos')

const records = ref([
  {
    id: 1,
    expediente: '2025GOMR001',
    avatar: 'https://i.pravatar.cc/150?img=11',
    nombre: 'Carlos Alberto Méndez Torres',
    sexo: 'Masculino',
    edad: 34,
    localidad: 'Guadalajara, Jalisco',
    ultimaAtencion: '10 / nov / 2025',
    servicio: 'Dolor en molar inferior derecho',
    diagnostico: 'Caries dental profunda en la pieza 46',
    tratamiento: 'Endodoncia',
    odontologo: 'Dr. González',
    fechaCreacion: '10 / feb / 2025',
    estado: 'En tratamiento',
  },
  {
    id: 2,
    expediente: '2025GOMR002',
    avatar: 'https://i.pravatar.cc/150?img=12',
    nombre: 'María Fernanda López Ruiz',
    sexo: 'Femenino',
    edad: 28,
    localidad: 'Zapopan, Jalisco',
    ultimaAtencion: '05 / nov / 2025',
    servicio: 'Limpieza dental',
    diagnostico: 'Gingivitis leve',
    tratamiento: 'Profilaxis',
    odontologo: 'Dra. Martínez',
    fechaCreacion: '15 / ene / 2025',
    estado: 'Finalizado',
  },
  {
    id: 3,
    expediente: '2025GOMR003',
    avatar: 'https://i.pravatar.cc/150?img=13',
    nombre: 'Jorge Antonio Ramírez García',
    sexo: 'Masculino',
    edad: 45,
    localidad: 'Tlaquepaque, Jalisco',
    ultimaAtencion: '12 / nov / 2025',
    servicio: 'Dolor en muela del juicio',
    diagnostico: 'Pericoronaritis',
    tratamiento: 'Extracción',
    odontologo: 'Dr. Hernández',
    fechaCreacion: '22 / feb / 2025',
    estado: 'Pendiente',
  },
  {
    id: 4,
    expediente: '2025GOMR004',
    avatar: 'https://i.pravatar.cc/150?img=14',
    nombre: 'Ana Lucía Torres Villalobos',
    sexo: 'Femenino',
    edad: 31,
    localidad: 'Guadalajara, Jalisco',
    ultimaAtencion: '08 / nov / 2025',
    servicio: 'Blanqueamiento dental',
    diagnostico: 'Dientes con pigmentación',
    tratamiento: 'Blanqueamiento ambulatorio',
    odontologo: 'Dra. López',
    fechaCreacion: '05 / mar / 2025',
    estado: 'En tratamiento',
  },
  {
    id: 5,
    expediente: '2025GOMR005',
    avatar: 'https://i.pravatar.cc/150?img=15',
    nombre: 'Roberto Carlos Sánchez Medina',
    sexo: 'Masculino',
    edad: 52,
    localidad: 'Zapopan, Jalisco',
    ultimaAtencion: '15 / nov / 2025',
    servicio: 'Prótesis dental',
    diagnostico: 'Edentulismo parcial',
    tratamiento: 'Colocación de puente fijo',
    odontologo: 'Dr. González',
    fechaCreacion: '12 / abr / 2025',
    estado: 'Finalizado',
  },
  {
    id: 6,
    expediente: '2025GOMR006',
    avatar: 'https://i.pravatar.cc/150?img=16',
    nombre: 'Patricia Isabel Flores Cuevas',
    sexo: 'Femenino',
    edad: 27,
    localidad: 'Tlaquepaque, Jalisco',
    ultimaAtencion: '02 / nov / 2025',
    servicio: 'Ortodoncia',
    diagnostico: 'Maloclusión clase II',
    tratamiento: 'Brackets metálicos',
    odontologo: 'Dra. Martínez',
    fechaCreacion: '20 / may / 2025',
    estado: 'En tratamiento',
  },
])

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

const getEstadoColor = (estado: string) => {
  const colors = {
    'En tratamiento': 'bg-accent-dim text-accent border-accent/20',
    Finalizado: 'bg-[#d1fae5] text-[#065f46] border-[#a7f3d0]',
    Pendiente: 'bg-[#fed7aa] text-[#92400e] border-[#fed7aa]',
  }
  return colors[estado as keyof typeof colors] || 'bg-surface text-muted border-border'
}

const clearSearch = () => {
  searchQuery.value = ''
}

const router = useRouter()
const route = useRoute()
const dentistId = computed(() => String(route.params.id ?? '0'))

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
    <!-- ── Header ───────────────────────────────────────── -->
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

    <!-- ── Búsqueda y filtros ───────────────────────────── -->
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
          @click="clearSearch"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-muted/40 hover:text-muted/70"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <Filter class="w-4 h-4 text-muted/40" />
        <span class="text-xs font-medium text-muted/60 mr-1">Filtrar por:</span>
        <div class="flex flex-wrap gap-2">
          <button
            @click="selectedStatus = 'todos'"
            :class="[
              'px-3 py-1.5 text-xs font-medium rounded-full transition-all',
              selectedStatus === 'todos'
                ? 'bg-accent text-white shadow-sm'
                : 'bg-card text-muted hover:bg-surface border border-border',
            ]"
          >
            Todos
          </button>
          <button
            @click="selectedStatus = 'En tratamiento'"
            :class="[
              'px-3 py-1.5 text-xs font-medium rounded-full transition-all',
              selectedStatus === 'En tratamiento'
                ? 'bg-accent text-white shadow-sm'
                : 'bg-card text-muted hover:bg-surface border border-border',
            ]"
          >
            En tratamiento
          </button>
          <button
            @click="selectedStatus = 'Finalizado'"
            :class="[
              'px-3 py-1.5 text-xs font-medium rounded-full transition-all',
              selectedStatus === 'Finalizado'
                ? 'bg-accent text-white shadow-sm'
                : 'bg-card text-muted hover:bg-surface border border-border',
            ]"
          >
            Finalizado
          </button>
          <button
            @click="selectedStatus = 'Pendiente'"
            :class="[
              'px-3 py-1.5 text-xs font-medium rounded-full transition-all',
              selectedStatus === 'Pendiente'
                ? 'bg-accent text-white shadow-sm'
                : 'bg-card text-muted hover:bg-surface border border-border',
            ]"
          >
            Pendiente
          </button>
        </div>
      </div>

      <div class="text-sm text-muted/60">
        {{ filtered.length }} expediente{{ filtered.length !== 1 ? 's' : '' }} encontrado
        <span v-if="searchQuery || selectedStatus !== 'todos'">(filtrado)</span>
      </div>
    </div>

    <!-- ── Grid de tarjetas ───────────────────────────────── -->
    <div class="bg-card border border-border rounded-2xl shadow-sm p-5">
      <div
        v-if="filtered.length === 0"
        class="py-20 text-center text-muted/50 flex flex-col items-center"
      >
        <Search class="w-12 h-12 mb-3 opacity-40" />
        <p class="text-sm font-medium">No se encontraron expedientes</p>
        <p class="text-xs mt-1">Intenta con otros criterios de búsqueda</p>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="record in filtered"
          :key="record.id"
          class="group bg-surface rounded-2xl border border-border overflow-hidden hover:shadow-md transition-all duration-300"
        >
          <!-- Cabecera -->
          <div class="relative p-4 pb-3 border-b border-border bg-card/30">
            <div class="flex items-center gap-3">
              <img
                :src="record.avatar"
                :alt="record.nombre"
                class="w-14 h-14 rounded-full object-cover ring-2 ring-white shadow-sm"
              />
              <div class="flex-1 min-w-0">
                <h3
                  class="font-display font-semibold text-muted text-base truncate"
                  :title="record.nombre"
                >
                  {{ record.nombre.split(' ').slice(0, 2).join(' ') }}
                </h3>
                <p class="text-xs text-muted/50 font-mono mt-0.5">No. {{ record.expediente }}</p>
              </div>
              <span
                :class="[
                  'px-2.5 py-1 text-[10px] font-bold rounded-full border',
                  getEstadoColor(record.estado),
                ]"
              >
                {{ record.estado }}
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
                  class="truncate inline-block max-w-[180px] align-bottom"
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
              <div class="flex items-center gap-1">
                <span class="font-medium">Odontólogo:</span>
                <span>{{ record.odontologo }}</span>
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
