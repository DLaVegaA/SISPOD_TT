<script setup lang="ts">
import { ref } from 'vue'
import {
  HeartPulse, ShieldAlert, CheckCircle2,
  Info, Clock, FileText, Send, CalendarDays,
  Stethoscope, AlertCircle, Loader2
} from 'lucide-vue-next'

const isSubmitting = ref(false)
const successMsg = ref<string | null>(null)

const seguimiento = ref({
  estado: 'Activo',
  diasRestantes: 5,
  indicaciones: '1. Mantener la gasa mordida por 45 minutos.\n2. No consumir alimentos calientes o irritantes por 3 días.\n3. Aplicar hielo en la zona afectada en intervalos de 15 minutos.\n4. Tomar Ketorolaco 10mg cada 8 horas en caso de dolor.',
  nivelAlerta: 'Ninguna',
  fechaInicio: '2026-04-28',
  procedimientoNombre: 'Extracción de Tercer Molar',
  idCita: 101,
})

const cuestionarioHoy = ref({
  respondido: false,
  dolor: 0,
  sangrado: false,
  inflamacion: false,
  comentarios: ''
})

const handleEnviarCuestionario = async () => {
  isSubmitting.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 1200))
    cuestionarioHoy.value.respondido = true
    successMsg.value = 'Tus síntomas de hoy han sido registrados. Tu dentista ha sido notificado.'
    setTimeout(() => { successMsg.value = null }, 4000)
  } catch (error) {
    console.error('Error enviando cuestionario:', error)
  } finally {
    isSubmitting.value = false
  }
}

