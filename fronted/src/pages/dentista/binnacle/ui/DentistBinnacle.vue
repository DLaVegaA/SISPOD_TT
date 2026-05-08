<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Search,
  ClipboardList,
  CalendarDays,
  User,
  Filter,
  ChevronDown,
  X,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Download,
  SlidersHorizontal,
  Pencil,   // Nuevo icono para editar
  Trash2    // Nuevo icono para eliminar/anular
} from 'lucide-vue-next'

// ── Simulación de Sesión ──────────────────────────────────────────────────
// Para implementar la RN8, necesitamos saber el rol del usuario actual.
// En tu app real, esto vendrá de tu store (Pinia) o JWT tras el CU1 Iniciar Sesión.
const currentUserRole = ref<'Dentista' | 'Asistente'>('Dentista') 

// ── Types ────────────────────────────────────────────────────────────────
interface LogEntry {
  id: string
  patientName: string
  patientId: string
  authorName: string
  authorRole: 'Dentista' | 'Asistente'
  date: string         // ISO 8601
  appointmentType: string
  description: string
  // Se agrega el estado 'Anulada' según la RN8
  status: 'Completado' | 'Pendiente' | 'Requiere atención' | 'Anulada'
  tags: string[]
}

// ── Mock data ─────────────────────────────────────────────────────────────
const logs = ref<LogEntry[]>([
  {
    id: 'BIT-001',
    patientName: 'Ana Torres',
    patientId: 'P001',
    authorName: 'Dr. González',
    authorRole: 'Dentista',
    date: '2025-11-25T10:30:00',
    appointmentType: 'Endodoncia',
    description: 'Se realizó endodoncia en pieza 36. Paciente toleró bien el procedimiento, sin complicaciones. Se aplicó anestesia local sin reacción adversa. Se sellará en próxima cita.',
    status: 'Completado',
    tags: ['Endodoncia', 'Pieza 36'],
  },
  {
    id: 'BIT-002',
    patientName: 'Carlos Méndez',
    patientId: 'P002',
    authorName: 'Dra. Martínez',
    authorRole: 'Dentista',
    date: '2025-11-24T09:00:00',
    appointmentType: 'Consulta General',
    description: 'Revisión general. Se detectaron 2 caries iniciales en piezas 14 y 17. Se recomienda profilaxis y obturación. Siguiente cita programada en 2 semanas.',
    status: 'Pendiente',
    tags: ['Revisión', 'Caries', 'Profilaxis'],
  },
  {
    id: 'BIT-003',
    patientName: 'María Fernández',
    patientId: 'P003',
    authorName: 'Asist. López',
    authorRole: 'Asistente',
    date: '2025-11-23T14:15:00',
    appointmentType: 'Seguimiento Postoperatorio',
    description: 'Seguimiento 3 días post-extracción. Paciente reporta dolor moderado nivel 5/10. Inflamación leve persistente. Se ajustó dosis de analgésico. Se recomienda valoración con dentista.',
    status: 'Requiere atención',
    tags: ['Postoperatorio', 'Extracción', 'Seguimiento'],
  },
  {
    id: 'BIT-004',
    patientName: 'Jorge Ramírez',
    patientId: 'P004',
    authorName: 'Dr. González',
    authorRole: 'Dentista',
    date: '2025-11-22T11:00:00',
    appointmentType: 'Ortodoncia',
    description: 'Ajuste mensual de brackets. Se tensaron arcos superiores e inferiores. Buen avance en corrección clase II. Paciente asintomático post-ajuste. Próximo ajuste en 4 semanas.',
    status: 'Completado',
    tags: ['Ortodoncia', 'Ajuste', 'Clase II'],
  },
  // Agregamos un registro 'Anulada' para probar el filtrado de la RN8
  {
    id: 'BIT-007',
    patientName: 'Luis Hernán',
    patientId: 'P007',
    authorName: 'Dr. González',
    authorRole: 'Dentista',
    date: '2025-11-19T10:00:00',
    appointmentType: 'Extracción',
    description: 'Bitácora registrada por error.',
    status: 'Anulada',
    tags: ['Error'],
  }
])

// ── Filters ───────────────────────────────────────────────────────────────
const searchQuery = ref('')
const selectedStatus = ref<string>('todos')
const selectedAuthor = ref<string>('todos')
const expandedId = ref<string | null>(null)

// Eliminamos 'Anulada' de las opciones de filtro para que no sea seleccionable
const statusOptions = ['todos', 'Completado', 'Pendiente', 'Requiere atención']

