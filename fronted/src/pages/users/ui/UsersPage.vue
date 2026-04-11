<template>
  <div class="fade-in">
    <!-- Cabecera -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="font-display text-3xl font-semibold text-black">Gestión de Usuarios</h1>
        <p class="text-muted text-sm mt-1">{{}}usuarios encontrados</p>
      </div>

      <button
        class="flex items-center gap-2 bg-ink/65 text-text-secondary hover:bg-ink/80 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all hover:scale-105 active:scale-95"
        @click="openCreate"
      >
        <UserPlus class="h-4 w-4" />
        Nuevo Usuario
      </button>
    </div>
    <!-- Filtros -->
    <!-- <UiModal v-model="showForm" title="Crear" /> -->

    <!-- Modal Crear/Editar  -->
    <UserFormModal
      v-model="showForm"
      :form="activeForm"
      :errors="activeErrors"
      :is-edit="isEditeMode"
      :show-password="createForm.showPwd.value"
      @toggle-password="createForm.showPwd.value = !createForm.showPwd.value"
      @submit="handleSubmit"
    />
  </div>
</template>
<script lang="ts" setup>
import { computed, ref } from 'vue'
import { UserPlus } from 'lucide-vue-next'

// Widgets Layout
import { UserFormModal } from '@/widgets/user-form-modal'

// Features Layout
import { useCreateUserForm } from '@/features/create-user'

// Formularios
const createForm = useCreateUserForm()

const isEditeMode = ref(false)
const showForm = ref(false)

const activeForm = computed(() => createForm.form)

const activeErrors = computed(() => createForm.errors)

// Handlers
function openCreate(): void {
  showForm.value = true
}

function handleSubmit(): void {
  if (isEditeMode.value) {
  } else {
    if (!createForm.validate()) return
    showForm.value = false
  }
}
</script>
