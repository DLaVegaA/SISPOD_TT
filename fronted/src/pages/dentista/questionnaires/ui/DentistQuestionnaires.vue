<template>
  <div class="fade-in">

    <!-- ── Header ─────────────────────────────────────────────────────── -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
      <div>
        <div class="flex items-center gap-1.5 text-xs text-muted font-medium mb-2">
          <RouterLink
            :to="{ name: ROUTE_NAMES.DENTIST_HOME, params: { id: route.params.id } }"
            class="text-muted/60 hover:text-black transition-colors"
          >🏠</RouterLink>
          <span class="text-muted/60">&gt;</span>
          <span class="bg-card border border-border px-2 py-0.5 rounded-lg">Cuestionarios</span>
        </div>
        <h1 class="font-display text-4xl font-semibold text-black">Cuestionarios</h1>
        <p class="text-sm text-muted mt-1">Biblioteca de plantillas de cuestionarios postoperatorios.</p>
      </div>

      <RouterLink
        :to="{ name: ROUTE_NAMES.DENTIST_NEW_QUESTIONNAIRES, params: { id: route.params.id } }"
        class="flex items-center justify-center gap-2 bg-ink/65 text-text-secondary hover:bg-ink/80 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all hover:scale-105 active:scale-95 shadow-sm shrink-0"
      >
        <Plus class="w-4 h-4" /> Crear Nuevo
      </RouterLink>
    </div>

    <!-- Error global -->
    <div v-if="errorMessage" class="mb-6 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-sm font-medium">
      <AlertCircle class="w-4 h-4 shrink-0" /> {{ errorMessage }}
    </div>

    <!-- ── Resumen ────────────────────────────────────────────────────── -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      <div class="bg-card border border-border rounded-2xl p-4 shadow-sm">
        <p class="text-xs text-muted font-bold uppercase tracking-wide">Total</p>
        <p class="text-2xl font-black text-black mt-1">{{ resumen.total }}</p>
        <p class="text-xs text-muted mt-1">Cuestionarios registrados</p>
      </div>
      <div class="bg-card border border-border rounded-2xl p-4 shadow-sm">
        <p class="text-xs text-muted font-bold uppercase tracking-wide">24 horas</p>
        <p class="text-2xl font-black text-black mt-1">{{ resumen.total24h }}</p>
        <p class="text-xs text-muted mt-1">Seguimiento temprano</p>
      </div>
      <div class="bg-card border border-border rounded-2xl p-4 shadow-sm">
        <p class="text-xs text-muted font-bold uppercase tracking-wide">72 horas</p>
        <p class="text-2xl font-black text-black mt-1">{{ resumen.total72h }}</p>
        <p class="text-xs text-muted mt-1">Seguimiento posterior</p>
      </div>
      <div class="bg-card border border-border rounded-2xl p-4 shadow-sm">
        <p class="text-xs text-muted font-bold uppercase tracking-wide">Activos</p>
        <p class="text-2xl font-black text-black mt-1">{{ resumen.totalActivos }}</p>
        <p class="text-xs text-muted mt-1">Disponibles para asignar</p>
      </div>
    </div>

    <!-- ── Toolbar ────────────────────────────────────────────────────── -->
    <div class="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-4 mb-6">
      <div class="relative w-full xl:max-w-md">
        <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/40" />
        <input
          v-model="searchQuery" type="text"
          placeholder="Buscar por nombre o procedimiento"
          class="w-full pl-11 pr-10 py-2.5 bg-card border border-border rounded-2xl text-sm text-black placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
        />
        <button v-if="searchQuery" class="absolute right-3 top-1/2 -translate-y-1/2 text-muted/40 hover:text-muted/70" @click="clearSearch">
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="flex items-center gap-3 overflow-x-auto pb-2 xl:pb-0">
        <div class="relative shrink-0">
          <select v-model="tipoFiltro"
            class="appearance-none bg-card border border-border rounded-2xl pl-4 pr-10 py-2.5 text-sm font-medium text-black focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all cursor-pointer shadow-sm">
            <option value="todos">Todos los tipos</option>
            <option value="24h">24 horas</option>
            <option value="72h">72 horas</option>
          </select>
          <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
        </div>
        <div class="relative shrink-0">
          <select v-model="estadoFiltro"
            class="appearance-none bg-card border border-border rounded-2xl pl-4 pr-10 py-2.5 text-sm font-medium text-black focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all cursor-pointer shadow-sm">
            <option value="todos">Todos los estados</option>
            <option value="Activo">Activos</option>
            <option value="Inactivo">Inactivos</option>
          </select>
          <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
        </div>
      </div>
    </div>

    <!-- ── Lista ──────────────────────────────────────────────────────── -->
    <div class="space-y-3">
      <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 gap-3 text-muted/50 bg-card rounded-2xl border border-border">
        <Loader2 class="w-8 h-8 animate-spin text-accent/50" />
        <p class="text-sm">Cargando cuestionarios...</p>
      </div>

      <div v-else-if="filteredCuestionarios.length === 0"
        class="bg-card border border-dashed border-border rounded-2xl py-20 flex flex-col items-center gap-2 text-muted/40">
        <FileText class="w-10 h-10" />
        <p class="text-sm">No se encontraron cuestionarios.</p>
      </div>

      <template v-else>
        <div v-for="item in filteredCuestionarios" :key="item.id_cuestionario"
          :class="['bg-card border rounded-2xl p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4 hover:shadow-sm transition-all group',
            item.estado === 'Inactivo' ? 'border-border opacity-60' : 'border-border hover:border-accent/20']">

          <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-center w-full">
            <!-- Nombre + descripción -->
            <div class="md:col-span-4">
              <p class="text-sm font-bold text-black truncate">{{ item.nombre_cuestionario }}</p>
              <p class="text-xs text-muted truncate mt-0.5">{{ item.descripcion || 'Sin descripción registrada' }}</p>
            </div>
            <!-- Procedimiento -->
            <div class="md:col-span-3">
              <p class="text-[10px] text-muted font-bold uppercase tracking-wide">Procedimiento</p>
              <p class="text-xs font-medium text-black truncate">{{ item.procedimiento }}</p>
            </div>
            <!-- Tipo -->
            <div class="md:col-span-1">
              <span :class="['inline-flex items-center justify-center rounded-lg px-2.5 py-1 text-xs font-bold border',
                item.tipo_cuestionario === '24h' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-purple-50 text-purple-700 border-purple-200']">
                {{ item.tipo_cuestionario }}
              </span>
            </div>
            <!-- Preguntas -->
            <div class="md:col-span-2">
              <p class="text-[10px] text-muted font-bold uppercase tracking-wide">Preguntas</p>
              <p class="text-xs font-medium text-black">
                {{ item.total_preguntas > 0 ? `${item.total_preguntas} pregunta${item.total_preguntas === 1 ? '' : 's'}` : '—' }}
              </p>
            </div>
            <!-- Estado -->
            <div class="md:col-span-2">
              <p class="text-[10px] text-muted font-bold uppercase tracking-wide">Estado</p>
              <span :class="['inline-flex rounded-lg px-2.5 py-1 text-xs font-bold border',
                item.estado === 'Activo' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-surface text-muted border-border']">
                {{ item.estado }}
              </span>
            </div>
          </div>

          <!-- Acciones -->
          <div class="flex items-center gap-2 shrink-0 justify-end">
            <button
              class="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-surface border border-border text-muted hover:text-black hover:border-accent/30 hover:bg-accent/5 transition-all text-xs font-bold"
              title="Ver preguntas" @click="abrirDetalle(item)">
              <Eye class="w-3.5 h-3.5" /> Ver
            </button>

            <button
              class="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-accent/10 border border-accent/20 text-accent hover:bg-accent hover:text-white transition-all text-xs font-bold"
              title="Descargar PDF" @click="descargarPdf(item)">
              <Download class="w-3.5 h-3.5" /> PDF
            </button>

            <button v-if="item.estado === 'Activo'"
              class="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-surface border border-border text-muted hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all text-xs font-bold"
              title="Desactivar cuestionario" @click="desactivarCuestionario(item)">
              <PowerOff class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </template>
    </div>

    <!-- ── Modal detalle ──────────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="cuestionarioSeleccionado"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          @click.self="cerrarDetalle">

          <div class="bg-white rounded-3xl shadow-xl w-full max-w-2xl border border-border overflow-hidden flex flex-col max-h-[90dvh]">

            <div class="px-6 py-5 border-b border-border flex items-start justify-between gap-4 shrink-0">
              <div>
                <h2 class="font-display text-2xl font-semibold text-black">
                  {{ cuestionarioSeleccionado.nombre_cuestionario }}
                </h2>
                <p class="text-sm text-muted mt-1">
                  {{ cuestionarioSeleccionado.procedimiento }} · {{ cuestionarioSeleccionado.tipo_cuestionario }}
                </p>
              </div>
              <button class="w-9 h-9 rounded-xl border border-border text-muted hover:text-black hover:bg-surface transition-all shrink-0"
                @click="cerrarDetalle">
                <X class="w-4 h-4 mx-auto" />
              </button>
            </div>

            <!-- Cuerpo: preguntas o loading -->
            <div class="flex-1 overflow-y-auto custom-scrollbar">
              <div v-if="isLoadingDetalle" class="flex flex-col items-center justify-center py-16 gap-3 text-muted/50">
                <Loader2 class="w-7 h-7 animate-spin text-accent/50" />
                <p class="text-sm">Cargando preguntas...</p>
              </div>

              <div v-else-if="cuestionarioSeleccionado.preguntas.length === 0"
                class="flex flex-col items-center justify-center py-16 gap-2 text-muted/40">
                <FileText class="w-8 h-8" />
                <p class="text-sm">Este cuestionario no tiene preguntas asignadas.</p>
              </div>

              <div v-else class="p-6 space-y-4">
                <div v-for="(pregunta, index) in cuestionarioSeleccionado.preguntas" :key="pregunta.id_pregunta_base"
                  class="p-4 rounded-2xl border border-border bg-surface">
                  <div class="flex items-start gap-3">
                    <span class="w-6 h-6 rounded-lg bg-accent/10 text-accent text-xs font-black flex items-center justify-center shrink-0">
                      {{ index + 1 }}
                    </span>
                    <div class="min-w-0">
                      <p class="text-sm font-bold text-black">{{ pregunta.texto_pregunta }}</p>
                      <div class="flex flex-wrap gap-2 mt-2">
                        <span class="text-[10px] px-2 py-0.5 rounded-lg bg-accent/10 text-accent border border-accent/20 font-bold">
                          {{ typeLabel(pregunta.tipo_control) }}
                        </span>
                        <span v-if="pregunta.valor_alerta"
                          class="text-[10px] px-2 py-0.5 rounded-lg bg-amber-100 text-amber-700 border border-amber-200 font-bold">
                          ⚠ Signo de alarma
                        </span>
                      </div>
                      <p v-if="pregunta.opciones?.length" class="text-xs text-muted mt-2">
                        <span class="font-bold">Opciones:</span> {{ pregunta.opciones.join(', ') }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="px-6 py-4 border-t border-border shrink-0 flex justify-end gap-3">
              <button class="px-4 py-2.5 rounded-2xl border border-border text-sm font-bold text-muted hover:text-black hover:bg-surface transition-all"
                @click="cerrarDetalle">Cerrar</button>
              <button
                :disabled="isLoadingDetalle || cuestionarioSeleccionado.preguntas.length === 0"
                class="px-4 py-2.5 rounded-2xl bg-accent text-white text-sm font-bold hover:bg-accent/90 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                @click="descargarPdf(cuestionarioSeleccionado)">
                <Download class="w-4 h-4" /> Descargar PDF
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
import { RouterLink, useRoute } from 'vue-router'
import { ROUTE_NAMES } from '@/shared/routes'
import { httpClient } from '@/shared/api/http'
import {
  AlertCircle, ChevronDown, Download, Eye, FileText,
  Loader2, Plus, PowerOff, Search, X,
} from 'lucide-vue-next'

// ─── Types ────────────────────────────────────────────────────────────────────

type TipoControl       = 'escala_1_10' | 'booleano_si_no' | 'texto_libre' | 'opcion_multiple'
type TipoCuestionario  = '24h' | '72h'
type EstadoCuestionario = 'Activo' | 'Inactivo'

interface Procedure { id_procedimiento: number; nombre_procedimiento: string }

interface PreguntaBiblioteca {
  id_pregunta_base: number
  texto_pregunta:   string
  tipo_control:     TipoControl
  opciones:         string[] | null
  valor_alerta:     Record<string, unknown> | null
}

interface CuestionarioBiblioteca {
  id_cuestionario:     number
  nombre_cuestionario: string
  descripcion:         string | null
  tipo_cuestionario:   TipoCuestionario
  procedimiento:       string
  total_preguntas:     number
  estado:              EstadoCuestionario
  fecha_creacion:      string
  preguntas:           PreguntaBiblioteca[]
}

// ─── State ────────────────────────────────────────────────────────────────────

const route        = useRoute()
const searchQuery  = ref('')
const tipoFiltro   = ref<'todos' | TipoCuestionario>('todos')
const estadoFiltro = ref<'todos' | EstadoCuestionario>('todos')
const isLoading    = ref(true)
const isLoadingDetalle = ref(false)
const errorMessage = ref<string | null>(null)

const cuestionarios           = ref<CuestionarioBiblioteca[]>([])
const cuestionarioSeleccionado = ref<CuestionarioBiblioteca | null>(null)

// ─── Computed ─────────────────────────────────────────────────────────────────

const filteredCuestionarios = computed(() => {
  let list = cuestionarios.value
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(item =>
      item.nombre_cuestionario.toLowerCase().includes(q) ||
      item.procedimiento.toLowerCase().includes(q)
    )
  }
  if (tipoFiltro.value !== 'todos')   list = list.filter(item => item.tipo_cuestionario === tipoFiltro.value)
  if (estadoFiltro.value !== 'todos') list = list.filter(item => item.estado === estadoFiltro.value)
  return list
})