function formatearFecha(fechaStr: string): string {
  if (!fechaStr) return '—'
  return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(fechaStr))
}
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
        <h1 class="font-display text-4xl font-semibold text-black">Cuidados Postoperatorios</h1>
        <p class="text-sm text-muted mt-1">Sigue tus indicaciones y reporta tus síntomas diariamente.</p>
      </div>
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

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

      <!-- ── Sidebar ─────────────────────────────────────────────────── -->
      <aside class="lg:col-span-1 space-y-5">

        <!-- Estado card -->
        <div class="bg-card border border-border rounded-3xl shadow-sm overflow-hidden">

          <!-- Icono + título centrado -->
          <div class="flex flex-col items-center pt-7 pb-5 px-5 gap-3">
            <div class="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center">
              <HeartPulse class="w-7 h-7 text-emerald-500" />
            </div>
            <div class="text-center">
              <p class="text-sm font-bold text-black">Estado de Recuperación</p>
              <div class="flex items-center justify-center gap-1.5 mt-2">
                <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 border border-emerald-400/30 rounded-lg text-xs font-bold uppercase tracking-wide">
                  <CheckCircle2 class="w-3 h-3" />
                  {{ seguimiento.estado }}
                </span>
              </div>
            </div>
          </div>

          <div class="h-px bg-border mx-5" />

          <!-- Procedimiento -->
          <div class="px-5 py-4">
            <p class="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">Procedimiento</p>
            <div class="flex items-center gap-2 px-3 py-2.5 bg-surface rounded-xl border border-border">
              <Stethoscope class="w-3.5 h-3.5 text-muted/50 shrink-0" />
              <p class="text-xs font-semibold text-black truncate">{{ seguimiento.procedimientoNombre }}</p>
            </div>
          </div>

          <div class="h-px bg-border mx-5" />

          <!-- Stats -->
          <div class="grid grid-cols-2 divide-x divide-border px-0 py-4">
            <div class="flex flex-col items-center gap-0.5 px-4">
              <p class="text-[10px] font-bold text-muted uppercase tracking-wider">Días restantes</p>
              <p class="text-2xl font-black text-black">{{ seguimiento.diasRestantes }}</p>
            </div>
            <div class="flex flex-col items-center gap-0.5 px-4">
              <p class="text-[10px] font-bold text-muted uppercase tracking-wider">Nivel alerta</p>
              <p class="text-sm font-black text-emerald-600 mt-1">{{ seguimiento.nivelAlerta }}</p>
            </div>
          </div>

          <div class="h-px bg-border mx-5" />

          <!-- Fecha -->
          <div class="px-5 py-3.5 flex items-center gap-1.5">
            <CalendarDays class="w-3.5 h-3.5 text-muted/50 shrink-0" />
            <span class="text-[11px] text-muted">
              Inicio: <span class="font-semibold text-black">{{ formatearFecha(seguimiento.fechaInicio) }}</span>
            </span>
            <span class="text-[11px] text-muted/40 font-mono ml-auto">Cita #{{ seguimiento.idCita }}</span>
          </div>
        </div>

        <!-- Aviso urgencia -->
        <div class="bg-card border border-border rounded-3xl shadow-sm overflow-hidden">
          <div class="p-5 flex items-start gap-3">
            <div class="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-400/20 flex items-center justify-center shrink-0 mt-0.5">
              <Info class="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <p class="text-xs font-bold text-black mb-1">Monitoreo activo</p>
              <p class="text-xs text-muted leading-relaxed">
                Tu dentista está revisando tu progreso. Si presentas dolor insoportable o hemorragia, acude inmediatamente a la clínica.
              </p>
            </div>
          </div>
        </div>
      </aside>

      <!-- ── Main content ────────────────────────────────────────────── -->
      <section class="lg:col-span-2 space-y-5">

        <!-- Indicaciones Médicas -->
        <div class="bg-card border border-border rounded-3xl shadow-sm overflow-hidden">

          <div class="px-6 pt-6 pb-4 flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
              <FileText class="w-4 h-4 text-accent" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-black leading-tight">Indicaciones Médicas</h3>
              <p class="text-[11px] text-muted">Sigue estas instrucciones al pie de la letra</p>
            </div>
          </div>

          <div class="px-6 pb-6 space-y-2">
            <div
              v-for="(linea, i) in seguimiento.indicaciones.split('\n').filter(Boolean)"
              :key="i"
              class="flex items-start gap-3 p-3.5 bg-surface rounded-xl border border-border hover:border-accent/30 transition-colors"
            >
              <span class="w-5 h-5 rounded-lg bg-accent/10 text-accent text-[10px] font-black flex items-center justify-center shrink-0 mt-px">
                {{ i + 1 }}
              </span>
              <p class="text-sm text-black leading-relaxed">{{ linea.replace(/^\d+\.\s*/, '') }}</p>
            </div>
          </div>
        </div>

        <!-- Bitácora diaria -->
        <div class="bg-card border border-border rounded-3xl shadow-sm overflow-hidden">

          <div class="px-6 pt-6 pb-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-400/20 flex items-center justify-center shrink-0">
                <ShieldAlert class="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <h3 class="text-sm font-bold text-black leading-tight">Bitácora de Hoy</h3>
                <p class="text-[11px] text-muted">Requerido para tu evaluación diaria</p>
              </div>
            </div>
            <span
              v-if="cuestionarioHoy.respondido"
              class="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-400/30 px-2.5 py-1 rounded-lg"
            >
              <CheckCircle2 class="w-3.5 h-3.5" />
              Completado
            </span>
            <span v-else class="text-xs font-bold text-amber-600 bg-amber-500/10 border border-amber-400/30 px-2.5 py-1 rounded-lg">
              Pendiente
            </span>
          </div>

          <div class="h-px bg-border mx-6" />

          <!-- Completado -->
          <div v-if="cuestionarioHoy.respondido" class="flex flex-col items-center justify-center py-14 gap-3 text-center">
            <div class="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center">
              <CheckCircle2 class="w-7 h-7 text-emerald-500" />
            </div>
            <p class="text-sm font-bold text-black">¡Gracias por tu reporte!</p>
            <p class="text-xs text-muted">Vuelve mañana para continuar tu seguimiento.</p>
          </div>

          <!-- Formulario -->
          <form v-else @submit.prevent="handleEnviarCuestionario" class="px-6 py-5 space-y-5">

            <!-- Dolor -->
            <div class="bg-surface border border-border rounded-2xl p-4 space-y-3">
              <div class="flex items-center justify-between">
                <label class="text-[10px] font-bold text-muted uppercase tracking-wider">Nivel de dolor</label>
                <span class="text-lg font-black text-accent tabular-nums">{{ cuestionarioHoy.dolor }}<span class="text-xs font-bold text-muted">/10</span></span>
              </div>
              <input
                type="range"
                min="0" max="10"
                v-model="cuestionarioHoy.dolor"
                class="w-full accent-accent"
              />
              <div class="flex justify-between text-[10px] font-semibold text-muted">
                <span>Sin dolor</span>
                <span>Dolor máximo</span>
              </div>
            </div>

            <!-- Checkboxes -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label
                :class="['flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all', cuestionarioHoy.sangrado ? 'bg-red-500/5 border-red-400/40' : 'bg-surface border-border hover:border-red-300/50']"
              >
                <div class="flex items-center gap-2.5">
                  <div :class="['w-7 h-7 rounded-lg flex items-center justify-center shrink-0', cuestionarioHoy.sangrado ? 'bg-red-500/15' : 'bg-surface border border-border']">
                    <AlertCircle :class="['w-3.5 h-3.5', cuestionarioHoy.sangrado ? 'text-red-500' : 'text-muted/40']" />
                  </div>
                  <span class="text-sm font-bold text-black">¿Sangrado abundante?</span>
                </div>
                <input type="checkbox" v-model="cuestionarioHoy.sangrado" class="w-4 h-4 accent-accent rounded" />
              </label>

              <label
                :class="['flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all', cuestionarioHoy.inflamacion ? 'bg-amber-500/5 border-amber-400/40' : 'bg-surface border-border hover:border-amber-300/50']"
              >
                <div class="flex items-center gap-2.5">
                  <div :class="['w-7 h-7 rounded-lg flex items-center justify-center shrink-0', cuestionarioHoy.inflamacion ? 'bg-amber-500/15' : 'bg-surface border border-border']">
                    <AlertCircle :class="['w-3.5 h-3.5', cuestionarioHoy.inflamacion ? 'text-amber-500' : 'text-muted/40']" />
                  </div>
                  <span class="text-sm font-bold text-black">¿Inflamación severa?</span>
                </div>
                <input type="checkbox" v-model="cuestionarioHoy.inflamacion" class="w-4 h-4 accent-accent rounded" />
              </label>
            </div>

            <!-- Comentarios -->
            <div class="space-y-1.5">
              <label class="block text-[10px] font-bold text-muted uppercase tracking-wider">
                Comentarios adicionales <span class="normal-case font-normal text-muted/50">(Opcional)</span>
              </label>
              <textarea
                v-model="cuestionarioHoy.comentarios"
                rows="3"
                placeholder="¿Sientes algo fuera de lo normal?"
                class="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-black placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-none"
              />
            </div>

            <!-- Submit -->
            <div class="flex justify-end pt-1">
              <button
                type="submit"
                :disabled="isSubmitting"
                class="flex items-center gap-2 bg-accent text-white px-8 py-3 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
              >
                <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
                <Send v-else class="w-4 h-4" />
                {{ isSubmitting ? 'Enviando...' : 'Enviar Reporte' }}
              </button>
            </div>

          </form>
        </div>
      </section>
    </div>
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
</style>