<script setup lang="ts">
import type { PatientStatus, PatientSummary } from '../model/types'

defineProps<{ patients: PatientSummary[] }>()

type StatusStyle = { badge: string; dot: string; label: string }

const statusStyles: Record<PatientStatus, StatusStyle> = {
  Confirmada: {
    badge: 'bg-emerald-500/10 text-emerald-600',
    dot: 'bg-emerald-500',
    label: 'Confirmada',
  },
  Pendiente: {
    badge: 'bg-amber-500/10 text-amber-600',
    dot: 'bg-amber-500',
    label: 'Pendiente',
  },
  Cancelada: {
    badge: 'bg-red-500/10 text-red-500',
    dot: 'bg-red-500',
    label: 'Cancelada',
  },
  'Sin citas': {
    badge: 'bg-slate-500/10 text-slate-500',
    dot: 'bg-slate-400',
    label: 'Sin citas',
  },
}

const resolveStatus = (status: PatientStatus) => statusStyles[status]
</script>

<template>
  <div class="md:hidden space-y-3">
    <div
      v-for="patient in patients"
      :key="patient.id"
      class="bg-card border border-border rounded-2xl p-4"
    >
      <div class="flex justify-between items-start mb-3">
        <div>
          <p class="font-bold text-sm text-black">{{ patient.name }}</p>
          <p class="text-xs text-muted font-mono">
            P{{ patient.id }} · {{ patient.age }} ·
            <span class="text-accent font-bold">{{ patient.gender }}</span>
          </p>
        </div>
        <span :class="['role-badge', resolveStatus(patient.status).badge]">
          <span class="w-1.5 h-1.5 rounded-full" :class="resolveStatus(patient.status).dot" />
          {{ resolveStatus(patient.status).label }}
        </span>
      </div>

      <div class="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
        <div>
          <p class="text-[10px] text-muted uppercase tracking-wider">Ultima cita</p>
          <p class="text-xs text-black">{{ patient.lastAppointment }}</p>
        </div>
        <div>
          <p class="text-[10px] text-muted uppercase tracking-wider">Proxima cita</p>
          <p class="text-xs text-black">{{ patient.nextAppointment }}</p>
        </div>
        <div>
          <p class="text-[10px] text-muted uppercase tracking-wider">Ultimo tratamiento</p>
          <p class="text-xs text-black">{{ patient.lastTreatment }}</p>
        </div>
        <div>
          <p class="text-[10px] text-muted uppercase tracking-wider">Telefono</p>
          <p class="text-xs text-muted">{{ patient.phone }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
