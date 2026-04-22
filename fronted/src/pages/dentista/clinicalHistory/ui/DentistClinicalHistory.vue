<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search, FileText, Download, Pencil } from 'lucide-vue-next'
 
const searchQuery = ref('')
 
const records = ref(
  Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    expediente: '2025GOMR001',
    avatar: `https://i.pravatar.cc/150?img=${11 + (i % 5)}`,
    nombre: 'Carlos Alberto Méndez Torres',
    sexo: 'Masculino',
    edad: 34,
    localidad: 'Guadalajara, Jalisco',
    ultimaAtencion: '10 / nov / 2025',
    servicio: 'Dolor en molar inferior derecho',
    diagnostico: 'Caries dental profunda en la pieza 46',
    tratamiento: 'Endodoncia',
    odontologo: 'Dr. Gonzalez',
    fechaCreacion: '10 / feb / 2025',
    estado: 'En tratamiento',
  }))
)
 
const filtered = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return records.value
  return records.value.filter(
    (r) =>
      r.nombre.toLowerCase().includes(q) ||
      r.expediente.toLowerCase().includes(q),
  )
})
</script>
 
<template>
  <div class="fade-in">
 
    <!-- ── Header ──────────────────────────────────────────────────────── -->
    <div class="mb-8">
      <div class="flex items-center gap-1.5 text-xs text-muted font-medium mb-2">
        <span class="text-muted/60">🏠</span>
        <span class="text-muted/60">&gt;</span>
        <span class="bg-card border border-border px-2 py-0.5 rounded-lg">Historial Clínico</span>
      </div>
      <h1 class="font-display text-2xl font-extrabold text-black">Historial Clínico</h1>
    </div>
 
    <!-- ── Search ──────────────────────────────────────────────────────── -->
    <div class="mb-6 max-w-md">
      <div class="relative">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="No. Expediente o Nombre"
          class="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm text-black placeholder-muted focus:outline-none focus:border-accent transition-colors"
        />
      </div>
    </div>
 
    <!-- ── Cards container ─────────────────────────────────────────────── -->
    <div class="bg-card border border-border rounded-2xl p-5">
 
      <!-- Empty state -->
      <div v-if="filtered.length === 0" class="py-16 text-center text-muted text-sm">
        <Search class="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p>No se encontraron expedientes</p>
      </div>
 
      <!-- Grid -->
      <div
        v-else
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4"
      >
        <div
          v-for="record in filtered"
          :key="record.id"
          class="bg-surface border border-border rounded-xl flex flex-col gap-0 overflow-hidden hover:border-accent/30 hover:shadow-sm transition-all"
        >
          <!-- Avatar + expediente -->
          <div class="flex flex-col items-center pt-4 pb-3 px-3 border-b border-border">
            <img
              :src="record.avatar"
              alt="Avatar"
              class="w-12 h-12 rounded-full object-cover mb-2 ring-2 ring-border"
            />
            <span class="text-[9px] text-muted font-semibold tracking-wide text-center">
              No. Expediente: {{ record.expediente }}
            </span>
          </div>
 
          <!-- Info blocks -->
          <div class="flex flex-col gap-2 p-3 flex-1">
 
            <!-- Datos personales -->
            <div class="bg-card rounded-lg p-2.5 text-[10px] leading-relaxed text-black/80 space-y-0.5">
              <p><span class="font-bold text-black">Nombre:</span> {{ record.nombre }}</p>
              <p><span class="font-bold text-black">Sexo / Edad:</span> {{ record.sexo }} {{ record.edad }} años</p>
              <p><span class="font-bold text-black">Localidad:</span> {{ record.localidad }}</p>
            </div>
 
            <!-- Última atención -->
            <div class="bg-card rounded-lg p-2.5 text-[10px] leading-relaxed text-black/80 space-y-0.5">
              <p><span class="font-bold text-black">Última atención:</span> {{ record.ultimaAtencion }}</p>
              <p class="truncate" :title="record.servicio">
                <span class="font-bold text-black">Servicio:</span> {{ record.servicio }}
              </p>
              <p class="truncate" :title="record.diagnostico">
                <span class="font-bold text-black">Diagnóstico:</span> {{ record.diagnostico }}
              </p>
              <p><span class="font-bold text-black">Tratamiento Actual:</span> {{ record.tratamiento }}</p>
            </div>
 
            <!-- Odontólogo -->
            <div class="bg-card rounded-lg p-2.5 text-[10px] leading-relaxed text-black/80 space-y-0.5">
              <p><span class="font-bold text-black">Odontólogo responsable:</span> {{ record.odontologo }}</p>
              <p><span class="font-bold text-black">Fecha de creación:</span> {{ record.fechaCreacion }}</p>
              <p>
                <span class="font-bold text-black">Estado:</span>
                <span class="text-accent font-semibold ml-1">{{ record.estado }}</span>
              </p>
            </div>
 
          </div>
 
          <!-- Action buttons -->
          <div class="grid grid-cols-3 border-t border-border">
            <button
              class="flex items-center justify-center gap-1 py-2 text-[9px] font-bold text-accent hover:bg-accent-dim transition-colors border-r border-border"
            >
              <FileText class="w-3 h-3" /> Historial
            </button>
            <button
              class="flex items-center justify-center gap-1 py-2 text-[9px] font-bold text-accent hover:bg-accent-dim transition-colors border-r border-border"
            >
              <Download class="w-3 h-3" /> Descargar
            </button>
            <button
              class="flex items-center justify-center gap-1 py-2 text-[9px] font-bold text-accent hover:bg-accent-dim transition-colors"
            >
              <Pencil class="w-3 h-3" /> Editar
            </button>
          </div>
        </div>
      </div>
    </div>
 
  </div>
</template>