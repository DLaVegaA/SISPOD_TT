<template>
  <div class="fade-in max-w-7xl mx-auto pb-10 px-4 sm:px-6 lg:px-8">
    
    <!-- ── Header ─────────────────────────────────────────────────────── -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pt-6">
      <div>
        <div class="flex items-center gap-1.5 text-xs text-muted font-medium mb-2">
          <span class="text-muted/60">🏠</span>
          <span class="text-muted/60">&gt;</span>
          <RouterLink :to="{ name: ROUTE_NAMES.DENTIST_QUESTIONNAIRES, params: { id: $route.params.id } }" class="hover:text-black transition-colors">
            Cuestionarios
          </RouterLink>
          <span class="text-muted/60">&gt;</span>
          <span class="bg-card border border-border px-2 py-0.5 rounded-lg">Nuevo Cuestionario</span>
        </div>
        <h1 class="font-display text-4xl font-semibold text-black">Nuevo Cuestionario</h1>
        <p class="text-sm text-muted mt-1">Arrastra preguntas desde el panel derecho hacia el panel izquierdo para formar tu cuestionario.</p>
      </div>
    </div>

    <!-- ── Columns ────────────────────────────────────────────────────── -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      <!-- ── Left Column (Builder - Drop Zone) ────────────────────────── -->
      <div class="lg:col-span-7 bg-white p-6 rounded-3xl border border-border flex flex-col gap-6 shadow-sm min-h-[40rem]">
        
        <header class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="relative w-full md:max-w-xs shadow-sm">
            <select 
              v-model="currentQuestionnaire.type" 
              class="appearance-none w-full bg-card border border-border rounded-lg pl-4 pr-10 py-2.5 text-sm font-semibold text-black focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all cursor-pointer"
            >
              <option v-for="type in questionnaireTypes" :key="type" :value="type">{{ type }}</option>
            </select>
            <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          </div>
          
          <button
            class="flex items-center gap-2 bg-[#7BA4C7] hover:bg-[#6A93B6] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/10 active:scale-95 shrink-0"
          >
            <Plus class="w-4 h-4" />
            Crear Nuevo
          </button>
        </header>

        <!-- Builder Drop Zone -->
        <div 
          class="flex-1 space-y-3 rounded-2xl p-1 transition-colors"
          :class="{'bg-blue-50/50 border-2 border-dashed border-accent/30': isDragging}"
          @dragover.prevent="onDragOver"
          @dragleave="onDragLeave"
          @drop="onDrop"
        >
          <div v-if="currentQuestionnaire.questions.length === 0" class="flex flex-col items-center justify-center h-full text-center py-20 gap-4 text-muted/30 border-2 border-dashed border-border rounded-2xl">
              <ClipboardList class="w-16 h-16" />
              <p class="font-medium text-sm">Arrastra preguntas aquí para construir tu cuestionario</p>
          </div>

          <template v-else>
            <div 
              v-for="(item, index) in currentQuestionnaire.questions" 
              :key="item.id"
              class="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4 group"
            >
              <div class="flex items-center gap-3 w-full">
                <span class="text-xs font-bold text-muted/60 shrink-0 w-5">{{ index + 1 }}.</span>
                <p class="text-sm font-medium text-black truncate w-full">{{ item.text }}</p>
              </div>
              <button 
                class="w-8 h-8 rounded-lg bg-[#EBF3F9] text-[#7BA4C7] hover:bg-red-50 hover:text-red-500 hover:border-red-200 flex items-center justify-center transition-colors border border-[#C5DFE8] shadow-sm shrink-0"
                title="Quitar pregunta"
                @click="removeQuestionFromBuilder(item.id)"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </template>
        </div>

        <footer class="mt-6 pt-6 border-t border-border">
          <button
            class="w-full flex items-center justify-center gap-2 bg-[#7BA4C7]/10 text-[#5580A6] border border-[#C5DFE8] hover:bg-[#7BA4C7]/20 px-6 py-3 rounded-2xl text-sm font-bold transition-all hover:scale-[1.01] active:scale-95"
          >
            <Users class="w-4 h-4" />
            Asignar Cuestionario
          </button>
        </footer>

      </div>

      <!-- ── Right Column (Questions Pool - Drag Source) ───────────────── -->
      <div class="lg:col-span-5 bg-[#EBF3F9]/60 p-6 rounded-3xl border border-border flex flex-col gap-6 shadow-sm min-h-[40rem]">
        
        <header class="flex flex-col gap-4">
          <div class="flex items-center justify-between gap-2">
            <h2 class="font-display font-bold text-black text-base">Mis Preguntas</h2>
            <button class="flex items-center gap-1.5 text-xs font-bold text-[#5580A6] hover:text-[#3A5B78] transition-colors" @click="createNewQuestion">
              <Plus class="w-3.5 h-3.5" />
              Crear Pregunta
            </button>
          </div>
          <div class="relative w-full shadow-sm">
            <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/40" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar Pregunta"
              class="w-full pl-11 pr-4 py-2.5 bg-card border border-border rounded-full text-sm text-black placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
            />
          </div>
        </header>

        <!-- Pool List -->
        <div class="flex-1 space-y-3 overflow-y-auto pr-2 hide-scrollbar">
            <div 
              v-for="item in availableQuestionsFiltered" 
              :key="item.id"
              class="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4 cursor-grab transition-colors active:cursor-grabbing hover:border-accent/40 group relative"
              draggable="true"
              @dragstart="onDragStart($event, item)"
            >
              <div class="flex flex-col gap-1 w-full truncate pr-16">
                 <p class="text-sm font-semibold text-black truncate w-full">{{ item.text }}</p>
                 <div class="text-[10px] text-muted truncate">
                   <span class="font-bold text-black/70">Tipo:</span> <span class="bg-[#EBF3F9] text-[#5580A6] px-2 py-0.5 rounded ml-1">{{ item.type }}</span>
                 </div>
              </div>
              
              <!-- Pool Actions -->
              <div class="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity justify-end absolute right-4 top-1/2 -translate-y-1/2">
                <button 
                  class="w-8 h-8 rounded-lg bg-[#EBF3F9] text-[#7BA4C7] hover:bg-[#D5E6F5] hover:text-[#5A87B2] flex items-center justify-center transition-colors border border-[#C5DFE8] shadow-sm shrink-0"
                  title="Editar"
                  @click.stop="createNewQuestion"
                >
                  <Pencil class="w-4 h-4" />
                </button>
                <button 
                  class="w-8 h-8 rounded-lg bg-[#EBF3F9] text-[#7BA4C7] hover:bg-red-50 hover:text-red-500 hover:border-red-200 flex items-center justify-center transition-colors border border-[#C5DFE8] shadow-sm shrink-0"
                  title="Eliminar"
                  @click.stop="createNewQuestion"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div v-if="availableQuestionsFiltered.length === 0" class="text-center py-10 text-muted/50 flex flex-col items-center gap-2">
                <Search class="w-10 h-10" />
                <p class="text-sm">No se encontraron preguntas que coincidan con la búsqueda.</p>
            </div>
        </div>

      </div>
    </div>
    
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ROUTE_NAMES } from '@/shared/routes'
import {
  Plus, Search, Pencil, Trash2, Users, ChevronDown,
  ClipboardList
} from 'lucide-vue-next'