const authors = computed(() => {
  const unique = [...new Set(logs.value.map((l) => l.authorName))]
  return ['todos', ...unique]
})

const filtered = computed(() => {
  // RN8: Las bitácoras que se encuentren en estado "Anuladas" no serán visibles
  let result = logs.value.filter(l => l.status !== 'Anulada')

  const q = searchQuery.value.toLowerCase().trim()
  if (q) {
    result = result.filter(
      (l) =>
        l.patientName.toLowerCase().includes(q) ||
        l.authorName.toLowerCase().includes(q) ||
        l.appointmentType.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q),
    )
  }

  if (selectedStatus.value !== 'todos') {
    result = result.filter((l) => l.status === selectedStatus.value)
  }

  if (selectedAuthor.value !== 'todos') {
    result = result.filter((l) => l.authorName === selectedAuthor.value)
  }

  return result
})

// ── Helpers & Actions ─────────────────────────────────────────────────────
function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso))
}

function statusConfig(status: string) {
  if (status === 'Completado')
    return { bg: 'bg-emerald-500/10 border-emerald-400/30', text: 'text-emerald-600', icon: CheckCircle2 }
  if (status === 'Pendiente')
    return { bg: 'bg-amber-400/10 border-amber-400/30', text: 'text-amber-600', icon: Clock }
  if (status === 'Requiere atención')
    return { bg: 'bg-red-500/10 border-red-400/30', text: 'text-red-600', icon: AlertCircle }
  // Por si llegara a renderizarse en algún otro contexto
  return { bg: 'bg-gray-500/10 border-gray-400/30', text: 'text-gray-600', icon: FileText }
}

function roleColor(role: string) {
  return role === 'Dentista'
    ? 'bg-accent/10 text-accent border-accent/20'
    : 'bg-indigo-500/10 text-indigo-600 border-indigo-400/20'
}

function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

function clearSearch() {
  searchQuery.value = ''
}

// CU26 Editar Bitácoras
function editarBitacora(id: string) {
  // Aquí iría tu lógica para abrir un modal o navegar a la vista de edición
  console.log(`Editando bitácora: ${id}`)
}

// CU27 Eliminar Bitácoras (RN8: Cambio a estado "Anulada")
function anularBitacora(id: string) {
  if (confirm('¿Estás seguro de que deseas anular esta bitácora? Esta acción la ocultará de la vista principal.')) {
    const bitacoraIndex = logs.value.findIndex(l => l.id === id)
    if (bitacoraIndex !== -1) {
      if (logs.value[bitacoraIndex]) {
        logs.value[bitacoraIndex].status = 'Anulada'
      }
      // Al cambiar el status a 'Anulada', desaparecerá automáticamente gracias a la prop computada `filtered`
    }
  }
}

// ── Stats ─────────────────────────────────────────────────────────────────
const stats = computed(() => ({
  total: logs.value.filter(l => l.status !== 'Anulada').length,
  completados: logs.value.filter((l) => l.status === 'Completado').length,
  pendientes: logs.value.filter((l) => l.status === 'Pendiente').length,
  atencion: logs.value.filter((l) => l.status === 'Requiere atención').length,
}))
</script>

