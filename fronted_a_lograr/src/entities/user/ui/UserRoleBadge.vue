<template>
  <span :class="['role-badge inline-flex items-center gap-1', meta.badgeClass]">
    <component :is="iconComponent" class="w-3 h-3" />
    {{ meta.label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Shield, Stethoscope, Headset, User } from 'lucide-vue-next'
import { ROLE_META } from '@/shared/config'
import type { RoleId } from '@/shared/config'

const ICON_MAP: Record<string, unknown> = {
  Shield, Stethoscope, Headset, User,
}

const props = defineProps<{ role: RoleId }>()

const meta          = computed(() => ROLE_META[props.role])
const iconComponent = computed(() => ICON_MAP[meta.value?.icon ?? 'User'])
</script>
