<script setup lang="ts">
import { ref } from 'vue';

// Cabecera del calendario (iniciando en Domingo)
const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// Generamos 35 días (5 semanas) para rellenar la cuadrícula
const diasCalendario = ref(Array.from({ length: 35 }, (_, i) => {
  // Como Marzo 2026 empieza en Domingo, el índice 0 corresponde al día 1.
  const dia = i + 1; 
  const esMesActual = dia <= 31; // Marzo tiene 31 días
  const esHoy = dia === 8; // Marcamos el 8 como el día actual
  
  // Mock de citas para ver cómo se ven los indicadores
  const citas = [];
  if (esMesActual) {
    if (dia === 5 || dia === 12 || dia === 18) {
      citas.push({ id: 1, titulo: 'Limpieza - Juan P.', color: 'bg-blue-400' });
    }
    if (dia === 18) {
      citas.push({ id: 2, titulo: 'Revisión - Ana G.', color: 'bg-indigo-400' });
    }
  }

  return {
    numero: esMesActual ? dia : dia - 31, // Si pasa del 31, empieza en 1, 2, 3 (Abril)
    esMesActual,
    esHoy,
    citas
  };
}));
</script>

<template>
  <div class="min-h-screen bg-slate-50 font-sans p-6 md:p-8">
    
    <header class="mb-8">
      <div class="flex items-center text-sm text-slate-500 mb-2 font-medium">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span>> Calendario</span>
      </div>

      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 class="text-3xl font-bold text-slate-900">Marzo 2026</h1>
        
        <div class="flex items-center gap-3">
          <div class="flex bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden font-bold">
            <button class="px-4 py-2 hover:bg-slate-50 transition border-r border-slate-200 text-slate-600">&lt;</button>
            <button class="px-4 py-2 hover:bg-slate-50 transition text-slate-800">Hoy</button>
            <button class="px-4 py-2 hover:bg-slate-50 transition border-l border-slate-200 text-slate-600">&gt;</button>
          </div>
          <button class="bg-blue-400 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-xl shadow-sm transition-colors">
            + Nueva Cita
          </button>
        </div>
      </div>
    </header>

    <main>
      <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        
        <div class="grid grid-cols-7 bg-slate-50/50 border-b border-slate-200 text-center py-4">
          <span v-for="dia in diasSemana" :key="dia" class="text-sm font-bold text-slate-500 uppercase tracking-wider">
            {{ dia }}
          </span>
        </div>

        <div class="grid grid-cols-7">
          <div 
            v-for="(dia, index) in diasCalendario" 
            :key="index"
            class="min-h-[120px] p-2 border-r border-b border-slate-100 last:border-r-0 hover:bg-slate-50/50 transition-colors cursor-pointer group"
          >
            <div class="flex justify-end mb-2">
              <span :class="[
                'w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-colors',
                dia.esHoy ? 'bg-blue-500 text-white shadow-md shadow-blue-200' : (dia.esMesActual ? 'text-slate-700' : 'text-slate-300')
              ]">
                {{ dia.numero }}
              </span>
            </div>

            <div class="space-y-1">
              <div 
                v-for="cita in dia.citas" 
                :key="cita.id"
                :class="['text-[10px] p-1.5 rounded-lg text-white font-bold truncate shadow-xs', cita.color]"
              >
                {{ cita.titulo }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>