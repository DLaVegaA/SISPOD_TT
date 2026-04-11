<!-- eslint-disable vue/no-mutating-props  -->
<template>
  <UiModal
    :model-value="modelValue"
    :title="isEdit ? 'Editar Usuario' : 'Nuevo Usuario'"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="px-6 py-5 space-y-4">
      <!--Nombre -->
      <div>
        <label class="block text-xs font-semibold text-muted uppercase tracking-wider mb-2"
          >Nombre Completo</label
        >
        <input
          v-model="form.name"
          type="text"
          placeholder="Ej. María García"
          :class="inputCls(!!errors.name)"
        />
        <p v-if="errors.name" class="text-red-400 text-xs mt-1">{{ errors.name }}</p>
      </div>

      <!--Correo -->
      <div>
        <label class="block text-xs font-semibold text-muted uppercase tracking-wider mb-2"
          >Correo electrónico</label
        >
        <input
          v-model="form.email"
          type="email"
          placeholder="ejemplo@sispod.com"
          :class="inputCls(!!errors.name)"
        />
        <p v-if="errors.email" class="text-red-400 text-xs mt-1">{{ errors.email }}</p>
      </div>

      <!-- Contraseña -->
      <div v-if="!isEdit && 'password' in form">
        <label class="block text-xs font-semibold text-muted uppercase tracking-wider mb-2"
          >Contraseña</label
        >
        <div class="relative">
          <input
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Mínimo 8 caracteres"
            :class="[inputCls(!!errors.password), 'pr-10']"
          />
          <button
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-black transition-colors"
            @click="emit('toggle-password')"
          >
            <component :is="showPassword ? EyeOff : Eye" class="w-4 h-4"></component>
          </button>
        </div>
        <p v-if="errors.password" class="text-red-400 text-xs mt-1">{{ errors.password }}</p>
      </div>
      <!-- Rol -->
      <div>
        <label class="block text-xs font-semibold text-muted uppercase tracking-wider mb-2"
          >Rol asignado</label
        >
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="role in roles"
            :key="role.id"
            type="button"
            :class="[
              ' flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all hover:scale-105',
              form.role === role.id
                ? 'border-accent bg-accent-dim text-accent'
                : 'border-border text-muted hover:border-accent/10 hover:text-black ',
            ]"
            @click="form.role = role.id"
          >
            <component :is="iconMap[role.icon]" class="w-4 h-4 shrink-0"></component
            >{{ role.label }}
          </button>
        </div>
        <p v-if="errors.role" class="text-red-400 text-xs mt-1">
          {{ errors.role }}
        </p>
      </div>
      <!-- Estado -->
      <div>
        <label class="block text-xs font-semibold text-muted uppercase tracking-wider mb-2"
          >Estado</label
        >
        <div class="flex gap-2">
          <button
            type="button"
            :class="[
              'flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2 hover:scale-105',
              form.status === 'active'
                ? 'border-green-600 bg-green-500/10 text-green-600'
                : 'border-border text-muted hover:text-black hover:border-accent/10 ',
            ]"
            @click="form.status = 'active'"
          >
            <CheckCircle class="w-4 h-4" /> Activo
          </button>
          <button
            type="button"
            :class="[
              'flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2 hover:scale-105',
              form.status === 'inactive'
                ? 'border-red-600 bg-red-600/10 text-red-500'
                : 'border-border text-muted hover:text-black hover:border-accent/10',
            ]"
            @click="form.status = 'inactive'"
          >
            <XCircle class="w-4 h-4" /> Inactivo
          </button>
        </div>
      </div>
    </div>
    <!-- Footer -->
    <div class="px-6 py-4 border-t border-border flex gap-3 justify-end">
      <button
        type="button"
        class="border-accent/10 bg-accent-dim text-accent px-4 py-2 rounded-xl border text-sm hover:bg-accent-light/30 hover:border-accent/10 transition-all hover:scale-105"
        @click="$emit('update:modelValue', false)"
      >
        Cancelar
      </button>
      <button
        type="button"
        class="flex items-center gap-2 bg-ink/65 text-text-secondary hover:bg-ink/80 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all hover:scale-105 active:scale-95"
        @click="$emit('submit')"
      >
        <component :is="isEdit ? Save : UserPlus" class="w-4 h-4" />
        {{ isEdit ? 'Guardar cambios' : 'Crear usuario' }}
      </button>
    </div>
  </UiModal>
</template>
<script setup lang="ts">
import {
  Eye,
  EyeOff,
  Headset,
  Shield,
  Stethoscope,
  User,
  CheckCircle,
  XCircle,
  Save,
  UserPlus,
} from 'lucide-vue-next'

import type { CreateUserDto, UpdateUserDto } from '@/entities/user'

import type { CreateUserErrors } from '@/features/create-user'

import { ROLES_LIST } from '@/shared/config'
import { UiModal } from '@/shared/ui/UiModal'

const iconMap: Record<string, unknown> = { Shield, Stethoscope, Headset, User }

interface Props {
  modelValue: boolean
  form: CreateUserDto | UpdateUserDto
  errors: CreateUserErrors
  isEdit?: boolean
  showPassword: boolean
}

withDefaults(defineProps<Props>(), { isEdit: false })

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'toggle-password': []
  submit: []
}>()

const roles = ROLES_LIST

function inputCls(hasError: boolean): string {
  return `w-full bg-surface border rounded-xl px-4 py-2.5 text-sm text-black placeholder-muted focus:outline-none transition-colors ${hasError ? 'border-red-500' : 'border-border focus:border-accent'}`
}
</script>