const resumen = computed(() => ({
  total:        cuestionarios.value.length,
  total24h:     cuestionarios.value.filter(c => c.tipo_cuestionario === '24h').length,
  total72h:     cuestionarios.value.filter(c => c.tipo_cuestionario === '72h').length,
  totalActivos: cuestionarios.value.filter(c => c.estado === 'Activo').length,
}))

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchCuestionarios() {
  isLoading.value    = true
  errorMessage.value = null
  try {
    // Cargamos cuestionarios y catálogo de procedimientos en paralelo.
    // El endpoint GET /cuestionario no incluye el nombre del procedimiento,
    // por eso lo resolvemos localmente con el catálogo.
    const [resCuest, resProcs] = await Promise.all([
      httpClient.get<{ cuestionarios: any[] }>('/cuestionario?todos=true'),
      httpClient.get<{ listaCatalogo: Procedure[] }>('/catalogo-procedimientos'),
    ])

    const procMap = new Map<number, string>(
      (resProcs.listaCatalogo ?? []).map(p => [p.id_procedimiento, p.nombre_procedimiento])
    )

    cuestionarios.value = (resCuest.cuestionarios ?? []).map((c: any) => ({
      id_cuestionario:     c.id_cuestionario,
      nombre_cuestionario: c.nombre_cuestionario,
      descripcion:         c.descripcion ?? null,
      tipo_cuestionario:   c.tipo_cuestionario as TipoCuestionario,
      // Resolución local del nombre de procedimiento
      procedimiento: c.procedimiento_asociado?.nombre_procedimiento 
               ?? procMap.get(c.id_procedimiento) 
               ?? `Procedimiento #${c.id_procedimiento}`,
      // El backend devuelve el conteo si fue actualizado (ver snippet); si no, inicia en 0
      total_preguntas:     c.total_preguntas ?? 0,
      // `activo` en el modelo Sequelize → mapeamos a EstadoCuestionario
      estado:              c.activo === false ? 'Inactivo' : 'Activo' as EstadoCuestionario,
      fecha_creacion:      c.createdAt ?? c.created_at ?? '',
      // Las preguntas se cargan bajo demanda al abrir el detalle o el PDF
      preguntas:           [],
    }))
  } catch {
    errorMessage.value = 'No se pudieron cargar los cuestionarios. Intenta de nuevo.'
  } finally {
    isLoading.value = false
  }
}

