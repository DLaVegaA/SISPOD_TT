<template>
  <div class="bg-card border border-border rounded-2xl overflow-hidden">
    <div class="lg:hidden flex flex-col gap-3 p-3 sm:p-4">
      <article
        v-if="users.length === 0"
        class="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-surface/70 px-6 py-16 text-center text-muted shadow-sm"
      >
        <SearchX class="w-8 h-8 opacity-40" />
        <p class="text-sm">No se encontraron usuarios</p>
      </article>

      <article
        v-for="user in users"
        :key="user.id"
        class="rounded-2xl border border-border bg-white/80 p-4 shadow-sm transition-colors hover:bg-white"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0 flex-1 space-y-4">
            <div class="flex items-center gap-3 min-w-0">
              <UserAvatar :name="user.name" size="md" :role="user.role" />
              <div class="min-w-0">
                <p class="truncate text-sm font-medium text-black">{{ user.name }}</p>
                <p class="truncate text-sm text-muted">{{ user.email }}</p>
              </div>
            </div>

            <div class="flex flex-wrap gap-2">
              <UserRoleBadge :role="user.role" />
              <span
                :class="[
                  'role-badge inline-flex items-center gap-1',
                  user.status === 'active'
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : 'bg-red-500/10 text-red-500',
                ]"
              >
                <component :is="user.status === 'active' ? CheckCircle : XCircle" class="w-3 h-3" />
                {{ user.status === 'active' ? 'Activo' : 'Inactivo' }}
              </span>
            </div>

            <p class="text-sm text-muted">
              <span class="font-medium text-muted-foreground">Creado:</span>
              {{ user.createdAt }}
            </p>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <button
              class="p-2 rounded-lg hover:bg-accent-dim hover:text-accent text-muted transition-all"
              title="Editar usuario"
              @click="$emit('edit', user)"
            >
              <Pencil class="w-4 h-4" />
            </button>
            <button
              class="p-2 rounded-lg hover:bg-accent-dim hover:text-accent text-muted transition-all"
              title="Eliminar usuario"
              @click="$emit('delete', user)"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </article>
    </div>

    <table class="hidden lg:table w-full">
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
        <tr v-if="users.length === 0">
          <td colspan="6" class="text-center py-16 text-muted text-sm">
            <SearchX class="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>No se encontraron usuarios</p>
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
              <span class="text-sm font-medium text-black">{{ user.name }}</span>
            </div>
          </td>
          <td class="px-6 py-4 text-sm text-muted">{{ user.email }}</td>
          <td class="px-6 py-4"><UserRoleBadge :role="user.role" /></td>
          <td class="px-6 py-4">
            <span
              :class="[
                'role-badge inline-flex items-center gap-1',
                user.status === 'active'
                  ? 'bg-emerald-500/10 text-emerald-500'
                  : 'bg-red-500/10 text-red-500',
              ]"
            >
              <component :is="user.status === 'active' ? CheckCircle : XCircle" class="w-3 h-3" />
              {{ user.status === 'active' ? 'Activo' : 'Inactivo' }}
            </span>
          </td>

          <td class="px-6 py-4 text-sm text-muted">{{ user.createdAt }}</td>

          <td class="px-6 py-4">
            <div class="flex items-center gap-2 justify-end">
              <button
                class="p-2 rounded-lg hover:bg-accent-dim hover:text-accent text-muted transition-all"
                title="Editar usuario"
                @click="$emit('edit', user)"
              >
                <Pencil class="w-4 h-4" />
              </button>
              <button
                class="p-2 rounded-lg hover:bg-accent-dim hover:text-accent text-muted transition-all"
                title="Eliminar usuario"
                @click="$emit('delete', user)"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script setup lang="ts">
import { CheckCircle, Pencil, SearchX, Trash2, XCircle } from 'lucide-vue-next'
import { UserAvatar, UserRoleBadge } from '@/entities/user'
import type { User } from '@/entities/user'

defineProps<{ users: User[] }>()
defineEmits<{ edit: [user: User]; delete: [user: User] }>()
</script>
