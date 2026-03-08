<script setup lang="ts">
import { ref } from 'vue';

// Datos falsos (mock) basados en tu diseño para armar la estructura
const metricas = ref([
  { titulo: 'Citas del Dia', numero: 8, subtitulo: '2 Sin Confirmar', textoBoton: 'Ver Agenda' },
  { titulo: 'Tratamientos En Progreso', numero: 8, subtitulo: 'Controles Proximos', textoBoton: 'Ver Tratamientos' },
  { titulo: 'Cuestionarios Pendientes', numero: 6, subtitulo: 'Por Completar', textoBoton: 'Revisar' },
]);

const proximasCitas = ref(Array(15).fill({
  paciente: 'Nombre del Paciente',
  fecha: 'Fecha de Cita',
  tipo: 'Tipo de Tratamiento'
}));

const alertas = ref([
  { tipo: 'Cita cancelada', paciente: 'Carlos Pérez', hora: '9:00 AM', color: 'bg-red-300 text-red-900' },
  { tipo: 'Cita cancelada', paciente: 'Carlos Pérez', hora: '9:00 AM', color: 'bg-red-300 text-red-900' },
  { tipo: 'Cuestionario faltante', paciente: 'Sergio Díaz', hora: '9:00 AM', color: 'bg-yellow-200 text-yellow-900' },
  { tipo: 'Cita cancelada', paciente: 'Carlos Pérez', hora: '9:00 AM', color: 'bg-red-300 text-red-900' },
  { tipo: 'Historial incompleto', paciente: 'Ana Castillo', hora: '9:00 AM', color: 'bg-yellow-200 text-yellow-900' },
  { tipo: 'Cita cancelada', paciente: 'Carlos Pérez', hora: '9:00 AM', color: 'bg-red-300 text-red-900' },
  { tipo: 'Historial incompleto', paciente: 'Ana Castillo', hora: '9:00 AM', color: 'bg-yellow-200 text-yellow-900' },
]);
</script>

<template>
  <div class="min-h-screen bg-slate-50 font-sans p-6 md:p-8">
    
    <header class="mb-8">
      <div class="flex items-center text-sm text-slate-500 mb-2 font-medium">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span>> Resumen</span>
      </div>
      <h1 class="text-3xl font-bold text-slate-900">Resumen</h1>
    </header>

    <main class="space-y-8">
      
      <section class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div v-for="(item, index) in metricas" :key="index" class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col">
          <h2 class="text-center font-bold text-slate-800 mb-6">{{ item.titulo }}</h2>
          <div class="flex items-center justify-between mt-auto">
            <span class="text-2xl font-bold text-slate-700 w-12 h-12 flex items-center justify-center border border-slate-200 rounded-xl shadow-sm">
              {{ item.numero }}
            </span>
            <span class="text-sm font-semibold text-slate-600 px-4 py-1 border border-slate-200 rounded-full bg-slate-50">
              {{ item.subtitulo }}
            </span>
            <button class="bg-blue-400 hover:bg-blue-500 text-white text-xs font-bold py-2 px-4 rounded-xl transition-colors">
              {{ item.textoBoton }}
            </button>
          </div>
        </div>
      </section>

      <section class="bg-blue-50/40 rounded-3xl p-6 border border-blue-100">
        <h2 class="text-center font-bold text-slate-900 mb-6 text-xl">Próximas Citas</h2>
        
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-x-6 gap-y-3 mb-6">
          <div v-for="(cita, index) in proximasCitas" :key="index" class="bg-white border border-slate-200 rounded-full px-5 py-2 flex justify-between items-center text-xs text-slate-600 shadow-sm">
            <span class="font-bold text-slate-900 truncate w-1/3">{{ cita.paciente }}</span>
            <span class="w-1/3 text-center">{{ cita.fecha }}</span>
            <span class="w-1/3 text-right truncate">{{ cita.tipo }}</span>
          </div>
        </div>

        <div class="flex justify-center">
          <button class="bg-blue-400 hover:bg-blue-500 text-white text-sm font-bold py-2 px-8 rounded-xl transition-colors shadow-sm">
            Ver Agenda
          </button>
        </div>
      </section>

      <section class="bg-blue-50/40 rounded-3xl p-6 border border-blue-100 min-h-[300px] flex flex-col">
        <h2 class="text-center font-bold text-slate-900 mb-6 text-xl">Alertas</h2>
        
        <div class="space-y-3 lg:w-1/2 mb-6 flex-grow">
          <div v-for="(alerta, index) in alertas" :key="index" 
               :class="['rounded-full px-6 py-2 flex justify-between items-center text-xs font-bold shadow-sm', alerta.color]">
            <span class="w-1/3 truncate">{{ alerta.tipo }}</span>
            <span class="w-1/3 text-center font-medium">{{ alerta.paciente }}</span>
            <span class="w-1/3 text-right font-medium">{{ alerta.hora }}</span>
          </div>
        </div>

        <div class="flex justify-center">
          <button class="bg-blue-400 hover:bg-blue-500 text-white text-sm font-bold py-2 px-8 rounded-xl transition-colors shadow-sm">
            Ver Más
          </button>
        </div>
      </section>

    </main>
  </div>
</template>