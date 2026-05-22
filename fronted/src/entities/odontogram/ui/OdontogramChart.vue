<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

interface Props {
  preview?: boolean
  patientId?: string | number
  initialData?: unknown
}

const props = withDefaults(defineProps<Props>(), {
  preview: false,
  patientId: undefined,
  initialData: undefined,
})

const emit = defineEmits<{
  (event: 'save', payload: OdontogramaPayload): void
}>()

type Surf = 'top' | 'bottom' | 'left' | 'right' | 'center'
type ToothState = {
  surfaces: Record<Surf, string | null>
  condition: string | null
}

type OdontogramaItem = {
  num: number
  surfaces: Record<Surf, string | null>
  condition: string | null
}

type OdontogramaPayload = OdontogramaItem[]

const SURFS: Surf[] = ['top', 'bottom', 'left', 'right', 'center']

// Clave dinámica por paciente
const storageKey = computed(() => {
  if (!props.patientId) return 'odontogram_draft_v2' // fallback
  return `odontogram_patient_${props.patientId}`
})

const TOOL_COLORS: Record<string, string> = {
  caries: '#ef4444',
  restoration: '#10b981',
  sealant: '#3b82f6',
  fracture: '#fbbf24',
  crown: '#a78bfa',
  extracted: '#f97316',
}

const TOOL_BG: Record<string, string> = {
  caries: 'rgba(239, 68, 68, 0.12)',
  restoration: 'rgba(16, 185, 129, 0.12)',
  sealant: 'rgba(59, 130, 246, 0.12)',
  fracture: 'rgba(251, 191, 36, 0.12)',
  crown: 'rgba(167, 139, 250, 0.12)',
  extracted: 'rgba(249, 115, 22, 0.12)',
}

const TOOL_LABELS: Record<string, string> = {
  caries: 'Caries',
  restoration: 'Restauracion',
  sealant: 'Sellador',
  fracture: 'Fractura',
  crown: 'Corona',
  extracted: 'Extraido',
}

const SURF_LABELS: Record<Surf, string> = {
  top: 'Oclusal',
  bottom: 'Cervical',
  left: 'Mesial',
  right: 'Distal',
  center: 'Central',
}

const tools = [
  { key: 'caries', label: 'Caries', shortLabel: 'Car', group: 'surface' },
  { key: 'restoration', label: 'Restauracion', shortLabel: 'Res', group: 'surface' },
  { key: 'sealant', label: 'Sellador', shortLabel: 'Sel', group: 'surface' },
  { key: 'fracture', label: 'Fractura', shortLabel: 'Fra', group: 'surface' },
  { key: 'crown', label: 'Corona', shortLabel: 'Cor', group: 'tooth' },
  { key: 'extracted', label: 'Extraido', shortLabel: 'Ext', group: 'tooth' },
]

const activeTool = ref('caries')
const selectedTooth = ref<number | null>(null)
const state = ref<Record<number, ToothState>>({})
const saveStatus = ref<'idle' | 'saved' | 'error'>('idle')
const isMobile = ref(false)
let saveTimeout: number | undefined

// --- CONSTANTES DE DIBUJO ---
const S = 36
const OFF = 10
const GAP = 4
const STEP = S + GAP
const PAD = 18

// Detección de tamaño de pantalla
const updateLayout = () => {
  isMobile.value = window.innerWidth < 640
}

// Configuración dinámica del SVG
const viewConfig = computed(() => {
  if (isMobile.value) {
    return { w: STEP * 8 + PAD * 2, h: 340, rows: [20, 100, 180, 260] }
  }
  return { w: 700, h: 190, rows: [18, 105] } // Original
})

const upperRight = [18, 17, 16, 15, 14, 13, 12, 11]
const upperLeft = [21, 22, 23, 24, 25, 26, 27, 28]
const lowerRight = [48, 47, 46, 45, 44, 43, 42, 41]
const lowerLeft = [31, 32, 33, 34, 35, 36, 37, 38]
const allTeeth = [...upperRight, ...upperLeft, ...lowerRight, ...lowerLeft]
const mobileLabels = ['SUP. DERECHO', 'SUP. IZQUIERDO', 'INF. IZQUIERDO', 'INF. DERECHO']

