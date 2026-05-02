<template>
  <div class="fade-in max-w-7xl mx-auto pb-10 px-4 sm:px-6 lg:px-8">
    
    <!-- ── Header ─────────────────────────────────────────────────────── -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pt-6">
      <div>
        <div class="flex items-center gap-1.5 text-xs text-muted font-medium mb-2">
          <span class="text-muted/60">🏠</span>
          <span class="text-muted/60">&gt;</span>
          <span class="bg-card border border-border px-2 py-0.5 rounded-lg">Cuestionarios</span>
        </div>
        <h1 class="font-display text-4xl font-semibold text-black">Cuestionarios</h1>
      </div>
    </div>

    <!-- ── Toolbar ────────────────────────────────────────────────────── -->
    <div class="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
      
      <!-- Buscador -->
      <div class="relative w-full md:max-w-md">
        <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/40" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Nombre del Cuestionario"
          class="w-full pl-11 pr-10 py-2.5 bg-card border border-border rounded-full text-sm text-black placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
        />
        <button v-if="searchQuery" class="absolute right-3 top-1/2 -translate-y-1/2 text-muted/40 hover:text-muted/70" @click="clearSearch">
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Filtros y Acción -->
      <div class="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
        <!-- Paginación Día -->
        <div class="flex items-center bg-card border border-border rounded-lg p-1 shrink-0 shadow-sm">
          <button class="p-1 hover:bg-surface rounded text-muted hover:text-black transition-colors">
             <ChevronLeft class="w-4 h-4" />
          </button>
          <span class="px-3 text-sm font-medium text-black">Hoy</span>
          <button class="p-1 hover:bg-surface rounded text-muted hover:text-black transition-colors">
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>

        <!-- Filtro Mes -->
        <div class="relative shrink-0 shadow-sm">
          <select class="appearance-none bg-card border border-border rounded-lg pl-4 pr-10 py-2 text-sm font-medium text-black focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all cursor-pointer">
            <option value="">Seleccionar Mes</option>
            <option value="1">Enero</option>
            <option value="2">Febrero</option>
            <option value="3">Marzo</option>
            <option value="4">Abril</option>
            <option value="5">Mayo</option>
          </select>
          <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
        </div>

        <!-- Botón Crear Nuevo -->
        <RouterLink :to="{ 
            name: ROUTE_NAMES.DENTIST_NEW_QUESTIONNAIRES, 
            params: { id: route.params.id } 
            }"
            class="flex items-center gap-2 bg-[#7BA4C7] hover:bg-[#6A93B6] text-white px-5 py-2 rounded-lg text-sm font-medium transition-all shadow-sm shrink-0">
            <Plus class="w-4 h-4" />
            Crear Nuevo
        </RouterLink>
      </div>
    </div>

    <!-- ── Lista de Cuestionarios ─────────────────────────────────────── -->
    <div class="space-y-3">
      
      <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 gap-3 text-muted/50 bg-card rounded-2xl border border-border">
        <Loader2 class="w-8 h-8 animate-spin text-accent/50" />
        <p class="text-sm">Cargando cuestionarios...</p>
      </div>

      <div v-else-if="filteredCuestionarios.length === 0" class="bg-card border border-dashed border-border rounded-2xl py-20 flex flex-col items-center gap-2 text-muted/40">
        <FileText class="w-10 h-10" />
        <p class="text-sm">No se encontraron cuestionarios.</p>
      </div>

      <template v-else>
        <div 
          v-for="item in filteredCuestionarios" 
          :key="item.id"
          class="bg-white border border-border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-shadow group"
        >
          <!-- Info Principal -->
          <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-center w-full">
            
            <div class="col-span-3">
              <p class="text-sm font-bold text-black truncate">{{ item.nombre }}</p>
            </div>
            
            <div class="col-span-2 text-xs text-muted font-medium">
              <span class="font-bold text-black/70">Fecha:</span> {{ formatearFecha(item.fecha) }}
            </div>

            <div class="col-span-3 flex items-center gap-2 overflow-hidden">
               <span class="text-xs font-bold text-black/70 shrink-0">Asignado</span>
               <div class="flex gap-1 overflow-x-auto hide-scrollbar">
                  <span 
                    v-for="(paciente, index) in item.asignados.slice(0, 2)" 
                    :key="index"
                    class="bg-[#EBF3F9] text-[#5580A6] border border-[#C5DFE8] text-[10px] px-2 py-0.5 rounded whitespace-nowrap"
                  >
                    {{ paciente }}
                  </span>
                  <span v-if="item.asignados.length > 2" class="bg-surface text-muted text-[10px] px-2 py-0.5 rounded border border-border">
                    +{{ item.asignados.length - 2 }}
                  </span>
               </div>
            </div>

            <div class="col-span-2 text-xs truncate">
               <span class="font-bold text-black/70">Estatus:</span> 
               <span class="text-muted ml-1">{{ item.estatus }}</span>
            </div>

            <div class="col-span-2 flex flex-col gap-0.5">
               <div class="text-xs truncate"><span class="font-bold text-black/70">Tipo:</span> <span class="text-muted">{{ item.tipo }}</span></div>
               <div class="text-xs truncate"><span class="font-bold text-black/70">Doctor:</span> <span class="text-muted">{{ item.doctor }}</span></div>
            </div>

          </div>

          <!-- Acciones -->
          <div class="flex items-center gap-2 shrink-0 md:opacity-50 md:group-hover:opacity-100 transition-opacity justify-end">
            <button 
              class="w-8 h-8 rounded-lg bg-[#EBF3F9] text-[#7BA4C7] hover:bg-[#D5E6F5] hover:text-[#5A87B2] flex items-center justify-center transition-colors border border-[#C5DFE8]"
              title="Editar"
            >
              <Pencil class="w-4 h-4" />
            </button>
            <button 
              class="w-8 h-8 rounded-lg bg-[#EBF3F9] text-[#7BA4C7] hover:bg-red-50 hover:text-red-500 hover:border-red-200 flex items-center justify-center transition-colors border border-[#C5DFE8]"
              title="Eliminar"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </template>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router';
