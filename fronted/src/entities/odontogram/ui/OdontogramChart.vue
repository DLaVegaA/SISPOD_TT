<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

interface Props {
  preview?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  preview: false,
})

type Surf = 'top' | 'bottom' | 'left' | 'right' | 'center'

type ToothState = {
  surfaces: Record<Surf, string | null>
  condition: string | null
}

const SURFS: Surf[] = ['top', 'bottom', 'left', 'right', 'center']
const STORAGE_KEY = 'odontogram_draft_v2'

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
let saveTimeout: number | undefined

const S = 36
const OFF = 10
const GAP = 4
const STEP = S + GAP
const PAD = 18
const W = 600
const H = 190
const CX = W / 2
const ROW_T = 18
const ROW_B = H / 2 + 10

const upperRight = [18, 17, 16, 15, 14, 13, 12, 11]
const upperLeft = [21, 22, 23, 24, 25, 26, 27, 28]
const lowerRight = [48, 47, 46, 45, 44, 43, 42, 41]
const lowerLeft = [31, 32, 33, 34, 35, 36, 37, 38]

function xPos(quadrant: 'ur' | 'ul' | 'lr' | 'll', i: number): number {
  if (quadrant === 'ur' || quadrant === 'lr') return CX - PAD - STEP * (i + 1)
  return CX + PAD + STEP * i
}

const teeth = [
  ...upperRight.map((num, i) => ({ num, x: xPos('ur', i), y: ROW_T })),
  ...upperLeft.map((num, i) => ({ num, x: xPos('ul', i), y: ROW_T })),
  ...lowerRight.map((num, i) => ({ num, x: xPos('lr', i), y: ROW_B })),
  ...lowerLeft.map((num, i) => ({ num, x: xPos('ll', i), y: ROW_B })),
]

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

function buildEmptyState(): Record<number, ToothState> {
  const next: Record<number, ToothState> = {}
  ;[...upperRight, ...upperLeft, ...lowerRight, ...lowerLeft].forEach((num) => {
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

function setTool(toolKey: string) {
  if (props.preview) return
  activeTool.value = toolKey
}

function resetAll() {
  if (props.preview) return
  initState()
  selectedTooth.value = null
}

function selectTooth(num: number) {
  if (props.preview) return
  selectedTooth.value = num
}

function handleSurfaceClick(num: number, surf: Surf) {
  if (props.preview) return
  selectTooth(num)
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
  const tooth = state.value[num]
  const val = tooth?.surfaces[surf]
  return ['surf', val ? `surf-${val}` : 'surf-healthy']
}

function isSelected(num: number) {
  return selectedTooth.value === num
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseToothState(value: unknown): ToothState | null {
  if (!isRecord(value) || !isRecord(value.surfaces)) return null
  const surfaces = value.surfaces as Record<string, unknown>
  return {
    surfaces: {
      top: typeof surfaces.top === 'string' ? surfaces.top : null,
      bottom: typeof surfaces.bottom === 'string' ? surfaces.bottom : null,
      left: typeof surfaces.left === 'string' ? surfaces.left : null,
      right: typeof surfaces.right === 'string' ? surfaces.right : null,
      center: typeof surfaces.center === 'string' ? surfaces.center : null,
    },
    condition: typeof value.condition === 'string' ? value.condition : null,
  }
}

function loadDraft() {
  if (typeof window === 'undefined') return
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (!isRecord(parsed) || !isRecord(parsed.state)) return
    const next = buildEmptyState()
    const savedState = parsed.state as Record<string, unknown>
    Object.keys(next).forEach((key) => {
      const saved = parseToothState(savedState[key])
      if (saved) next[Number(key)] = saved
    })
    state.value = next
    if (typeof parsed.selectedTooth === 'number' && next[parsed.selectedTooth])
      selectedTooth.value = parsed.selectedTooth
    if (typeof parsed.activeTool === 'string' && TOOL_COLORS[parsed.activeTool])
      activeTool.value = parsed.activeTool
  } catch {
    /* ignore */
  }
}

function setSaveStatus(status: 'idle' | 'saved' | 'error') {
  saveStatus.value = status
  if (saveTimeout) window.clearTimeout(saveTimeout)
  if (status !== 'idle') {
    saveTimeout = window.setTimeout(() => {
      saveStatus.value = 'idle'
    }, 2000)
  }
}

function saveDraft() {
  if (props.preview) return
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: state.value,
        selectedTooth: selectedTooth.value,
        activeTool: activeTool.value,
      }),
    )
    setSaveStatus('saved')
  } catch {
    setSaveStatus('error')
  }
}

onMounted(() => {
  loadDraft()
})

const selectedState = computed(() =>
  selectedTooth.value ? state.value[selectedTooth.value] : null,
)

