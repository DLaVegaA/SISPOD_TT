<template>
  <div class="fade-in max-w-7xl mx-auto pb-10 px-4 sm:px-6 lg:px-8">
    <!-- ── Header ─────────────────────────────────────────────────────── -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pt-6">
      <div>
        <div class="flex items-center gap-1.5 text-xs text-muted font-medium mb-2">
          <RouterLink
            :to="{ name: ROUTE_NAMES.DENTIST_HOME, params: routeParams }"
            class="text-muted/60 hover:text-black transition-colors"
          >
            🏠
          </RouterLink>
          <span class="text-muted/60">&gt;</span>
          <RouterLink
            :to="{ name: ROUTE_NAMES.DENTIST_QUESTIONNAIRES, params: routeParams }"
            class="hover:text-black transition-colors"
          >
            Cuestionarios
          </RouterLink>
          <span class="text-muted/60">&gt;</span>
          <span class="bg-card border border-border px-2 py-0.5 rounded-lg">Nuevo Cuestionario</span>
        </div>

        <h1 class="font-display text-4xl font-semibold text-black">Nuevo Cuestionario</h1>
        <p class="text-sm text-muted mt-1">
          Selecciona preguntas del banco y arrástralas al cuestionario. El banco se filtra según el tipo seleccionado.
        </p>
      </div>
    </div>

    <div
      v-if="successMessage"
      class="mb-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 flex items-center gap-2"
    >
      <CheckCircle2 class="w-4 h-4 shrink-0" />
      {{ successMessage }}
    </div>

    <div
      v-if="errorMessage"
      class="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2"
    >
      <AlertCircle class="w-4 h-4 shrink-0" />
      {{ errorMessage }}
    </div>

    <!-- ── Columns ────────────────────────────────────────────────────── -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- ── Left Column — Builder / Drop Zone ─────────────────────────── -->
      <div
        class="lg:col-span-7 bg-card p-6 rounded-3xl border border-border flex flex-col gap-6 shadow-sm min-h-[40rem] lg:h-[calc(100vh-9rem)] lg:sticky lg:top-6"
      >
        <header class="flex flex-col gap-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-[10px] font-bold text-muted uppercase tracking-wide mb-1">
                Nombre del cuestionario
              </label>
              <input
                v-model="form.nombre_cuestionario"
                type="text"
                placeholder="Ej. Seguimiento 24h - Exodoncia"
                class="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm font-semibold text-black placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              />
              <p v-if="formErrors.nombre_cuestionario" class="text-xs text-red-500 mt-1">
                {{ formErrors.nombre_cuestionario }}
              </p>
            </div>

            <div>
              <label class="block text-[10px] font-bold text-muted uppercase tracking-wide mb-1">
                Tipo de cuestionario
              </label>
              <div class="relative w-full">
                <select
                  v-model="form.tipo_cuestionario"
                  class="appearance-none w-full bg-surface border border-border rounded-xl pl-4 pr-10 py-2.5 text-sm font-semibold text-black focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all cursor-pointer"
                >
                  <option value="24h">Cuestionario de 24hrs</option>
                  <option value="72h">Cuestionario de 72hrs</option>
                </select>
                <ChevronDown
                  class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none"
                />
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-[10px] font-bold text-muted uppercase tracking-wide mb-1">
                Procedimiento
              </label>
              <div class="relative w-full">
                <select
                  v-model.number="form.id_procedimiento"
                  :disabled="isLoadingProcedures"
                  class="appearance-none w-full bg-surface border border-border rounded-xl pl-4 pr-10 py-2.5 text-sm font-semibold text-black focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all cursor-pointer disabled:opacity-60"
                >
                  <option :value="null" disabled>
                    {{ isLoadingProcedures ? 'Cargando procedimientos...' : 'Selecciona un procedimiento' }}
                  </option>
                  <option
                    v-for="procedure in procedures"
                    :key="procedure.id_procedimiento"
                    :value="procedure.id_procedimiento"
                  >
                    {{ procedure.nombre_procedimiento }}
                  </option>
                </select>
                <ChevronDown
                  class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none"
                />
              </div>
              <p v-if="formErrors.id_procedimiento" class="text-xs text-red-500 mt-1">
                {{ formErrors.id_procedimiento }}
              </p>
            </div>

            <div>
              <label class="block text-[10px] font-bold text-muted uppercase tracking-wide mb-1">
                Descripción
              </label>
              <input
                v-model="form.descripcion"
                type="text"
                placeholder="Descripción opcional"
                class="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm font-semibold text-black placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              />
            </div>
          </div>

          <div class="rounded-2xl border border-accent/20 bg-accent/5 px-4 py-3">
            <p class="text-xs text-muted">
              Mostrando preguntas compatibles con
              <strong class="text-accent">{{ form.tipo_cuestionario }}</strong>.
              Las preguntas marcadas como <strong>24h / 72h</strong> pueden usarse en ambos cuestionarios.
            </p>
          </div>
        </header>

        <!-- Drop zone -->
        <div
          class="flex-1 space-y-3 rounded-2xl p-1 transition-colors lg:overflow-y-auto lg:pr-2 lg:custom-scrollbar"
          :class="{ 'bg-accent/5 border-2 border-dashed border-accent/30': isDragging }"
          @dragover.prevent="onDragOver"
          @dragleave="onDragLeave"
          @drop="onDrop"
        >
          <div
            v-if="currentQuestionnaire.questions.length === 0"
            class="flex flex-col items-center justify-center h-full text-center py-20 gap-4 text-muted/30 border-2 border-dashed border-border rounded-2xl"
          >
            <ClipboardList class="w-16 h-16" />
            <p class="font-medium text-sm">Arrastra preguntas aquí para construir tu cuestionario</p>
          </div>

          <template v-else>
            <div
              v-for="(item, index) in currentQuestionnaire.questions"
              :key="item.id"
              class="bg-surface border border-border rounded-xl p-4 flex items-center justify-between gap-4 group hover:border-accent/20 transition-colors"
            >
              <div class="flex items-center gap-3 w-full min-w-0">
                <span class="text-xs font-bold text-muted/60 shrink-0 w-5">{{ index + 1 }}.</span>

                <div class="min-w-0">
                  <p class="text-sm font-medium text-black truncate w-full">{{ item.text }}</p>

                  <div class="flex items-center gap-2 mt-1 flex-wrap">
                    <span
                      class="bg-accent/10 text-accent border border-accent/20 px-2 py-0.5 rounded-lg text-[10px] font-medium"
                    >
                      {{ typeLabel(item.controlType) }}
                    </span>

                    <span
                      v-for="questionnaireType in item.questionnaireTypes"
                      :key="questionnaireType"
                      class="bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-lg text-[10px] font-medium"
                    >
                      {{ questionnaireType }}
                    </span>

                    <span
                      v-if="item.alertValue"
                      class="bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-lg text-[10px] font-medium"
                    >
                      ⚠ Signo de alarma
                    </span>
                  </div>
                </div>
              </div>

              <button
                class="w-8 h-8 rounded-xl bg-card border border-border text-muted hover:text-red-500 hover:border-red-200 hover:bg-red-50 flex items-center justify-center transition-all shrink-0"
                title="Quitar pregunta"
                @click="removeQuestionFromBuilder(item.id)"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </template>
        </div>

        <footer class="mt-2 pt-6 border-t border-border">
          <button
            :disabled="isSaving || currentQuestionnaire.questions.length === 0"
            class="w-full flex items-center justify-center gap-2 bg-accent/10 text-accent border border-accent/20 hover:bg-accent hover:text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-accent/10 disabled:hover:text-accent disabled:hover:scale-100"
            @click="saveQuestionnaire"
          >
            <Loader2 v-if="isSaving" class="w-4 h-4 animate-spin" />
            <Save v-else class="w-4 h-4" />
            {{ isSaving ? 'Guardando...' : `Guardar Cuestionario (${currentQuestionnaire.questions.length})` }}
          </button>
        </footer>
      </div>

      <!-- ── Right Column — Questions Pool ─────────────────────────────── -->
      <div
        class="lg:col-span-5 bg-surface/60 p-6 rounded-3xl border border-border flex flex-col gap-6 shadow-sm min-h-[40rem] lg:h-[calc(100vh-9rem)]"
      >
        <header class="flex flex-col gap-4">
          <div class="flex items-center justify-between gap-2">
            <h2 class="font-display font-bold text-black text-base">Mis Preguntas</h2>
            <button
              class="flex items-center gap-1.5 text-xs font-bold text-accent hover:text-accent/70 transition-colors"
              @click="openQuestionModal"
            >
              <Plus class="w-3.5 h-3.5" />
              Crear Pregunta
            </button>
          </div>

          <div class="relative w-full">
            <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/40" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar pregunta compatible..."
              class="w-full pl-11 pr-4 py-2.5 bg-card border border-border rounded-2xl text-sm text-black placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
            />
          </div>
        </header>

        <div class="flex-1 space-y-3 lg:overflow-y-auto lg:pr-2 lg:custom-scrollbar">
          <div
            v-for="item in availableQuestionsFiltered"
            :key="item.id"
            class="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4 cursor-grab transition-all active:cursor-grabbing hover:border-accent/30 hover:shadow-sm group relative lg:min-h-[6.5rem]"
            draggable="true"
            @dragstart="onDragStart($event, item)"
            @dragend="onDragEnd"
          >
            <div class="flex flex-col gap-1.5 w-full min-w-0 pr-20">
              <p class="text-sm font-semibold text-black line-clamp-2">{{ item.text }}</p>

              <div class="text-[10px] text-muted flex items-center gap-1 flex-wrap">
                <span class="font-bold text-black/70">Tipo:</span>

                <span
                  class="bg-accent/10 text-accent border border-accent/20 px-2 py-0.5 rounded-lg ml-0.5 font-medium"
                >
                  {{ typeLabel(item.controlType) }}
                </span>

                <span
                  v-for="questionnaireType in item.questionnaireTypes"
                  :key="questionnaireType"
                  class="bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-lg font-medium"
                >
                  {{ questionnaireType }}
                </span>

                <span
                  v-if="item.alertValue"
                  class="bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-lg font-medium"
                >
                  ⚠ Signo de alarma
                </span>
              </div>
            </div>

            <div
              class="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 top-1/2 -translate-y-1/2"
            >
              <button
                class="w-7 h-7 rounded-lg bg-surface border border-border text-muted hover:text-accent hover:border-accent/30 hover:bg-accent/5 flex items-center justify-center transition-all"
                title="Agregar"
                @click.stop="addQuestionToBuilder(item)"
              >
                <Plus class="w-3.5 h-3.5" />
              </button>

              <button
                class="w-7 h-7 rounded-lg bg-surface border border-border text-muted hover:text-red-500 hover:border-red-200 hover:bg-red-50 flex items-center justify-center transition-all"
                title="Eliminar"
                @click.stop="removeFromPool(item.id)"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div
            v-if="availableQuestionsFiltered.length === 0"
            class="text-center py-10 text-muted/40 flex flex-col items-center gap-2"
          >
            <Search class="w-10 h-10" />
            <p class="text-sm">No hay preguntas compatibles con {{ form.tipo_cuestionario }}.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Modal crear pregunta ───────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="isQuestionModalOpen"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          @click.self="closeQuestionModal"
        >
          <div class="bg-white rounded-3xl shadow-xl w-full max-w-lg p-6 space-y-5 border border-border">
            <div class="flex items-center justify-between gap-3">
              <div>
                <h2 class="font-display text-xl font-semibold text-black">Crear Pregunta</h2>
                <p class="text-xs text-muted mt-0.5">
                  La pregunta se agrega al banco local para guardarla con el cuestionario.
                </p>
              </div>

              <button
                class="w-8 h-8 rounded-xl border border-border text-muted hover:text-black hover:bg-surface transition-all"
                @click="closeQuestionModal"
              >
                <X class="w-4 h-4 mx-auto" />
              </button>
            </div>

            <div>
              <label class="block text-[10px] font-bold text-muted uppercase tracking-wide mb-1">Pregunta</label>
              <textarea
                v-model="questionForm.text"
                rows="3"
                placeholder="Escribe la pregunta..."
                class="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-black placeholder:text-muted/50 resize-none focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              />
              <p v-if="questionFormErrors.text" class="text-xs text-red-500 mt-1">
                {{ questionFormErrors.text }}
              </p>
            </div>

            <div>
              <label class="block text-[10px] font-bold text-muted uppercase tracking-wide mb-1">
                Tipo de control
              </label>

              <div class="grid grid-cols-2 gap-2">
                <label
                  v-for="type in controlTypes"
                  :key="type.value"
                  :class="[
                    'border rounded-xl px-3 py-2.5 text-xs font-bold cursor-pointer transition-all',
                    questionForm.controlType === type.value
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border bg-surface text-muted hover:border-accent/30',
                  ]"
                >
                  <input
                    v-model="questionForm.controlType"
                    type="radio"
                    class="sr-only"
                    :value="type.value"
                  />
                  {{ type.label }}
                </label>
              </div>
            </div>

            <div>
              <label class="block text-[10px] font-bold text-muted uppercase tracking-wide mb-1">
                Compatible con
              </label>

              <div class="grid grid-cols-2 gap-2">
                <label
                  v-for="questionnaireType in questionnaireTypeOptions"
                  :key="questionnaireType"
                  :class="[
                    'border rounded-xl px-3 py-2.5 text-xs font-bold cursor-pointer text-center transition-all',
                    questionForm.questionnaireTypes.includes(questionnaireType)
                      ? 'border-blue-300 bg-blue-50 text-blue-700'
                      : 'border-border bg-surface text-muted hover:border-blue-200',
                  ]"
                >
                  <input
                    type="checkbox"
                    class="sr-only"
                    :checked="questionForm.questionnaireTypes.includes(questionnaireType)"
                    @change="toggleQuestionnaireType(questionnaireType)"
                  />
                  {{ questionnaireType }}
                </label>
              </div>

              <p v-if="questionFormErrors.questionnaireTypes" class="text-xs text-red-500 mt-1">
                {{ questionFormErrors.questionnaireTypes }}
              </p>
            </div>

            <div v-if="questionForm.controlType === 'opcion_multiple'" class="space-y-2">
              <label class="block text-[10px] font-bold text-muted uppercase tracking-wide">Opciones</label>

              <div v-for="(_, index) in questionForm.options" :key="index" class="flex gap-2">
                <input
                  v-model="questionForm.options[index]"
                  type="text"
                  :placeholder="`Opción ${index + 1}`"
                  class="flex-1 bg-surface border border-border rounded-xl px-4 py-2 text-sm text-black placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                />

                <button
                  v-if="questionForm.options.length > 2"
                  class="w-9 h-9 rounded-xl border border-border text-muted hover:text-red-500 hover:bg-red-50 transition-all"
                  @click="questionForm.options.splice(index, 1)"
                >
                  <Trash2 class="w-4 h-4 mx-auto" />
                </button>
              </div>

              <button
                class="text-xs font-bold text-accent hover:text-accent/70"
                @click="questionForm.options.push('')"
              >
                + Agregar opción
              </button>

              <p v-if="questionFormErrors.options" class="text-xs text-red-500 mt-1">
                {{ questionFormErrors.options }}
              </p>
            </div>

            <div class="rounded-2xl border border-border bg-surface p-4 space-y-3">
              <label class="block text-[10px] font-bold text-muted uppercase tracking-wide">
                Valor de alerta clínica opcional
              </label>

              <div v-if="questionForm.controlType === 'escala_1_10'" class="flex items-center gap-2">
                <span class="text-xs text-muted">Alertar si el valor es mayor o igual a</span>
                <input
                  v-model.number="questionForm.alertMin"
                  type="number"
                  min="1"
                  max="10"
                  placeholder="8"
                  class="w-20 bg-card border border-border rounded-xl px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                />
              </div>

              <div v-else-if="questionForm.controlType === 'booleano_si_no'" class="flex gap-2">
                <label
                  v-for="option in booleanAlertOptions"
                  :key="option.value"
                  :class="[
                    'flex-1 text-center border rounded-xl px-3 py-2 text-xs font-bold cursor-pointer transition-all',
                    questionForm.alertValue === option.value
                      ? 'border-amber-400 bg-amber-50 text-amber-700'
                      : 'border-border bg-card text-muted hover:border-amber-300',
                  ]"
                >
                  <input
                    v-model="questionForm.alertValue"
                    type="radio"
                    class="sr-only"
                    :value="option.value"
                  />
                  {{ option.label }}
                </label>

                <button
                  v-if="questionForm.alertValue"
                  class="w-9 h-9 rounded-xl border border-border text-muted hover:text-red-500 hover:bg-red-50 transition-all"
                  title="Quitar alerta"
                  @click="questionForm.alertValue = null"
                >
                  <X class="w-4 h-4 mx-auto" />
                </button>
              </div>

              <div v-else-if="questionForm.controlType === 'opcion_multiple'">
                <input
                  v-model="questionForm.alertIncludes"
                  type="text"
                  placeholder="Texto de opción que dispara alerta. Ej. Pus"
                  class="w-full bg-card border border-border rounded-xl px-4 py-2 text-sm text-black placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                />
              </div>

              <p v-else class="text-xs text-muted">
                Las preguntas de texto libre no generan alerta automática.
              </p>
            </div>

            <div class="flex gap-3 pt-2">
              <button
                class="flex-1 border border-border rounded-2xl py-3 text-sm font-bold text-muted hover:bg-surface hover:text-black transition-all"
                @click="closeQuestionModal"
              >
                Cancelar
              </button>

              <button
                class="flex-1 bg-accent text-white rounded-2xl py-3 text-sm font-bold hover:bg-accent/90 transition-all"
                @click="createQuestion"
              >
                Agregar pregunta
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { ROUTE_NAMES } from '@/shared/routes'
import { httpClient } from '@/shared/api/http'
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-vue-next'

