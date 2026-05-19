<template>
  <div class="fade-in max-w-2xl mx-auto pb-16">

    <!-- ── Breadcrumb ──────────────────────────────────────────────── -->
    <div class="flex items-center gap-2 text-xs text-muted mb-6">
      <RouterLink :to="{ name: ROUTE_NAMES.PATIENT_HOME, params: routeParams }" class="text-muted hover:text-black transition-colors">🏠</RouterLink>
      <span>/</span>
      <RouterLink :to="{ name: ROUTE_NAMES.PATIENT_FOLLOW_UP, params: routeParams }" class="text-muted hover:text-black transition-colors" @click="volverALista">
        Seguimiento
      </RouterLink>
      <template v-if="seguimientoSeleccionado">
        <span>/</span>
        <span class="font-medium text-black truncate max-w-[180px]">{{ seguimientoSeleccionado.procedimiento }}</span>
      </template>
    </div>

    <!-- ── Header ─────────────────────────────────────────────────── -->
    <div class="mb-8">
      <h1 class="font-display text-3xl font-bold text-black">Seguimiento postoperatorio</h1>
      <p class="text-sm text-muted mt-1">Consulta tu plan de cuidados y responde tus cuestionarios.</p>
    </div>

    <!-- Cargando -->
    <div v-if="cargandoLista" class="flex items-center justify-center gap-3 py-24 text-muted">
      <Loader2 class="h-6 w-6 animate-spin" /><span class="text-sm">Cargando tus seguimientos...</span>
    </div>

    <!-- Error -->
    <div v-else-if="errorLista" class="rounded-2xl border border-red-200 bg-red-50 p-5 flex items-start gap-3 text-sm text-red-700">
      <AlertCircle class="h-5 w-5 shrink-0 mt-0.5" />
      <div>
        <p class="font-medium">Error de conexión</p>
        <p class="text-red-600/80 mt-0.5">{{ errorLista }}</p>
        <button class="mt-3 underline text-xs" @click="cargarLista">Reintentar</button>
      </div>
    </div>

    <!-- Sin seguimientos -->
    <div v-else-if="!cargandoLista && seguimientos.length === 0" class="rounded-2xl border border-border bg-surface p-10 text-center">
      <HeartPulse class="h-12 w-12 mx-auto mb-3 text-muted/30" />
      <p class="font-medium text-black">Sin seguimiento activo</p>
      <p class="text-sm text-muted mt-1">Tu dentista aún no ha iniciado un seguimiento para ti.</p>
    </div>

    <!-- ── Vista A: lista ─────────────────────────────────────────── -->
    <template v-else-if="!seguimientoSeleccionado">
      <div class="space-y-3">
        <button v-for="s in seguimientos" :key="s.id_seguimiento"
          class="w-full text-left rounded-2xl border border-border bg-surface p-5 hover:border-accent/40 transition-all active:scale-[0.99] group"
          @click="seleccionarSeguimiento(s)">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <Stethoscope class="h-4 w-4 text-accent" />
              </div>
              <div>
                <p class="font-semibold text-black text-sm">{{ s.procedimiento }}</p>
                <p class="text-xs text-muted mt-0.5">{{ s.nombre }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span :class="['text-xs font-medium px-2.5 py-1 rounded-full', estadoClase(s.estado_seguimiento)]">{{ s.estado_seguimiento }}</span>
              <ChevronRight class="h-4 w-4 text-muted group-hover:text-accent transition-colors" />
            </div>
          </div>
          <div class="flex gap-4 mt-3 pt-3 border-t border-border text-xs text-muted">
            <span>Inicio: {{ formatFecha(s.fecha_inicio) }}</span>
            <span>Fin: {{ formatFecha(s.fecha_fin) }}</span>
          </div>
        </button>
      </div>
    </template>

    <!-- ── Vista B: detalle ───────────────────────────────────────── -->
    <template v-else>

      <!-- Estado -->
      <div class="rounded-2xl border border-border bg-surface p-5 mb-5 flex items-center gap-4">
        <div class="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
          <Stethoscope class="h-5 w-5 text-accent" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-xs text-muted uppercase tracking-wide font-medium">Procedimiento</p>
          <p class="font-semibold text-black truncate">{{ seguimientoSeleccionado.procedimiento }}</p>
        </div>
        <span :class="['text-xs font-medium px-2.5 py-1 rounded-full shrink-0', estadoClase(seguimientoSeleccionado.estado_seguimiento)]">
          {{ seguimientoSeleccionado.estado_seguimiento }}
        </span>
      </div>

      <div v-if="cargandoDetalle" class="flex items-center gap-2 text-muted text-sm py-6">
        <Loader2 class="h-4 w-4 animate-spin" /> Cargando indicaciones...
      </div>

      <!-- Indicaciones -->
      <div v-else-if="detalle && (detalle.plan_cuidados || detalle.indicaciones_medicas)"
        class="rounded-2xl border border-border bg-surface p-5 mb-5 space-y-4">
        <h2 class="text-sm font-semibold text-black flex items-center gap-2">
          <ClipboardList class="h-4 w-4 text-accent" /> Indicaciones de tu dentista
        </h2>
        <div v-if="detalle.plan_cuidados">
          <p class="text-xs text-muted uppercase tracking-wide font-medium mb-1">Plan de cuidados</p>
          <p class="text-sm text-black leading-relaxed whitespace-pre-line">{{ detalle.plan_cuidados }}</p>
        </div>
        <div v-if="detalle.indicaciones_medicas">
          <p class="text-xs text-muted uppercase tracking-wide font-medium mb-1">Indicaciones médicas</p>
          <p class="text-sm text-black leading-relaxed whitespace-pre-line">{{ detalle.indicaciones_medicas }}</p>
        </div>
      </div>

      <!-- Cuestionarios -->
      <div class="space-y-3">
        <h2 class="text-sm font-semibold text-black flex items-center gap-2">
          <ClipboardCheck class="h-4 w-4 text-accent" /> Cuestionarios postoperatorios
        </h2>

        <!-- Sin cuestionarios asignados -->
        <div v-if="tiposCuestionario.length === 0" class="rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
          <ClipboardCheck class="h-10 w-10 mx-auto mb-3 text-muted/30" />
          <p class="text-sm font-medium text-black">Sin cuestionarios asignados</p>
          <p class="text-xs text-muted mt-1">Tu dentista aún no ha asignado cuestionarios a este seguimiento.</p>
        </div>

        <button v-for="tipo in tiposCuestionario" :key="tipo.valor"
          :disabled="tipo.completado"
          :class="['w-full flex items-center justify-between p-4 rounded-xl border transition-all',
            tipo.completado ? 'border-green-200 bg-green-50/50 cursor-default' : 'border-border bg-surface hover:border-accent/40 active:scale-[0.99]']"
          @click="!tipo.completado && abrirCuestionario(tipo.valor)">
          <div class="flex items-center gap-3">
            <div :class="['w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
              tipo.completado ? 'bg-green-100' : 'bg-surface border border-border']">
              <CheckCircle2 v-if="tipo.completado" class="h-4 w-4 text-green-600" />
              <ClipboardCheck v-else class="h-4 w-4 text-muted" />
            </div>
            <div class="text-left">
              <p class="text-sm font-medium text-black">Cuestionario {{ tipo.valor }}</p>
              <p class="text-xs text-muted mt-0.5">{{ tipo.descripcion }}</p>
            </div>
          </div>
          <span :class="['text-xs font-medium px-2.5 py-1 rounded-full',
            tipo.completado ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700']">
            {{ tipo.completado ? 'Completado' : 'Pendiente' }}
          </span>
        </button>
      </div>
    </template>

    <!-- ════════════════════════════════════════════════════════════ -->
    <!-- Overlays (Teleport al body)                                 -->
    <!-- ════════════════════════════════════════════════════════════ -->
    <Teleport to="body">

      <!-- Modal responder cuestionario (CU22) -->
      <Transition name="fade">
        <div v-if="modalAbierto"
          class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-0 sm:px-4"
          @click.self="intentarCerrarModal">
          <div class="relative w-full sm:max-w-xl bg-white rounded-t-3xl sm:rounded-2xl shadow-xl flex flex-col max-h-[90dvh]">

            <div class="flex items-start justify-between p-5 border-b border-border shrink-0">
              <div>
                <p class="font-semibold text-black">
                  {{ form.cuestionario.value?.nombre_cuestionario ?? `Cuestionario ${tipoActivo}` }}
                </p>
                <p class="text-xs text-muted mt-0.5">
                  {{ form.preguntasRespondidas.value }} / {{ form.totalPreguntas.value }} preguntas respondidas
                </p>
              </div>
              <!-- BUG FIX: llama a intentarCerrarModal, no a form.intentarSalir directamente -->
              <button class="p-1.5 rounded-xl hover:bg-surface text-muted transition-colors" @click="intentarCerrarModal">
                <X class="h-5 w-5" />
              </button>
            </div>

            <!-- Progreso -->
            <div class="h-1 bg-border shrink-0">
              <div class="h-full bg-accent transition-all duration-500" :style="{ width: `${form.progresoPercent.value}%` }" />
            </div>

            <div v-if="form.cargandoCuestionario.value" class="flex-1 flex items-center justify-center gap-3 text-muted p-10">
              <Loader2 class="h-6 w-6 animate-spin" /><span class="text-sm">Cargando preguntas...</span>
            </div>

            <div v-else-if="form.errorCarga.value" class="flex-1 flex items-center justify-center p-10">
              <p class="text-sm text-red-600 text-center">{{ form.errorCarga.value }}</p>
            </div>

            <div v-else class="overflow-y-auto flex-1 px-5 py-4 space-y-8">
              <div v-for="(estado, idx) in form.estados.value" :key="estado.pregunta.id_pregunta_base">
                <div class="flex gap-2 mb-3">
                  <span class="shrink-0 w-6 h-6 rounded-full bg-accent/10 text-accent text-xs font-semibold flex items-center justify-center mt-0.5">
                    {{ idx + 1 }}
                  </span>
                  <p class="text-sm font-medium text-black leading-relaxed">{{ estado.pregunta.texto_pregunta }}</p>
                </div>
                <div class="pl-8">
                  <ControlPregunta
                    :pregunta="estado.pregunta"
                    :model-value="estado.valor"
                    :tocada="estado.tocada"
                    @update:model-value="(v) => form.actualizarRespuesta(estado.pregunta.id_pregunta_base, v)"
                  />
                </div>
              </div>
            </div>

            <div class="p-5 border-t border-border shrink-0 space-y-2">
              <p v-if="form.intentoEnvio.value && !form.formularioCompleto.value" class="text-sm text-amber-600 text-center">
                Responde todas las preguntas antes de continuar.
              </p>
              <p v-if="form.errorEnvio.value" class="text-sm text-red-600 text-center">{{ form.errorEnvio.value }}</p>
              <button
                :disabled="form.enviando.value || form.cargandoCuestionario.value"
                class="w-full flex items-center justify-center gap-2 rounded-xl bg-accent text-white text-sm font-semibold py-3 hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                @click="enviar">
                <Loader2 v-if="form.enviando.value" class="h-4 w-4 animate-spin" />
                <Send v-else class="h-4 w-4" />
                {{ form.enviando.value ? 'Enviando...' : 'Enviar respuestas' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Éxito al enviar -->
      <Transition name="fade">
        <div v-if="form.enviado.value && !form.mostrarAlerta.value"
          class="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
          <div class="bg-white rounded-2xl p-8 max-w-sm w-full text-center space-y-4 shadow-xl">
            <div class="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle2 class="h-8 w-8 text-green-600" />
            </div>
            <p class="font-semibold text-black text-lg">¡Cuestionario enviado!</p>
            <p class="text-sm text-muted">Tu dentista revisará tus respuestas.</p>
            <button class="w-full rounded-xl bg-accent text-white text-sm font-semibold py-2.5 hover:bg-accent/90 transition-all" @click="cerrarTrasExito">
              Entendido
            </button>
          </div>
        </div>
      </Transition>

      <!-- Alerta RN13 -->
      <Transition name="fade">
        <div v-if="form.mostrarAlerta.value" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
          <div class="bg-white rounded-2xl p-8 max-w-sm w-full shadow-xl space-y-4">
            <div class="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <AlertTriangle class="h-8 w-8 text-red-600" />
            </div>
            <p class="font-semibold text-black text-center text-lg">Atención</p>
            <p class="text-sm text-muted text-center leading-relaxed">
              Tus respuestas indican posibles complicaciones.
              <strong class="text-black">Contacta a tu dentista</strong> o acude a urgencias si el malestar es severo.
            </p>
            <button class="w-full rounded-xl bg-red-600 text-white text-sm font-semibold py-2.5 hover:bg-red-700 transition-all" @click="cerrarTrasAlerta">
              Entendido
            </button>
          </div>
        </div>
      </Transition>

      <!-- Confirmar salir sin enviar (trayectoria A) -->
      <Transition name="fade">
        <div v-if="form.mostrarSalir.value" class="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4">
          <div class="bg-white rounded-2xl p-6 max-w-xs w-full shadow-xl space-y-4">
            <p class="font-semibold text-black">¿Desea salir sin enviar respuestas?</p>
            <p class="text-sm text-muted">Tus respuestas no se guardarán.</p>
            <div class="flex gap-3">
              <button class="flex-1 rounded-xl border border-border text-sm py-2.5 hover:bg-surface transition-colors" @click="form.cancelarSalir()">
                Continuar
              </button>
              <button class="flex-1 rounded-xl bg-black text-white text-sm py-2.5 hover:bg-black/80 transition-colors" @click="confirmarSalir">
                Salir sin enviar
              </button>
            </div>
          </div>
        </div>
      </Transition>

    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useSessionStore } from '@/entities/session'
import { ROUTE_NAMES } from '@/shared/routes'
import {
  Loader2, AlertCircle, HeartPulse, Stethoscope, ClipboardList,
  ClipboardCheck, CheckCircle2, ChevronRight, X, Send, AlertTriangle,
} from 'lucide-vue-next'

import {
  seguimientoApi,
  type SeguimientoListItem,
  type SeguimientoDetalle,
  type TipoCuestionario,
} from '@/entities/seguimiento'
import { useResponderCuestionario, ControlPregunta } from '@/features/responder-cuestionario'

// ── Sesión ────────────────────────────────────────────────────────────────────
const sessionStore = useSessionStore()
const currentUserId = computed(() =>
  String((sessionStore.user as any)?.id ?? (sessionStore.user as any)?.id_usuario ?? 0),
)
const routeParams = computed(() => ({ id: currentUserId.value }))

// ── Lista ─────────────────────────────────────────────────────────────────────
const seguimientos  = ref<SeguimientoListItem[]>([])
const cargandoLista = ref(true)
const errorLista    = ref<string | null>(null)

async function cargarLista() {
  cargandoLista.value = true
  errorLista.value    = null
  try {
    // BUG FIX: el backend ahora filtra por paciente autenticado
    const res = await seguimientoApi.listar('en curso')
    seguimientos.value = res.seguimientos
  } catch {
    errorLista.value = 'No se pudo cargar la información. Intenta de nuevo.'
  } finally {
    cargandoLista.value = false
  }
}

onMounted(cargarLista)

// ── Detalle ───────────────────────────────────────────────────────────────────
const seguimientoSeleccionado = ref<SeguimientoListItem | null>(null)
const detalle                 = ref<SeguimientoDetalle | null>(null)
const cargandoDetalle         = ref(false)

async function seleccionarSeguimiento(s: SeguimientoListItem) {
  seguimientoSeleccionado.value = s
  detalle.value    = null
  cargandoDetalle.value = true
  try {
    const res = await seguimientoApi.obtener(s.id_seguimiento)
    detalle.value = res.seguimiento
  } finally {
    cargandoDetalle.value = false
  }
}

function volverALista() {
  seguimientoSeleccionado.value = null
  detalle.value = null
}

// ── Cuestionarios disponibles (solo los asignados por el dentista) ─────────────
const completados = ref<Set<TipoCuestionario>>(new Set())

const tiposCuestionario = computed(() => {
  const s = seguimientoSeleccionado.value
  if (!s) return []

  const tipos: { valor: TipoCuestionario; descripcion: string; completado: boolean }[] = []

  if (s.tiene_cuestionario_24h) {
    tipos.push({
      valor: '24h',
      descripcion: 'Evaluación a las 24 horas del procedimiento',
      completado: completados.value.has('24h'),
    })
  }

  if (s.tiene_cuestionario_72h) {
    tipos.push({
      valor: '72h',
      descripcion: 'Evaluación a las 72 horas del procedimiento',
      completado: completados.value.has('72h'),
    })
  }

  return tipos
})

// ── Modal ─────────────────────────────────────────────────────────────────────
const modalAbierto = ref(false)
const tipoActivo   = ref<TipoCuestionario>('24h')
const form = useResponderCuestionario()

async function abrirCuestionario(tipo: TipoCuestionario) {
  if (!seguimientoSeleccionado.value) return
  tipoActivo.value   = tipo
  form.resetear()          // ← limpiar estado antes de abrir
  modalAbierto.value = true
  await form.cargarCuestionario(seguimientoSeleccionado.value.id_seguimiento, tipo)
}

// BUG FIX: función unificada de cierre que controla modalAbierto correctamente
function intentarCerrarModal() {
  const hayRespuestasSinEnviar =
    form.estados.value.some(e => e.tocada) && !form.enviado.value

  if (hayRespuestasSinEnviar) {
    // Hay respuestas sin enviar → mostrar diálogo de confirmación
    form.mostrarSalir.value = true
  } else {
    // Formulario limpio o ya enviado → cerrar directamente
    modalAbierto.value = false
    form.resetear()
  }
}

function confirmarSalir() {
  form.mostrarSalir.value = false
  modalAbierto.value = false
  form.resetear()
}

async function enviar() {
  if (!seguimientoSeleccionado.value) return
  await form.enviar(seguimientoSeleccionado.value.id_seguimiento)
}

function cerrarTrasExito() {
  completados.value.add(tipoActivo.value)
  modalAbierto.value = false
  form.resetear()
}

function cerrarTrasAlerta() {
  form.mostrarAlerta.value = false
  completados.value.add(tipoActivo.value)
  modalAbierto.value = false
  form.resetear()
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function estadoClase(estado: string) {
  const mapa: Record<string, string> = {
    'en curso':   'bg-blue-100 text-blue-700',
    'alerta':     'bg-red-100 text-red-700',
    'finalizado': 'bg-gray-100 text-gray-600',
    'cancelado':  'bg-gray-100 text-gray-500',
  }
  return mapa[estado] ?? 'bg-gray-100 text-gray-600'
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<style scoped>
.fade-in { animation: fadeIn 0.25s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>