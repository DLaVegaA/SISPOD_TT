<script setup lang="ts">
import { ref } from 'vue'
import { CalendarCheck, Activity, ClipboardList, AlertTriangle, AlertCircle } from 'lucide-vue-next'
 
const metricas = ref([
  {
    titulo: 'Citas del Día',
    numero: 8,
    subtitulo: '2 Sin Confirmar',
    textoBoton: 'Ver Agenda',
    icon: CalendarCheck,
    iconClass: 'text-accent',
    iconBg: 'bg-accent-dim',
  },
  {
    titulo: 'Tratamientos En Progreso',
    numero: 8,
    subtitulo: 'Controles Próximos',
    textoBoton: 'Ver Tratamientos',
    icon: Activity,
    iconClass: 'text-emerald-500',
    iconBg: 'bg-emerald-500/10',
  },
  {
    titulo: 'Cuestionarios Pendientes',
    numero: 6,
    subtitulo: 'Por Completar',
    textoBoton: 'Revisar',
    icon: ClipboardList,
    iconClass: 'text-amber-500',
    iconBg: 'bg-amber-500/10',
  },
])
 
const proximasCitas = ref(
  Array(15).fill({
    paciente: 'Nombre del Paciente',
    fecha: 'Fecha de Cita',
    tipo: 'Tipo de Tratamiento',
  }),
)
 
const alertas = ref([
  { tipo: 'Cita cancelada',       paciente: 'Carlos Pérez',  hora: '9:00 AM', kind: 'error' },
  { tipo: 'Cita cancelada',       paciente: 'Carlos Pérez',  hora: '9:00 AM', kind: 'error' },
  { tipo: 'Cuestionario faltante',paciente: 'Sergio Díaz',   hora: '9:00 AM', kind: 'warning' },
  { tipo: 'Cita cancelada',       paciente: 'Carlos Pérez',  hora: '9:00 AM', kind: 'error' },
  { tipo: 'Historial incompleto', paciente: 'Ana Castillo',  hora: '9:00 AM', kind: 'warning' },
  { tipo: 'Cita cancelada',       paciente: 'Carlos Pérez',  hora: '9:00 AM', kind: 'error' },
  { tipo: 'Historial incompleto', paciente: 'Ana Castillo',  hora: '9:00 AM', kind: 'warning' },
])
 
function alertClass(kind: string) {
  return kind === 'error'
    ? 'bg-red-500/10 border border-red-400/30 text-red-600'
    : 'bg-amber-400/10 border border-amber-400/30 text-amber-700'
}
 
function alertIcon(kind: string) {
  return kind === 'error' ? AlertCircle : AlertTriangle
}
</script>
 
<template>
  <div class="fade-in">
 
    <!-- ── Header ──────────────────────────────────────────────────────── -->
    <div class="mb-8">
      <div class="flex items-center gap-1.5 text-xs text-muted font-medium mb-2">
        <span class="text-muted/60">🏠</span>
        <span class="text-muted/60">&gt;</span>
        <span class="bg-card border border-border px-2 py-0.5 rounded-lg">Resumen</span>
      </div>
      <h1 class="font-display text-2xl font-extrabold text-black">Resumen</h1>
    </div>
 
    <!-- ── Metric cards ─────────────────────────────────────────────────── -->
    <section class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div
        v-for="item in metricas"
        :key="item.titulo"
        class="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4"
      >
        <!-- Title row -->
        <div class="flex items-center gap-2">
          <div :class="['w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0', item.iconBg]">
            <component :is="item.icon" :class="['w-4 h-4', item.iconClass]" />
          </div>
          <p class="text-sm font-semibold text-black">{{ item.titulo }}</p>
        </div>
 
        <!-- Number + badge + button -->
        <div class="flex items-center justify-between">
          <span class="text-3xl font-display font-extrabold text-black">{{ item.numero }}</span>
 
          <span class="text-xs font-semibold text-muted px-3 py-1 bg-surface border border-border rounded-full">
            {{ item.subtitulo }}
          </span>
 
          <button
            class="flex items-center gap-2 bg-ink/65 text-text-secondary hover:bg-ink/80 px-3 py-2 rounded-2xl text-xs font-medium transition-all hover:scale-105 active:scale-95"
          >
            {{ item.textoBoton }}
          </button>
        </div>
      </div>
    </section>
 
    <!-- ── Próximas Citas ───────────────────────────────────────────────── -->
    <section class="bg-card border border-border rounded-2xl p-6 mb-6">
      <h2 class="font-display font-bold text-black text-lg mb-5 text-center">Próximas Citas</h2>
 
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-x-4 gap-y-2 mb-6">
        <div
          v-for="(cita, i) in proximasCitas"
          :key="i"
          class="bg-surface border border-border rounded-xl px-4 py-2 flex justify-between items-center text-xs text-muted"
        >
          <span class="font-bold text-black truncate w-1/3">{{ cita.paciente }}</span>
          <span class="w-1/3 text-center">{{ cita.fecha }}</span>
          <span class="w-1/3 text-right truncate">{{ cita.tipo }}</span>
        </div>
      </div>
 
      <div class="flex justify-center">
        <button
          class="flex items-center gap-2 bg-ink/65 text-text-secondary hover:bg-ink/80 px-5 py-2.5 rounded-2xl text-sm font-medium transition-all hover:scale-105 active:scale-95"
        >
          Ver Agenda
        </button>
      </div>
    </section>
 
    <!-- ── Alertas ─────────────────────────────────────────────────────── -->
    <section class="bg-card border border-border rounded-2xl p-6">
      <h2 class="font-display font-bold text-black text-lg mb-5 text-center">Alertas</h2>
 
      <div class="space-y-2 mb-6">
        <div
          v-for="(alerta, i) in alertas"
          :key="i"
          :class="['flex items-center justify-between rounded-xl px-5 py-2.5 text-xs font-semibold', alertClass(alerta.kind)]"
        >
          <div class="flex items-center gap-2 w-1/3">
            <component :is="alertIcon(alerta.kind)" class="w-3.5 h-3.5 flex-shrink-0" />
            <span>{{ alerta.tipo }}</span>
          </div>
          <span class="w-1/3 text-center font-medium">{{ alerta.paciente }}</span>
          <span class="w-1/3 text-right font-medium">{{ alerta.hora }}</span>
        </div>
      </div>
 
      <div class="flex justify-center">
        <button
          class="flex items-center gap-2 bg-ink/65 text-text-secondary hover:bg-ink/80 px-5 py-2.5 rounded-2xl text-sm font-medium transition-all hover:scale-105 active:scale-95"
        >
          Ver Más
        </button>
      </div>
    </section>
 
  </div>
</template>