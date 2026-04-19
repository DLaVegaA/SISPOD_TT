<template>
  <div class="bg-card border border-border rounded-2xl overflow-hidden">
    <table class="w-full">
      <thead>
        <tr class="border-b border-border">
          <th class="text-left px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider">
            Usuario
          </th>
          <th class="text-left px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider">
            Correo
          </th>
          <th class="text-left px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider">
            Rol
          </th>
          <th class="text-left px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider">
            Estado
          </th>
          <th class="text-left px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider">
            Creado
          </th>
          <th class="px-6 py-4" />
        </tr>
      </thead>

      <tbody>
        <tr v-if="false">
          <td colspan="6" class="text-center py-16 text-muted text-sm">
            <SearchX class="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p class="opacity-40">No se encontraron usuarios</p>
          </td>
        </tr>
        <tr
          v-for="(user, i) in users"
          :key="user.id"
          :class="[
            'border-b border-border last:border-0 hover:bg-surface transition-colors',
            i % 2 === 0 ? 'bg-white/30' : '',
          ]"
        >
          <td class="px-6 py-4">
            <div class="flex items-center gap-3">
              <UserAvatar :name="user.name" size="md" :role="user.role" />
              <span class="text-sm font-medium text-muted">{{ user.name }}</span>
            </div>
          </td>
          <td class="px-6 py-4 text-sm text-muted">{{ user.email }}</td>
          <td class="px-6 py-4"><UserRolBadge :role="user.role" /></td>
          <td class="px-6 py-4">
            <span
              :class="[
                'role-badge inline-flex items-center gap-1',
                user.status === 'active'
                  ? 'bg-green-500/10 text-green-600'
                  : 'bg-red-500/10 text-red-500',
              ]"
              ><component :is="user.status === 'active' ? CheckCircle : XCircle" class="w-3 h-3" />
              {{ user.status === 'active' ? 'Activo' : 'Inactivo' }}
            </span>
          </td>

          <td class="px-6 py-4 text-sm text-muted">{{ user.createdAt }}</td>

          <td class="px-6 py-4">{{}}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script setup lang="ts">
import { UserAvatar, UserRolBadge } from '@/entities/user'
import type { User } from '@/entities/user'
import { SearchX } from '@lucide/vue'
import { CheckCircle, XCircle } from 'lucide-vue-next'
defineProps<{ users: User[] }>()
</script>
