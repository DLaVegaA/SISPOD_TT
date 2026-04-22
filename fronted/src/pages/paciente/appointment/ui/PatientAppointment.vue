<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronLeft, ChevronRight, CalendarClock } from 'lucide-vue-next'

// ── State ──────────────────────────────────────────────────────────────────
const today = new Date()
const currentYear  = ref(today.getFullYear())
const currentMonth = ref(today.getMonth()) // 0-based

const MONTH_NAMES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
]
const DAY_NAMES = ['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB']

// ── Mock appointments ─────────────────────────────────────────────────────
const appointments: Record<string, { id: number; title: string; color: 'blue' | 'indigo' }[]> = {
  '2026-2-5':  [{ id: 1, title: 'Limpieza Dental',                color: 'blue'   }],
  '2026-2-18': [{ id: 2, title: 'Extracción Muelas del Juicio',   color: 'indigo' }],
  '2026-2-25': [{ id: 3, title: 'Revisión Postoperatoria',        color: 'indigo' }],
}

// ── Calendar grid ─────────────────────────────────────────────────────────
const calendarDays = computed(() => {
  const y = currentYear.value
  const m = currentMonth.value
  const firstDay     = new Date(y, m, 1).getDay()
  const daysInMonth  = new Date(y, m + 1, 0).getDate()
  const prevDays     = new Date(y, m, 0).getDate()
  const cells = []

  for (let i = firstDay - 1; i >= 0; i--)
    cells.push({ day: prevDays - i, current: false, dateKey: '', isToday: false })

  for (let d = 1; d <= daysInMonth; d++)
    cells.push({
      day: d,
      current: true,
      dateKey: `${y}-${m}-${d}`,
      isToday: d === today.getDate() && m === today.getMonth() && y === today.getFullYear(),
    })

  const remaining = 42 - cells.length
  for (let d = 1; d <= remaining; d++)
    cells.push({ day: d, current: false, dateKey: '', isToday: false })

  return cells
})

// ── Navigation ────────────────────────────────────────────────────────────
function prevMonth() {
  if (currentMonth.value === 0) { currentMonth.value = 11; currentYear.value-- }
  else currentMonth.value--
}
function nextMonth() {
  if (currentMonth.value === 11) { currentMonth.value = 0; currentYear.value++ }
  else currentMonth.value++
}
function goToday() {
  currentMonth.value = today.getMonth()
  currentYear.value  = today.getFullYear()
}

// ── Handlers ──────────────────────────────────────────────────────────────
function handleNuevaCita() {
  console.log('Abrir modal / navegar a agendar cita')
}
function handleOpcionesCita(appt: { id: number; title: string }) {
  console.log('Detalle de cita para cancelar / reprogramar:', appt)
}

// ── Color map ─────────────────────────────────────────────────────────────
const apptColorCls: Record<'blue' | 'indigo', string> = {
  blue:   'bg-accent hover:bg-accent-light',
  indigo: 'bg-indigo-500 hover:bg-indigo-400',
}
</script>

<template>
  <div class="fade-in">

    <!-- ── Header ──────────────────────────────────────────────────────── -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <div class="flex items-center gap-1.5 text-xs text-muted font-medium mb-2">
          <span class="text-muted/60">🏠</span>
          <span class="text-muted/60">&gt;</span>
          <span class="bg-card border border-border px-2 py-0.5 rounded-lg">Mis Citas</span>
        </div>
        <h1 class="font-display text-2xl font-extrabold text-black">
          {{ MONTH_NAMES[currentMonth] }} {{ currentYear }}
        </h1>
      </div>

      <div class="flex items-center gap-3">
        <!-- Month navigation -->
        <div class="flex items-center bg-card border border-border rounded-2xl overflow-hidden">
          <button
            class="px-3 py-2.5 hover:bg-ghost text-muted hover:text-black transition-colors"
            @click="prevMonth"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>
          <button
            class="px-4 py-2.5 text-sm font-semibold text-black hover:bg-ghost transition-colors border-x border-border"
            @click="goToday"
          >
            Hoy
          </button>
          <button
            class="px-3 py-2.5 hover:bg-ghost text-muted hover:text-black transition-colors"
            @click="nextMonth"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>

        <!-- CTA -->
        <button
          class="flex items-center gap-2 bg-ink/65 text-text-secondary hover:bg-ink/80 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all hover:scale-105 active:scale-95"
          @click="handleNuevaCita"
        >
          <CalendarClock class="w-4 h-4" />
          Agendar Cita
        </button>
      </div>
    </div>

    <!-- ── Calendar ────────────────────────────────────────────────────── -->
    <div class="bg-card border border-border rounded-2xl overflow-hidden">

      <!-- Day-of-week header -->
      <div class="grid grid-cols-7 border-b border-border bg-surface">
        <div
          v-for="name in DAY_NAMES"
          :key="name"
          class="py-3 text-center text-xs font-semibold text-muted uppercase tracking-wider"
        >
          {{ name }}
        </div>
      </div>

      <!-- Grid cells -->
      <div class="grid grid-cols-7">
        <div
          v-for="(cell, idx) in calendarDays"
          :key="idx"
          :class="[
            'min-h-28 p-2 border-b border-border transition-colors group',
            (idx + 1) % 7 !== 0 ? 'border-r border-border' : '',
            cell.current ? 'hover:bg-surface cursor-pointer' : 'bg-surface/40',
          ]"
        >
          <!-- Day number -->
          <div class="flex justify-end mb-1">
            <span
              :class="[
                'w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold transition-colors',
                cell.isToday
                  ? 'bg-accent text-white shadow-sm'
                  : cell.current
                  ? 'text-black group-hover:bg-ghost'
                  : 'text-muted/30',
              ]"
            >
              {{ cell.day }}
            </span>
          </div>

          <!-- Appointment pills -->
          <div class="space-y-1 mt-1">
            <button
              v-for="appt in (appointments[cell.dateKey] ?? [])"
              :key="appt.id"
              :class="[
                'w-full text-left text-[10px] px-2 py-1.5 rounded-lg text-white font-semibold truncate',
                'transition-transform hover:scale-[1.02] active:scale-95',
                apptColorCls[appt.color],
              ]"
              :title="appt.title"
              @click.stop="handleOpcionesCita(appt)"
            >
              {{ appt.title }}
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>