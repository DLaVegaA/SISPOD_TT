<template>
  <div
    :class="[
      'flex shrink-0 items-center justify-center font-bold rounded-full',
      sizeClass,
      avatarClass,
    ]"
  >
    {{ initial }}
  </div>
</template>
<script setup lang="ts">
import { ROLE_META } from '@/shared/config'
import { computed } from 'vue'
import type { RoleId } from '@/shared/config'

interface Props {
  name: string
  role: RoleId
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), { size: 'md' })

const initial = computed(() => props.name.charAt(0).toUpperCase())
const avatarClass = computed(() => ROLE_META[props.role]?.avatarClass ?? 'bg-ghost text-muted')
const sizeClass = computed(
  () =>
    ({
      sm: 'w-7 h-7 text-xs',
      md: 'w-9 h-9 text-sm',
      lg: 'w-12 h-12 text-base',
    })[props.size],
)
</script>
