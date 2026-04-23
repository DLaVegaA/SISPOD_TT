<script setup lang="ts">
import { ref } from 'vue'
import { FileText, Download, Eye, CalendarDays, ChevronDown } from 'lucide-vue-next'
 
const patients = ref(
  Array.from({ length: 6 }, (_, i) => ({
    id: 'P001',
    nombre: 'Ana Torres',
    edad: 32,
    genero: 'F',
    ultimaCita: '2025-11-01',
    ultimoTratamiento: 'Endodoncia',
    proximaCita: '2025-11-25',
    estado: i === 0 ? 'activo' : 'inactivo',
    telefono: '55-12345678',
  }))
)
 
const currentMonth = ref('Noviembre 2025')
const currentRange = ref('Nov 1, 2025 – Nov 31, 2025')
const currentDay   = ref('NOV 7')
</script>
 
<template>
  <div class="fade-in">
 
    <!-- ── Header bar ───────────────────────────────────────────────────── -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
 
      <!-- Date chip -->
      <div class="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3">
        <div class="text-center">
          <p class="text-xs font-extrabold text-accent font-display leading-none">{{ currentDay }}</p>
        </div>
        <div class="w-px h-8 bg-border" />
        <div>
          <p class="text-sm font-bold text-black">{{ currentMonth }}</p>
          <p class="text-xs text-muted">{{ currentRange }}</p>
        </div>
      </div>
 
      <!-- Right controls -->
      <div class="flex items-center gap-3">
        <button class="px-4 py-2.5 bg-card border border-border rounded-2xl text-sm font-semibold text-black hover:bg-surface transition-colors">
          Hoy
        </button>
 
        <div class="relative">
          <select class="appearance-none bg-card border border-border rounded-2xl px-4 py-2.5 pr-9 text-sm font-semibold text-black hover:bg-surface transition-colors focus:outline-none focus:border-accent cursor-pointer">
            <option>Seleccionar Mes</option>
            <option>Enero</option>
            <option>Febrero</option>
            <option>Marzo</option>
          </select>
          <ChevronDown class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        </div>
 
        <button
          class="flex items-center gap-2 bg-ink/65 text-text-secondary hover:bg-ink/80 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all hover:scale-105 active:scale-95"
        >
          <CalendarDays class="w-4 h-4" />
          Agendar cita
        </button>
      </div>
    </div>
 
    <!-- ── Table ───────────────────────────────────────────────────────── -->
    <div class="bg-card border border-border rounded-2xl overflow-hidden">
      <table class="w-full">
 
        <!-- Head -->
        <thead>
          <tr class="border-b border-border bg-surface">
            <th class="text-left px-5 py-4 text-xs font-semibold text-muted uppercase tracking-wider">ID</th>
            <th class="text-left px-5 py-4 text-xs font-semibold text-muted uppercase tracking-wider">Nombre de Usuario</th>
            <th class="text-left px-5 py-4 text-xs font-semibold text-muted uppercase tracking-wider">Edad</th>
            <th class="text-left px-5 py-4 text-xs font-semibold text-muted uppercase tracking-wider">Género</th>
            <th class="text-left px-5 py-4 text-xs font-semibold text-muted uppercase tracking-wider">Última Cita</th>
            <th class="text-left px-5 py-4 text-xs font-semibold text-muted uppercase tracking-wider">Último Tratamiento</th>
            <th class="text-left px-5 py-4 text-xs font-semibold text-muted uppercase tracking-wider">Próxima Cita</th>
            <th class="text-left px-5 py-4 text-xs font-semibold text-muted uppercase tracking-wider">Estado Postoperatorio</th>
            <th class="text-left px-5 py-4 text-xs font-semibold text-muted uppercase tracking-wider">Teléfono</th>
            <th class="px-5 py-4 text-xs font-semibold text-muted uppercase tracking-wider text-right">Expedientes</th>
          </tr>
        </thead>
 
        <!-- Body -->
        <tbody>
          <tr
            v-for="(patient, i) in patients"
            :key="i"
            :class="[
              'border-b border-border last:border-0 hover:bg-surface transition-colors',
              i % 2 === 0 ? 'bg-white/30' : '',
            ]"
          >
            <!-- ID -->
            <td class="px-5 py-5 font-mono text-xs text-muted">{{ patient.id }}</td>
 
            <!-- Nombre -->
            <td class="px-5 py-5">
              <span class="text-sm font-bold text-black">{{ patient.nombre }}</span>
            </td>
 
            <!-- Edad -->
            <td class="px-5 py-5 text-sm text-black">{{ patient.edad }}</td>
 
            <!-- Género -->
            <td class="px-5 py-5">
              <span class="text-sm font-bold text-accent">{{ patient.genero }}</span>
            </td>
 
            <!-- Última cita -->
            <td class="px-5 py-5 text-xs text-muted">{{ patient.ultimaCita }}</td>
 
            <!-- Último tratamiento -->
            <td class="px-5 py-5 text-xs text-black">{{ patient.ultimoTratamiento }}</td>
 
            <!-- Próxima cita -->
            <td class="px-5 py-5 text-xs text-muted">{{ patient.proximaCita }}</td>
 
            <!-- Estado -->
            <td class="px-5 py-5">
              <span
                :class="[
                  'role-badge inline-flex items-center gap-1',
                  patient.estado === 'activo'
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : 'bg-red-500/10 text-red-500',
                ]"
              >
                <span class="w-1.5 h-1.5 rounded-full"
                  :class="patient.estado === 'activo' ? 'bg-emerald-500' : 'bg-red-500'"
                />
                {{ patient.estado === 'activo' ? '+ Activo' : '• Inactivo' }}
              </span>
            </td>
 
            <!-- Teléfono -->
            <td class="px-5 py-5 text-xs text-muted">{{ patient.telefono }}</td>
 
            <!-- Expedientes -->
            <td class="px-5 py-5">
              <div class="flex flex-col gap-1.5 items-end">
                <button class="flex items-center gap-1 text-[10px] font-semibold text-accent hover:text-accent-light uppercase transition-colors">
                  <FileText class="w-3 h-3" /> Historial
                </button>
                <button class="flex items-center gap-1 text-[10px] font-semibold text-accent hover:text-accent-light uppercase transition-colors">
                  <Download class="w-3 h-3" /> Descargar
                </button>
                <button class="flex items-center gap-1 text-[10px] font-semibold text-accent hover:text-accent-light uppercase transition-colors">
                  <Eye class="w-3 h-3" /> Ver
                </button>
              </div>
            </td>
          </tr>
        </tbody>
 
      </table>
    </div>
 
  </div>
</template>