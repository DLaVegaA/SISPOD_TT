<template>
  <div class="p-6 bg-[#f8f9fa] min-h-screen">
    
    <div class="mb-6">
      <div class="flex items-center gap-2 text-sm text-slate-500 mb-2">
        <span class="cursor-pointer hover:text-blue-600">🏠</span>
        <span>></span>
        <span class="bg-white px-2 py-1 rounded shadow-sm text-xs font-medium">Historial Clínico</span>
      </div>
      <h1 class="text-3xl font-bold text-slate-800">Historial Clínico</h1>
    </div>

    <div class="mb-8">
      <div class="relative w-full max-w-md">
        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <span class="text-slate-400 text-lg">🔍</span>
        </div>
        <input 
          type="text" 
          placeholder="No. Expediente o Nombre" 
          class="w-full pl-11 pr-4 py-3 bg-gray-200/60 border-none rounded-full text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-shadow"
        >
      </div>
    </div>

    <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm overflow-y-auto max-h-[70vh] custom-scrollbar">
      
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        
        <div v-for="i in 12" :key="i" class="border border-blue-100 rounded-xl p-3 flex flex-col gap-2 bg-white hover:shadow-md transition-shadow">
          
          <div class="flex flex-col items-center mb-1">
            <img src="https://i.pravatar.cc/150?img=11" alt="Avatar" class="w-10 h-10 rounded-full object-cover mb-2 shadow-sm">
            <span class="text-[9px] text-slate-400 font-medium tracking-wide">No. Expediente: 2025GOMR001</span>
          </div>

          <div class="bg-[#f4f7fb] p-2.5 rounded-lg text-[10px] leading-tight text-slate-600">
            <p><strong class="text-slate-800">Nombre:</strong> Carlos Alberto Méndez Torres</p>
            <p><strong class="text-slate-800">Sexo / Edad:</strong> Masculino 34 años</p>
            <p><strong class="text-slate-800">Localidad:</strong> Guadalajara, Jalisco</p>
          </div>

          <div class="bg-[#f4f7fb] p-2.5 rounded-lg text-[10px] leading-tight text-slate-600">
            <p><strong class="text-slate-800">Última atención:</strong> 10 / nov / 2025</p>
            <p class="truncate" title="Dolor en molar inferior derecho"><strong class="text-slate-800">Servicio:</strong> Dolor en molar inferior der...</p>
            <p class="truncate" title="Caries dental profunda en la pieza 46"><strong class="text-slate-800">Diagnóstico:</strong> Caries dental profunda...</p>
            <p><strong class="text-slate-800">Tratamiento Actual:</strong> Endodoncia</p>
          </div>

          <div class="bg-[#f4f7fb] p-2.5 rounded-lg text-[10px] leading-tight text-slate-600">
            <p><strong class="text-slate-800">Odontólogo responsable:</strong> Dr. Gonzalez</p>
            <p><strong class="text-slate-800">Fecha de creación:</strong> 10 / feb / 2025</p>
            <p><strong class="text-slate-800">Estado:</strong> <span class="text-blue-600 font-semibold">En tratamiento</span></p>
          </div>

          <div class="flex justify-between gap-1 mt-auto pt-1">
            <button class="flex-1 bg-[#478ecc] text-white text-[9px] py-1.5 rounded hover:bg-blue-600 transition-colors flex items-center justify-center gap-1">
              <span>📄</span> Historial
            </button>
            <button class="flex-1 bg-[#478ecc] text-white text-[9px] py-1.5 rounded hover:bg-blue-600 transition-colors flex items-center justify-center gap-1">
              <span>📥</span> Descargar
            </button>
            <button class="flex-1 bg-[#478ecc] text-white text-[9px] py-1.5 rounded hover:bg-blue-600 transition-colors flex items-center justify-center gap-1">
              <span>✏️</span> Editar
            </button>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Estilos para replicar el scrollbar redondeado y delgado del lado derecho */
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #cbd5e1; 
  border-radius: 10px;
}
</style>