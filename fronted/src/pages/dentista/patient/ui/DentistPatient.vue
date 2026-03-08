<script setup lang="ts">
import { ref } from 'vue';

// Datos falsos (mock) para ver cómo se llena la tabla de pacientes
const pacientes = ref([
  { id: 'EXP-001', nombre: 'Carlos Pérez', telefono: '55 1234 5678', ultimaCita: '15 Feb 2026', estado: 'En Tratamiento', colorEstado: 'bg-blue-100 text-blue-800' },
  { id: 'EXP-002', nombre: 'Ana Castillo', telefono: '55 8765 4321', ultimaCita: '02 Mar 2026', estado: 'Alta', colorEstado: 'bg-emerald-100 text-emerald-800' },
  { id: 'EXP-003', nombre: 'Sergio Díaz', telefono: '55 1122 3344', ultimaCita: '28 Ene 2026', estado: 'Mantenimiento', colorEstado: 'bg-indigo-100 text-indigo-800' },
  { id: 'EXP-004', nombre: 'María García', telefono: '55 4433 2211', ultimaCita: '08 Mar 2026', estado: 'En Tratamiento', colorEstado: 'bg-blue-100 text-blue-800' },
  { id: 'EXP-005', nombre: 'Luis Ramírez', telefono: '55 9988 7766', ultimaCita: '10 Dic 2025', estado: 'Inactivo', colorEstado: 'bg-slate-100 text-slate-600' },
]);
</script>

<template>
  <div class="min-h-screen bg-slate-50 font-sans p-6 md:p-8">
    
    <header class="mb-8">
      <div class="flex items-center text-sm text-slate-500 mb-2 font-medium">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <span>> Pacientes</span>
      </div>

      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 class="text-3xl font-bold text-slate-900">Directorio de Pacientes</h1>
        <button class="bg-blue-400 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-xl shadow-sm transition-colors flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Registrar Paciente
        </button>
      </div>
    </header>

    <main class="space-y-6">
      
      <section class="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4">
        <div class="flex-1 relative">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            placeholder="Buscar por nombre, expediente o teléfono..." 
            class="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow text-sm text-slate-700 font-medium"
          >
        </div>
        
        <div class="flex items-center gap-3">
          <select class="border border-slate-200 text-slate-600 rounded-xl px-4 py-2 outline-hidden focus:ring-2 focus:ring-blue-400 shadow-sm text-sm font-semibold bg-slate-50">
            <option>Todos los estados</option>
            <option>En Tratamiento</option>
            <option>Alta</option>
          </select>
          <button class="p-2 text-slate-500 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
        </div>
      </section>

      <section class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50/50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
                <th class="p-4 px-6">Expediente</th>
                <th class="p-4 px-6">Nombre del Paciente</th>
                <th class="p-4 px-6">Teléfono</th>
                <th class="p-4 px-6">Última Cita</th>
                <th class="p-4 px-6">Estado</th>
                <th class="p-4 px-6 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="paciente in pacientes" :key="paciente.id" class="hover:bg-slate-50/50 transition-colors group">
                <td class="p-4 px-6 font-bold text-slate-800 text-sm">{{ paciente.id }}</td>
                <td class="p-4 px-6 font-semibold text-slate-700">{{ paciente.nombre }}</td>
                <td class="p-4 px-6 text-slate-500 text-sm font-medium">{{ paciente.telefono }}</td>
                <td class="p-4 px-6 text-slate-500 text-sm font-medium">{{ paciente.ultimaCita }}</td>
                <td class="p-4 px-6">
                  <span :class="['px-3 py-1 rounded-full text-xs font-bold shadow-xs', paciente.colorEstado]">
                    {{ paciente.estado }}
                  </span>
                </td>
                <td class="p-4 px-6 text-center">
                  <button class="text-blue-500 hover:text-blue-700 font-semibold text-sm mr-3 transition-colors">Abrir</button>
                  <button class="text-slate-400 hover:text-slate-600 font-semibold text-sm transition-colors">Editar</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="p-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500 font-medium">
          <span>Mostrando 1 a 5 de 42 pacientes</span>
          <div class="flex gap-1">
            <button class="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50">Ant</button>
            <button class="px-3 py-1 rounded-lg border border-blue-400 bg-blue-50 text-blue-700 font-bold">1</button>
            <button class="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50">2</button>
            <button class="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50">3</button>
            <button class="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50">Sig</button>
          </div>
        </div>
      </section>

    </main>
  </div>
</template>