<template>
  <div class="fade-in max-w-7xl mx-auto pb-10">

    <!-- ── Header ─────────────────────────────────────────────────────── -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
      <div>
        <div class="flex items-center gap-1.5 text-xs text-muted font-medium mb-2">
          <span class="text-muted/60">🏠</span>
          <span class="text-muted/60">&gt;</span>
          <span class="bg-card border border-border px-2 py-0.5 rounded-lg">Bitácoras</span>
        </div>
        <h1 class="font-display text-4xl font-semibold text-black">Bitácoras</h1>
        <p class="text-sm text-muted mt-1">Registro detallado de todas las atenciones y procedimientos.</p>
      </div>

      <!-- CU17 Crear Bitácora: Disponible para Dentista y Asistente -->
      <button
        class="flex items-center gap-2 bg-ink/65 text-text-secondary hover:bg-ink/80 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all hover:scale-105 active:scale-95 self-start md:self-auto"
      >
        <FileText class="w-4 h-4" />
        Nueva Bitácora
      </button>
    </div>

    <!-- ── Stat cards ─────────────────────────────────────────────────── -->
    <!-- (Se mantiene igual, solo que ahora stats computa correctamente excluyendo las anuladas) -->
    <section class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div class="bg-card border border-border rounded-2xl p-4 flex flex-col gap-1">
        <p class="text-[10px] font-bold text-muted uppercase tracking-wider">Total Activas</p>
        <p class="text-3xl font-display font-semibold text-black">{{ stats.total }}</p>
        <p class="text-xs text-muted">registros</p>
      </div>
      <div class="bg-card border border-border rounded-2xl p-4 flex flex-col gap-1">
        <p class="text-[10px] font-bold text-muted uppercase tracking-wider">Completados</p>
        <p class="text-3xl font-display font-semibold text-emerald-500">{{ stats.completados }}</p>
        <p class="text-xs text-muted">sin pendientes</p>
      </div>
      <div class="bg-card border border-border rounded-2xl p-4 flex flex-col gap-1">
        <p class="text-[10px] font-bold text-muted uppercase tracking-wider">Pendientes</p>
        <p class="text-3xl font-display font-semibold text-amber-500">{{ stats.pendientes }}</p>
        <p class="text-xs text-muted">por resolver</p>
      </div>
      <div class="bg-card border border-border rounded-2xl p-4 flex flex-col gap-1">
        <p class="text-[10px] font-bold text-muted uppercase tracking-wider">Requieren Atención</p>
        <p class="text-3xl font-display font-semibold text-red-500">{{ stats.atencion }}</p>
        <p class="text-xs text-muted">alertas activas</p>
      </div>
    </section>

    <!-- ── Filters ────────────────────────────────────────────────────── -->
    <!-- (Se mantiene igual) -->
    <div class="bg-card border border-border rounded-2xl p-4 mb-6 flex flex-col sm:flex-row gap-3">
      <!-- Search -->
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/40" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar por paciente, autor, cita o descripción..."
          class="w-full pl-10 pr-9 py-2.5 bg-surface border border-border rounded-xl text-sm text-muted placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
        />
        <button
          v-if="searchQuery"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-muted/40 hover:text-muted/70"
          @click="clearSearch"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Status filter -->
      <div class="relative">
        <SlidersHorizontal class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/40 pointer-events-none" />
        <select
          v-model="selectedStatus"
          class="pl-9 pr-8 py-2.5 bg-surface border border-border rounded-xl text-sm text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all appearance-none cursor-pointer"
        >
          <option v-for="s in statusOptions" :key="s" :value="s">
            {{ s === 'todos' ? 'Todos los estados' : s }}
          </option>
        </select>
        <ChevronDown class="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/40 pointer-events-none" />
      </div>

      <!-- Author filter -->
      <div class="relative">
        <User class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/40 pointer-events-none" />
        <select
          v-model="selectedAuthor"
          class="pl-9 pr-8 py-2.5 bg-surface border border-border rounded-xl text-sm text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all appearance-none cursor-pointer"
        >
          <option v-for="a in authors" :key="a" :value="a">
            {{ a === 'todos' ? 'Todos los autores' : a }}
          </option>
        </select>
        <ChevronDown class="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/40 pointer-events-none" />
      </div>
    </div>

    <!-- ── Result count ───────────────────────────────────────────────── -->
    <p class="text-xs text-muted mb-3">
      {{ filtered.length }} bitácora{{ filtered.length !== 1 ? 's' : '' }} encontrada{{ filtered.length !== 1 ? 's' : '' }}
      <span v-if="searchQuery || selectedStatus !== 'todos' || selectedAuthor !== 'todos'">(filtrado)</span>
    </p>

    <!-- ── Table ─────────────────────────────────────────────────────── -->
    <div class="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">

      <!-- Table header -->
      <div class="hidden md:grid grid-cols-[2fr_1.5fr_1.5fr_1fr_1fr_auto] gap-4 px-6 py-3 bg-surface/50 border-b border-border">
        <span class="text-[10px] font-bold text-muted uppercase tracking-widest">Paciente</span>
        <span class="text-[10px] font-bold text-muted uppercase tracking-widest">Realizado por</span>
        <span class="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center gap-1">
          <CalendarDays class="w-3 h-3" /> Fecha / Cita
        </span>
        <span class="text-[10px] font-bold text-muted uppercase tracking-widest">Estado</span>
        <span class="text-[10px] font-bold text-muted uppercase tracking-widest">ID</span>
        <span class="text-[10px] font-bold text-muted uppercase tracking-widest text-right">Acciones</span>
      </div>

      <!-- Empty state -->
      <div v-if="filtered.length === 0" class="py-20 text-center text-muted/50 flex flex-col items-center gap-3">
        <ClipboardList class="w-12 h-12 opacity-40" />
        <p class="text-sm font-medium">No se encontraron bitácoras</p>
        <p class="text-xs">Intenta con otros criterios de búsqueda</p>
      </div>

      <!-- Rows -->
      <div v-else>
        <div
          v-for="log in filtered"
          :key="log.id"
          class="border-b border-border last:border-0 transition-colors hover:bg-surface/30"
        >
          <!-- Main row -->
          <div
            class="grid grid-cols-1 md:grid-cols-[2fr_1.5fr_1.5fr_1fr_1fr_auto] gap-3 md:gap-4 px-4 md:px-6 py-4 cursor-pointer items-center"
            @click="toggleExpand(log.id)"
          >
            <!-- Patient -->
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-bold text-sm shrink-0">
                {{ log.patientName.charAt(0) }}
              </div>
              <div class="min-w-0">
                <p class="text-sm font-bold text-black truncate">{{ log.patientName }}</p>
                <p class="text-[10px] text-muted font-mono">{{ log.patientId }}</p>
              </div>
            </div>

            <!-- Author -->
            <div class="flex items-center gap-2 md:gap-0 md:flex-col md:items-start">
              <p class="text-sm font-semibold text-black">{{ log.authorName }}</p>
              <span :class="['text-[10px] font-bold px-2 py-0.5 rounded-md border', roleColor(log.authorRole)]">
                {{ log.authorRole }}
              </span>
            </div>

            <!-- Date + Appointment -->
            <div class="flex flex-col gap-0.5">
              <div class="flex items-center gap-1.5 text-sm font-semibold text-black">
                <CalendarDays class="w-3.5 h-3.5 text-muted/60 shrink-0" />
                {{ formatDate(log.date) }}
              </div>
              <p class="text-xs text-muted ml-5">{{ formatTime(log.date) }} · {{ log.appointmentType }}</p>
            </div>

            <!-- Status -->
            <div>
              <span
                :class="[
                  'inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg border',
                  statusConfig(log.status).bg,
                  statusConfig(log.status).text,
                ]"
              >
                <component :is="statusConfig(log.status).icon" class="w-3 h-3" />
                {{ log.status }}
              </span>
            </div>

            <!-- ID -->
            <p class="text-[10px] font-mono text-muted hidden md:block">{{ log.id }}</p>

            <!-- Actions -->
            <div class="flex items-center gap-1 justify-end" @click.stop>
              <!-- RN8: Restringir edición y eliminación. Solo Dentista puede ver estos botones -->
              <template v-if="currentUserRole === 'Dentista'">
                <button
                  class="p-2 rounded-lg text-muted hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                  title="Editar"
                  @click="editarBitacora(log.id)"
                >
                  <Pencil class="w-4 h-4" />
                </button>
                <button
                  class="p-2 rounded-lg text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  title="Anular (Eliminar)"
                  @click="anularBitacora(log.id)"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </template>
              
              <button
                class="p-2 rounded-lg text-muted hover:text-accent hover:bg-accent/5 transition-colors"
                title="Descargar"
              >
                <Download class="w-4 h-4" />
              </button>
              <button
                class="p-2 rounded-lg text-muted hover:text-black transition-colors"
                :title="expandedId === log.id ? 'Colapsar' : 'Expandir'"
                @click="toggleExpand(log.id)"
              >
                <ChevronDown
                  :class="['w-4 h-4 transition-transform duration-200', expandedId === log.id ? 'rotate-180' : '']"
                />
              </button>
            </div>
          </div>

          <!-- Expanded description -->
          <Transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="opacity-0 -translate-y-1"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition-all duration-150 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 -translate-y-1"
          >
            <div v-if="expandedId === log.id" class="px-4 md:px-6 pb-5">
              <div class="bg-surface/60 border border-border rounded-xl p-4 ml-0 md:ml-12 space-y-3">

                <div class="flex items-start gap-2">
                  <FileText class="w-4 h-4 text-accent mt-0.5 shrink-0" />
                  <div>
                    <p class="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Descripción</p>
                    <p class="text-sm text-black leading-relaxed">{{ log.description }}</p>
                  </div>
                </div>

                <div class="flex flex-wrap gap-2 pt-1">
                  <span
                    v-for="tag in log.tags"
                    :key="tag"
                    class="text-[10px] font-bold px-2.5 py-1 bg-card border border-border rounded-full text-muted"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>
            </div>
          </Transition>
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
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>