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
  <div class="hidden md:block bg-card border border-border rounded-2xl overflow-hidden">
    <table class="w-full">
      <thead>
        <tr class="border-b border-border bg-surface">
          <th class="text-left px-5 py-4 text-xs font-semibold text-muted uppercase tracking-wider">
            ID
          </th>
          <th class="text-left px-5 py-4 text-xs font-semibold text-muted uppercase tracking-wider">
            Nombre de Usuario
          </th>
          <th class="text-left px-5 py-4 text-xs font-semibold text-muted uppercase tracking-wider">
            Edad
          </th>
          <th class="text-left px-5 py-4 text-xs font-semibold text-muted uppercase tracking-wider">
            Genero
          </th>
          <th class="text-left px-5 py-4 text-xs font-semibold text-muted uppercase tracking-wider">
            Ultima Cita
          </th>
          <th class="text-left px-5 py-4 text-xs font-semibold text-muted uppercase tracking-wider">
            Ultimo Tratamiento
          </th>
          <th class="text-left px-5 py-4 text-xs font-semibold text-muted uppercase tracking-wider">
            Proxima Cita
          </th>
          <th class="text-left px-5 py-4 text-xs font-semibold text-muted uppercase tracking-wider">
            Estado
          </th>
          <th class="text-left px-5 py-4 text-xs font-semibold text-muted uppercase tracking-wider">
            Telefono
          </th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="(patient, i) in patients"
          :key="patient.id"
          :class="[
            'border-b border-border last:border-0 hover:bg-surface transition-colors',
            i % 2 === 0 ? 'bg-white/30' : '',
          ]"
        >
          <td class="px-5 py-5 font-mono text-xs text-muted">P{{ patient.id }}</td>
          <td class="px-5 py-5">
            <span class="text-sm font-bold text-black">{{ patient.name }}</span>
          </td>
          <td class="px-5 py-5 text-sm text-black">{{ patient.age }}</td>
          <td class="px-5 py-5 text-center">
            <span class="text-sm font-bold text-accent">{{ patient.gender }}</span>
          </td>
          <td class="px-5 py-5 text-xs text-muted">{{ patient.lastAppointment }}</td>
          <td class="px-5 py-5 text-xs text-black">{{ patient.lastTreatment }}</td>
          <td class="px-5 py-5 text-xs text-muted">{{ patient.nextAppointment }}</td>
          <td class="px-5 py-5">
            <span
              :class="[
                'role-badge inline-flex items-center gap-1',
                resolveStatus(patient.status).badge,
              ]"
            >
              <span class="w-1.5 h-1.5 rounded-full" :class="resolveStatus(patient.status).dot" />
              {{ resolveStatus(patient.status).label }}
            </span>
          </td>
          <td class="px-3 py-5 text-xs text-muted">{{ patient.phone }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