const detailChips = computed(() => {
  if (!selectedTooth.value || !selectedState.value) return []
  const tooth = selectedState.value
  const chips = SURFS.map((surf) => {
    const val = tooth.surfaces[surf]
    return {
      key: surf,
      label: SURF_LABELS[surf],
      value: val ? (TOOL_LABELS[val] ?? val) : '-',
      color: val ? (TOOL_COLORS[val] ?? '') : '',
      active: Boolean(val),
    }
  })
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
  SURFS.forEach((surf) => {
    const val = tooth.surfaces[surf]
    if (!val) return
    items.push({
      label: TOOL_LABELS[val] ?? val,
      color: TOOL_COLORS[val] ?? '',
      surface: SURF_LABELS[surf],
    })
  })
  return items
})

const activeToolStyle = computed(() => (toolKey: string) => {
  if (activeTool.value !== toolKey) return {}
  return {
    borderColor: TOOL_COLORS[toolKey],
    color: TOOL_COLORS[toolKey],
    backgroundColor: TOOL_BG[toolKey] ?? 'rgba(0,0,0,0.04)',
  }
})

const saveMessage = computed(() => {
  if (saveStatus.value === 'saved') return 'Guardado'
  if (saveStatus.value === 'error') return 'Error'
  return ''
})
</script>

