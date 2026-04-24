<template>
  <div class="fade-in">
    <div class="mb-8">
      <h1 class="font-display text-3xl font-bold text-black">Roles del Sistema</h1>
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
import { onMounted } from 'vue'
import { RoleCard, ROLES_LIST } from '@/entities/role'
import { useUserStore } from '@/entities/user'

const store = useUserStore()
const roles = ROLES_LIST

onMounted(() => {
  if (!store.all.value.length) {
    store.fetchUsers().catch(() => undefined)
  }
})
</script>
