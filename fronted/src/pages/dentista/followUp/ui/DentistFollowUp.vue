<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Plus, Search, X, Pencil, CheckCircle2, AlertCircle,
  Clock, Loader2, HeartPulse, ChevronDown,
  CalendarDays, Stethoscope,
} from 'lucide-vue-next'
 
// ── Types ─────────────────────────────────────────────────────────────────
interface Seguimiento {
  id_seguimiento: number
  id_cita: number
  id_procedimiento: number
  estado_seguimiento: 'En curso' | 'finalizado' | 'alerta'
  plan_cuidados: string
  indicaciones_medicas: string
  fecha_inicio: string
  fecha_fin: string | null
  pacienteNombre: string
  procedimientoNombre: string
}
 
// ── State ─────────────────────────────────────────────────────────────────
const seguimientos = ref<Seguimiento[]>([])
const searchQuery = ref('')
const isLoading = ref(true)
const isSaving = ref(false)
const successMsg = ref<string | null>(null)
const errorMsg = ref<string | null>(null)
const isModalOpen = ref(false)
const modalMode = ref<'crear' | 'editar'>('crear')
 
const form = ref({
  id_seguimiento: 0,
  id_cita: '',
  id_procedimiento: '',
  plan_cuidados: '',
  indicaciones_medicas: '',
})
 
const citasOpciones = ref([
  { value: '101', label: 'Cita #101 — Juan Pérez (Hoy)' },
  { value: '102', label: 'Cita #102 — Ana Gómez (Ayer)' },
])
 
const procedimientosOpciones = ref([
  { value: '1', label: 'Extracción de Tercer Molar' },
  { value: '2', label: 'Implante Dental' },
  { value: '3', label: 'Endodoncia' },
])
 
// ── Columns ───────────────────────────────────────────────────────────────
const columns = [
  {
    key: 'alerta',
    label: 'Alerta',
    icon: AlertCircle,
    accent: 'text-red-500',
    bar: 'bg-red-400',
    borderLeft: 'border-l-red-400',
    badge: 'bg-red-500/10 text-red-600 border-red-400/30',
    headerBg: 'bg-red-500/5 border-red-400/20',
  },
  {
    key: 'En curso',
    label: 'En Curso',
    icon: Clock,
    accent: 'text-accent',
    bar: 'bg-accent',
    borderLeft: 'border-l-accent',
    badge: 'bg-accent/10 text-accent border-accent/20',
    headerBg: 'bg-accent/5 border-accent/20',
  },
  {
    key: 'finalizado',
    label: 'Finalizado',
    icon: CheckCircle2,
    accent: 'text-emerald-500',
    bar: 'bg-emerald-400',
    borderLeft: 'border-l-emerald-400',
    badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-400/30',
    headerBg: 'bg-emerald-500/5 border-emerald-400/20',
  },
]
 
// ── Computed ──────────────────────────────────────────────────────────────
const filtered = computed(() => {
  if (!searchQuery.value.trim()) return seguimientos.value
  const q = searchQuery.value.toLowerCase()
  return seguimientos.value.filter(
    (s) =>
      s.pacienteNombre.toLowerCase().includes(q) ||
      s.procedimientoNombre.toLowerCase().includes(q),
  )
})
 
function columnItems(key: string) {
  return filtered.value.filter((s) => s.estado_seguimiento === key)
}
 
// ── Helpers ───────────────────────────────────────────────────────────────
function formatearFecha(fechaStr: string): string {
  if (!fechaStr) return '—'
  return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(fechaStr))
}
 
function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map((n) => n.charAt(0)).join('').toUpperCase()
}
 
function diasTranscurridos(fecha: string): number {
  return Math.floor((new Date().getTime() - new Date(fecha).getTime()) / (1000 * 60 * 60 * 24))
}
 
function clearSearch() { searchQuery.value = '' }
 
