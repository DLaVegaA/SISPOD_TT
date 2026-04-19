<template>
  <span :class="[meta.badgeClass, 'inline-flex items-center gap-1 role-badge']">
    <component :is="iconComponent" class="w-3 h-3" />
    {{ meta.label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Headset, Shield, Stethoscope, User } from 'lucide-vue-next'
import { ROLE_META, type RoleId } from '@/shared/config'

const iconMap: Record<string, unknown> = {
  Shield,
  Stethoscope,
  Headset,
  User,
}

const props = defineProps<{ role: RoleId }>()

const meta = computed(() => ROLE_META[props.role])
const iconComponent = computed(() => iconMap[meta.value?.icon ?? 'User'])
</script>
