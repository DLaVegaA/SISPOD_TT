<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Search,
  ClipboardList,
  CalendarDays,
  User,
  ChevronDown,
  X,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  SlidersHorizontal,
  Pencil,
  Trash2,
} from 'lucide-vue-next'
import { useSessionStore } from '@/entities/session'
import { useBitacoraStore } from '@/entities/bitacora'
import { normalizeRole } from '@/shared/routes'
import { BitacoraFormModal } from '@/widgets/bitacora-form-modal'

// ── Integración de Sesión ─────────────────────────────────────────────────
const sessionStore = useSessionStore()
const bitacoraStore = useBitacoraStore()

const role = computed(() => normalizeRole(sessionStore.role))
const isDentist = computed(() => role.value === 'dentist')
const isAssistant = computed(() => role.value === 'assistant')

// ── Filters ───────────────────────────────────────────────────────────────
const searchQuery = ref('')
const selectedStatus = ref<string>('todos')
const selectedAuthor = ref<string>('todos')
const expandedId = ref<string | null>(null)

const showCreateModal = ref(false)
const isEditMode = ref(false)
const currentEditData = ref({ id_cita: '', descripcion: '', citaDisplay: '' })
const editingId = ref<string | null>(null)

const statusOptions = ['todos', 'Pendiente', 'Revisado']

const authors = computed(() => {
  const unique = [...new Set(bitacoraStore.logs.map((l) => l.authorName))]
  return ['todos', ...unique]
})

const filtered = computed(() => {
  let result = bitacoraStore.logs.filter((l) => l.status !== 'Anulada')

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
  if (!iso) return 'Fecha no disponible'
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

function formatTime(iso: string): string {
  if (!iso) return '--:--'
  return new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso))
}

function statusConfig(status: string) {
  if (status === 'Revisado')
    return {
      bg: 'bg-emerald-500/10 border-emerald-400/30',
      text: 'text-emerald-600',
      icon: CheckCircle2,
    }
  if (status === 'Pendiente')
    return { bg: 'bg-amber-400/10 border-amber-400/30', text: 'text-amber-600', icon: Clock }
  if (status === 'Requiere atención')
    return { bg: 'bg-red-500/10 border-red-400/30', text: 'text-red-600', icon: AlertCircle }
  return { bg: 'bg-gray-500/10 border-gray-400/30', text: 'text-gray-600', icon: FileText }
}

function roleColor(role: string) {
  return role === 'Dentista' || role === '2'
    ? 'bg-accent/10 text-accent border-accent/20'
    : 'bg-indigo-500/10 text-indigo-600 border-indigo-400/20'
}

function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

function clearSearch() {
  searchQuery.value = ''
}

function abrirModalNuevo() {
  isEditMode.value = false
  editingId.value = null
  showCreateModal.value = true
}

// CU27 Eliminar Bitácoras (RN8)
async function anularBitacora(id: string) {
  if (!isDentist.value) return
  if (
    confirm(
      '¿Estás seguro de que deseas anular esta bitácora? Esta acción la ocultará de la vista principal.',
    )
  ) {
    try {
      await bitacoraStore.anularBitacora(id)
    } catch {
      alert('No se pudo anular la bitácora.')
    }
  }
}

async function handleSaveBitacora(payload: { id_cita: number; descripcion: string }) {
  try {
    if (isEditMode.value && editingId.value) {
      await bitacoraStore.updateBitacora(editingId.value, payload.descripcion)
      alert('Cambios guardados exitosamente')
    } else {
      await bitacoraStore.createBitacora(payload)
      alert('Bitácora creada exitosamente')
    }
    showCreateModal.value = false
  } catch {
    alert('Error al procesar la solicitud')
  }
}

async function marcarComoRevisada(id: string) {
  if (!confirm('¿Confirmas que has revisado este procedimiento?')) return
  try {
    await bitacoraStore.revisarBitacora(id)
  } catch {
    alert('No se pudo actualizar el estado')
  }
}

function iniciarEdicion(log: any) {
  isEditMode.value = true
  editingId.value = log.id
  const fecha = formatDate(log.date)
  const hora = formatTime(log.date)
  currentEditData.value = {
    id_cita: 'bloqueado',
    descripcion: log.description,
    citaDisplay: `Cita registrada el ${fecha} a las ${hora} (${log.patientName})`,
  }
  showCreateModal.value = true
}

// ── Stats ─────────────────────────────────────────────────────────────────
const stats = computed(() => ({
  total: bitacoraStore.logs.filter((l) => l.status !== 'Anulada').length,
  completados: bitacoraStore.logs.filter((l) =>
    ['Completado', 'Revisada', 'Revisado'].includes(l.status),
  ).length,
  pendientes: bitacoraStore.logs.filter((l) => l.status === 'Pendiente').length,
}))

