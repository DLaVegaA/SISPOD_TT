<template>
  <select
    :value="modelValue"
    class="bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-black focus:outline-none focus:border-accent transition-colors cursor-pointer"
    @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
  >
    <slot />
  </select>
</template>

<script setup lang="ts">
defineProps<{ modelValue?: string }>()
defineEmits<{ 'update:modelValue': [value: string] }>()
</script>
