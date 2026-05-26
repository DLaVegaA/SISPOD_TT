<script setup lang="ts">
import OdontogramChart from './OdontogramChart.vue'

defineProps<{
  updatedAt?: string
  patientId?: string | number
  data?: unknown
}>()
</script>

<template>
  <div class="bg-card border border-border rounded-2xl p-4">
    <div class="flex items-center justify-between mb-3">
      <div>
        <p class="text-sm font-semibold text-black">Odontograma</p>
        <p class="text-xs text-muted">Vista previa del estado dental</p>
      </div>
      <span v-if="updatedAt" class="text-[10px] text-muted uppercase tracking-wide">
        Actualizado: {{ updatedAt }}
      </span>
    </div>
    <OdontogramChart preview :patient-id="patientId" :initial-data="data" />
  </div>
</template>
