<template>
  <UiModal
    :model-value="modelValue"
    title="Nuevo Paciente"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="px-6 py-5 space-y-4">
      <p class="text-sm text-muted mb-4">
        Ingresa la información mínima para enviar la invitación de registro al paciente.
      </p>

      <!-- Nombre -->
      <div>
        <label class="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
          Nombre
        </label>
        <input
          v-model="form.nombre"
          type="text"
          placeholder="Ej. Juan"
          :class="inputCls(!!errors.nombre)"
        />
        <p v-if="errors.nombre" class="text-red-400 text-xs mt-1">{{ errors.nombre }}</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <!-- Apellido Paterno -->
        <div>
          <label class="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
            Apellido paterno
          </label>
          <input
            v-model="form.apellido_paterno"
            type="text"
            placeholder="Pérez"
            :class="inputCls(!!errors.apellido_paterno)"
          />
          <p v-if="errors.apellido_paterno" class="text-red-400 text-xs mt-1">
            {{ errors.apellido_paterno }}
          </p>
        </div>

        <!-- Apellido Materno -->
        <div>
          <label class="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
            Apellido materno
          </label>
          <input
            v-model="form.apellido_materno"
            type="text"
            placeholder="López (opcional)"
            :class="inputCls(!!errors.apellido_materno)"
          />
          <p v-if="errors.apellido_materno" class="text-red-400 text-xs mt-1">
            {{ errors.apellido_materno }}
          </p>
        </div>
      </div>

      <!-- Correo electrónico -->
      <div>
        <label class="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
          Correo electrónico
        </label>
        <input
          v-model="form.correo"
          type="email"
          placeholder="ejemplo@correo.com"
          :class="inputCls(!!errors.correo)"
        />
        <p v-if="errors.correo" class="text-red-400 text-xs mt-1">{{ errors.correo }}</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <!-- Fecha de nacimiento -->
        <div>
          <label class="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
            Fecha de nacimiento
          </label>
          <input
            v-model="form.fecha_nacimiento"
            type="date"
            :max="maxDate"
            :class="inputCls(!!errors.fecha_nacimiento)"
          />
          <p v-if="errors.fecha_nacimiento" class="text-red-400 text-xs mt-1">
            {{ errors.fecha_nacimiento }}
          </p>
        </div>

        <!-- CURP -->
        <div>
          <label class="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
            CURP
          </label>
          <input
            v-model="form.curp"
            type="text"
            maxlength="18"
            placeholder="18 caracteres"
            class="uppercase"
            :class="inputCls(!!errors.curp)"
          />
          <p v-if="errors.curp" class="text-red-400 text-xs mt-1">{{ errors.curp }}</p>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="px-6 py-4 border-t border-border flex gap-3 justify-end">
      <button
        type="button"
        class="border-accent/10 bg-accent-dim text-accent px-4 py-2 rounded-xl border text-sm hover:bg-accent-light/30 transition-all hover:scale-105"
        @click="$emit('update:modelValue', false)"
        :disabled="isLoading"
      >
        Cancelar
      </button>
      <button
        type="button"
        class="flex items-center gap-2 bg-ink/65 text-text-secondary hover:bg-ink/80 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
        @click="$emit('submit')"
        :disabled="isLoading"
      >
        <UserPlus class="w-4 h-4" />
        {{ isLoading ? 'Enviando...' : 'Crear paciente' }}
      </button>
    </div>
  </UiModal>
</template>

<script setup lang="ts">
import { UserPlus } from 'lucide-vue-next'
import { UiModal } from '@/shared/ui/UiModal'

export interface PatientFormDto {
  nombre: string
  apellido_paterno: string
  apellido_materno: string
  correo: string
  fecha_nacimiento: string
  curp: string
  id_rol: number
}

interface Props {
  modelValue: boolean
  form: PatientFormDto
  errors: Record<string, string>
  isLoading?: boolean
}

const maxDate = new Date().toISOString().split('T')[0];

defineProps<Props>()

defineEmits<{
  'update:modelValue': [value: boolean]
  submit: []
}>()

function inputCls(hasError: boolean): string {
  return `w-full bg-surface border rounded-xl px-4 py-2.5 text-sm text-black placeholder-muted focus:outline-none transition-colors ${hasError ? 'border-red-500' : 'border-border focus:border-accent'}`
}
</script>