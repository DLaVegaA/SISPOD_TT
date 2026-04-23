<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  ChevronLeft, ChevronRight, Plus, 
  Calendar as CalendarIcon, Clock, Stethoscope,
  Info, AlertCircle, CheckCircle2
} from 'lucide-vue-next'

// ── State del Calendario ──────────────────────────────────────────────────
const today = new Date()
const currentYear  = ref(today.getFullYear())
const currentMonth = ref(today.getMonth())

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DAY_NAMES = ['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB']

// ── Datos de Citas (CU7) ──────────────────────────────────────────────────
// En el futuro esto vendrá de: await citaService.getCitasByPaciente()
const appointments = ref<Record<string, any>>({
  '2026-4-28': [{ id: 1, title: 'Revisión General', time: '10:00 AM', status: 'Confirmada' }],
})

// ── Lógica de Selección (CU4 / CU8) ───────────────────────────────────────
const selectedDate = ref<string | null>(null)
const showForm = ref(false)

// ── Grid del Calendario ───────────────────────────────────────────────────
const calendarDays = computed(() => {
  const y = currentYear.value, m = currentMonth.value
  const firstDay = new Date(y, m, 1).getDay()
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const prevDays = new Date(y, m, 0).getDate()
  
  const cells = []
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: prevDays - i, current: false, key: '' })
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ 
      day: d, 
      current: true, 
      key: `${y}-${m + 1}-${d}`,
      isToday: d === today.getDate() && m === today.getMonth() && y === today.getFullYear()
    })
  }
  const remaining = 42 - cells.length
  for (let d = 1; d <= remaining; d++) cells.push({ day: d, current: false, key: '' })
  return cells
})

// ── Handlers ──────────────────────────────────────────────────────────────
function selectDay(cell: any) {
  if (!cell.current) return
  selectedDate.value = cell.key
  showForm.value = true // Abrimos el flujo de agendado (CU4)
}

function handleConfirmarCita() {
  // Aquí llamarás a tu citaController en el backend
  console.log('Guardando cita para:', selectedDate.value)
  showForm.value = false
}
</script>

<template>
  <div class="fade-in max-w-7xl mx-auto">
    
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h1 class="font-display text-2xl font-extrabold text-black">Gestión de Citas</h1>
        <p class="text-sm text-muted">Agenda, consulta o modifica tus visitas al dentista.</p>
      </div>
      
      <div class="flex items-center gap-3">
        <div class="flex items-center bg-card border border-border rounded-2xl p-1 shadow-sm">
          <button @click="currentMonth--" class="p-2 hover:bg-surface rounded-xl transition-colors"><ChevronLeft class="w-4 h-4"/></button>
          <span class="px-4 text-sm font-bold text-black min-w-[140px] text-center">
            {{ MONTH_NAMES[currentMonth] }} {{ currentYear }}
          </span>
          <button @click="currentMonth++" class="p-2 hover:bg-surface rounded-xl transition-colors"><ChevronRight class="w-4 h-4"/></button>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-4 gap-8">
      
      <div class="xl:col-span-3 bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div class="grid grid-cols-7 text-center bg-surface/50 border-b border-border">
          <div v-for="d in DAY_NAMES" :key="d" class="py-4 text-[10px] font-bold text-muted tracking-widest uppercase">{{ d }}</div>
        </div>

        <div class="grid grid-cols-7">
          <div 
            v-for="(cell, i) in calendarDays" 
            :key="i"
            @click="selectDay(cell)"
            :class="[
              'min-h-[120px] p-3 border-r border-b border-border transition-all cursor-pointer relative group',
              cell.current ? 'hover:bg-accent/5' : 'bg-surface/20 opacity-40',
              selectedDate === cell.key ? 'bg-accent/10 ring-2 ring-inset ring-accent/30' : ''
            ]"
          >
            <div class="flex justify-between items-start mb-2">
              <span :class="['text-sm font-bold', cell.isToday ? 'bg-accent text-white w-7 h-7 flex items-center justify-center rounded-full shadow-md' : 'text-black']">
                {{ cell.day }}
              </span>
              <Plus v-if="cell.current" class="w-4 h-4 text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            <div class="space-y-1">
              <div 
                v-for="appt in (appointments[cell.key] || [])" 
                :key="appt.id"
                class="px-2 py-1 bg-accent text-white text-[10px] font-bold rounded-lg truncate shadow-sm"
              >
                {{ appt.time }} - {{ appt.title }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <aside class="space-y-6">
        
        <div class="bg-card border border-border rounded-3xl p-6 shadow-sm">
          <h2 class="font-display font-bold text-black mb-4 flex items-center gap-2">
            <CalendarIcon class="w-5 h-5 text-accent" />
            {{ showForm ? 'Detalles de la Cita' : 'Selecciona una fecha' }}
          </h2>

          <div v-if="showForm" class="space-y-4 animate-in slide-in-from-right-4 duration-300">
            <div class="p-4 bg-surface rounded-2xl border border-border">
              <p class="text-xs text-muted font-bold uppercase mb-1">Fecha seleccionada</p>
              <p class="text-sm font-bold text-black">{{ selectedDate }}</p>
            </div>

            <div class="space-y-2">
              <label class="text-[10px] font-bold text-muted uppercase px-1">Motivo de consulta</label>
              <select class="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-accent/20 outline-none transition-all">
                <option>Limpieza Dental</option>
                <option>Revisión General</option>
                <option>Dolor / Emergencia</option>
                <option>Seguimiento Postoperatorio</option>
              </select>
            </div>

            <button 
              @click="handleConfirmarCita"
              class="w-full py-3 bg-accent text-white rounded-2xl text-sm font-bold shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              Confirmar Cita
            </button>
            <button @click="showForm = false" class="w-full py-2 text-xs font-bold text-muted hover:text-black transition-colors">
              Cancelar
            </button>
          </div>

          <div v-else class="text-center py-8">
            <div class="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
              <Info class="w-8 h-8 text-muted/30" />
            </div>
            <p class="text-xs text-muted leading-relaxed px-4">
              Haz clic en un día disponible en el calendario para comenzar a agendar tu cita.
            </p>
          </div>
        </div>

        <div class="bg-card border border-border rounded-3xl p-6 shadow-sm">
          <h3 class="text-xs font-bold text-black mb-4 uppercase tracking-wider">Estado de tus citas</h3>
          <div class="space-y-3">
            <div class="flex items-center gap-3 text-xs">
              <CheckCircle2 class="w-4 h-4 text-emerald-500" />
              <span class="text-muted font-medium">Confirmada</span>
            </div>
            <div class="flex items-center gap-3 text-xs">
              <Clock class="w-4 h-4 text-amber-500" />
              <span class="text-muted font-medium">Pendiente</span>
            </div>
            <div class="flex items-center gap-3 text-xs">
              <AlertCircle class="w-4 h-4 text-red-500" />
              <span class="text-muted font-medium">Requiere Atención</span>
            </div>
          </div>
        </div>
      </aside>

    </div>
  </div>
</template>