type TipoControl = 'escala_1_10' | 'booleano_si_no' | 'texto_libre' | 'opcion_multiple'
type TipoCuestionario = '24h' | '72h'

type AlertValue =
  | { min: number }
  | { valor: 'true' | 'false' }
  | { incluye: string }
  | null

interface Question {
  id: string
  text: string
  controlType: TipoControl
  options: string[] | null
  alertValue: AlertValue
  questionnaireTypes: TipoCuestionario[]
}

interface QuestionnaireBuilder {
  questions: Question[]
}

interface Procedure {
  id_procedimiento: number
  nombre_procedimiento: string
}

interface ProceduresResponse {
  message: string
  listaCatalogo: Procedure[]
}

interface CreateQuestionnaireResponse {
  message: string
  cuestionario: {
    id_cuestionario: number
    nombre_cuestionario: string
    tipo_cuestionario: TipoCuestionario
    descripcion?: string | null
  }
}

interface CreateQuestionResponse {
  message: string
  pregunta: unknown
}

const route = useRoute()
const router = useRouter()
const routeParams = computed(() => ({ id: String(route.params.id ?? '') }))

const form = reactive({
  nombre_cuestionario: '',
  tipo_cuestionario: '24h' as TipoCuestionario,
  id_procedimiento: null as number | null,
  descripcion: '',
})

