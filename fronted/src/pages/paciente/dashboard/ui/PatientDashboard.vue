<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ROUTE_PATHS } from '@/shared/routes'
import {
  Plus, CalendarCheck, ClipboardCheck, Stethoscope,
  ArrowRight, BookOpen, CalendarClock, Ban, CalendarDays
} from 'lucide-vue-next'

// ── Router ─────────────────────────────────────────────────────────────────
const router = useRouter()

// ── Mock appointments (Lista plana optimizada para el dashboard) ──────────
const proximasCitas = ref([
  { id: 1, date: '18 Mar 2026', time: '11:30 AM', title: 'Revisión General', status: 'Confirmada', badgeBg: 'bg-emerald-100', badgeText: 'text-emerald-700' },
  { id: 2, date: '25 Mar 2026', time: '04:00 PM', title: 'Limpieza Dental', status: 'Pendiente', badgeBg: 'bg-amber-100', badgeText: 'text-amber-700' },
])

// ── Metrics ───────────────────────────────────────────────────────────────
const metricas = ref([
  { titulo: 'Próxima Cita',  numero: '18 Mar',  subtitulo: '11:30 AM',       icon: CalendarCheck,  iconBg: 'bg-accent-dim',       iconClass: 'text-accent'      },
  { titulo: 'Cuestionarios', numero: 2,         subtitulo: 'Pendientes',     icon: ClipboardCheck, iconBg: 'bg-emerald-500/10',   iconClass: 'text-emerald-500' },
  { titulo: 'Seguimiento',   numero: 'Activo',  subtitulo: 'Postoperatorio', icon: Stethoscope,    iconBg: 'bg-indigo-500/10',    iconClass: 'text-indigo-500'  },
])

// ── Handlers (Navegación y Casos de Uso) ──────────────────────────────────
function handleAgendar() {
  // Redirige al calendario/formulario para agendar (CU4)
  router.push(ROUTE_PATHS.PATIENT_APPOINTMENT)
}

function handleVerCalendario() {
  // Redirige a la vista completa del calendario (CU7)
  router.push(ROUTE_PATHS.PATIENT_APPOINTMENT)
}

function handleReprogramar(id: number) {
  // CU8
  console.log('Reprogramar cita:', id)
}

function handleCancelar(id: number) {
  // CU6
  console.log('Cancelar cita:', id)
}
</script>

