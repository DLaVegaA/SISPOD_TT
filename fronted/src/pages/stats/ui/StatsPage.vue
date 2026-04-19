<template>
  <div class="fade-in">
    <div class="mb-8">
      <h1 class="font-display text-2xl font-extrabold text-black">Estadísticas</h1>
      <p class="text-muted text-sm mt-1">Resumen del sistema de usuarios</p>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div class="bg-card border border-border rounded-2xl p-5">
        <div class="flex items-center justify-between mb-3">
          <p class="text-xs text-muted font-semibold uppercase tracking-wider">Total</p>
          <Users class="w-4 h-4 text-accent-light" />
        </div>
        <p class="text-3xl font-display font-extrabold text-black">{{ store.totalCount }}</p>
        <p class="text-xs text-muted mt-1">usuarios registrados</p>
      </div>

      <div class="bg-card border border-border rounded-2xl p-5">
        <div class="flex items-center justify-between mb-3">
          <p class="text-xs text-muted font-semibold uppercase tracking-wider">Activos</p>
          <Activity class="w-4 h-4 text-emerald-400" />
        </div>
        <p class="text-3xl font-display font-extrabold text-emerald-500">{{ store.activeCount }}</p>
        <p class="text-xs text-muted mt-1">en el sistema</p>
      </div>

      <div class="bg-card border border-border rounded-2xl p-5">
        <div class="flex items-center justify-between mb-3">
          <p class="text-xs text-muted font-semibold uppercase tracking-wider">Inactivos</p>
          <UserX class="w-4 h-4 text-red-400" />
        </div>
        <p class="text-3xl font-display font-extrabold text-red-500">{{ store.inactiveCount }}</p>
        <p class="text-xs text-muted mt-1">deshabilitados</p>
      </div>

      <div class="bg-card border border-border rounded-2xl p-5">
        <div class="flex items-center justify-between mb-3">
          <p class="text-xs text-muted font-semibold uppercase tracking-wider">Roles</p>
          <Tag class="w-4 h-4 text-purple-500" />
        </div>
        <p class="text-3xl font-display font-extrabold text-black">{{ roles.length }}</p>
        <p class="text-xs text-muted mt-1">tipos disponibles</p>
      </div>
    </div>

    <div class="bg-card border border-border rounded-2xl p-6">
      <h3 class="font-display font-bold text-black mb-6">Distribución por Rol</h3>

      <div class="space-y-5">
        <div v-for="role in roles" :key="role.id">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <component :is="iconMap[role.icon]" :class="['w-4 h-4', role.textClass]" />
              <span class="text-sm text-black">{{ role.label }}</span>
            </div>
            <span class="text-sm text-muted">
              {{ store.countByRole(role.id) }} / {{ store.totalCount }}
            </span>
          </div>

          <div class="w-full bg-border rounded-full h-2">
            <div
              :class="['h-2 rounded-full transition-all duration-700', role.barClass]"
              :style="{ width: rolePercentage(role.id) }"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { Activity, Headset, Shield, Stethoscope, Tag, User, Users, UserX } from 'lucide-vue-next'
import { useUserStore } from '@/entities/user'
import { ROLES_LIST } from '@/entities/role'

const store = useUserStore()
const roles = ROLES_LIST

onMounted(() => {
  if (!store.all.value.length) {
    store.fetchUsers().catch(() => undefined)
  }
})

const iconMap: Record<string, unknown> = {
  Shield,
  Stethoscope,
  Headset,
  User,
}

function rolePercentage(roleId: string): string {
  if (!store.totalCount.value) {
    return '0%'
  }

  return `${(store.countByRole(roleId) / store.totalCount.value) * 100}%`
}
</script>
