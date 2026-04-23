<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-vue-next'
 
// ── State ──────────────────────────────────────────────────────────────────
const today = new Date()
const currentYear  = ref(today.getFullYear())
const currentMonth = ref(today.getMonth())   // 0-based
 
const MONTH_NAMES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
]
const DAY_NAMES = ['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB']
 
// ── Mock appointments (keyed as "YYYY-M-D") ───────────────────────────────
const appointments: Record<string, { id: number; title: string; color: string }[]> = {
  '2026-2-5':  [{ id: 1, title: 'Limpieza - Juan P.',  color: 'blue'   }],
  '2026-2-12': [{ id: 2, title: 'Limpieza - Juan P.',  color: 'blue'   }],
  '2026-2-18': [
    { id: 3, title: 'Limpieza - Juan P.',  color: 'blue'   },
    { id: 4, title: 'Revisión - Ana G.',   color: 'indigo' },
  ],
}
 
// ── Calendar grid ─────────────────────────────────────────────────────────
const calendarDays = computed(() => {
  const y = currentYear.value
  const m = currentMonth.value
 
  const firstDay  = new Date(y, m, 1).getDay()   // 0 = Sun
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const prevMonthDays = new Date(y, m, 0).getDate()
 
  const cells = []
 
  // Padding from previous month
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: prevMonthDays - i, current: false, dateKey: '' })
  }
 
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      day: d,
      current: true,
      dateKey: `${y}-${m}-${d}`,
      isToday:
        d === today.getDate() &&
        m === today.getMonth() &&
        y === today.getFullYear(),
    })
  }
 
  // Padding for next month
  const remaining = 42 - cells.length
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, current: false, dateKey: '' })
  }
 
  return cells
})
 
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
</script>
 
<template>
  <div class="fade-in">
 
    <!-- ── Header ──────────────────────────────────────────────────────── -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <!-- Breadcrumb -->
        <div class="flex items-center gap-1.5 text-xs text-muted font-medium mb-2">
          <span class="text-muted/60">🏠</span>
          <span class="text-muted/60">&gt;</span>
          <span class="bg-card border border-border px-2 py-0.5 rounded-lg">Calendario</span>
        </div>
        <h1 class="font-display text-2xl font-extrabold text-black">
          {{ MONTH_NAMES[currentMonth] }} {{ currentYear }}
        </h1>
      </div>
 
      <div class="flex items-center gap-3">
        <!-- Month nav -->
        <div class="flex items-center border border-border rounded-2xl overflow-hidden bg-card">
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
 
        <!-- New appointment button -->
        <button
          class="flex items-center gap-2 bg-ink/65 text-text-secondary hover:bg-ink/80 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all hover:scale-105 active:scale-95"
        >
          <Plus class="w-4 h-4" />
          Nueva Cita
        </button>
      </div>
    </div>
 
    <!-- ── Calendar card ───────────────────────────────────────────────── -->
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
 
      <!-- Grid -->
      <div class="grid grid-cols-7">
        <div
          v-for="(cell, idx) in calendarDays"
          :key="idx"
          :class="[
            'min-h-28 p-2 border-r border-b border-border last:border-r-0',
            'transition-colors cursor-pointer group',
            cell.current ? 'hover:bg-surface' : 'bg-surface/40',
            (idx + 1) % 7 === 0 ? 'border-r-0' : '',
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
                  : 'text-muted/40',
              ]"
            >
              {{ cell.day }}
            </span>
          </div>
 
          <!-- Appointments -->
          <div class="space-y-1">
            <div
              v-for="appt in (appointments[cell.dateKey] ?? [])"
              :key="appt.id"
              :class="[
                'text-[10px] px-2 py-1 rounded-lg text-white font-semibold truncate',
                appt.color === 'blue'   ? 'bg-accent'           : '',
                appt.color === 'indigo' ? 'bg-indigo-500'        : '',
              ]"
            >
              {{ appt.title }}
            </div>
          </div>
        </div>
      </div>
 
    </div>
  </div>
</template>