<script setup lang="ts">
import { CalendarDays, Search } from 'lucide-vue-next'
import { UiInput } from '@/shared/ui/UiInput'
import { UiSelect } from '@/shared/ui/UiSelect'

type RangeType = 'all' | 'week' | 'month' | 'date'

const props = defineProps<{
  search: string
  rangeType: RangeType
  dateValue: string
}>()

const emit = defineEmits<{
  'update:search': [value: string]
  'update:rangeType': [value: RangeType]
  'update:dateValue': [value: string]
}>()
</script>

<template>
  <div class="flex flex-col lg:flex-row lg:items-end gap-3">
    <div class="flex-1">
      <UiInput
        :model-value="props.search"
        placeholder="Buscar por nombre de paciente..."
        :prefix-icon="Search"
        variant="card"
        @update:modelValue="emit('update:search', $event)"
      />
    </div>

    <div>
      <label class="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
        Rango de citas
      </label>
      <UiSelect
        :model-value="props.rangeType"
        @update:modelValue="emit('update:rangeType', $event as RangeType)"
      >
        <option value="all">Todas</option>
        <option value="week">Semana</option>
        <option value="month">Mes</option>
        <option value="date">Fecha</option>
      </UiSelect>
    </div>

    <div v-if="props.rangeType !== 'all'">
      <label class="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
        Selecciona fecha
      </label>
      <div class="relative">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
          <CalendarDays class="w-4 h-4" />
        </span>
        <input
          type="date"
          class="bg-card border border-border rounded-xl px-10 py-2.5 text-sm text-black focus:outline-none focus:border-accent transition-colors"
          :value="props.dateValue"
          @input="emit('update:dateValue', ($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>
  </div>
</template>
