<template>
  <div class="flex flex-wrap gap-3">
    <!-- Busqueda -->
    <div class="flex-1 min-w-52 relative">
      <UiInput
        placeholder="Buscar por nombre o correo..."
        type="text"
        :prefix-icon="Search"
        variant="card"
      />
    </div>
    <!-- Filtro Rol -->
    <UiSelect>
      <option value="">Todos los Roles</option>
      <option v-for="role in roles" :key="role.id" :value="role.id">{{ role.label }}</option>
    </UiSelect>
    <!-- Filtro Estado -->
    <UiSelect>
      <option value="">Todos los Estados</option>
      <option value="active">Activo</option>
      <option value="inactive">Inactivo</option>
    </UiSelect>
  </div>
</template>
<script setup lang="ts">
import { ROLES_LIST } from '@/shared/config'
import { UiInput } from '@/shared/ui/UiInput'
import { UiSelect } from '@/shared/ui/UiSelect'
import { Search } from 'lucide-vue-next'

const roles = ROLES_LIST
</script>
