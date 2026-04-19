<template>
  <div class="bg-card border border-border rounded-2xl p-6 hover:border-accent/30 transition-colors">
    <div class="flex items-center gap-4 mb-4">
      <div :class="['w-12 h-12 rounded-xl flex items-center justify-center', role.bgClass]">
        <component :is="iconComponent" :class="['w-6 h-6', role.textClass]" />
      </div>
      <div>
        <h3 class="font-display font-bold text-black">{{ role.label }}</h3>
        <p class="text-xs text-muted">{{ userCount }} usuarios asignados</p>
      </div>
    </div>
    <p class="text-sm text-muted mb-4">{{ role.description }}</p>
    <p class="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Permisos</p>
    <div
      v-for="perm in role.permissions"
      :key="perm"
      class="flex items-center gap-2 text-xs text-black/70 mb-1.5"
    >
      <CheckCircle2 class="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
      {{ perm }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Shield, Stethoscope, Headset, User, CheckCircle2 } from 'lucide-vue-next'
import type { RoleMeta } from '../model'

const ICON_MAP: Record<string, unknown> = { Shield, Stethoscope, Headset, User }

const props = defineProps<{ role: RoleMeta; userCount?: number }>()

const iconComponent = computed(() => ICON_MAP[props.role.icon] ?? User)
</script>