// ─── Carga bajo demanda de preguntas ─────────────────────────────────────────

async function cargarPreguntas(id_cuestionario: number): Promise<PreguntaBiblioteca[]> {
  const res = await httpClient.get<{ preguntas: PreguntaBiblioteca[] }>(
    `/cuestionario/${id_cuestionario}/preguntas`
  )
  const preguntas = res.preguntas ?? []

  // Persistir en la lista local para no volver a pedirlas
  const idx = cuestionarios.value.findIndex(c => c.id_cuestionario === id_cuestionario)
  const cuest = idx !== -1 ? cuestionarios.value[idx] : undefined
  if (cuest) {
    cuest.preguntas       = preguntas
    cuest.total_preguntas = preguntas.length
  }

  return preguntas
}

// ─── Detalle ──────────────────────────────────────────────────────────────────

async function abrirDetalle(item: CuestionarioBiblioteca) {
  cuestionarioSeleccionado.value = { ...item }

  if (item.preguntas.length === 0) {
    isLoadingDetalle.value = true
    try {
      const preguntas = await cargarPreguntas(item.id_cuestionario)
      cuestionarioSeleccionado.value = {
        ...cuestionarioSeleccionado.value,
        preguntas,
        total_preguntas: preguntas.length,
      }
    } catch {
      // La modal abre igual; muestra estado vacío
    } finally {
      isLoadingDetalle.value = false
    }
  }
}

