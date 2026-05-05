<template>
  <select
    :value="modelValue"
    :class="[
      variantCls,
      'w-full border-border rounded-xl px-4 py-2.5 text-sm text-black focus:outline-none focus:border-accent transition-colors cursor-pointer',
    ]"
    @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
  >
    <slot />
  </select>
</template>

<script setup lang="ts">
type Variant = 'primary' | 'card'
interface Props {
  variant?: Variant
  modelValue?: string
}

const variantMap: Record<Variant, string> = {
  primary: 'bg-surface',
  card: 'bg-card',
}
const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  modelValue: '',
})
defineEmits<{ 'update:modelValue': [value: string] }>()

const variantCls = variantMap[props.variant]
</script>
