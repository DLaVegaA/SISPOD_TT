<template>
  <span :class="['role-badge', customClass || colorMap[color] || colorMap.default]">
    <slot />
  </span>
</template>

<script setup lang="ts">
type BadgeColor = 'default' | 'success' | 'danger' | 'purple' | 'blue' | 'amber' | 'emerald'

interface Props {
  color?:       BadgeColor
  customClass?: string
}

const props = withDefaults(defineProps<Props>(), { color: 'default' })

const colorMap: Record<string, string> = {
  default: 'bg-ghost text-muted',
  success: 'bg-emerald-500/10 text-emerald-400',
  danger:  'bg-red-500/10 text-red-400',
  purple:  'bg-purple-500/10 text-purple-400',
  blue:    'bg-blue-500/10 text-blue-400',
  amber:   'bg-amber-500/10 text-amber-400',
  emerald: 'bg-emerald-500/10 text-emerald-400',
}
</script>
