<script setup lang="ts">
import { ref, watch } from 'vue'
import { Minus, NotebookPen } from 'lucide-vue-next'

type Props = {
  label: string
  modelValue?: string   // ← era: modelValue: string
  disabled?: boolean
  showRemove?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',       // ← default explícito
})

const isOpen = ref(Boolean(props.modelValue?.trim()))

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
  (event: 'remove'): void
}>()

const onInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
}

const toggleOpen = () => {
  isOpen.value = !isOpen.value
}

watch(
  () => props.modelValue,
  (value) => {
    if (value?.trim() && !isOpen.value) {
      isOpen.value = true
    }
  },
)
</script>

<template>
  <div class="space-y-2">
    <div class="flex items-center justify-between gap-2">
      <span
        class="inline-flex text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full bg-surface border border-border text-muted"
      >
        {{ label }}
      </span>
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="inline-flex items-center justify-center h-5 w-5 rounded-md border transition-colors"
          :class="
            isOpen
              ? 'border-accent bg-accent text-white hover:text-white'
              : 'border-border bg-white text-muted hover:text-black hover:border-ink/20'
          "
          @click="toggleOpen"
          :aria-expanded="isOpen"
          :aria-label="isOpen ? 'Ocultar nota' : 'Agregar nota'"
        >
          <NotebookPen class="h-3 w-3" />
        </button>
        <button
          v-if="showRemove"
          type="button"
          class="inline-flex items-center justify-center h-5 w-5 rounded-md border border-border bg-white text-muted hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors disabled:opacity-60 disabled:pointer-events-none"
          :disabled="props.disabled"
          @click="emit('remove')"
          aria-label="Eliminar padecimiento"
        >
          <Minus class="h-3 w-3" />
        </button>
      </div>
    </div>
    <textarea
      v-if="isOpen"
      class="w-full min-h-11 rounded-xl border border-border bg-white px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:bg-surface disabled:text-muted"
      :value="props.modelValue"
      :disabled="props.disabled"
      placeholder="Detalle o nota"
      rows="2"
      @input="onInput"
    />
  </div>
</template>