// ── Data ──────────────────────────────────────────────────────────────────
async function fetchSeguimientos() {
  isLoading.value = true
  await new Promise((r) => setTimeout(r, 600))
  seguimientos.value = [
    {
      id_seguimiento: 1, id_cita: 101, id_procedimiento: 1,
      estado_seguimiento: 'En curso',
      plan_cuidados: 'Evitar alimentos calientes, no usar popote, mantener la zona limpia.',
      indicaciones_medicas: 'Ketorolaco 10mg c/8h por 3 días',
      fecha_inicio: '2026-04-30', fecha_fin: null,
      pacienteNombre: 'Anuar De la Vega', procedimientoNombre: 'Extracción de Tercer Molar',
    },
    {
      id_seguimiento: 2, id_cita: 98, id_procedimiento: 2,
      estado_seguimiento: 'finalizado',
      plan_cuidados: 'Dieta blanda por 3 días, reposo relativo.',
      indicaciones_medicas: 'Ibuprofeno 400mg c/8h',
      fecha_inicio: '2026-04-20', fecha_fin: '2026-04-25',
      pacienteNombre: 'Diana Cano', procedimientoNombre: 'Implante Dental',
    },
    {
      id_seguimiento: 3, id_cita: 102, id_procedimiento: 1,
      estado_seguimiento: 'alerta',
      plan_cuidados: 'Reposo absoluto. Evitar esfuerzo físico.',
      indicaciones_medicas: 'Amoxicilina 500mg, Ketorolaco 10mg',
      fecha_inicio: '2026-05-01', fecha_fin: null,
      pacienteNombre: 'Emma Abimelek Rodriguez', procedimientoNombre: 'Extracción de Tercer Molar',
    },
    {
      id_seguimiento: 4, id_cita: 105, id_procedimiento: 3,
      estado_seguimiento: 'En curso',
      plan_cuidados: 'No consumir alimentos duros, enjuague con agua tibia y sal.',
      indicaciones_medicas: 'Metronidazol 500mg c/8h, Paracetamol 500mg c/6h',
      fecha_inicio: '2026-04-28', fecha_fin: null,
      pacienteNombre: 'Paola Godinez', procedimientoNombre: 'Endodoncia',
    },
    {
      id_seguimiento: 5, id_cita: 95, id_procedimiento: 2,
      estado_seguimiento: 'finalizado',
      plan_cuidados: 'Higiene oral cuidadosa, evitar tabaco.',
      indicaciones_medicas: 'Clorhexidina enjuague c/12h',
      fecha_inicio: '2026-04-10', fecha_fin: '2026-04-17',
      pacienteNombre: 'Christian Cavazos', procedimientoNombre: 'Implante Dental',
    },
  ]
  isLoading.value = false
}
 
// ── Modal ─────────────────────────────────────────────────────────────────
function abrirModal(modo: 'crear' | 'editar', item?: Seguimiento) {
  modalMode.value = modo
  errorMsg.value = null
  form.value = modo === 'editar' && item
    ? { id_seguimiento: item.id_seguimiento, id_cita: item.id_cita.toString(), id_procedimiento: item.id_procedimiento.toString(), plan_cuidados: item.plan_cuidados, indicaciones_medicas: item.indicaciones_medicas }
    : { id_seguimiento: 0, id_cita: '', id_procedimiento: '', plan_cuidados: '', indicaciones_medicas: '' }
  isModalOpen.value = true
}
 
function cerrarModal() { isModalOpen.value = false; errorMsg.value = null }
 
async function guardarSeguimiento() {
  if (!form.value.id_cita || !form.value.id_procedimiento) {
    errorMsg.value = 'Por favor completa todos los campos requeridos.'
    return
  }
  isSaving.value = true
  await new Promise((r) => setTimeout(r, 800))
  isSaving.value = false
  cerrarModal()
  successMsg.value = modalMode.value === 'crear' ? 'Seguimiento creado correctamente.' : 'Seguimiento actualizado correctamente.'
  setTimeout(() => (successMsg.value = null), 3500)
  fetchSeguimientos()
}
 
async function terminarSeguimiento(id: number) {
  if (!confirm('¿Marcar este seguimiento como Finalizado?')) return
  await new Promise((r) => setTimeout(r, 500))
  successMsg.value = 'Seguimiento finalizado correctamente.'
  setTimeout(() => (successMsg.value = null), 3500)
  fetchSeguimientos()
}
 
onMounted(fetchSeguimientos)
</script>
 