<template>
  <div class="odontogram-wrap px-2 sm:p-3 w-full min-w-0">
    <!-- Toolbar -->
    <div
      v-if="!preview"
      class="flex flex-wrap gap-1 p-1.5 sm:p-2 bg-gray-50 border border-gray-200 rounded-xl mb-2 sm:mb-3 items-center"
    >
      <!-- Surface tools -->
      <span class="text-[10px] text-gray-400 mr-0.5 hidden xs:inline">Superficie</span>
      <button
        v-for="tool in tools.filter((t) => t.group === 'surface')"
        :key="tool.key"
        type="button"
        class="tool-btn flex items-center gap-1 px-2 py-1 text-[10px] sm:text-[11px] font-medium border border-gray-200 rounded-lg bg-white text-gray-700 cursor-pointer hover:bg-gray-100 transition-all"
        :style="activeToolStyle(tool.key)"
        @click="setTool(tool.key)"
      >
        <span
          class="w-2 h-2 rounded-sm flex-shrink-0"
          :style="{ background: TOOL_COLORS[tool.key] }"
        />
        <!-- Full label on md+, short label on small screens -->
        <span class="hidden sm:inline">{{ tool.label }}</span>
        <span class="sm:hidden">{{ tool.shortLabel }}</span>
      </button>

      <div class="w-px h-5 bg-gray-200 mx-0.5" />

      <!-- Tooth tools -->
      <span class="text-[10px] text-gray-400 mr-0.5 hidden xs:inline">Diente</span>
      <button
        v-for="tool in tools.filter((t) => t.group === 'tooth')"
        :key="tool.key"
        type="button"
        class="tool-btn flex items-center gap-1 px-2 py-1 text-[10px] sm:text-[11px] font-medium border border-gray-200 rounded-lg bg-white text-gray-700 cursor-pointer hover:bg-gray-100 transition-all"
        :style="activeToolStyle(tool.key)"
        @click="setTool(tool.key)"
      >
        <span
          class="w-2 h-2 rounded-sm flex-shrink-0"
          :style="{ background: TOOL_COLORS[tool.key] }"
        />
        <span class="hidden sm:inline">{{ tool.label }}</span>
        <span class="sm:hidden">{{ tool.shortLabel }}</span>
      </button>

      <!-- Actions -->
      <div class="flex items-center gap-1 ml-auto">
        <button
          type="button"
          class="text-[10px] text-gray-400 px-2 py-1 border border-gray-200 rounded-lg bg-white hover:bg-gray-100 cursor-pointer"
          @click="resetAll"
        >
          <span class="hidden sm:inline">Limpiar todo</span>
          <span class="sm:hidden">Limpiar</span>
        </button>
        <button
          type="button"
          class="text-[10px] text-gray-400 px-2 py-1 border border-gray-200 rounded-lg bg-white hover:bg-gray-100 cursor-pointer"
          @click="saveDraft"
        >
          Guardar
        </button>
        <span v-if="saveStatus !== 'idle'" class="text-[10px] text-gray-400">
          {{ saveMessage }}
        </span>
      </div>
    </div>

    <!-- SVG chart -->
    <div
      class="bg-white border border-gray-200 rounded-xl px-1 sm:px-2 pt-2 pb-1 mb-2 sm:mb-3 min-w-0 overflow-hidden"
    >
      <div class="flex justify-between px-1 sm:px-2 pb-1">
        <span class="text-[8px] sm:text-[9px] text-gray-400 tracking-wider sm:tracking-widest"
          >SUP. DERECHO</span
        >
        <span class="text-[8px] sm:text-[9px] text-gray-400 tracking-wider sm:tracking-widest"
          >SUP. IZQUIERDO</span
        >
      </div>

      <!-- SVG scales automatically via viewBox + w-full, no height needed -->
      <svg
        class="w-full block"
        :viewBox="`0 0 ${W} ${H}`"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <line x1="0" :y1="H / 2" :x2="W" :y2="H / 2" class="midline-h" />
        <line :x1="CX" y1="0" :x2="CX" :y2="H" class="midline-v" />

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
            :key="`div-${idx}`"
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

      <div class="flex justify-between px-1 sm:px-2 pt-1">
        <span class="text-[8px] sm:text-[9px] text-gray-400 tracking-wider sm:tracking-widest"
          >INF. DERECHO</span
        >
        <span class="text-[8px] sm:text-[9px] text-gray-400 tracking-wider sm:tracking-widest"
          >INF. IZQUIERDO</span
        >
      </div>

      <!-- Legend -->
      <div
        v-if="!preview"
        class="flex flex-wrap gap-x-2 gap-y-1 pt-2 mt-1 border-t border-gray-100 pb-1"
      >
        <div
          v-for="tool in tools"
          :key="tool.key"
          class="flex items-center gap-1 text-[9px] sm:text-[10px] text-gray-500"
        >
          <span
            class="w-2 h-2 rounded-sm flex-shrink-0"
            :style="{ background: TOOL_COLORS[tool.key] }"
          />
          <span class="hidden sm:inline">{{ tool.label }}</span>
          <span class="sm:hidden">{{ tool.shortLabel }}</span>
        </div>
        <span class="ml-auto text-[9px] text-gray-300 hidden sm:inline"
          >clic derecho = limpiar</span
        >
      </div>
    </div>

    <!-- Detail panels — stack on mobile, side by side on sm+ -->
    <div v-if="!preview" class="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
      <!-- Surface detail -->
      <div class="bg-white border border-gray-200 rounded-xl p-2.5 sm:p-3">
        <p class="text-[11px] text-gray-400 mb-1.5">Superficies del diente</p>
        <div v-if="!selectedTooth" class="text-[11px] text-gray-400 italic">
          Haz clic en un diente para seleccionarlo
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

      <!-- Treatment list -->
      <div class="bg-white border border-gray-200 rounded-xl p-2.5 sm:p-3">
        <p class="text-[11px] text-gray-400 mb-1.5">Tratamientos registrados</p>
        <div v-if="!selectedTooth" class="text-[11px] text-gray-400 italic">Sin seleccion</div>
        <template v-else>
          <div v-if="treatmentItems.length === 0" class="text-[11px] text-gray-400 italic">
            Sin tratamientos registrados
          </div>
          <div v-else>
            <p class="text-[14px] sm:text-[15px] font-medium text-gray-900 mb-1">
              Diente #{{ selectedTooth }}
              <span class="text-[11px] font-normal text-gray-500">
                — {{ treatmentItems.length }} registro{{ treatmentItems.length > 1 ? 's' : '' }}
              </span>
            </p>
            <div
              v-for="(item, index) in treatmentItems"
              :key="`${item.label}-${index}`"
              class="flex items-center gap-2 py-1 border-b border-gray-100 text-[11px] sm:text-[12px] text-gray-900"
            >
              <span
                class="w-2 h-2 rounded-full flex-shrink-0"
                :style="{ background: item.color }"
              />
              <span>{{ item.label }}</span>
              <span class="ml-auto text-[10px] text-gray-400">{{ item.surface }}</span>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.odontogram-wrap {
  --tooth-bg: #f9fafb;
  --tooth-border: #d1d5db;
  --c-caries: #ef4444;
  --c-resto: #10b981;
  --c-sealant: #3b82f6;
  --c-fracture: #fbbf24;
  --c-crown: #a78bfa;
  --c-extracted: #f97316;
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

.tooth-g:hover .tooth-outline {
  stroke: #3b82f6;
}

.surf {
  transition: fill 0.1s;
}
.surf-healthy {
  fill: transparent;
}
.surf-caries {
  fill: var(--c-caries);
}
.surf-restoration {
  fill: var(--c-resto);
}
.surf-sealant {
  fill: var(--c-sealant);
}
.surf-fracture {
  fill: var(--c-fracture);
}
.surf-crown {
  fill: none;
  stroke: var(--c-crown);
  stroke-width: 2.5;
}
.xt-line {
  stroke: var(--c-extracted);
  stroke-width: 2.5;
  stroke-linecap: round;
}

.tnum {
  font-size: 7.5px;
  fill: #9ca3af;
  font-family: ui-monospace, monospace;
  pointer-events: none;
  user-select: none;
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
