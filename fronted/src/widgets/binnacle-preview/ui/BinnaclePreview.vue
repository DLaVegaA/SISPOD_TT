<script setup lang="ts">
const items = [
  {
    id: 1,
    title: 'Control mensual',
    date: '03 / may / 2026',
    description: 'Ajuste de ortodoncia y recomendaciones de higiene.',
    status: 'Finalizado',
  },
  {
    id: 2,
    title: 'Endodoncia',
    date: '28 / abr / 2026',
    description: 'Dolor en molar inferior derecho, se realiza limpieza.',
    status: 'En tratamiento',
  },
  {
    id: 3,
    title: 'Seguimiento',
    date: '22 / abr / 2026',
    description: 'Reevaluacion posterior a extraccion de pieza 18.',
    status: 'Pendiente',
  },
  {
    id: 4,
    title: 'Profilaxis',
    date: '15 / abr / 2026',
    description: 'Limpieza general y control de placa.',
    status: 'Finalizado',
  },
  {
    id: 5,
    title: 'Consulta general',
    date: '05 / abr / 2026',
    description: 'Revisar caries incipientes y plan de tratamiento.',
    status: 'En tratamiento',
  },
  {
    id: 6,
    title: 'Revision',
    date: '29 / mar / 2026',
    description: 'Evaluacion de dolor y sensibilidad localizada.',
    status: 'Pendiente',
  },
]

const statusStyles: Record<string, string> = {
  'En tratamiento': 'bg-accent/10 text-accent border-accent/20',
  Finalizado: 'bg-emerald-500/10 text-emerald-600 border-emerald-400/30',
  Pendiente: 'bg-amber-500/10 text-amber-600 border-amber-400/30',
}
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
    <div
      v-for="item in items"
      :key="item.id"
      class="bg-surface border border-border rounded-2xl p-4 shadow-sm"
    >
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-sm font-semibold text-black">{{ item.title }}</p>
          <p class="text-[11px] text-muted">Fecha: {{ item.date }}</p>
        </div>
        <span
          :class="[
            'text-[10px] font-bold uppercase px-2 py-1 rounded-full border',
            statusStyles[item.status] ?? 'bg-card text-muted border-border',
          ]"
        >
          {{ item.status }}
        </span>
      </div>
      <p class="text-xs text-muted mt-3">{{ item.description }}</p>
    </div>
  </div>
</template>
