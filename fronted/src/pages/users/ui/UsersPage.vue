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
    <UiModal v-model="showForm" title="Crear" />
  </div>
</template>
<script lang="ts" setup>
import { UiModal } from '@/shared/ui/UiModal'
import { UserPlus } from 'lucide-vue-next'
import { ref } from 'vue'

const showForm = ref(false)

// Handlers
function openCreate(): void {
  showForm.value = true
}
</script>