const formErrors = reactive({
  nombre_cuestionario: '',
  id_procedimiento: '',
})

const procedures = ref<Procedure[]>([])
const isLoadingProcedures = ref(false)
const isSaving = ref(false)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const questionnaireTypeOptions: TipoCuestionario[] = ['24h', '72h']

const mockedQuestionsDatabase: Question[] = [
  {
    id: 'q1',
    text: 'En una escala del 1 al 10, ¿Cómo calificaría su dolor?',
    controlType: 'escala_1_10',
    options: null,
    alertValue: { min: 8 },
    questionnaireTypes: ['24h', '72h'],
  },
  {
    id: 'q2',
    text: '¿La medicación dada le está proporcionando un alivio adecuado?',
    controlType: 'booleano_si_no',
    options: null,
    alertValue: { valor: 'false' },
    questionnaireTypes: ['24h'],
  },
  {
    id: 'q3',
    text: '¿Todavía experimenta un sangrado activo que deje la gasa empapada?',
    controlType: 'booleano_si_no',
    options: null,
    alertValue: { valor: 'true' },
    questionnaireTypes: ['24h'],
  },
  {
    id: 'q4',
    text: '¿Ha presentado alguna reacción alérgica u otras reacciones como náuseas, vómitos, sarpullidos u otros efectos con la medicación dada?',
    controlType: 'booleano_si_no',
    options: null,
    alertValue: { valor: 'true' },
    questionnaireTypes: ['24h'],
  },
  {
    id: 'q5',
    text: '¿Tiene alguna dificultad para respirar o tragar?',
    controlType: 'booleano_si_no',
    options: null,
    alertValue: { valor: 'true' },
    questionnaireTypes: ['24h', '72h'],
  },
  {
    id: 'q6',
    text: '¿Tiene alguna pregunta sobre su procedimiento postoperatorio?',
    controlType: 'booleano_si_no',
    options: null,
    alertValue: null,
    questionnaireTypes: ['24h', '72h'],
  },
  {
    id: 'q7',
    text: '¿Qué tipo de reacción ha experimentado?',
    controlType: 'opcion_multiple',
    options: ['Náuseas', 'Vómitos', 'Sarpullidos', 'Otros'],
    alertValue: { incluye: 'Náuseas' },
    questionnaireTypes: ['24h'],
  },
  {
    id: 'q8',
    text: '¿Has estado aplicando compresas frías en la zona?',
    controlType: 'booleano_si_no',
    options: null,
    alertValue: null,
    questionnaireTypes: ['24h'],
  },
  {
    id: 'q9',
    text: '¿Ha evitado tomar alcohol o fumar?',
    controlType: 'booleano_si_no',
    options: null,
    alertValue: { valor: 'false' },
    questionnaireTypes: ['24h'],
  },
  {
    id: 'q10',
    text: '¿Ha evitado moverse o hacer alguna actividad?',
    controlType: 'booleano_si_no',
    options: null,
    alertValue: null,
    questionnaireTypes: ['24h'],
  },
  {
    id: 'q11',
    text: '¿Ha evitado enjuagarse?',
    controlType: 'booleano_si_no',
    options: null,
    alertValue: null,
    questionnaireTypes: ['24h'],
  },
  {
    id: 'q12',
    text: '¿Ha evitado comer alimentos calientes, duros o crujientes?',
    controlType: 'booleano_si_no',
    options: null,
    alertValue: null,
    questionnaireTypes: ['24h'],
  },
  {
    id: 'q13',
    text: '¿Tomó su primera dosis de analgésico antes de que desaparezca el efecto de la anestesia?',
    controlType: 'booleano_si_no',
    options: null,
    alertValue: { valor: 'false' },
    questionnaireTypes: ['24h'],
  },
  {
    id: 'q14',
    text: 'Comparado con los primeros días después de la cirugía, ¿tu dolor e hinchazón han empeorado, mejorado o se han mantenido igual?',
    controlType: 'opcion_multiple',
    options: ['Empeorado', 'Mejorado', 'Se ha mantenido igual'],
    alertValue: { incluye: 'Empeorado' },
    questionnaireTypes: ['72h'],
  },
  {
    id: 'q15',
    text: '¿Has notado alguno de los siguientes síntomas en donde se hizo la cirugía?',
    controlType: 'opcion_multiple',
    options: ['Mal sabor', 'Mal olor', 'Pus', 'Otro'],
    alertValue: { incluye: 'Pus' },
    questionnaireTypes: ['72h'],
  },
  {
    id: 'q16',
    text: '¿Has tenido fiebre?',
    controlType: 'booleano_si_no',
    options: null,
    alertValue: { valor: 'true' },
    questionnaireTypes: ['72h'],
  },
  {
    id: 'q17',
    text: '¿Has tenido escalofríos?',
    controlType: 'booleano_si_no',
    options: null,
    alertValue: { valor: 'true' },
    questionnaireTypes: ['72h'],
  },
  {
    id: 'q18',
    text: '¿Ha mejorado tu capacidad para abrir la boca desde la cirugía?',
    controlType: 'booleano_si_no',
    options: null,
    alertValue: null,
    questionnaireTypes: ['72h'],
  },
  {
    id: 'q19',
    text: '¿Has podido reanudar gradualmente una dieta más blanda?',
    controlType: 'booleano_si_no',
    options: null,
    alertValue: null,
    questionnaireTypes: ['72h'],
  },
  {
    id: 'q20',
    text: '¿Ha evitado la actividad física intensa durante los primeros 3 días?',
    controlType: 'booleano_si_no',
    options: null,
    alertValue: null,
    questionnaireTypes: ['72h'],
  },
  {
    id: 'q21',
    text: '¿Ha bebido abundantes líquidos?',
    controlType: 'booleano_si_no',
    options: null,
    alertValue: null,
    questionnaireTypes: ['72h'],
  },
  {
    id: 'q22',
    text: '¿Su dolor e hinchazón han estado disminuyendo en comparación a los primeros días?',
    controlType: 'booleano_si_no',
    options: null,
    alertValue: { valor: 'false' },
    questionnaireTypes: ['72h'],
  },
  {
    id: 'q23',
    text: '¿Ha tenido algún problema con sus suturas, como que se hayan salido antes de tiempo o que se sientan irritantes?',
    controlType: 'booleano_si_no',
    options: null,
    alertValue: { valor: 'true' },
    questionnaireTypes: ['72h'],
  },
  {
    id: 'q24',
    text: 'En una escala del 1 al 10, ¿qué tan satisfecho está con su cuidado postoperatorio?',
    controlType: 'escala_1_10',
    options: null,
    alertValue: null,
    questionnaireTypes: ['72h'],
  },
]