<template>
  <div class="fade-in max-w-6xl mx-auto pb-10">

    <div class="flex items-end justify-between mb-8">
      <div>
        <div class="flex items-center gap-1.5 text-xs text-muted font-medium mb-2">
          <span class="text-muted/60">🏠</span>
          <span class="text-muted/60">&gt;</span>
          <span class="bg-card border border-border px-2 py-0.5 rounded-lg">Inicio</span>
        </div>
        <h1 class="font-display text-2xl font-extrabold text-black">Hola, Anuar 👋</h1>
        <p class="text-sm text-muted mt-1">Este es el resumen de tu actividad.</p>
      </div>

      <button
        class="flex items-center gap-2 bg-ink/65 text-text-secondary hover:bg-ink/80 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all hover:scale-105 active:scale-95"
        @click="handleAgendar"
      >
        <Plus class="w-4 h-4" />
        Agendar Nueva Cita
      </button>
    </div>

    <section class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div
        v-for="item in metricas"
        :key="item.titulo"
        class="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3 shadow-sm"
      >
        <div class="flex items-center gap-2">
          <div :class="['w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0', item.iconBg]">
            <component :is="item.icon" :class="['w-4 h-4', item.iconClass]" />
          </div>
          <p class="text-sm font-semibold text-black">{{ item.titulo }}</p>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-2xl font-display font-extrabold text-black">{{ item.numero }}</span>
          <span class="text-[10px] font-bold text-muted px-3 py-1 bg-surface border border-border rounded-full uppercase tracking-wide">
            {{ item.subtitulo }}
          </span>
        </div>
      </div>
    </section>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <section class="lg:col-span-2">
        <div class="bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col h-full">
          
          <div class="flex items-center justify-between px-6 py-5 border-b border-border bg-surface/50">
            <h2 class="font-display font-bold text-black text-lg">Próximas Citas</h2>
            <button 
              @click="handleVerCalendario"
              class="flex items-center gap-1.5 text-xs font-bold text-accent hover:text-accent-dark transition-colors"
            >
              <CalendarDays class="w-4 h-4" />
              Ver Calendario
            </button>
          </div>

          <div class="p-6 space-y-4 flex-1">
            <div
              v-for="cita in proximasCitas"
              :key="cita.id"
              class="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border bg-surface/30 hover:bg-surface/60 transition-colors gap-4"
            >
              <div class="flex items-center gap-4">
                <div class="bg-card border border-border rounded-xl p-3 text-center min-w-[75px] shadow-sm">
                  <span class="block text-[10px] uppercase font-bold text-muted">{{ cita.date.split(' ')[1] }}</span>
                  <span class="block text-xl font-extrabold text-black">{{ cita.date.split(' ')[0] }}</span>
                </div>
                <div>
                  <h3 class="font-bold text-black text-sm">{{ cita.title }}</h3>
                  <div class="flex items-center gap-2 mt-1.5">
                    <span class="text-xs font-medium text-muted">{{ cita.time }}</span>
                    <span class="w-1 h-1 rounded-full bg-border"></span>
                    <span :class="['text-[10px] font-bold px-2 py-0.5 rounded-md', cita.badgeBg, cita.badgeText]">
                      {{ cita.status }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
                <button 
                  @click="handleReprogramar(cita.id)"
                  class="flex items-center gap-1.5 px-3 py-2 bg-white border border-border rounded-lg text-xs font-bold text-black hover:bg-surface transition-colors shadow-sm"
                >
                  <CalendarClock class="w-3.5 h-3.5 text-muted" />
                  Modificar
                </button>
                <button 
                  @click="handleCancelar(cita.id)"
                  class="p-2 text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Cancelar Cita"
                >
                  <Ban class="w-4 h-4" />
                </button>
              </div>
            </div>

            <div v-if="proximasCitas.length === 0" class="text-center py-10">
              <p class="text-sm text-muted font-medium mb-3">No tienes citas programadas.</p>
              <button @click="handleAgendar" class="text-xs font-bold text-accent hover:underline">
                Agendar tu primera cita ahora
              </button>
            </div>
          </div>
        </div>
      </section>

      <section class="space-y-4">
        <div class="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-8 h-8 rounded-xl bg-accent-dim flex items-center justify-center">
              <BookOpen class="w-4 h-4 text-accent" /> 
            </div>
            <h3 class="font-display font-bold text-black text-sm">Guía de Cuidados</h3>
          </div>
          <p class="text-xs text-muted mb-4 leading-relaxed">
            Consulta las recomendaciones y los cuidados específicos para tu recuperación postoperatoria.
          </p>
          <button class="w-full flex items-center gap-2 justify-center bg-ink/65 text-text-secondary hover:bg-ink/80 px-4 py-2.5 rounded-2xl text-xs font-medium transition-all hover:scale-105 active:scale-95">
            <BookOpen class="w-4 h-4" />
            Ver Plan de Cuidados
          </button>
        </div>

        <div class="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <Stethoscope class="w-4 h-4 text-indigo-600" />
            </div>
            <h3 class="font-display font-bold text-black text-sm">Seguimiento Postoperatorio</h3>
          </div>
          <p class="text-xs text-muted mb-4 leading-relaxed">
            Registra tu progreso y revisa si hay alertas sobre tu estado de salud actual.
          </p>
          <button class="w-full flex items-center justify-between p-3 bg-surface border border-border rounded-xl hover:border-indigo-400/30 transition-colors cursor-pointer group">
            <span class="text-xs font-bold text-black">Entrar a tu seguimiento</span>
            <ArrowRight class="w-4 h-4 text-indigo-600 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

    </div>
  </div>
</template>