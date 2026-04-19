<template>
  <div class="fade-in">
    <div class="mb-8">
      <h1 class="font-display text-2xl font-extrabold text-black">Roles del Sistema</h1>
      <p class="text-muted text-sm mt-1">Descripción de permisos por rol</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <RoleCard
        v-for="role in roles"
        :key="role.id"
        :role="role"
        :user-count="store.countByRole(role.id)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// entities — capa inferior ✅
import { RoleCard, ROLES_LIST } from '@/entities/role'
import { useUserStore }         from '@/entities/user'

const store = useUserStore()
const roles = ROLES_LIST
</script>