const availableQuestions = ref<Question[]>(mockedQuestionsDatabase)
const currentQuestionnaire = ref<QuestionnaireBuilder>({ questions: [] })
const searchQuery = ref('')
const draggedItem = ref<Question | null>(null)
const isDragging = ref(false)

const isQuestionModalOpen = ref(false)

const questionForm = reactive({
  text: '',
  controlType: 'booleano_si_no' as TipoControl,
  options: ['', ''],
  alertMin: null as number | null,
  alertValue: null as 'true' | 'false' | null,
  alertIncludes: '',
  questionnaireTypes: ['24h', '72h'] as TipoCuestionario[],
})

const questionFormErrors = reactive({
  text: '',
  options: '',
  questionnaireTypes: '',
})

const controlTypes: { value: TipoControl; label: string }[] = [
  { value: 'escala_1_10', label: 'Escala 1–10' },
  { value: 'booleano_si_no', label: 'Sí / No' },
  { value: 'opcion_multiple', label: 'Opción múltiple' },
  { value: 'texto_libre', label: 'Texto libre' },
]

const booleanAlertOptions = [
  { value: 'true' as const, label: 'Sí dispara alerta' },
  { value: 'false' as const, label: 'No dispara alerta' },
]

const availableQuestionsFiltered = computed(() => {
  const selectedIds = new Set(currentQuestionnaire.value.questions.map((question) => question.id))

  let available = availableQuestions.value.filter((question) => {
    const notSelected = !selectedIds.has(question.id)
    const matchesQuestionnaireType = question.questionnaireTypes.includes(form.tipo_cuestionario)
    return notSelected && matchesQuestionnaireType
  })

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    available = available.filter((question) => question.text.toLowerCase().includes(query))
  }

  return available
})

