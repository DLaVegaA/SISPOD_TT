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
          :class="inputCls(!!errors.email)"
        />
        <p v-if="errors.email" class="text-red-400 text-xs mt-1">{{ errors.email }}</p>
      </div>

      <!-- Datos personales requeridos para paciente y dentista -->
      <template v-if="showExtendedFields">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-muted uppercase tracking-wider mb-2"
              >Apellido paterno</label
            >
            <input
              v-model="createForm.apellidoPaterno"
              type="text"
              placeholder="Apellido paterno"
              :class="inputCls(!!(errors as CreateUserErrors).apellidoPaterno)"
            />
            <p
              v-if="(errors as CreateUserErrors).apellidoPaterno"
              class="text-red-400 text-xs mt-1"
            >
              {{ (errors as CreateUserErrors).apellidoPaterno }}
            </p>
          </div>

          <div>
            <label class="block text-xs font-semibold text-muted uppercase tracking-wider mb-2"
              >Apellido materno</label
            >
            <input
              v-model="createForm.apellidoMaterno"
              type="text"
              placeholder="Apellido materno"
              :class="inputCls(!!(errors as CreateUserErrors).apellidoMaterno)"
            />
            <p
              v-if="(errors as CreateUserErrors).apellidoMaterno"
              class="text-red-400 text-xs mt-1"
            >
              {{ (errors as CreateUserErrors).apellidoMaterno }}
            </p>
          </div>

          <div>
            <label class="block text-xs font-semibold text-muted uppercase tracking-wider mb-2"
              >Teléfono</label
            >
            <input
              v-model="createForm.telefono"
              type="tel"
              placeholder="10 dígitos"
              :class="inputCls(!!(errors as CreateUserErrors).telefono)"
            />
            <p v-if="(errors as CreateUserErrors).telefono" class="text-red-400 text-xs mt-1">
              {{ (errors as CreateUserErrors).telefono }}
            </p>
          </div>

          <div>
            <label class="block text-xs font-semibold text-muted uppercase tracking-wider mb-2"
              >Fecha de nacimiento</label
            >
            <input
              v-model="createForm.fechaNacimiento"
              type="date"
              :class="inputCls(!!(errors as CreateUserErrors).fechaNacimiento)"
            />
            <p
              v-if="(errors as CreateUserErrors).fechaNacimiento"
              class="text-red-400 text-xs mt-1"
            >
              {{ (errors as CreateUserErrors).fechaNacimiento }}
            </p>
          </div>

          <div>
            <label class="block text-xs font-semibold text-muted uppercase tracking-wider mb-2"
              >CURP</label
            >
            <input
              v-model="createForm.curp"
              type="text"
              maxlength="18"
              placeholder="18 caracteres"
              :class="inputCls(!!(errors as CreateUserErrors).curp)"
            />
            <p v-if="(errors as CreateUserErrors).curp" class="text-red-400 text-xs mt-1">
              {{ (errors as CreateUserErrors).curp }}
            </p>
          </div>

          <div>
            <label class="block text-xs font-semibold text-muted uppercase tracking-wider mb-2"
              >Género</label
            >
            <input
              v-model="createForm.genero"
              type="text"
              placeholder="Ej. Masculino/Femenino"
              :class="inputCls(!!(errors as CreateUserErrors).genero)"
            />
            <p v-if="(errors as CreateUserErrors).genero" class="text-red-400 text-xs mt-1">
              {{ (errors as CreateUserErrors).genero }}
            </p>
          </div>
        </div>
      </template>

      <!-- Cédula requerida para dentista -->
      <div v-if="showDentistFields">
        <label class="block text-xs font-semibold text-muted uppercase tracking-wider mb-2"
          >Cédula profesional</label
        >
        <input
          v-model="createForm.noCedula"
          type="text"
          placeholder="No. cédula"
          :class="inputCls(!!(errors as CreateUserErrors).noCedula)"
        />
        <p v-if="(errors as CreateUserErrors).noCedula" class="text-red-400 text-xs mt-1">
          {{ (errors as CreateUserErrors).noCedula }}
        </p>
      </div>

      <!-- Dirección requerida para paciente -->
      <template v-if="showPatientFields">
        <div class="pt-1">
          <p class="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Dirección</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="md:col-span-2">
              <input
                v-model="createForm.calle"
                type="text"
                placeholder="Calle"
                :class="inputCls(!!(errors as CreateUserErrors).calle)"
              />
              <p v-if="(errors as CreateUserErrors).calle" class="text-red-400 text-xs mt-1">
                {{ (errors as CreateUserErrors).calle }}
              </p>
            </div>

            <div>
              <input
                v-model="createForm.numExt"
                type="text"
                placeholder="Número exterior"
                :class="inputCls(!!(errors as CreateUserErrors).numExt)"
              />
              <p v-if="(errors as CreateUserErrors).numExt" class="text-red-400 text-xs mt-1">
                {{ (errors as CreateUserErrors).numExt }}
              </p>
            </div>

            <div>
              <input
                v-model="createForm.numInt"
                type="text"
                placeholder="Número interior (opcional)"
                :class="inputCls(false)"
              />
            </div>

            <div>
              <input
                v-model="createForm.colonia"
                type="text"
                placeholder="Colonia"
                :class="inputCls(!!(errors as CreateUserErrors).colonia)"
              />
              <p v-if="(errors as CreateUserErrors).colonia" class="text-red-400 text-xs mt-1">
                {{ (errors as CreateUserErrors).colonia }}
              </p>
            </div>

            <div>
              <input
                v-model="createForm.municipio"
                type="text"
                placeholder="Municipio"
                :class="inputCls(!!(errors as CreateUserErrors).municipio)"
              />
              <p v-if="(errors as CreateUserErrors).municipio" class="text-red-400 text-xs mt-1">
                {{ (errors as CreateUserErrors).municipio }}
              </p>
            </div>

            <div>
              <input
                v-model="createForm.estadoDireccion"
                type="text"
                placeholder="Estado"
                :class="inputCls(!!(errors as CreateUserErrors).estadoDireccion)"
              />
              <p
                v-if="(errors as CreateUserErrors).estadoDireccion"
                class="text-red-400 text-xs mt-1"
              >
                {{ (errors as CreateUserErrors).estadoDireccion }}
              </p>
            </div>

            <div>
              <input
                v-model="createForm.codigoPostal"
                type="text"
                maxlength="5"
                placeholder="Código postal"
                :class="inputCls(!!(errors as CreateUserErrors).codigoPostal)"
              />
              <p v-if="(errors as CreateUserErrors).codigoPostal" class="text-red-400 text-xs mt-1">
                {{ (errors as CreateUserErrors).codigoPostal }}
              </p>
            </div>
          </div>
        </div>
      </template>

      <!-- Contraseña -->
      <div v-if="showPasswordField && 'password' in form">
        <label class="block text-xs font-semibold text-muted uppercase tracking-wider mb-2"
          >Contraseña</label
        >
        <div class="relative">
          <input
            v-model="(form as CreateUserDto).password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Mínimo 8 caracteres"
            :class="[inputCls(!!(errors as CreateUserErrors).password), 'pr-10']"
          />
          <button
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-black transition-colors"
            @click="emit('toggle-password')"
          >
            <component :is="showPassword ? EyeOff : Eye" class="w-4 h-4"></component>
          </button>
        </div>
        <p v-if="(errors as CreateUserErrors).password" class="text-red-400 text-xs mt-1">
          {{ (errors as CreateUserErrors).password }}
        </p>
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
            @click="setRole(role.id)"
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
      <div v-if="showStatusField">
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
import { computed } from 'vue'
import {
  CheckCircle,
  Eye,
  EyeOff,
  Headset,
  Save,
  Shield,
  Stethoscope,
  User,
  UserPlus,
  XCircle,
} from 'lucide-vue-next'