const teeth = computed(() => {
  const { w, rows } = viewConfig.value
  const cx = w / 2

  if (isMobile.value) {
    const xPos = (i: number) => cx - STEP * 4 + STEP * i
    return [
      ...upperRight.map((num, i) => ({ num, x: xPos(i), y: rows[0], label: 'SUP. DERECHO' })),
      ...upperLeft.map((num, i) => ({ num, x: xPos(i), y: rows[1], label: 'SUP. IZQUIERDO' })),
      ...lowerLeft.map((num, i) => ({ num, x: xPos(i), y: rows[2], label: 'INF. IZQUIERDO' })),
      ...lowerRight.map((num, i) => ({ num, x: xPos(i), y: rows[3], label: 'INF. DERECHO' })),
    ]
  } else {
    const xPos = (q: string, i: number) =>
      q.includes('r') ? cx - PAD - STEP * (i + 1) : cx + PAD + STEP * i
    return [
      ...upperRight.map((num, i) => ({ num, x: xPos('ur', i), y: rows[0] })),
      ...upperLeft.map((num, i) => ({ num, x: xPos('ul', i), y: rows[0] })),
      ...lowerRight.map((num, i) => ({ num, x: xPos('lr', i), y: rows[1] })),
      ...lowerLeft.map((num, i) => ({ num, x: xPos('ll', i), y: rows[1] })),
    ]
  }
})

const surfacePoints = {
  top: `1,1 ${S - 1},1 ${S - OFF},${OFF} ${OFF},${OFF}`,
  bottom: `${OFF},${S - OFF} ${S - OFF},${S - OFF} ${S - 1},${S - 1} 1,${S - 1}`,
  left: `1,1 ${OFF},${OFF} ${OFF},${S - OFF} 1,${S - 1}`,
  right: `${S - OFF},${OFF} ${S - 1},1 ${S - 1},${S - 1} ${S - OFF},${S - OFF}`,
}

const centerRect = { x: OFF, y: OFF, w: S - OFF * 2, h: S - OFF * 2 }

const dividerLines = [
  { x1: OFF, y1: OFF, x2: S - OFF, y2: OFF },
  { x1: OFF, y1: S - OFF, x2: S - OFF, y2: S - OFF },
  { x1: OFF, y1: OFF, x2: OFF, y2: S - OFF },
  { x1: S - OFF, y1: OFF, x2: S - OFF, y2: S - OFF },
  { x1: 1, y1: 1, x2: OFF, y2: OFF },
  { x1: S - 1, y1: 1, x2: S - OFF, y2: OFF },
  { x1: 1, y1: S - 1, x2: OFF, y2: S - OFF },
  { x1: S - 1, y1: S - 1, x2: S - OFF, y2: S - OFF },
]

// --- LÓGICA DE ESTADO ---
function buildEmptyState(): Record<number, ToothState> {
  const next: Record<number, ToothState> = {}
  allTeeth.forEach((num) => {
    next[num] = {
      surfaces: { top: null, bottom: null, left: null, right: null, center: null },
      condition: null,
    }
  })
  return next
}

function initState() {
  state.value = buildEmptyState()
}
initState()

function buildPayload(): OdontogramaPayload {
  return allTeeth.map((num) => ({
    num,
    surfaces: {
      top: state.value[num]?.surfaces.top ?? null,
      bottom: state.value[num]?.surfaces.bottom ?? null,
      left: state.value[num]?.surfaces.left ?? null,
      right: state.value[num]?.surfaces.right ?? null,
      center: state.value[num]?.surfaces.center ?? null,
    },
    condition: state.value[num]?.condition ?? null,
  }))
}

