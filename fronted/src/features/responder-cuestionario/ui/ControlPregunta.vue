<template>
  <div class="space-y-3">

    <!-- escala_1_10 ──────────────────────────────────────────────── -->
    <template v-if="pregunta.tipo_control === 'escala_1_10'">
      <div class="flex items-center justify-between text-xs text-muted mb-1">
        <span>Sin dolor</span>
        <span class="text-lg font-semibold text-black tabular-nums">{{ valorNumerico }}</span>
        <span>Dolor severo</span>
      </div>
      <input
        type="range"
        min="1"
        max="10"
        step="1"
        :value="valorNumerico"
        class="w-full accent-accent"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
      <div class="flex justify-between text-xs text-muted select-none">
        <span v-for="n in 10" :key="n">{{ n }}</span>
      </div>
    </template>

    <!-- booleano_si_no ───────────────────────────────────────────── -->
    <template v-else-if="pregunta.tipo_control === 'booleano_si_no'">
      <div class="flex gap-3">
        <label
          v-for="opcion in BOOL_OPCIONES"
          :key="opcion.valor"
          :class="[
            'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border cursor-pointer transition-all text-sm font-medium select-none',
            modelValue === opcion.valor
              ? 'bg-accent/10 border-accent text-accent'
              : 'border-border text-muted hover:border-accent/40',
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
          {{ opcion.etiqueta }}
        </label>
      </div>
    </template>

    <!-- opcion_multiple ─────────────────────────────────────────── -->
    <template v-else-if="pregunta.tipo_control === 'opcion_multiple'">
      <div class="space-y-2">
        <label
          v-for="opcion in pregunta.opciones ?? []"
          :key="opcion"
          :class="[
            'flex items-center gap-3 py-2.5 px-3 rounded-xl border cursor-pointer transition-all text-sm select-none',
            seleccionados.includes(opcion)
              ? 'bg-accent/10 border-accent text-black'
              : 'border-border text-muted hover:border-accent/40',
          ]"
        >
          <input
            type="checkbox"
            :value="opcion"
            :checked="seleccionados.includes(opcion)"
            class="rounded accent-accent"
            @change="onCheckbox(opcion)"
          />
          {{ opcion }}
        </label>
      </div>
    </template>

    <!-- texto_libre ─────────────────────────────────────────────── -->
    <template v-else-if="pregunta.tipo_control === 'texto_libre'">
      <textarea
        :value="String(modelValue ?? '')"
        rows="3"
        placeholder="Escribe tu respuesta aquí..."
        class="w-full rounded-xl border border-border bg-surface text-sm text-black placeholder:text-muted px-3 py-2.5 resize-none focus:outline-none focus:border-accent transition-colors"
        @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      />
    </template>

    <!-- Error de validación (trayectoria B) ─────────────────────── -->
    <p v-if="tocada && !tieneRespuesta" class="text-xs text-red-500 mt-1 flex items-center gap-1">
      <span>Esta pregunta es obligatoria.</span>
    </p>

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