import type { CreateUserDto, UpdateUserDto } from '@/entities/user'
import type { RoleId } from '@/shared/config'

import type { CreateUserErrors } from '@/features/create-user'
import type { EditUserErrors } from '@/features/edit-user'

import { ROLES_LIST } from '@/entities/role'
import { UiModal } from '@/shared/ui/UiModal'

const iconMap: Record<string, unknown> = { Shield, Stethoscope, Headset, User }

interface Props {
  modelValue: boolean
  form: CreateUserDto | UpdateUserDto
  errors: CreateUserErrors | EditUserErrors
  isEdit?: boolean
  showPassword: boolean
}

const props = withDefaults(defineProps<Props>(), { isEdit: false })

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'toggle-password': []
  submit: []
}>()

const roles = ROLES_LIST

const createForm = computed(() => props.form as CreateUserDto)
const selectedRole = computed<RoleId>(() => (createForm.value.role ?? 'patient') as RoleId)

const showExtendedFields = computed(
  () => !props.isEdit && (selectedRole.value === 'patient' || selectedRole.value === 'dentist'),
)
const showPatientFields = computed(() => !props.isEdit && selectedRole.value === 'patient')
const showDentistFields = computed(() => !props.isEdit && selectedRole.value === 'dentist')
const showPasswordField = computed(() => !props.isEdit && selectedRole.value !== 'patient')
const showStatusField = computed(
  () => props.isEdit || selectedRole.value === 'admin' || selectedRole.value === 'assistant',
)

function setRole(role: RoleId): void {
  createForm.value.role = role

  if (role !== 'dentist') {
    createForm.value.noCedula = ''
  }

  if (role !== 'patient') {
    createForm.value.calle = ''
    createForm.value.numExt = ''
    createForm.value.numInt = ''
    createForm.value.colonia = ''
    createForm.value.municipio = ''
    createForm.value.estadoDireccion = ''
    createForm.value.codigoPostal = ''
  }
}

function inputCls(hasError: boolean): string {
  return `w-full bg-surface border rounded-xl px-4 py-2.5 text-sm text-black placeholder-muted focus:outline-none transition-colors ${hasError ? 'border-red-500' : 'border-border focus:border-accent'}`
}
</script>