onMounted(async () => {
  if (sessionStore.status === 'unknown') await sessionStore.bootstrap()
  await bitacoraStore.fetchBitacoras()
})
</script>

<template>
  <div class="fade-in mx-auto pb-10">
    <!-- ── Header ──────────────────────────────────────────────────────── -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
      <div>
        <div class="flex items-center gap-1.5 text-xs text-muted font-medium mb-2">
          <span class="text-muted/60">🏠</span>
          <span class="text-muted/60">&gt;</span>
          <span class="bg-card border border-border px-2 py-0.5 rounded-lg">Bitácoras</span>
        </div>
        <h1 class="font-display text-4xl font-semibold text-black">Bitácoras</h1>
        <p class="text-sm text-muted mt-1">
          Registro detallado de todas las atenciones y procedimientos.
        </p>
      </div>

      <button
        class="flex items-center gap-2 bg-ink/65 text-text-secondary hover:bg-ink/80 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all hover:scale-105 active:scale-95 self-start md:self-auto"
        @click="abrirModalNuevo"
      >
        <FileText class="w-4 h-4" />
        Nueva Bitácora
      </button>
    </div>

    <!-- ── Stats ───────────────────────────────────────────────────────── -->
    <section class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
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
    </section>

    <!-- ── Filtros — FIX MÓVIL ─────────────────────────────────────────── -->
    <!-- flex-col en móvil, flex-row en sm+. Cada select tiene w-full en móvil -->
    <div class="bg-card border border-border rounded-2xl p-4 mb-6 flex flex-col sm:flex-row gap-3">
      <!-- Buscador -->
      <div class="relative flex-1">
        <Search
          class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/40 pointer-events-none"
        />
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

      <!-- Select Estado — w-full en móvil, auto en sm+ -->
      <div class="relative w-full sm:w-auto">
        <SlidersHorizontal
          class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/40 pointer-events-none"
        />
        <select
          v-model="selectedStatus"
          class="w-full pl-9 pr-8 py-2.5 bg-surface border border-border rounded-xl text-sm text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all appearance-none cursor-pointer"
        >
          <option v-for="s in statusOptions" :key="s" :value="s">
            {{ s === 'todos' ? 'Todos los estados' : s }}
          </option>
        </select>
        <ChevronDown
          class="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/40 pointer-events-none"
        />
      </div>

      <!-- Select Autor — w-full en móvil, auto en sm+ -->
      <div class="relative w-full sm:w-auto">
        <User
          class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/40 pointer-events-none"
        />
        <select
          v-model="selectedAuthor"
          class="w-full pl-9 pr-8 py-2.5 bg-surface border border-border rounded-xl text-sm text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all appearance-none cursor-pointer"
        >
          <option v-for="a in authors" :key="a" :value="a">
            {{ a === 'todos' ? 'Todos los autores' : a }}
          </option>
        </select>
        <ChevronDown
          class="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/40 pointer-events-none"
        />
      </div>
    </div>

    <p class="text-xs text-muted mb-3">
      {{ filtered.length }} bitácora{{ filtered.length !== 1 ? 's' : '' }} encontrada{{
        filtered.length !== 1 ? 's' : ''
      }}
      <span v-if="searchQuery || selectedStatus !== 'todos' || selectedAuthor !== 'todos'"
        >(filtrado)</span
      >
    </p>

    <!-- ── Tabla ────────────────────────────────────────────────────────── -->
    <div class="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
      <!-- Header desktop -->
      <div
        class="hidden md:grid grid-cols-[2.5fr_1.5fr_1.5fr_110px_60px_80px] gap-4 px-6 py-3 bg-surface/50 border-b border-border"
      >
        <span class="text-[10px] font-bold text-muted uppercase tracking-widest">Paciente</span>
        <span class="text-[10px] font-bold text-muted uppercase tracking-widest"
          >Realizado por</span
        >
        <span
          class="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center gap-1"
        >
          <CalendarDays class="w-3 h-3" /> Fecha / Cita
        </span>
        <span class="text-[10px] font-bold text-muted uppercase tracking-widest">Estado</span>
        <span class="text-[10px] font-bold text-muted uppercase tracking-widest">ID</span>
        <span class="text-[10px] font-bold text-muted uppercase tracking-widest text-right"
          >Acciones</span
        >
      </div>

      <!-- Vacío -->
      <div
        v-if="filtered.length === 0"
        class="py-20 text-center text-muted/50 flex flex-col items-center gap-3"
      >
        <ClipboardList class="w-12 h-12 opacity-40" />
        <p class="text-sm font-medium">No se encontraron bitácoras</p>
        <p class="text-xs">Intenta con otros criterios de búsqueda</p>
      </div>

      <!-- Filas -->
      <div v-else>
        <div
          v-for="log in filtered"
          :key="log.id"
          class="border-b border-border last:border-0 transition-colors hover:bg-surface/30"
        >
          <div
            class="grid grid-cols-1 md:grid-cols-[2.5fr_1.5fr_1.5fr_110px_60px_80px] gap-3 md:gap-4 px-4 md:px-6 py-4 cursor-pointer items-center"
            @click="toggleExpand(log.id)"
          >
            <!-- Paciente -->
            <div class="flex items-center gap-3">
              <div
                class="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-bold text-sm shrink-0"
              >
                {{ log.patientName.charAt(0) }}
              </div>
              <div class="min-w-0">
                <p class="text-sm font-bold text-black truncate">{{ log.patientName }}</p>
                <p class="text-[10px] text-muted font-mono">{{ log.patientId }}</p>
              </div>
            </div>

            <!-- Autor -->
            <div class="flex items-center gap-2 md:gap-0 md:flex-col md:items-start">
              <p class="text-sm font-semibold text-black">{{ log.authorName }}</p>
              <span
                :class="[
                  'text-[10px] font-bold px-2 py-0.5 rounded-md border',
                  roleColor(log.authorRole),
                ]"
              >
                {{ log.authorRole }}
              </span>
            </div>

            <!-- Fecha -->
            <div class="flex flex-col gap-0.5">
              <div class="flex items-center gap-1.5 text-sm font-semibold text-black">
                <CalendarDays class="w-3.5 h-3.5 text-muted/60 shrink-0" />
                {{ formatDate(log.date) }}
              </div>
              <p class="text-xs text-muted ml-5">
                {{ formatTime(log.date) }} · {{ log.appointmentType }}
              </p>
            </div>

            <!-- Estado -->
            <div class="flex items-center">
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
            <div class="flex items-center">
              <p class="text-[10px] font-mono text-muted hidden md:block">{{ log.id }}</p>
            </div>

            <!-- Acciones -->
            <div class="flex items-center gap-1 justify-end" @click.stop>
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
                  :class="[
                    'w-4 h-4 transition-transform duration-200',
                    expandedId === log.id ? 'rotate-180' : '',
                  ]"
                />
              </button>
            </div>
          </div>

          <!-- Detalle expandido -->
          <Transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="opacity-0 -translate-y-1"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition-all duration-150 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 -translate-y-1"
          >
            <div v-if="expandedId === log.id" class="px-4 md:px-6 pb-5">
              <div
                class="bg-surface/60 border border-border rounded-xl p-4 ml-0 md:ml-12 flex flex-col gap-4"
              >
                <div class="flex items-start gap-2">
                  <FileText class="w-4 h-4 text-accent mt-0.5 shrink-0" />
                  <div>
                    <p class="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
                      Descripción
                    </p>
                    <p class="text-sm text-black leading-relaxed">{{ log.description }}</p>
                  </div>
                </div>

                <div
                  v-if="isDentist"
                  class="flex flex-wrap justify-end gap-3 pt-3 border-t border-border/50"
                >
                  <button
                    class="px-4 py-2 rounded-xl text-xs font-semibold text-red-600 bg-red-500/10 hover:bg-red-500/20 transition-colors flex items-center gap-2"
                    @click.stop="anularBitacora(log.id)"
                  >
                    <Trash2 class="w-4 h-4" /> Anular Bitácora
                  </button>

                  <button
                    v-if="log.status === 'Pendiente'"
                    class="px-4 py-2 rounded-xl text-xs font-semibold text-amber-600 bg-amber-500/10 hover:bg-amber-500/20 transition-colors flex items-center gap-2"
                    @click.stop="iniciarEdicion(log)"
                  >
                    <Pencil class="w-4 h-4" /> Editar Descripción
                  </button>

                  <button
                    v-if="log.status === 'Pendiente'"
                    class="px-4 py-2 rounded-xl text-xs font-semibold text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors flex items-center gap-2"
                    @click.stop="marcarComoRevisada(log.id)"
                  >
                    <CheckCircle2 class="w-4 h-4" /> Marcar como Revisada
                  </button>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <!-- ── Modal ────────────────────────────────────────────────────────── -->
    <BitacoraFormModal
      v-model="showCreateModal"
      :is-edit-mode="isEditMode"
      :initial-data="currentEditData"
      @submit="handleSaveBitacora"
    />
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