<template>
  <div class="fade-in max-w-7xl mx-auto pb-10">
 
    <!-- ── Header ─────────────────────────────────────────────────────── -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
      <div>
        <div class="flex items-center gap-1.5 text-xs text-muted font-medium mb-2">
          <span class="text-muted/60">🏠</span>
          <span class="text-muted/60">&gt;</span>
          <span class="bg-card border border-border px-2 py-0.5 rounded-lg">Seguimiento</span>
        </div>
        <h1 class="font-display text-4xl font-semibold text-black">Seguimiento Postoperatorio</h1>
        <p class="text-sm text-muted mt-1">Planes de cuidado e indicaciones médicas para pacientes en recuperación.</p>
      </div>
 
      <button
        class="flex items-center gap-2 bg-ink/65 text-text-secondary hover:bg-ink/80 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all hover:scale-105 active:scale-95 self-start md:self-auto"
        @click="abrirModal('crear')"
      >
        <Plus class="w-4 h-4" />
        Nuevo Seguimiento
      </button>
    </div>
 
    <!-- ── Toast ──────────────────────────────────────────────────────── -->
    <Transition name="toast">
      <div
        v-if="successMsg"
        class="mb-6 flex items-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 rounded-2xl text-sm font-medium"
      >
        <CheckCircle2 class="w-4 h-4 shrink-0" />
        {{ successMsg }}
      </div>
    </Transition>
 
    <!-- ── Search ─────────────────────────────────────────────────────── -->
    <div class="relative max-w-md mb-8">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/40" />
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Buscar paciente o procedimiento..."
        class="w-full pl-10 pr-9 py-2.5 bg-card border border-border rounded-2xl text-sm text-muted placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
      />
      <button v-if="searchQuery" class="absolute right-3 top-1/2 -translate-y-1/2 text-muted/40 hover:text-muted/70" @click="clearSearch">
        <X class="w-4 h-4" />
      </button>
    </div>
 
    <!-- ── Loading ────────────────────────────────────────────────────── -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center py-32 gap-3 text-muted/50">
      <Loader2 class="w-10 h-10 animate-spin text-accent/50" />
      <p class="text-sm font-medium">Cargando seguimientos...</p>
    </div>
 
    <!-- ── Kanban ─────────────────────────────────────────────────────── -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
 
      <div v-for="col in columns" :key="col.key" class="flex flex-col gap-3">
 
        <!-- Column header -->
        <div :class="['flex items-center justify-between px-4 py-3 rounded-2xl border', col.headerBg]">
          <div class="flex items-center gap-2">
            <component :is="col.icon" :class="['w-4 h-4', col.accent]" />
            <span class="text-sm font-bold text-black">{{ col.label }}</span>
          </div>
          <span class="text-xs font-bold bg-card border border-border text-muted px-2.5 py-0.5 rounded-full">
            {{ columnItems(col.key).length }}
          </span>
        </div>
 
        <!-- Empty state -->
        <div
          v-if="columnItems(col.key).length === 0"
          class="bg-card border border-dashed border-border rounded-2xl py-12 flex flex-col items-center gap-2 text-muted/30"
        >
          <HeartPulse class="w-8 h-8" />
          <p class="text-xs">Sin registros</p>
        </div>
 
        <!-- Cards -->
        <div
          v-for="item in columnItems(col.key)"
          :key="item.id_seguimiento"
          :class="['bg-card border border-border border-l-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 group', col.borderLeft]"
        >
          <!-- Card body -->
          <div class="p-4 space-y-3">
 
            <!-- Patient + badge -->
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-bold text-xs shrink-0">
                  {{ getInitials(item.pacienteNombre) }}
                </div>
                <div>
                  <p class="text-sm font-bold text-black leading-tight">{{ item.pacienteNombre }}</p>
                  <p class="text-[10px] text-muted font-mono">Cita #{{ item.id_cita }}</p>
                </div>
              </div>
              <span :class="['text-[10px] font-bold px-2 py-0.5 rounded-lg border shrink-0', col.badge]">
                {{ col.label }}
              </span>
            </div>
 
            <!-- Procedure -->
            <div class="flex items-center gap-1.5 px-3 py-2 bg-surface rounded-xl border border-border">
              <Stethoscope class="w-3.5 h-3.5 text-muted/50 shrink-0" />
              <p class="text-xs font-semibold text-black truncate">{{ item.procedimientoNombre }}</p>
            </div>
 
            <!-- Plan -->
            <div>
              <p class="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Plan de Cuidados</p>
              <p class="text-xs text-black leading-relaxed line-clamp-2">{{ item.plan_cuidados }}</p>
            </div>
 
            <!-- Indicaciones -->
            <div>
              <p class="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Indicaciones</p>
              <p class="text-xs text-muted line-clamp-1">{{ item.indicaciones_medicas }}</p>
            </div>
          </div>
 
          <!-- Card footer -->
          <div class="px-4 py-2.5 bg-surface/60 border-t border-border rounded-b-2xl flex items-center justify-between">
            <div class="flex items-center gap-1.5 text-[10px] text-muted">
              <CalendarDays class="w-3 h-3 shrink-0" />
              <span>{{ formatearFecha(item.fecha_inicio) }}</span>
              <template v-if="!item.fecha_fin">
                <span class="font-semibold text-black">· {{ diasTranscurridos(item.fecha_inicio) }} días</span>
              </template>
              <template v-else>
                <span>→ {{ formatearFecha(item.fecha_fin) }}</span>
              </template>
            </div>
 
            <div v-if="item.estado_seguimiento !== 'finalizado'" class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
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
            </div>
            <span v-else class="text-[10px] text-muted/50 italic">Completado</span>
          </div>
        </div>
 
      </div>
    </div>
 
    <!-- ── Modal ──────────────────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="cerrarModal">
          <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="cerrarModal" />
 
          <div class="relative bg-card border border-border rounded-3xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-5">
 
            <div class="flex items-start justify-between">
              <div>
                <h3 class="font-display font-bold text-black text-base">
                  {{ modalMode === 'crear' ? 'Nuevo Seguimiento' : 'Editar Seguimiento' }}
                </h3>
                <p class="text-xs text-muted mt-0.5">
                  {{ modalMode === 'crear' ? 'Registra un nuevo plan de cuidado.' : 'Modifica el plan existente.' }}
                </p>
              </div>
              <button class="p-1.5 rounded-xl hover:bg-surface transition-colors text-muted hover:text-black" @click="cerrarModal">
                <X class="w-4 h-4" />
              </button>
            </div>
 
            <div class="space-y-4">
              <div class="space-y-1.5">
                <label class="text-[10px] font-bold text-muted uppercase tracking-wider px-1">Cita Quirúrgica *</label>
                <div class="relative">
                  <select v-model="form.id_cita" :disabled="modalMode === 'editar'" class="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all appearance-none disabled:opacity-50">
                    <option value="">Selecciona la cita...</option>
                    <option v-for="opt in citasOpciones" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                  </select>
                  <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/40 pointer-events-none" />
                </div>
              </div>
 
              <div class="space-y-1.5">
                <label class="text-[10px] font-bold text-muted uppercase tracking-wider px-1">Procedimiento *</label>
                <div class="relative">
                  <select v-model="form.id_procedimiento" class="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all appearance-none">
                    <option value="">Selecciona el procedimiento...</option>
                    <option v-for="opt in procedimientosOpciones" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                  </select>
                  <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/40 pointer-events-none" />
                </div>
              </div>
 
              <div class="space-y-1.5">
                <label class="text-[10px] font-bold text-muted uppercase tracking-wider px-1">Plan de Cuidados</label>
                <textarea v-model="form.plan_cuidados" rows="3" placeholder="Ej. Dieta blanda, aplicar hielo, no usar popote..." class="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-black placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-none" />
              </div>
 
              <div class="space-y-1.5">
                <label class="text-[10px] font-bold text-muted uppercase tracking-wider px-1">Indicaciones Médicas</label>
                <textarea v-model="form.indicaciones_medicas" rows="3" placeholder="Ej. Paracetamol 500mg cada 8 hrs..." class="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-black placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-none" />
              </div>
            </div>
 
            <div v-if="errorMsg" class="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-400/30 text-red-600 rounded-xl text-xs font-medium">
              <AlertCircle class="w-3.5 h-3.5 shrink-0" />
              {{ errorMsg }}
            </div>
 
            <div class="flex flex-col gap-2">
              <button
                :disabled="isSaving"
                :class="['w-full py-3 rounded-2xl text-sm font-bold transition-all', !isSaving ? 'bg-accent text-white shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-95' : 'bg-surface text-muted cursor-not-allowed border border-border']"
                @click="guardarSeguimiento"
              >
                {{ isSaving ? 'Guardando...' : modalMode === 'crear' ? 'Crear Seguimiento' : 'Guardar Cambios' }}
              </button>
              <button class="w-full py-2 text-xs font-bold text-muted hover:text-black transition-colors" @click="cerrarModal">
                Cancelar
              </button>
            </div>
 
          </div>
        </div>
      </Transition>
    </Teleport>
 
  </div>
</template>
 
<style scoped>
.fade-in { animation: fadeIn 0.25s ease; }
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(-8px); }
.modal-enter-active, .modal-leave-active { transition: all 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.line-clamp-1 { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
</style>