onMounted(() => {
  void loadProcedures()
})

async function loadProcedures() {
  isLoadingProcedures.value = true
  errorMessage.value = null

  try {
    const response = await httpClient.get<ProceduresResponse>('/catalogo-procedimientos')
    procedures.value = response.listaCatalogo ?? []
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message ?? 'No se pudo cargar el catálogo de procedimientos.'
  } finally {
    isLoadingProcedures.value = false
  }
}

async function saveQuestionnaire() {
  errorMessage.value = null
  successMessage.value = null
  resetFormErrors()

  if (!validateQuestionnaire()) return

  isSaving.value = true

  try {
    const questionnaireResponse = await httpClient.post<
      CreateQuestionnaireResponse,
      {
        nombre_cuestionario: string
        tipo_cuestionario: TipoCuestionario
        id_procedimiento: number
        descripcion: string | null
      }
    >('/cuestionario', {
      nombre_cuestionario: form.nombre_cuestionario.trim(),
      tipo_cuestionario: form.tipo_cuestionario,
      id_procedimiento: form.id_procedimiento as number,
      descripcion: form.descripcion.trim() || null,
    })

    const idCuestionario = questionnaireResponse.cuestionario.id_cuestionario

    for (const question of currentQuestionnaire.value.questions) {
      await httpClient.post<
        CreateQuestionResponse,
        {
          id_cuestionario: number
          texto_pregunta: string
          tipo_control: TipoControl
          opciones: string[] | null
          valor_alerta: AlertValue
        }
      >('/pregunta', {
        id_cuestionario: idCuestionario,
        texto_pregunta: question.text,
        tipo_control: question.controlType,
        opciones: question.options,
        valor_alerta: question.alertValue,
      })
    }

    successMessage.value = `Cuestionario guardado con ${currentQuestionnaire.value.questions.length} pregunta(s).`

    window.setTimeout(() => {
      void router.push({ name: ROUTE_NAMES.DENTIST_QUESTIONNAIRES, params: routeParams.value })
    }, 1200)
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message ?? 'No se pudo guardar el cuestionario.'
  } finally {
    isSaving.value = false
  }
}