import { ROUTE_NAMES } from '@/shared/routes';
import {
  Search, X, Plus, ChevronLeft, ChevronRight, ChevronDown,
  Pencil, Trash2, Loader2, FileText
} from 'lucide-vue-next'

// ── Types ─────────────────────────────────────────────────────────────────
interface Cuestionario {
  id: string
  nombre: string
  fecha: string
  asignados: string[]
  estatus: string
  tipo: string
  doctor: string
}

const route = useRoute();

// ── State ─────────────────────────────────────────────────────────────────
const searchQuery = ref('')
const isLoading = ref(true)
const cuestionarios = ref<Cuestionario[]>([])

// ── Computed ──────────────────────────────────────────────────────────────
const filteredCuestionarios = computed(() => {
  if (!searchQuery.value.trim()) return cuestionarios.value
  const q = searchQuery.value.toLowerCase()
  return cuestionarios.value.filter(c => c.nombre.toLowerCase().includes(q))
})

// ── Helpers ───────────────────────────────────────────────────────────────
function formatearFecha(fechaStr: string): string {
  if (!fechaStr) return '—'
  const date = new Date(fechaStr)
  const dia = date.getDate().toString().padStart(2, '0')
  const mes = (date.getMonth() + 1).toString().padStart(2, '0')
  const anio = date.getFullYear()
  return `${dia} / ${mes} / ${anio}`
}

function clearSearch() {
  searchQuery.value = ''
}

// ── Data Fetching ─────────────────────────────────────────────────────────
async function fetchCuestionarios() {
  isLoading.value = true
  // Simulación de carga
  await new Promise(r => setTimeout(r, 600))
  
  cuestionarios.value = [
    {
      id: '1',
      nombre: 'Extracción de Tercer Molar (24h)',
      fecha: '2026-05-01',
      asignados: ['Ana Gómez', 'Carlos Ruiz', 'Luis Nava'],
      estatus: 'Respondido / Pendiente',
      tipo: 'Postoperatorio 24h',
      doctor: 'Dr. Hernández'
    },
    {
      id: '2',
      nombre: 'Implante Dental Básico',
      fecha: '2026-04-28',
      asignados: ['María López'],
      estatus: 'Respondido',
      tipo: 'Postoperatorio 72h',
      doctor: 'Dra. Silva'
    },
    {
      id: '3',
      nombre: 'Endodoncia - Control de Dolor',
      fecha: '2026-04-25',
      asignados: ['Roberto Sánchez', 'Elena Pineda'],
      estatus: 'Pendiente',
      tipo: 'Postoperatorio 24h',
      doctor: 'Dr. Hernández'
    },
    {
      id: '4',
      nombre: 'Cuestionario General de Rutina',
      fecha: '2026-04-20',
      asignados: ['Patricia Flores', 'Juan Pérez', 'Diego Soto', 'Carmen Vega'],
      estatus: 'Mixto',
      tipo: 'Seguimiento',
      doctor: 'Dra. Silva'
    },
    {
      id: '5',
      nombre: 'Cirugía Maxilofacial Compleja',
      fecha: '2026-04-15',
      asignados: [],
      estatus: 'Sin asignar',
      tipo: 'Postoperatorio 72h',
      doctor: 'Dr. Hernández'
    }
  ]
  isLoading.value = false
}

onMounted(() => {
  fetchCuestionarios()
})
</script>

<style scoped>
.fade-in { animation: fadeIn 0.25s ease; }
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Ocultar scrollbar en contenedor de badges */
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>