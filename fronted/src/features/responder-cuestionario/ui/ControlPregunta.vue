<template>
  <div class="space-y-4">
    <!-- escala_1_10 ──────────────────────────────────────────────── -->
    <template v-if="pregunta.tipo_control === 'escala_1_10'">
      <div class="flex items-center justify-between px-2 mb-2">
        <span class="text-[10px] font-bold text-muted uppercase tracking-wider">Mínimo</span>
        <div class="flex flex-col items-center">
          <span class="text-2xl font-display font-black text-accent tabular-nums">{{ valorNumerico }}</span>
          <span class="text-[8px] font-bold text-muted uppercase">Nivel</span>
        </div>
        <span class="text-[10px] font-bold text-muted uppercase tracking-wider">Máximo</span>
      </div>
      
      <div class="relative px-2 py-4">
        <input
          type="range"
          min="1"
          max="10"
          step="1"
          :value="valorNumerico"
          class="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer accent-accent"
          @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        />
        <div class="flex justify-between mt-3 px-0.5">
          <span 
            v-for="n in 10" 
            :key="n" 
            :class="[
              'text-[10px] font-bold transition-colors',
              valorNumerico === n ? 'text-accent scale-125' : 'text-muted/40'
            ]"
          >
            {{ n }}
          </span>
        </div>
      </div>
    </template>

    <!-- booleano_si_no ───────────────────────────────────────────── -->
    <template v-else-if="pregunta.tipo_control === 'booleano_si_no'">
      <div class="flex gap-4">
        <label
          v-for="opcion in BOOL_OPCIONES"
          :key="opcion.valor"
          :class="[
            'flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl border-2 cursor-pointer transition-all text-sm font-bold select-none',
            modelValue === opcion.valor
              ? 'bg-accent/5 border-accent text-accent shadow-sm shadow-accent/10'
              : 'bg-white border-border text-muted hover:border-accent/30 hover:bg-surface',
          ]"
        >
          <input
            type="radio"
            class="sr-only"
            :name="`pregunta-${pregunta.id_pregunta_base}`"
            :value="opcion.valor"
            :checked="modelValue === opcion.valor"
            @change="emit('update:modelValue', opcion.valor)"
          />
          <div 
            v-if="modelValue === opcion.valor"
            class="w-4 h-4 rounded-full border-4 border-accent bg-white"
          />
          <div 
            v-else
            class="w-4 h-4 rounded-full border-2 border-border bg-white"
          />
          {{ opcion.etiqueta }}
        </label>
      </div>
    </template>

    <!-- opcion_multiple ─────────────────────────────────────────── -->
    <template v-else-if="pregunta.tipo_control === 'opcion_multiple'">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label
          v-for="opcion in pregunta.opciones ?? []"
          :key="opcion"
          :class="[
            'flex items-center gap-3 py-3 px-4 rounded-xl border transition-all text-xs font-medium select-none cursor-pointer',
            seleccionados.includes(opcion)
              ? 'bg-accent/5 border-accent text-black'
              : 'bg-white border-border text-muted hover:border-accent/30',
          ]"
        >
          <div class="relative flex items-center justify-center">
            <input
              type="checkbox"
              :value="opcion"
              :checked="seleccionados.includes(opcion)"
              class="peer sr-only"
              @change="onCheckbox(opcion)"
            />
            <div class="w-5 h-5 border-2 border-border rounded-lg peer-checked:bg-accent peer-checked:border-accent transition-all flex items-center justify-center">
              <svg v-if="seleccionados.includes(opcion)" class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          {{ opcion }}
        </label>
      </div>
    </template>

    <!-- texto_libre ─────────────────────────────────────────────── -->
    <template v-else-if="pregunta.tipo_control === 'texto_libre'">
      <div class="relative">
        <textarea
          :value="String(modelValue ?? '')"
          rows="3"
          placeholder="Escribe tus observaciones aquí..."
          class="w-full rounded-2xl border-2 border-border bg-white text-sm text-black placeholder:text-muted/60 px-4 py-3.5 resize-none focus:outline-none focus:border-accent/50 focus:bg-surface transition-all font-medium"
          @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
        />
        <div class="absolute bottom-3 right-3 text-[10px] font-bold text-muted/40 uppercase">
          Libre
        </div>
      </div>
    </template>

    <!-- Error de validación ─────────────────────── -->
    <Transition name="shake">
      <p v-if="tocada && !tieneRespuesta" class="text-[10px] font-bold text-red-500 mt-2 flex items-center gap-1.5 px-1 uppercase tracking-wider">
        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        Esta respuesta es necesaria para tu seguimiento
      </p>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Pregunta } from '@/entities/seguimiento'
import type { ValorRespuesta } from '../model/useResponderCuestionario'

const props = defineProps<{
  pregunta: Pregunta
  modelValue: ValorRespuesta
  tocada: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: ValorRespuesta): void
}>()

const BOOL_OPCIONES = [
    { etiqueta: 'Sí', valor: 'true' },
    { etiqueta: 'No', valor: 'false' },
] as const

const valorNumerico = computed(() =>
    props.modelValue !== null ? Number(props.modelValue) : 5,
)

const seleccionados = computed<string[]>(() =>
    Array.isArray(props.modelValue) ? props.modelValue : [],
)

function onCheckbox(opcion: string) {
    const actual = [...seleccionados.value]
    const idx = actual.indexOf(opcion)
    idx === -1 ? actual.push(opcion) : actual.splice(idx, 1)
    emit('update:modelValue', actual)
}

const tieneRespuesta = computed(() => {
    const v = props.modelValue
    if (v === null || v === undefined) return false
    if (Array.isArray(v)) return v.length > 0
    if (typeof v === 'string') return v.trim().length > 0
    return true
})
</script>

<style scoped>
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 20px;
  width: 20px;
  border-radius: 50%;
  background: white;
  border: 3px solid var(--color-accent, #3b82f6);
  cursor: pointer;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  transition: all 0.2s ease;
}

input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}

.shake-enter-active {
  animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
}

@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}
</style>