function resetFormErrors() {
  formErrors.nombre_cuestionario = ''
  formErrors.id_procedimiento = ''
}

function validateQuestionnaire() {
  let isValid = true

  if (!form.nombre_cuestionario.trim()) {
    formErrors.nombre_cuestionario = 'El nombre del cuestionario es obligatorio.'
    isValid = false
  }

  if (!form.id_procedimiento) {
    formErrors.id_procedimiento = 'Selecciona un procedimiento.'
    isValid = false
  }

  if (currentQuestionnaire.value.questions.length === 0) {
    errorMessage.value = 'Agrega al menos una pregunta al cuestionario.'
    isValid = false
  }

  return isValid
}

function onDragStart(event: DragEvent, question: Question) {
  draggedItem.value = question
  isDragging.value = true

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', question.id)
  }
}

function onDragOver(event: DragEvent) {
  event.preventDefault()

  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

function onDragLeave() {
  isDragging.value = false
}

function onDragEnd() {
  isDragging.value = false
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  isDragging.value = false

  if (!draggedItem.value) return

  addQuestionToBuilder(draggedItem.value)
  draggedItem.value = null
}

function addQuestionToBuilder(question: Question) {
  const alreadyExists = currentQuestionnaire.value.questions.some((item) => item.id === question.id)

  if (alreadyExists) {
    errorMessage.value = 'Esta pregunta ya fue añadida al cuestionario.'
    return
  }

  if (!question.questionnaireTypes.includes(form.tipo_cuestionario)) {
    errorMessage.value = `Esta pregunta no está marcada para cuestionarios de ${form.tipo_cuestionario}.`
    return
  }

  errorMessage.value = null
  currentQuestionnaire.value.questions.push({ ...question })
}

function removeQuestionFromBuilder(id: string) {
  currentQuestionnaire.value.questions = currentQuestionnaire.value.questions.filter((question) => question.id !== id)
}

function removeFromPool(id: string) {
  availableQuestions.value = availableQuestions.value.filter((question) => question.id !== id)
  removeQuestionFromBuilder(id)
}

function openQuestionModal() {
  Object.assign(questionForm, {
    text: '',
    controlType: 'booleano_si_no',
    options: ['', ''],
    alertMin: null,
    alertValue: null,
    alertIncludes: '',
    questionnaireTypes: ['24h', '72h'],
  })

  questionFormErrors.text = ''
  questionFormErrors.options = ''
  questionFormErrors.questionnaireTypes = ''

  isQuestionModalOpen.value = true
}

function closeQuestionModal() {
  isQuestionModalOpen.value = false
}

function toggleQuestionnaireType(type: TipoCuestionario) {
  const index = questionForm.questionnaireTypes.indexOf(type)

  if (index >= 0) {
    questionForm.questionnaireTypes.splice(index, 1)
    return
  }

  questionForm.questionnaireTypes.push(type)
}

function createQuestion() {
  questionFormErrors.text = ''
  questionFormErrors.options = ''
  questionFormErrors.questionnaireTypes = ''

  if (!questionForm.text.trim()) {
    questionFormErrors.text = 'La pregunta es obligatoria.'
    return
  }

  if (questionForm.questionnaireTypes.length === 0) {
    questionFormErrors.questionnaireTypes = 'Selecciona al menos un tipo de cuestionario.'
    return
  }

  const options = questionForm.options.map((option) => option.trim()).filter(Boolean)

  if (questionForm.controlType === 'opcion_multiple' && options.length < 2) {
    questionFormErrors.options = 'Agrega mínimo dos opciones.'
    return
  }

  const newQuestion: Question = {
    id: `custom-${Date.now()}`,
    text: questionForm.text.trim(),
    controlType: questionForm.controlType,
    options: questionForm.controlType === 'opcion_multiple' ? options : null,
    alertValue: buildAlertValue(),
    questionnaireTypes: [...questionForm.questionnaireTypes],
  }

  availableQuestions.value.unshift(newQuestion)

  if (newQuestion.questionnaireTypes.includes(form.tipo_cuestionario)) {
    addQuestionToBuilder(newQuestion)
  }

  closeQuestionModal()
}

function buildAlertValue(): AlertValue {
  if (questionForm.controlType === 'escala_1_10' && questionForm.alertMin !== null) {
    return { min: questionForm.alertMin }
  }

  if (questionForm.controlType === 'booleano_si_no' && questionForm.alertValue) {
    return { valor: questionForm.alertValue }
  }

  if (questionForm.controlType === 'opcion_multiple' && questionForm.alertIncludes.trim()) {
    return { incluye: questionForm.alertIncludes.trim() }
  }

  return null
}

function typeLabel(type: TipoControl) {
  const labels: Record<TipoControl, string> = {
    escala_1_10: 'Escala 1–10',
    booleano_si_no: 'Sí / No',
    texto_libre: 'Texto libre',
    opcion_multiple: 'Opción múltiple',
  }

  return labels[type]
}
</script>

<style scoped>
.fade-in {
  animation: fadeIn 0.25s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.45);
  border-radius: 999px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.6);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>