<template>
  <div class="fade-in max-w-6xl mx-auto pb-16">
    <!-- ── Breadcrumb ──────────────────────────────────────────────── -->
    <div class="flex items-center gap-1.5 text-xs text-muted font-medium mb-8">
      <span class="text-muted/60">🏠</span>
      <span class="text-muted/60">&gt;</span>
      <button
        @click="volverALista"
        class="hover:text-black transition-colors"
        :class="{ 'text-black font-bold': !seguimientoSeleccionado }"
      >
        Seguimiento
      </button>
      <template v-if="seguimientoSeleccionado">
        <span class="text-muted/60">&gt;</span>
        <span class="bg-card border border-border px-2 py-0.5 rounded-lg text-black truncate max-w-[200px]">
          {{ seguimientoSeleccionado.procedimiento }}
        </span>
      </template>
    </div>

    <!-- ── Header ─────────────────────────────────────────────────── -->
    <div class="mb-10">
      <h1 class="font-display text-4xl font-bold text-black leading-tight">
        Seguimiento postoperatorio
      </h1>
      <p class="text-sm text-muted mt-2 max-w-2xl">
        Aquí puedes consultar el progreso de tus tratamientos, leer las indicaciones de tu dentista
        y completar tus cuestionarios de salud.
      </p>
    </div>

    <!-- Cargando -->
    <div v-if="cargandoLista" class="flex flex-col items-center justify-center py-24 gap-4 text-muted">
      <Loader2 class="h-8 w-8 animate-spin text-accent" />
      <span class="text-sm font-medium">Cargando tus seguimientos...</span>
    </div>

    <!-- Error -->
    <div
      v-else-if="errorLista"
      class="rounded-2xl border border-red-200 bg-red-50 p-6 flex items-start gap-4 text-sm text-red-700 max-w-2xl"
    >
      <AlertCircle class="h-6 w-6 shrink-0 text-red-500" />
      <div>
        <p class="font-bold text-base">Error de conexión</p>
        <p class="text-red-600/80 mt-1 leading-relaxed">{{ errorLista }}</p>
        <button
          class="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-colors"
          @click="cargarLista"
        >
          Reintentar ahora
        </button>
      </div>
    </div>

    <!-- Sin seguimientos -->
    <div
      v-else-if="!cargandoLista && seguimientos.length === 0"
      class="rounded-3xl border border-dashed border-border bg-card p-16 text-center shadow-sm max-w-2xl mx-auto"
    >
      <div class="w-20 h-20 bg-surface rounded-full flex items-center justify-center mx-auto mb-6">
        <HeartPulse class="h-10 w-10 text-muted/40" />
      </div>
      <h2 class="font-display text-xl font-bold text-black">Sin seguimiento activo</h2>
      <p class="text-sm text-muted mt-2 leading-relaxed">
        Actualmente no tienes procesos postoperatorios en curso. <br />
        Tu dentista los activará después de tus procedimientos.
      </p>
    </div>

    <!-- ── Vista A: lista ─────────────────────────────────────────── -->
    <template v-else-if="!seguimientoSeleccionado">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          v-for="s in seguimientos"
          :key="s.id_seguimiento"
          class="group w-full text-left rounded-3xl border border-border bg-card p-6 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5 transition-all active:scale-[0.98] flex flex-col justify-between"
          @click="seleccionarSeguimiento(s)"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-2xl bg-accent-dim flex items-center justify-center shrink-0">
                <Stethoscope class="h-6 w-6 text-accent" />
              </div>
              <div>
                <p class="font-display font-bold text-black text-lg">{{ s.procedimiento }}</p>
                <p class="text-xs text-muted font-medium mt-0.5">{{ s.nombre }}</p>
              </div>
            </div>
            <span
              :class="[
                'text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider',
                estadoClase(s.estado_seguimiento),
              ]"
            >
              {{ s.estado_seguimiento }}
            </span>
          </div>

          <div class="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <div class="flex gap-4 text-[10px] font-bold text-muted uppercase tracking-tight">
              <div class="flex items-center gap-1">
                <span class="opacity-50">Inicio:</span>
                <span>{{ formatFecha(s.fecha_inicio) }}</span>
              </div>
              <div class="flex items-center gap-1">
                <span class="opacity-50">Fin:</span>
                <span>{{ formatFecha(s.fecha_fin) }}</span>
              </div>
            </div>
            <div class="w-8 h-8 rounded-full bg-surface flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-colors">
              <ChevronRight class="h-4 w-4" />
            </div>
          </div>
        </button>
      </div>
    </template>

    <!-- ── Vista B: detalle ───────────────────────────────────────── -->
    <template v-else>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <!-- Columna izquierda: Info e Indicaciones -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Card de Estado Principal -->
          <div class="rounded-3xl border border-border bg-card p-6 shadow-sm flex flex-col sm:flex-row sm:items-center gap-6">
            <div class="w-16 h-16 rounded-2xl bg-accent-dim flex items-center justify-center shrink-0 mx-auto sm:mx-0">
              <Stethoscope class="h-8 w-8 text-accent" />
            </div>
            <div class="flex-1 text-center sm:text-left">
              <p class="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">
                Procedimiento actual
              </p>
              <h2 class="font-display text-2xl font-bold text-black">
                {{ seguimientoSeleccionado.procedimiento }}
              </h2>
              <div class="flex items-center justify-center sm:justify-start gap-2 mt-2">
                <span
                  :class="[
                    'text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider',
                    estadoClase(seguimientoSeleccionado.estado_seguimiento),
                  ]"
                >
                  {{ seguimientoSeleccionado.estado_seguimiento }}
                </span>
                <span class="text-xs text-muted font-medium">
                  Desde el {{ formatFecha(seguimientoSeleccionado.fecha_inicio) }}
                </span>
              </div>
            </div>
          </div>

          <div v-if="cargandoDetalle" class="flex items-center justify-center py-12 gap-3 text-muted">
            <Loader2 class="h-5 w-5 animate-spin text-accent" />
            <span class="text-sm font-medium">Cargando indicaciones...</span>
          </div>

          <!-- Indicaciones -->
          <div
            v-else-if="detalle && (detalle.plan_cuidados || detalle.indicaciones_medicas)"
            class="rounded-3xl border border-border bg-card overflow-hidden shadow-sm"
          >
            <div class="px-6 py-4 border-b border-border bg-surface/50">
              <h3 class="font-display font-bold text-black flex items-center gap-2">
                <ClipboardList class="h-5 w-5 text-accent" />
                Indicaciones de tu dentista
              </h3>
            </div>
            <div class="p-8 space-y-8">
              <div v-if="detalle.plan_cuidados" class="relative pl-6 border-l-2 border-accent/20">
                <p class="text-[10px] font-bold text-accent uppercase tracking-widest mb-2">Plan de cuidados</p>
                <p class="text-sm text-black leading-relaxed whitespace-pre-line font-medium">
                  {{ detalle.plan_cuidados }}
                </p>
              </div>
              <div v-if="detalle.indicaciones_medicas" class="relative pl-6 border-l-2 border-indigo-500/20">
                <p class="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-2">Indicaciones médicas</p>
                <p class="text-sm text-black leading-relaxed whitespace-pre-line font-medium">
                  {{ detalle.indicaciones_medicas }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Columna derecha: Cuestionarios -->
        <div class="space-y-6">
          <div class="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div class="flex items-center gap-3 mb-6">
              <div class="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <ClipboardCheck class="h-5 w-5 text-emerald-500" />
              </div>
              <h3 class="font-display font-bold text-black">Cuestionarios</h3>
            </div>

            <div v-if="tiposCuestionario.length === 0" class="text-center py-8">
              <ClipboardCheck class="h-12 w-12 mx-auto mb-4 text-muted/20" />
              <p class="text-sm font-bold text-black">Sin cuestionarios</p>
              <p class="text-xs text-muted mt-1 leading-relaxed">
                No hay evaluaciones pendientes para este seguimiento.
              </p>
            </div>

            <div v-else class="space-y-3">
              <button
                v-for="tipo in tiposCuestionario"
                :key="tipo.valor"
                :disabled="tipo.completado"
                :class="[
                  'w-full flex items-center justify-between p-4 rounded-2xl border transition-all',
                  tipo.completado
                    ? 'border-emerald-100 bg-emerald-50/30 cursor-default opacity-80'
                    : 'border-border bg-surface hover:border-accent/40 hover:shadow-md active:scale-[0.97]',
                ]"
                @click="!tipo.completado && abrirCuestionario(tipo.valor)"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <div
                    :class="[
                      'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                      tipo.completado ? 'bg-emerald-100' : 'bg-white border border-border',
                    ]"
                  >
                    <CheckCircle2 v-if="tipo.completado" class="h-5 w-5 text-emerald-600" />
                    <ClipboardCheck v-else class="h-5 w-5 text-muted/60" />
                  </div>
                  <div class="text-left min-w-0">
                    <p class="text-sm font-bold text-black">Eva. {{ tipo.valor }}</p>
                    <p class="text-[10px] text-muted font-medium truncate">Cuestionario postop.</p>
                  </div>
                </div>
                <span
                  :class="[
                    'text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-tight',
                    tipo.completado ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700',
                  ]"
                >
                  {{ tipo.completado ? 'Listo' : 'Pendiente' }}
                </span>
              </button>
            </div>

            <div class="mt-8 p-4 rounded-2xl bg-surface/50 border border-border/50">
              <div class="flex items-center gap-2 mb-2">
                <AlertTriangle class="h-4 w-4 text-amber-500" />
                <span class="text-xs font-bold text-black">¿Tienes dudas?</span>
              </div>
              <p class="text-[11px] text-muted leading-relaxed">
                Si presentas dolor intenso, sangrado persistente o fiebre, contacta de inmediato con
                tu dentista.
              </p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ════════════════════════════════════════════════════════════ -->
    <!-- Overlays (Teleport al body)                                 -->
    <!-- ════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <!-- Modal responder cuestionario (CU22) -->
      <Transition name="modal">
        <div
          v-if="modalAbierto"
          class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          @click.self="intentarCerrarModal"
        >
          <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="intentarCerrarModal" />
          <div class="relative w-full sm:max-w-xl bg-card rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl flex flex-col max-h-[95dvh] sm:max-h-[85dvh] overflow-hidden">
            <!-- Header Modal -->
            <div class="px-6 py-5 border-b border-border bg-surface/50 flex items-start justify-between gap-4">
              <div>
                <h3 class="font-display font-bold text-black text-lg">
                  {{ form.cuestionario.value?.nombre_cuestionario ?? `Evaluación ${tipoActivo}` }}
                </h3>
                <div class="flex items-center gap-2 mt-1">
                  <div class="flex-1 h-1.5 w-32 bg-border rounded-full overflow-hidden">
                    <div
                      class="h-full bg-accent transition-all duration-500"
                      :style="{ width: `${form.progresoPercent.value}%` }"
                    />
                  </div>
                  <span class="text-[10px] font-bold text-muted uppercase tracking-wider">
                    {{ form.preguntasRespondidas.value }} / {{ form.totalPreguntas.value }} completas
                  </span>
                </div>
              </div>
              <button
                class="p-2 rounded-xl hover:bg-surface text-muted hover:text-black transition-all"
                @click="intentarCerrarModal"
              >
                <X class="h-5 w-5" />
              </button>
            </div>

            <!-- Cuerpo Modal -->
            <div class="overflow-y-auto flex-1 px-6 py-8 custom-scrollbar">
              <div v-if="form.cargandoCuestionario.value" class="flex flex-col items-center justify-center py-20 gap-4 text-muted">
                <Loader2 class="h-8 w-8 animate-spin text-accent" />
                <span class="text-sm font-medium">Cargando preguntas...</span>
              </div>
              <div v-else-if="form.errorCarga.value" class="py-12 text-center">
                <AlertCircle class="h-10 w-10 text-red-400 mx-auto mb-4" />
                <p class="text-sm font-bold text-red-600">{{ form.errorCarga.value }}</p>
                <button @click="abrirCuestionario(tipoActivo)" class="mt-4 text-xs font-bold text-accent hover:underline">
                  Intentar de nuevo
                </button>
              </div>
              <div v-else class="space-y-12">
                <div
                  v-for="(estado, idx) in form.estados.value"
                  :key="estado.pregunta.id_pregunta_base"
                  class="relative"
                >
                  <div class="flex gap-4 mb-4">
                    <span class="shrink-0 w-8 h-8 rounded-xl bg-accent-dim text-accent text-xs font-bold flex items-center justify-center shadow-sm">
                      {{ idx + 1 }}
                    </span>
                    <h4 class="text-sm font-bold text-black leading-relaxed pt-1.5">
                      {{ estado.pregunta.texto_pregunta }}
                    </h4>
                  </div>
                  <div class="pl-12">
                    <ControlPregunta
                      :pregunta="estado.pregunta"
                      :model-value="estado.valor"
                      :tocada="estado.tocada"
                      @update:model-value="(v) => form.actualizarRespuesta(estado.pregunta.id_pregunta_base, v)"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer Modal -->
            <div class="p-6 border-t border-border bg-surface/50 space-y-3">
              <p
                v-if="form.intentoEnvio.value && !form.formularioCompleto.value"
                class="text-xs font-bold text-amber-600 text-center bg-amber-50 py-2 rounded-lg"
              >
                ⚠️ Por favor, responde todas las preguntas.
              </p>
              <p v-if="form.errorEnvio.value" class="text-xs font-bold text-red-600 text-center">
                {{ form.errorEnvio.value }}
              </p>
              <div class="flex gap-3">
                <button
                  class="flex-1 rounded-2xl border border-border text-sm font-bold py-3.5 hover:bg-surface transition-all active:scale-95"
                  @click="intentarCerrarModal"
                >
                  Cancelar
                </button>
                <button
                  :disabled="form.enviando.value || form.cargandoCuestionario.value"
                  class="flex-[2] flex items-center justify-center gap-2 rounded-2xl bg-accent text-white text-sm font-bold py-3.5 hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-accent/20 active:scale-95"
                  @click="enviar"
                >
                  <Loader2 v-if="form.enviando.value" class="h-4 w-4 animate-spin" />
                  <Send v-else class="h-4 w-4" />
                  {{ form.enviando.value ? 'Enviando...' : 'Finalizar Evaluación' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Éxito al enviar -->
      <Transition name="modal">
        <div v-if="form.enviado.value && !form.mostrarAlerta.value" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/60 backdrop-blur-md" />
          <div class="relative bg-card rounded-3xl p-10 max-w-sm w-full text-center shadow-2xl space-y-6">
            <div class="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 class="h-10 w-10 text-emerald-600" />
            </div>
            <div>
              <h3 class="font-display font-bold text-black text-2xl">¡Evaluación enviada!</h3>
              <p class="text-sm text-muted mt-2 leading-relaxed">
                Tus respuestas han sido registradas. Tu dentista revisará tu progreso en breve.
              </p>
            </div>
            <button
              class="w-full rounded-2xl bg-black text-white text-sm font-bold py-4 hover:bg-black/80 transition-all active:scale-95 shadow-xl"
              @click="cerrarTrasExito"
            >
              Entendido
            </button>
          </div>
        </div>
      </Transition>

      <!-- Alerta RN13 (Complicaciones) -->
      <Transition name="modal">
        <div v-if="form.mostrarAlerta.value" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-red-900/40 backdrop-blur-md" />
          <div class="relative bg-card rounded-3xl p-10 max-w-sm w-full shadow-2xl space-y-6 border border-red-100">
            <div class="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto shadow-inner animate-pulse">
              <AlertTriangle class="h-10 w-10 text-red-600" />
            </div>
            <div class="text-center">
              <h3 class="font-display font-bold text-black text-2xl">Atención Médica</h3>
              <p class="text-sm text-muted mt-3 leading-relaxed">
                Tus respuestas sugieren <span class="text-red-600 font-bold">posibles complicaciones</span>.
              </p>
              <div class="mt-4 p-4 bg-red-50 rounded-2xl border border-red-100">
                <p class="text-xs font-bold text-red-700 leading-relaxed">
                  Por favor, contacta a tu dentista de inmediato o acude a urgencias.
                </p>
              </div>
            </div>
            <button
              class="w-full rounded-2xl bg-red-600 text-white text-sm font-bold py-4 hover:bg-red-700 transition-all active:scale-95 shadow-xl shadow-red-600/20"
              @click="cerrarTrasAlerta"
            >
              He leído el aviso
            </button>
          </div>
        </div>
      </Transition>

      <!-- Confirmar salir sin enviar -->
      <Transition name="modal">
        <div v-if="form.mostrarSalir.value" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div class="relative bg-card rounded-3xl p-8 max-w-xs w-full shadow-2xl space-y-6 text-center">
            <div>
              <h4 class="font-display font-bold text-black text-xl">¿Deseas salir?</h4>
              <p class="text-sm text-muted mt-2">Tus respuestas actuales no se guardarán.</p>
            </div>
            <div class="flex flex-col gap-2">
              <button
                class="w-full rounded-2xl bg-black text-white text-sm font-bold py-3.5 hover:bg-black/80 transition-all active:scale-95"
                @click="confirmarSalir"
              >
                Salir sin guardar
              </button>
              <button
                class="w-full rounded-2xl border border-border text-sm font-bold py-3 hover:bg-surface transition-all"
                @click="form.cancelarSalir()"
              >
                Continuar evaluando
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
import { useSessionStore } from '@/entities/session'
import { ROUTE_NAMES } from '@/shared/routes'
import {
  Loader2,
  AlertCircle,
  HeartPulse,
  Stethoscope,
  ClipboardList,
  ClipboardCheck,
  CheckCircle2,
  ChevronRight,
  X,
  Send,
  AlertTriangle,
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

// ── Lista ─────────────────────────────────────────────────────────────────────
const seguimientos  = ref<SeguimientoListItem[]>([])
const cargandoLista = ref(true)
const errorLista    = ref<string | null>(null)

async function cargarLista() {
  cargandoLista.value = true
  errorLista.value    = null
  try {
    const res = await seguimientoApi.listar()
    seguimientos.value = res.seguimientos.filter(
      s => s.estado_seguimiento === 'en curso' || s.estado_seguimiento === 'alerta',
    )
  } catch (err: any) {
    console.error('[cargarLista] Error:', err)
    errorLista.value = 'No pudimos conectar con el servidor. Revisa tu internet e intenta de nuevo.'
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
  detalle.value                 = null
  cargandoDetalle.value         = true
  try {
    const res     = await seguimientoApi.obtener(s.id_seguimiento)
    detalle.value = res.seguimiento
  } finally {
    cargandoDetalle.value = false
  }
}

function volverALista() {
  seguimientoSeleccionado.value = null
  detalle.value                 = null
}

// ── Cuestionarios disponibles ──────────────────────────────────────────────────
const completados = ref<Set<TipoCuestionario>>(new Set())

const tiposCuestionario = computed(() => {
  const s = seguimientoSeleccionado.value
  const d = detalle.value
  if (!s) return []

  const tipos: { valor: TipoCuestionario; descripcion: string; completado: boolean }[] = []

  if (s.tiene_cuestionario_24h) {
    const isCompletado = d?.enviado_24h || s.enviado_24h || completados.value.has('24h')
    tipos.push({ valor: '24h', descripcion: 'Evaluación a las 24 horas del procedimiento', completado: !!isCompletado })
  }
  if (s.tiene_cuestionario_72h) {
    const isCompletado = d?.enviado_72h || s.enviado_72h || completados.value.has('72h')
    tipos.push({ valor: '72h', descripcion: 'Evaluación a las 72 horas del procedimiento', completado: !!isCompletado })
  }

  return tipos
})

// ── Modal Responder ─────────────────────────────────────────────────────────────
const modalAbierto = ref(false)
const tipoActivo   = ref<TipoCuestionario>('24h')
const form         = useResponderCuestionario()

async function abrirCuestionario(tipo: TipoCuestionario) {
  if (!seguimientoSeleccionado.value) return
  tipoActivo.value   = tipo
  form.resetear()
  modalAbierto.value = true
  await form.cargarCuestionario(seguimientoSeleccionado.value.id_seguimiento, tipo)
}

function intentarCerrarModal() {
  const hayRespuestasSinEnviar = form.estados.value.some(e => e.tocada) && !form.enviado.value
  if (hayRespuestasSinEnviar) {
    form.mostrarSalir.value = true
  } else {
    modalAbierto.value = false
    form.resetear()
  }
}

function confirmarSalir() {
  form.mostrarSalir.value = false
  modalAbierto.value      = false
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
    'en curso':  'bg-blue-100 text-blue-700',
    alerta:      'bg-red-100 text-red-700',
    finalizado:  'bg-emerald-100 text-emerald-700',
    cancelado:   'bg-gray-100 text-gray-500',
  }
  return mapa[estado] ?? 'bg-gray-100 text-gray-600'
}

function formatFecha(iso: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<style scoped>
.fade-in {
  animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0);    }
}

.modal-enter-active, .modal-leave-active { transition: all 0.3s ease; }
.modal-enter-from,   .modal-leave-to     { opacity: 0; }
.modal-enter-from .relative, .modal-leave-to .relative { transform: scale(0.95) translateY(20px); }

.custom-scrollbar::-webkit-scrollbar       { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
</style>