function cerrarDetalle() {
  cuestionarioSeleccionado.value = null
}

// ─── PDF ─────────────────────────────────────────────────────────────────────

async function descargarPdf(item: CuestionarioBiblioteca) {
  let preguntas = item.preguntas

  if (preguntas.length === 0) {
    try {
      preguntas = await cargarPreguntas(item.id_cuestionario)
      // Si el modal está abierto, actualizarlo también
      if (cuestionarioSeleccionado.value?.id_cuestionario === item.id_cuestionario) {
        cuestionarioSeleccionado.value.preguntas       = preguntas
        cuestionarioSeleccionado.value.total_preguntas = preguntas.length
      }
    } catch {
      errorMessage.value = 'No se pudieron cargar las preguntas para generar el PDF.'
      return
    }
  }

  const preguntasHtml = preguntas
    .map((pregunta, index) => {
      const opciones = pregunta.opciones?.length
        ? `<p class="options"><strong>Opciones:</strong> ${pregunta.opciones.join(', ')}</p>`
        : ''
      const alerta = pregunta.valor_alerta ? '<span class="alert">Signo de alarma</span>' : ''

      return `
        <div class="question">
          <div class="question-header">
            <span class="number">${index + 1}</span>
            <div>
              <p class="question-text">${escapeHtml(pregunta.texto_pregunta)}</p>
              <div class="chips">
                <span class="chip">${typeLabel(pregunta.tipo_control)}</span>
                ${alerta}
              </div>
              ${opciones}
            </div>
          </div>
        </div>
      `
    })
    .join('')

  const html = `
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(item.nombre_cuestionario)}</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: Arial, sans-serif; color: #111827; margin: 32px; line-height: 1.4; }
          .header { border-bottom: 2px solid #e5e7eb; padding-bottom: 18px; margin-bottom: 24px; }
          .eyebrow { font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: #6b7280; font-weight: 700; margin-bottom: 6px; }
          h1 { font-size: 24px; margin: 0 0 8px; }
          .meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 24px; font-size: 12px; color: #374151; margin-top: 16px; }
          .meta strong { color: #111827; }
          .description { margin-top: 14px; font-size: 13px; color: #4b5563; }
          .question { border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px; margin-bottom: 12px; break-inside: avoid; }
          .question-header { display: flex; gap: 12px; align-items: flex-start; }
          .number { width: 26px; height: 26px; border-radius: 8px; background: #eff6ff; color: #2563eb; font-size: 12px; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
          .question-text { font-size: 14px; font-weight: 700; margin: 0 0 8px; }
          .chips { display: flex; gap: 6px; flex-wrap: wrap; }
          .chip { font-size: 10px; font-weight: 700; color: #2563eb; background: #eff6ff; border: 1px solid #bfdbfe; padding: 3px 8px; border-radius: 999px; }
          .alert { font-size: 10px; font-weight: 700; color: #b45309; background: #fffbeb; border: 1px solid #fde68a; padding: 3px 8px; border-radius: 999px; }
          .options { font-size: 12px; margin: 8px 0 0; color: #4b5563; }
          .footer { margin-top: 28px; padding-top: 12px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 11px; }
          @media print { body { margin: 20mm; } }
        </style>
      </head>
      <body>
        <section class="header">
          <p class="eyebrow">Cuestionario postoperatorio</p>
          <h1>${escapeHtml(item.nombre_cuestionario)}</h1>
          <div class="meta">
            <div><strong>Procedimiento:</strong> ${escapeHtml(item.procedimiento)}</div>
            <div><strong>Tipo:</strong> ${item.tipo_cuestionario}</div>
            <div><strong>Preguntas:</strong> ${preguntas.length}</div>
            <div><strong>Estado:</strong> ${item.estado}</div>
          </div>
          ${item.descripcion ? `<p class="description">${escapeHtml(item.descripcion)}</p>` : ''}
        </section>
        <section>${preguntasHtml}</section>
        <section class="footer">
          Documento generado desde SISPOD · ${new Date().toLocaleDateString('es-MX')}. El cuestionario puede contener preguntas con signos de alarma clínica.
        </section>
        <script>window.addEventListener('load', () => { window.print() })<\/script>
      </body>
    </html>
  `

  const pdfWindow = window.open('', '_blank')
  if (!pdfWindow) {
    errorMessage.value = 'El navegador bloqueó la ventana emergente. Permite las ventanas emergentes para este sitio.'
    return
  }
  pdfWindow.document.open()
  pdfWindow.document.write(html)
  pdfWindow.document.close()
}