function applyInitialData(data: unknown) {
  if (!data) return false
  const nextState = buildEmptyState()

  if (Array.isArray(data)) {
    data.forEach((item) => {
      if (!item || typeof item !== 'object') return
      const num = Number((item as OdontogramaItem).num)
      if (!nextState[num]) return
      const surfaces = (item as OdontogramaItem).surfaces
      nextState[num] = {
        surfaces: {
          top: surfaces?.top ?? null,
          bottom: surfaces?.bottom ?? null,
          left: surfaces?.left ?? null,
          right: surfaces?.right ?? null,
          center: surfaces?.center ?? null,
        },
        condition: (item as OdontogramaItem).condition ?? null,
      }
    })
    state.value = nextState
    return true
  }

  if (typeof data === 'object') {
    Object.entries(data as Record<string, ToothState>).forEach(([key, value]) => {
      const num = Number(key)
      if (!nextState[num] || typeof value !== 'object' || value === null) return
      nextState[num] = {
        surfaces: {
          top: value.surfaces?.top ?? null,
          bottom: value.surfaces?.bottom ?? null,
          left: value.surfaces?.left ?? null,
          right: value.surfaces?.right ?? null,
          center: value.surfaces?.center ?? null,
        },
        condition: value.condition ?? null,
      }
    })
    state.value = nextState
    return true
  }

  return false
}

function setTool(toolKey: string) {
  if (!props.preview) activeTool.value = toolKey
}
function resetAll() {
  if (!props.preview) {
    initState()
    selectedTooth.value = null
  }
  saveDraft()
}
function selectTooth(num: number) {
  // if (!props.preview) selectedTooth.value = num
  selectedTooth.value = num
}

function handleSurfaceClick(num: number, surf: Surf) {
  selectTooth(num) // siempre selecciona el diente

  if (props.preview) return // si es preview, no modifica nada más

  const tooth = state.value[num]
  if (!tooth) return
  const tool = activeTool.value
  if (tool === 'crown' || tool === 'extracted') {
    tooth.condition = tooth.condition === tool ? null : tool
  } else {
    tooth.surfaces[surf] = tooth.surfaces[surf] === tool ? null : tool
  }
}

function clearTooth(num: number) {
  if (props.preview) return
  state.value[num] = {
    surfaces: { top: null, bottom: null, left: null, right: null, center: null },
    condition: null,
  }
}

function surfaceClass(num: number, surf: Surf) {
  const val = state.value[num]?.surfaces[surf]
  return ['surf', val ? `surf-${val}` : 'surf-healthy']
}

function isSelected(num: number) {
  return selectedTooth.value === num
}

// Guardar borrador (solo si no es preview y hay patientId)
function saveDraft() {
  if (props.preview) return
  if (!props.patientId) return // no guardar si no hay paciente
  try {
    if (saveTimeout) window.clearTimeout(saveTimeout)
    window.localStorage.setItem(
      storageKey.value,
      JSON.stringify({
        state: state.value,
        selectedTooth: selectedTooth.value,
        activeTool: activeTool.value,
      }),
    )
    saveStatus.value = 'saved'
    saveTimeout = window.setTimeout(() => {
      saveStatus.value = 'idle'
      saveTimeout = undefined
    }, 2000)
  } catch {
    saveStatus.value = 'error'
  }
}
// Cargar borrador (solo si no preview y hay patientId)
function loadDraft() {
  if (!props.patientId) return
  try {
    const raw = window.localStorage.getItem(storageKey.value)
    if (!raw) return
    const parsed = JSON.parse(raw) as {
      state?: Record<string, ToothState>
      selectedTooth?: number | null
      activeTool?: string
    }
    const nextState = buildEmptyState()
    if (parsed.state) {
      Object.entries(parsed.state).forEach(([key, value]) => {
        const toothNum = Number(key)
        if (!nextState[toothNum] || typeof value !== 'object' || value === null) return
        const toothValue = value as ToothState
        nextState[toothNum] = {
          surfaces: {
            top: toothValue.surfaces?.top ?? null,
            bottom: toothValue.surfaces?.bottom ?? null,
            left: toothValue.surfaces?.left ?? null,
            right: toothValue.surfaces?.right ?? null,
            center: toothValue.surfaces?.center ?? null,
          },
          condition: toothValue.condition ?? null,
        }
      })
    }
    state.value = nextState
    selectedTooth.value = parsed.selectedTooth ?? null
    if (parsed.activeTool && parsed.activeTool in TOOL_COLORS) {
      activeTool.value = parsed.activeTool
    }
  } catch {
    saveStatus.value = 'error'
  }
}

