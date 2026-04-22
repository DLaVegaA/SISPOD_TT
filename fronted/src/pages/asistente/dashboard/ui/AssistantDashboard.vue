<script setup lang="ts">
import { ref } from 'vue'
import {
  CalendarCheck,
  UserPlus,
  XCircle,
  AlertTriangle,
  AlertCircle,
  CalendarClock,
  Ban,
} from 'lucide-vue-next'

const metricas = ref([
  {
    titulo: 'Citas del Día',
    numero: 12,
    subtitulo: '3 Por Confirmar',
    textoBoton: 'Ver Agenda',
    icon: CalendarCheck,
    iconClass: 'text-accent',
    iconBg: 'bg-accent-dim',
    action: () => console.log('Ir a la agenda'),
  },
  {
    titulo: 'Nuevos Pacientes',
    numero: 4,
    subtitulo: 'Registrados Hoy',
    textoBoton: 'Registrar',
    icon: UserPlus,
    iconClass: 'text-emerald-500',
    iconBg: 'bg-emerald-500/10',
    action: () => console.log('Abrir modal de registro'),
  },
  {
    titulo: 'Citas Canceladas',
    numero: 2,
    subtitulo: 'Requieren atención',
    textoBoton: 'Revisar',
    icon: XCircle,
    iconClass: 'text-amber-500',
    iconBg: 'bg-amber-500/10',
    action: () => console.log('Filtrar citas canceladas'),
  },
])

const proximasCitas = ref([
  { id: 1, paciente: 'Juan Pérez García', hora: '10:00 AM', tipo: 'Limpieza'    },
  { id: 2, paciente: 'Ana Gómez López',   hora: '11:30 AM', tipo: 'Revisión'    },
  { id: 3, paciente: 'Carlos Ruiz S.',    hora: '01:00 PM', tipo: 'Extracción'  },
  { id: 4, paciente: 'María Fernández',   hora: '04:00 PM', tipo: 'Primera Vez' },
])

function handleReprogramar(cita: { paciente: string }) {
  console.log('Reprogramar cita para', cita.paciente)
}
function handleCancelar(cita: { paciente: string }) {
  console.log('Cancelar cita de', cita.paciente)
}

const alertas = ref([
  { tipo: 'Llegada tarde',      paciente: 'Carlos Ruiz S.',  hora: 'Hace 10 min',  kind: 'warning' },
  { tipo: 'Falta confirmación', paciente: 'María Fernández', hora: 'Para 04:00 PM', kind: 'warning' },
  { tipo: 'Cita cancelada',     paciente: 'Luis Torres',     hora: 'Ayer',          kind: 'error'   },
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
        <span class="bg-card border border-border px-2 py-0.5 rounded-lg">Panel de Control</span>
      </div>
      <h1 class="font-display text-2xl font-extrabold text-black">Dashboard Recepción</h1>
      <p class="text-sm text-muted mt-1">Gestión rápida de agenda y pacientes.</p>
    </div>

    <!-- ── Metric cards ─────────────────────────────────────────────────── -->
    <section class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div
        v-for="item in metricas"
        :key="item.titulo"
        class="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4"
      >
        <div class="flex items-center gap-2">
          <div :class="['w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0', item.iconBg]">
            <component :is="item.icon" :class="['w-4 h-4', item.iconClass]" />
          </div>
          <p class="text-sm font-semibold text-black">{{ item.titulo }}</p>
        </div>

        <div class="flex items-center justify-between">
          <span class="text-3xl font-display font-extrabold text-black">{{ item.numero }}</span>
          <span class="text-xs font-semibold text-muted px-3 py-1 bg-surface border border-border rounded-full">
            {{ item.subtitulo }}
          </span>
          <button
            class="flex items-center gap-2 bg-ink/65 text-text-secondary hover:bg-ink/80 px-3 py-2 rounded-2xl text-xs font-medium transition-all hover:scale-105 active:scale-95"
            @click="item.action"
          >
            {{ item.textoBoton }}
          </button>
        </div>
      </div>
    </section>

    <!-- ── Main grid ───────────────────────────────────────────────────── -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <!-- Agenda table -->
      <section class="bg-card border border-border rounded-2xl p-6 lg:col-span-2 flex flex-col">
        <h2 class="font-display font-bold text-black text-lg mb-5">Control de Agenda (Hoy)</h2>

        <div class="flex-1 space-y-2 mb-6">
          <div
            v-for="cita in proximasCitas"
            :key="cita.id"
            class="bg-surface border border-border rounded-xl px-4 py-3 flex justify-between items-center text-sm group hover:border-accent/30 transition-colors"
          >
            <!-- Patient + type -->
            <div class="w-1/3">
              <span class="font-bold text-black block truncate">{{ cita.paciente }}</span>
              <span class="text-xs text-muted">{{ cita.tipo }}</span>
            </div>

            <!-- Time -->
            <span class="w-1/3 text-center text-sm font-medium text-black">{{ cita.hora }}</span>

            <!-- Actions -->
            <div class="w-1/3 flex justify-end gap-1">
              <button
                class="p-2 rounded-lg text-muted hover:text-accent hover:bg-accent-dim transition-colors"
                title="Reprogramar Cita"
                @click="handleReprogramar(cita)"
              >
                <CalendarClock class="w-4 h-4" />
              </button>
              <button
                class="p-2 rounded-lg text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
                title="Cancelar Cita"
                @click="handleCancelar(cita)"
              >
                <Ban class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div class="flex justify-center mt-auto">
          <button
            class="flex items-center gap-2 bg-ink/65 text-text-secondary hover:bg-ink/80 px-5 py-2.5 rounded-2xl text-sm font-medium transition-all hover:scale-105 active:scale-95"
          >
            Ver Calendario Completo
          </button>
        </div>
      </section>

      <!-- Notifications -->
      <section class="bg-card border border-border rounded-2xl p-6 flex flex-col">
        <h2 class="font-display font-bold text-black text-lg mb-5">Notificaciones</h2>

        <div class="flex-1 space-y-2 mb-6">
          <div
            v-for="(alerta, i) in alertas"
            :key="i"
            :class="['flex flex-col gap-1 rounded-xl px-4 py-3 text-xs font-semibold', alertClass(alerta.kind)]"
          >
            <div class="flex items-center gap-2">
              <component :is="alertIcon(alerta.kind)" class="w-3.5 h-3.5 flex-shrink-0" />
              <span>{{ alerta.tipo }}</span>
            </div>
            <div class="flex justify-between items-center mt-0.5 text-black/70 font-medium">
              <span>{{ alerta.paciente }}</span>
              <span class="text-[10px]">{{ alerta.hora }}</span>
            </div>
          </div>
        </div>

        <div class="flex justify-center mt-auto">
          <button
            class="border border-border bg-surface text-muted hover:text-black hover:border-ghost px-5 py-2.5 rounded-2xl text-sm font-medium transition-all active:scale-95"
          >
            Limpiar Alertas
          </button>
        </div>
      </section>

    </div>
  </div>
</template>