// ─── Desactivar ───────────────────────────────────────────────────────────────

async function desactivarCuestionario(item: CuestionarioBiblioteca) {
  const preview = item.nombre_cuestionario.length > 50
    ? item.nombre_cuestionario.substring(0, 50) + '...'
    : item.nombre_cuestionario

  if (!confirm(`¿Desactivar "${preview}"?\n\nYa no estará disponible para asignar a nuevos seguimientos. Los seguimientos existentes no se ven afectados.`)) return

  try {
    await httpClient.patch(`/cuestionario/${item.id_cuestionario}`, { activo: false })

    // Actualizar estado local sin recargar toda la lista
    const idx = cuestionarios.value.findIndex(c => c.id_cuestionario === item.id_cuestionario)
    const cuest = idx !== -1 ? cuestionarios.value[idx] : undefined
    if (cuest) cuest.estado = 'Inactivo'

    if (cuestionarioSeleccionado.value?.id_cuestionario === item.id_cuestionario) {
      cuestionarioSeleccionado.value.estado = 'Inactivo'
    }
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message ?? 'No se pudo desactivar el cuestionario.'
    setTimeout(() => { errorMessage.value = null }, 4000)
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clearSearch() { searchQuery.value = '' }

function typeLabel(type: TipoControl) {
  const labels: Record<TipoControl, string> = {
    escala_1_10:    'Escala 1–10',
    booleano_si_no: 'Sí / No',
    texto_libre:    'Texto libre',
    opcion_multiple: 'Opción múltiple',
  }
  return labels[type]
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

onMounted(() => { void fetchCuestionarios() })
</script>

<style scoped>
.fade-in { animation: fadeIn 0.25s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.custom-scrollbar::-webkit-scrollbar { width: 8px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.45); border-radius: 999px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(100, 116, 139, 0.6); }
</style>