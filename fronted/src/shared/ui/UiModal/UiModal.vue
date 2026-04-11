<template>
  <Transition name="modal">
    <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        class="absolute inset-0 bg-black/30 backdrop-blur-xs"
        @click="$emit('update:modelValue', false)"
      />
      <div
        :class="[
          'relative bg-card/90 border border-border rounded-2xl w-full shadow-2xl slide-in',
          maxWidthClass,
        ]"
      >
        <div
          v-if="title"
          class="flex items-center justify-between px-6 py-5 border-b border-border"
        >
          <h2 class="font-display text-xl font-semibold text-black">{{ title }}</h2>
          <button
            type="button"
            class="p-2 rounded-lg hover:bg-ghost text-muted hover:text-black transition-all"
            @click="$emit('update:modelValue', false)"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
        <slot />
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { X } from 'lucide-vue-next'

type MaxWidth = 'sm' | 'md' | 'lg'

interface Props {
  modelValue: boolean
  title?: string
  maxWidth?: MaxWidth
}

const props = withDefaults(defineProps<Props>(), { maxWidth: 'md' })

defineEmits<{ 'update:modelValue': [value: boolean] }>()

const maxWidthClass = computed<string>(
  () =>
    ({
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
    })[props.maxWidth],
)
</script>
