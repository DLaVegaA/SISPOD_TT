<template>
  <div class="flex flex-wrap gap-3">
    <!-- Búsqueda -->
    <div class="flex-1 min-w-52 relative">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
      <input
        v-model="filters.search.value"
        type="text"
        placeholder="Buscar por nombre o correo..."
        class="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-black placeholder-muted focus:outline-none focus:border-accent transition-colors"
      />
    </div>

    <!-- Filtro por rol -->
    <select
      v-model="filters.filterRole.value"
      class="bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-black focus:outline-none focus:border-accent transition-colors"
    >
      <option value="">Todos los roles</option>
      <option v-for="role in roles" :key="role.id" :value="role.id">{{ role.label }}</option>
    </select>

    <!-- Filtro por estado -->
    <select
      v-model="filters.filterStatus.value"
      class="bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-black focus:outline-none focus:border-accent transition-colors"
    >
      <option value="">Todos los estados</option>
      <option value="active">Activo</option>
      <option value="inactive">Inactivo</option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { Search } from 'lucide-vue-next'
import { ROLES_LIST } from '@/entities/role'
import type { FilterState } from '../model'

defineProps<{ filters: FilterState }>()

const roles = ROLES_LIST
</script>