function handleSave() {
  if (props.preview) return
  emit('save', buildPayload())
  saveDraft()
}

// En onMounted y onUnmounted igual, pero loadDraft ahora respeta preview y patientId
onMounted(() => {
  updateLayout()
  window.addEventListener('resize', updateLayout)
  if (!applyInitialData(props.initialData)) {
    loadDraft() // ya tiene las condiciones internas
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', updateLayout)
  if (saveTimeout) {
    window.clearTimeout(saveTimeout)
  }
})

watch(
  () => props.initialData,
  (value) => {
    if (!applyInitialData(value)) return
    if (!props.preview && props.patientId) {
      saveDraft()
    }
  },
)

const selectedState = computed(() =>
  selectedTooth.value ? state.value[selectedTooth.value] : null,
)

const detailChips = computed(() => {
  if (!selectedTooth.value || !selectedState.value) return []
  const tooth = selectedState.value
  const chips: Array<{
    key: Surf | 'condition'
    label: string
    value: string
    color: string
    active: boolean
  }> = SURFS.map((surf) => ({
    key: surf,
    label: SURF_LABELS[surf],
    value: tooth.surfaces[surf]
      ? (TOOL_LABELS[tooth.surfaces[surf]!] ?? tooth.surfaces[surf]!)
      : '-',
    color: tooth.surfaces[surf] ? (TOOL_COLORS[tooth.surfaces[surf]!] ?? '') : '',
    active: !!tooth.surfaces[surf],
  }))
  if (tooth.condition) {
    chips.push({
      key: 'condition',
      label: 'Diente',
      value: TOOL_LABELS[tooth.condition] ?? tooth.condition,
      color: TOOL_COLORS[tooth.condition] ?? '',
      active: true,
    })
  }
  return chips
})

const treatmentItems = computed(() => {
  if (!selectedTooth.value || !selectedState.value) return []
  const tooth = selectedState.value
  const items: Array<{ label: string; color: string; surface: string }> = []
  if (tooth.condition) {
    items.push({
      label: TOOL_LABELS[tooth.condition] ?? tooth.condition,
      color: TOOL_COLORS[tooth.condition] ?? '',
      surface: 'Diente completo',
    })
  }
  SURFS.forEach((s) => {
    if (tooth.surfaces[s]) {
      items.push({
        label: TOOL_LABELS[tooth.surfaces[s]!] ?? tooth.surfaces[s]!,
        color: TOOL_COLORS[tooth.surfaces[s]!] ?? '',
        surface: SURF_LABELS[s],
      })
    }
  })
  return items
})

const activeToolStyle = computed(() => (toolKey: string) => {
  if (activeTool.value !== toolKey) return {}
  return {
    borderColor: TOOL_COLORS[toolKey],
    color: TOOL_COLORS[toolKey],
    backgroundColor: TOOL_BG[toolKey],
  }
})
</script>

<template>
  <div class="odontogram-wrap px-2 sm:p-3 w-full min-w-0">
    <!-- Toolbar (Original) -->
    <div
      v-if="!preview"
      class="flex flex-wrap gap-1 p-1.5 sm:p-2 bg-gray-50 border border-gray-200 rounded-xl mb-2 sm:mb-3 items-center"
    >
      <button
        v-for="tool in tools"
        :key="tool.key"
        class="tool-btn flex items-center gap-1 px-2 py-1 text-[10px] sm:text-[11px] font-medium border border-gray-200 rounded-lg bg-white text-gray-700 cursor-pointer hover:bg-gray-100 transition-all"
        :style="activeToolStyle(tool.key)"
        @click="setTool(tool.key)"
      >
        <span class="w-2 h-2 rounded-sm shrink-0" :style="{ background: TOOL_COLORS[tool.key] }" />
        <span class="hidden sm:inline">{{ tool.label }}</span>
        <span class="sm:hidden">{{ tool.shortLabel }}</span>
      </button>
      <div class="flex items-center gap-1 ml-auto">
        <button
          class="text-[10px] text-gray-400 px-2 py-1 border border-gray-200 rounded-lg bg-white hover:bg-gray-100 cursor-pointer"
          @click="resetAll"
        >
          Limpiar
        </button>
        <button
          class="text-[10px] text-gray-400 px-2 py-1 border border-gray-200 rounded-lg bg-white hover:bg-gray-100 cursor-pointer"
          @click="handleSave"
        >
          Guardar
        </button>
      </div>
    </div>

    <!-- SVG Dinámico -->
    <div
      class="bg-white border border-gray-200 rounded-xl px-1 sm:px-2 pt-2 pb-1 mb-2 sm:mb-3 min-w-0 overflow-hidden"
    >
      <!-- Etiquetas superiores (Solo Desktop) -->
      <div v-if="!isMobile" class="flex justify-between px-1 sm:px-2 pb-1">
        <span class="text-[8px] sm:text-[9px] text-gray-400 tracking-wider">SUP. DERECHO</span>
        <span class="text-[8px] sm:text-[9px] text-gray-400 tracking-wider">SUP. IZQUIERDO</span>
      </div>

      <svg
        class="w-full block"
        :viewBox="`0 0 ${viewConfig.w} ${viewConfig.h}`"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <!-- Guías Desktop -->
        <template v-if="!isMobile">
          <line
            x1="0"
            :y1="viewConfig.h / 2"
            :x2="viewConfig.w"
            :y2="viewConfig.h / 2"
            class="midline-h"
          />
          <line
            :x1="viewConfig.w / 2"
            y1="0"
            :x2="viewConfig.w / 2"
            :y2="viewConfig.h"
            class="midline-v"
          />
        </template>

        <!-- Etiquetas de Fila (Solo Móvil) -->
        <template v-else>
          <text
            v-for="(label, idx) in mobileLabels"
            :key="idx"
            :x="viewConfig.w / 2 - 100"
            :y="(viewConfig.rows[idx] ?? 0) - 8"
            class="row-text"
          >
            {{ label }}
          </text>
        </template>

        <g
          v-for="tooth in teeth"
          :key="tooth.num"
          :class="['tooth-g', isSelected(tooth.num) ? 'selected' : '']"
          :transform="`translate(${tooth.x},${tooth.y})`"
          @click="selectTooth(tooth.num)"
          @contextmenu.prevent="clearTooth(tooth.num)"
        >
          <rect x="1" y="1" :width="S - 2" :height="S - 2" rx="4" class="tooth-outline" />
          <polygon
            :points="surfacePoints.top"
            :class="surfaceClass(tooth.num, 'top')"
            @click.stop="handleSurfaceClick(tooth.num, 'top')"
          />
          <polygon
            :points="surfacePoints.bottom"
            :class="surfaceClass(tooth.num, 'bottom')"
            @click.stop="handleSurfaceClick(tooth.num, 'bottom')"
          />
          <polygon
            :points="surfacePoints.left"
            :class="surfaceClass(tooth.num, 'left')"
            @click.stop="handleSurfaceClick(tooth.num, 'left')"
          />
          <polygon
            :points="surfacePoints.right"
            :class="surfaceClass(tooth.num, 'right')"
            @click.stop="handleSurfaceClick(tooth.num, 'right')"
          />
          <rect
            :x="centerRect.x"
            :y="centerRect.y"
            :width="centerRect.w"
            :height="centerRect.h"
            :class="surfaceClass(tooth.num, 'center')"
            @click.stop="handleSurfaceClick(tooth.num, 'center')"
          />
          <line
            v-for="(line, idx) in dividerLines"
            :key="idx"
            class="tooth-divider"
            :x1="line.x1"
            :y1="line.y1"
            :x2="line.x2"
            :y2="line.y2"
          />

          <template v-if="state[tooth.num]?.condition === 'extracted'">
            <line x1="5" y1="5" :x2="S - 5" :y2="S - 5" class="xt-line" />
            <line :x1="S - 5" y1="5" x2="5" :y2="S - 5" class="xt-line" />
          </template>
          <rect
            v-if="state[tooth.num]?.condition === 'crown'"
            x="3"
            y="3"
            :width="S - 6"
            :height="S - 6"
            rx="3"
            class="surf-crown"
          />
          <text
            :class="['tnum', isSelected(tooth.num) ? 'tnum-selected' : '']"
            :x="S / 2"
            :y="S + 10"
            text-anchor="middle"
          >
            {{ tooth.num }}
          </text>
        </g>
      </svg>

      <!-- Etiquetas inferiores (Solo Desktop) -->
      <div v-if="!isMobile" class="flex justify-between px-1 sm:px-2 pt-1">
        <span class="text-[8px] sm:text-[9px] text-gray-400 tracking-wider">INF. DERECHO</span>
        <span class="text-[8px] sm:text-[9px] text-gray-400 tracking-wider">INF. IZQUIERDO</span>
      </div>
    </div>

    <!-- Paneles de Detalles (Originales) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
      <div class="bg-white border border-gray-200 rounded-xl p-2.5 sm:p-3">
        <p class="text-[11px] text-gray-400 mb-1.5">Superficies del diente</p>
        <div v-if="!selectedTooth" class="text-[11px] text-gray-400 italic">
          Haz clic en un diente
        </div>
        <div v-else>
          <p class="text-[14px] sm:text-[15px] font-medium text-gray-900 mb-1">
            Diente #{{ selectedTooth }}
          </p>
          <div class="flex flex-wrap">
            <span
              v-for="chip in detailChips"
              :key="chip.key"
              class="inline-block px-2 py-0.5 rounded text-[10px] font-medium border mr-1 mb-1"
              :class="
                chip.active ? 'text-white border-transparent' : 'text-gray-500 border-gray-200'
              "
              :style="chip.active ? { background: chip.color } : { background: '#f3f4f6' }"
            >
              {{ chip.label }}: {{ chip.value }}
            </span>
          </div>
        </div>
      </div>

      <div class="bg-white border border-gray-200 rounded-xl p-2.5 sm:p-3">
        <p class="text-[11px] text-gray-400 mb-1.5">Tratamientos registrados</p>
        <div
          v-if="!selectedTooth || treatmentItems.length === 0"
          class="text-[11px] text-gray-400 italic"
        >
          Sin registros
        </div>
        <div v-else>
          <p class="text-[14px] sm:text-[15px] font-medium text-gray-900 mb-1">
            Diente #{{ selectedTooth }}
          </p>
          <div
            v-for="(item, idx) in treatmentItems"
            :key="idx"
            class="flex items-center gap-2 py-1 border-b border-gray-100 text-[11px] text-gray-900"
          >
            <span class="w-2 h-2 rounded-full shrink-0" :style="{ background: item.color }" />
            <span>{{ item.label }}</span>
            <span class="ml-auto text-[10px] text-gray-400">{{ item.surface }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.odontogram-wrap {
  --tooth-bg: #f9fafb;
  --tooth-border: #d1d5db;
}
.row-text {
  font-size: 8px;
  fill: #9ca3af;
  font-weight: bold;
}
.tooth-outline {
  fill: var(--tooth-bg);
  stroke: var(--tooth-border);
  stroke-width: 1.5;
  transition:
    stroke 0.12s,
    fill 0.12s;
}
.tooth-divider {
  stroke: #c0bfba;
  stroke-width: 0.8;
  pointer-events: none;
}
.tooth-g {
  cursor: pointer;
}
.tooth-g.selected .tooth-outline {
  stroke: #7c3aed;
  stroke-width: 2;
  fill: #ede9fe;
}
.surf-healthy {
  fill: transparent;
}
.surf-caries {
  fill: #ef4444;
}
.surf-restoration {
  fill: #10b981;
}
.surf-sealant {
  fill: #3b82f6;
}
.surf-fracture {
  fill: #fbbf24;
}
.surf-crown {
  fill: none;
  stroke: #a78bfa;
  stroke-width: 2.5;
}
.xt-line {
  stroke: #f97316;
  stroke-width: 2.5;
  stroke-linecap: round;
}
.tnum {
  font-size: 7.5px;
  fill: #9ca3af;
  font-family: ui-monospace, monospace;
}
.tnum-selected {
  fill: #7c3aed;
  font-weight: bold;
}
.midline-h,
.midline-v {
  stroke: #e5e7eb;
  stroke-width: 0.5;
  stroke-dasharray: 3 3;
}
</style>