// ── Types ─────────────────────────────────────────────────────────────────
interface Question {
  id: string
  text: string
  type: string
}

interface QuestionnaireBuilder {
  type: string
  questions: Question[]
}

// ── Data (Mocked based on image content) ──────────────────────────────────
const mockedQuestionsDatabase: Question[] = [
  { id: 'q1', text: 'En una escala del 1 al 10, ¿Cómo calificaría su dolor?', type: 'Tipo de control' },
  { id: 'q2', text: '¿La medicación dada le está proporcionando un alivio adecuado?', type: 'Tipo de control' },
  { id: 'q3', text: '¿Todavía experimenta un sangrado activo que deje la gasa empapada?', type: 'Tipo de control' },
  { id: 'q4', text: '¿Ha presentado alguna reacción alérgica u otras reacciones como náuseas, vómitos, sarpullidos u otros efectos con la medicación dada?', type: 'Tipo de control' },
  { id: 'q5', text: '¿Tiene alguna dificultad para respirar o tragar?', type: 'Tipo de control' },
  { id: 'q6', text: '¿Tiene alguna pregunta sobre su procedimiento postoperatorio?', type: 'Tipo de control' },
  { id: 'q7', text: '¿Qué tipo de reacción ha experimentado?', type: 'Tipo de control' },
  { id: 'q8', text: '¿Has estado aplicando compresas frías en la zona?', type: 'Tipo de control' },
  { id: 'q9', text: '¿Ha evitado tomar alcohol o fumar?', type: 'Tipo de control' },
  { id: 'q10', text: '¿Ha evitado moverse o hacer alguna actividad?', type: 'Tipo de control' },
  { id: 'q11', text: '¿Ha evitado enjuagarse?', type: 'Tipo de control' },
  { id: 'q12', text: '¿Ha evitado comer alimentos calientes, duros o crujientes?', type: 'Tipo de control' },
  { id: 'q13', text: '¿Tomó su primera dosis de analgésico antes de que desaparezca el efecto de la anestesia?', type: 'Tipo de control' }
]

const questionnaireTypes = ['Cuestionario de 24hrs', 'Cuestionario de 72hrs', 'Seguimiento General']

// ── State ─────────────────────────────────────────────────────────────────
const availableQuestions = ref<Question[]>(mockedQuestionsDatabase)
const currentQuestionnaire = ref<QuestionnaireBuilder>({
  type: questionnaireTypes[0],
  questions: [] // Initial empty questionnaire builder zone on left
})
const searchQuery = ref('')
const draggedItem = ref<Question | null>(null)
const isDragging = ref(false)

// ── Computed ──────────────────────────────────────────────────────────────
const availableQuestionsFiltered = computed(() => {
  if (!searchQuery.value.trim()) return availableQuestions.value
  const query = searchQuery.value.toLowerCase()
  return availableQuestions.value.filter(q => q.text.toLowerCase().includes(query))
})

// ── Methods ───────────────────────────────────────────────────────────────
function onDragStart(event: DragEvent, question: Question) {
  draggedItem.value = question
  isDragging.value = true
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', question.id)
  }
}

function onDragOver(event: DragEvent) {
  event.preventDefault() // Allow drop
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

function onDragLeave() {
    isDragging.value = false
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  isDragging.value = false
  if (draggedItem.value) {
    // Check if question is already in questionnaire to avoid duplicates
    const alreadyExists = currentQuestionnaire.value.questions.some(q => q.id === draggedItem.value!.id)
    if (!alreadyExists) {
      currentQuestionnaire.value.questions.push(draggedItem.value)
    } else {
        alert('Esta pregunta ya ha sido añadida al cuestionario.')
    }
    draggedItem.value = null
  }
}

function removeQuestionFromBuilder(id: string) {
  currentQuestionnaire.value.questions = currentQuestionnaire.value.questions.filter(q => q.id !== id)
}

function createNewQuestion() {
  alert('Aquí abrirías el modal para crear una nueva pregunta.')
}

function clearSearch() {
  searchQuery.value = ''
}
</script>

<style scoped>
.fade-in { animation: fadeIn 0.25s ease; }
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Hide scrollbar for clean pool list */
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
</style>