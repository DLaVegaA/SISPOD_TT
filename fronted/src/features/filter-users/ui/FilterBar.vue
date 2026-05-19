<template>
  <div class="flex flex-wrap gap-3">
    <!-- Busqueda -->
    <div class="flex-1 min-w-52 relative">
      <UiInput
        v-model="filters.search.value"
        placeholder="Buscar por nombre o correo..."
        type="text"
        :prefix-icon="Search"
        variant="card"
      />
    </div>
    <!-- Filtro Rol -->
    <div class="flex gap-3">
      <UiSelect v-model="filters.filterRole.value">
        <option value="">Todos los Roles</option>
        <option v-for="role in roles" :key="role.id" :value="role.id">{{ role.label }}</option>
      </UiSelect>
      <!-- Filtro Estado -->
      <UiSelect v-model="filters.filterStatus.value">
        <option value="">Todos los Estados</option>
        <option value="active">Activo</option>
        <option value="inactive">Inactivo</option>
      </UiSelect>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ROLES_LIST } from '@/shared/config'
import { UiInput } from '@/shared/ui/UiInput'
import { UiSelect } from '@/shared/ui/UiSelect'
import { Search } from 'lucide-vue-next'
import type { FilterState } from '../model'

defineProps<{ filters: FilterState }>()

const roles = ROLES_LIST
</script>
