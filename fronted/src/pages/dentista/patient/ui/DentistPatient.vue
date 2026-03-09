<template>
  <div class="p-6 bg-slate-50 min-h-screen">
    <div class="flex justify-between items-center mb-6">
      <div class="flex items-center gap-4">
        <div class="bg-white p-2 rounded-lg shadow-sm border flex items-center gap-3">
          <span class="text-blue-600 font-bold text-sm">NOV 7</span>
          <div>
            <h2 class="text-sm font-bold text-slate-700">Noviembre 2025</h2>
            <p class="text-xs text-slate-400">Nov 1, 2025 - Nov 31, 2025</p>
          </div>
        </div>
      </div>

      <div class="flex gap-2">
        <button class="px-4 py-2 bg-white border rounded-lg text-sm shadow-sm">Hoy</button>
        <select class="px-4 py-2 bg-white border rounded-lg text-sm shadow-sm">
          <option>Seleccionar Mes</option>
        </select>
        <button class="px-4 py-2 bg-blue-400 text-white rounded-lg text-sm font-medium flex items-center gap-2">
          <span>+</span> Agendar cita
        </button>
      </div>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border overflow-hidden">
      <table class="w-full text-left border-collapse">
        <thead class="bg-slate-50 border-b">
          <tr class="text-[11px] uppercase text-slate-500 font-semibold">
            <th class="px-4 py-3">ID</th>
            <th class="px-4 py-3">Nombre de Usuario</th>
            <th class="px-4 py-3">Edad</th>
            <th class="px-4 py-3 text-center">Género</th>
            <th class="px-4 py-3">Última Cita</th>
            <th class="px-4 py-3">Último Tratamiento</th>
            <th class="px-4 py-3">Próxima Cita</th>
            <th class="px-4 py-3 text-center">Estado Postoperatorio</th>
            <th class="px-4 py-3">Teléfono</th>
            <th class="px-4 py-3 text-center">Expedientes</th>
          </tr>
        </thead>
        <tbody class="divide-y">
          <tr v-for="i in 6" :key="i" class="text-sm text-slate-700 hover:bg-blue-50/30 transition-colors">
            <td class="px-4 py-4 font-mono text-xs text-slate-400">P001</td>
            <td class="px-4 py-4 font-bold">Ana Torres</td>
            <td class="px-4 py-4">32</td>
            <td class="px-4 py-4 text-center text-slate-400 font-semibold">F</td>
            <td class="px-4 py-4 text-xs">2025-11-01</td>
            <td class="px-4 py-4 text-xs">Endodoncia</td>
            <td class="px-4 py-4 text-xs">2025-11-25</td>
            <td class="px-4 py-4 text-center">
              <span :class="i === 1 ? 'bg-green-100 text-green-600 border-green-200' : 'bg-red-100 text-red-600 border-red-200'" 
                    class="px-3 py-1 rounded-full text-[10px] font-bold border uppercase">
                {{ i === 1 ? '+ Activo' : '• Inactivo' }}
              </span>
            </td>
            <td class="px-4 py-4 text-xs">55-12345678</td>
            <td class="px-4 py-4 text-[10px]">
              <div class="flex flex-col gap-1 items-start text-slate-500 font-semibold">
                <button class="hover:text-blue-600 flex items-center gap-1 uppercase">📄 Historial</button>
                <button class="hover:text-blue-600 flex items-center gap-1 uppercase">📥 Descargar</button>
                <button class="hover:text-blue-600 flex items-center gap-1 uppercase">👁️ Ver</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>