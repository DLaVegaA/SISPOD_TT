<template>
  <div class="w-full">
    <label
      v-if="label"
      class="block text-xs font-semibold text-muted uppercase tracking-wider mb-2"
    >
      {{ label }}
    </label>
    <div class="relative">
      <component
        :is="'span'"
        v-if="prefixIcon"
        class="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted"
      >
        <component :is="prefixIcon" class="w-4 h-4" />
      </component>
      <input
        v-bind="$attrs"
        :value="modelValue"
        :type="type"
        :placeholder="placeholder"
        :class="[
          base,
          variantCls,
          prefixIcon ? 'pl-10 pr-4' : 'px-4',
          hasError ? 'border-red-500' : 'border-border focus:border-accent',
        ]"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
      <button
        v-if="suffixIcon"
        type="button"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-black transition-colors"
        @click="$emit('suffix-click')"
      >
        <component :is="suffixIcon" class="w-4 h-4" />
      </button>
    </div>
    <p v-if="error" class="text-red-400 text-xs mt-1">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
type Variant = 'primary' | 'card'

interface Props {
  variant?: Variant
  modelValue?: string
  label?: string
  placeholder?: string
  type?: string
  prefixIcon?: Component
  suffixIcon?: Component
  error?: string
  hasError?: boolean
}

const base =
  'w-full border rounded-xl py-2.5 text-sm text-black placeholder-muted focus:outline-none transition-colors'

const variantMap: Record<Variant, string> = {
  primary: 'bg-surface',
  card: 'bg-card',
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  modelValue: '',
  type: 'text',
  hasError: false,
})

defineEmits<{
  'update:modelValue': [value: string]
  'suffix-click': []
}>()
const variantCls = variantMap[props.variant]
</script>
