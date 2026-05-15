<template>
  <UiModal
    :model-value="modelValue"
    :title="isEditMode ? 'Editar Descripción' : 'Nueva Bitácora'"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="px-6 py-5 space-y-5">
      <div>
        <label class="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
          Cita asociada
        </label>
        
        <div class="relative">
          <select
            v-model="form.id_cita"
            :disabled="isLoadingCitas || isEditMode"
            class="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-black focus:outline-none focus:border-accent transition-colors disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-surface-dim"
          >
            <option value="" disabled>
              {{ isLoadingCitas ? 'Cargando citas...' : 'Selecciona una cita...' }}
            </option>
            <option 
              v-for="cita in citasList" 
              :key="cita.id_cita" 
              :value="cita.id_cita"
            >
              {{ cita.display_text || formatCita(cita) }}
            </option>
          </select>
        </div>
        <p v-if="errors.id_cita" class="text-red-400 text-xs mt-1">{{ errors.id_cita }}</p>
      </div>

      <div>
        <label class="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
          Descripción del procedimiento
        </label>
        <textarea
          v-model="form.descripcion"
          rows="5"
          placeholder="Describe el procedimiento, hallazgos, tolerancia del paciente..."
          class="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-black focus:outline-none focus:border-accent transition-colors resize-none"
        ></textarea>
        <p v-if="errors.descripcion" class="text-red-400 text-xs mt-1">{{ errors.descripcion }}</p>
      </div>
    </div>
    
    <div class="px-6 py-4 border-t border-border flex gap-3 justify-end">
      <button
        type="button"
        class="border-accent/10 bg-accent-dim text-accent px-4 py-2 rounded-xl border text-sm hover:bg-accent-light/30 transition-all hover:scale-105"
        @click="$emit('update:modelValue', false)"
      >
        Cancelar
      </button>
      <button
        type="button"
        :disabled="isLoadingCitas || (citasList.length === 0 && !isEditMode)"
        class="flex items-center gap-2 bg-ink/65 text-text-secondary hover:bg-ink/80 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
        @click="handleSubmit"
      >
        {{ isEditMode ? 'Guardar Cambios' : 'Guardar Bitácora' }}
      </button>
    </div>
  </UiModal>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { UiModal } from '@/shared/ui/UiModal' 
import { httpClient } from '@/shared/api/http'

// Nuevas propiedades para aceptar el modo edición
const props = defineProps<{ 
  modelValue: boolean,
  isEditMode?: boolean,
  initialData?: { id_cita: string | number, descripcion: string, citaDisplay?: string }
}>()

const emit = defineEmits(['update:modelValue', 'submit'])

const form = reactive({
  id_cita: '' as string | number,
  descripcion: ''
})

const errors = reactive({
  id_cita: '',
  descripcion: ''
})

const citasList = ref<any[]>([])
const isLoadingCitas = ref(false)

watch(() => props.modelValue, async (isOpen) => {
  if (isOpen) {
    errors.id_cita = ''
    errors.descripcion = ''
    
    if (props.isEditMode && props.initialData) {
      // 🟢 MODO EDICIÓN: Llenamos los datos y metemos una "cita falsa" al select para que se muestre bloqueado con el texto correcto
      form.id_cita = props.initialData.id_cita
      form.descripcion = props.initialData.descripcion
      citasList.value = [{
        id_cita: props.initialData.id_cita,
        display_text: props.initialData.citaDisplay
      }]
      isLoadingCitas.value = false
    } else {
      // 🔵 MODO CREACIÓN: Limpiamos y consultamos la BD como lo hacíamos antes
      form.id_cita = ''
      form.descripcion = ''
      try {
        isLoadingCitas.value = true
        const data: any = await httpClient.get('/citas', {
          params: { limit: 100, estado: 'Pendiente' }
        })
        citasList.value = data.citas || []
      } catch (error) {
        console.error('Error al cargar las citas:', error)
      } finally {
        isLoadingCitas.value = false
      }
    }
  }
})

function formatCita(cita: any): string {
  const fecha = new Intl.DateTimeFormat('es-MX', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  }).format(new Date(cita.fecha_hora_inicio))
  
  const pacienteNombre = cita.paciente?.usuario?.nombre || ''
  const pacienteApellido = cita.paciente?.usuario?.apellido_paterno || ''
  
  return `Cita #${cita.id_cita} - ${fecha} (${pacienteNombre} ${pacienteApellido})`.trim()
}

function handleSubmit() {
  errors.id_cita = ''
  errors.descripcion = ''
  let isValid = true

  if (!form.id_cita) {
    errors.id_cita = 'Debes seleccionar una cita.'
    isValid = false
  }
  if (!form.descripcion.trim()) {
    errors.descripcion = 'La descripción es obligatoria.'
    isValid = false
  }

  if (isValid) {
    emit('submit', { 
      id_cita: Number(form.id_cita), 
      descripcion: form.descripcion.trim() 
    })
  }
}
</script>