<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { httpClient } from '@/shared/api/http'

type BitacoraItem = {
  id: number
  title: string
  date: string
  description: string
  status: string
}

type ResponseBitacoras = {
  message?: string
  bitacoras: Array<{
    id_bitacora: number
    estado_bitacora: string
    accion_realizada: string
    fecha_cita: string
    descripcion: string
    id_paciente: number
  }>
  total?: number
  totalPaginas?: number
  limit?: number
}

const props = defineProps<{ patientId?: string | number }>()

const items = ref<BitacoraItem[]>([])
const isLoading = ref(false)

const mapStatus = (estado?: string) => {
  const normalized = (estado || '').toLowerCase()
  if (normalized === 'revisado' || normalized === 'revisada') return 'Finalizado'
  if (normalized === 'pendiente') return 'Pendiente'
  return 'En tratamiento'
}

const formatDate = (fecha?: string) => {
  if (!fecha) return 'Sin fecha'
  const parsed = new Date(fecha)
  if (Number.isNaN(parsed.getTime())) return 'Sin fecha'
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed)
}

const loadBitacoras = async (patientId?: string | number) => {
  if (!patientId) {
    items.value = []
    return
  }

  isLoading.value = true
  try {
    const data: ResponseBitacoras = await httpClient.get(`/bitacora/paciente/${patientId}`, {
      params: { limit: 6, pagina: 1 },
    })
    const lista = Array.isArray(data?.bitacoras) ? data.bitacoras : []
    items.value = lista.map((bitacora) => ({
      id: bitacora.id_bitacora,
      title: bitacora.accion_realizada || 'Procedimiento',
      date: formatDate(bitacora.fecha_cita),
      description: bitacora.descripcion || 'Sin descripcion',
      status: mapStatus(bitacora.estado_bitacora),
    }))
  } catch (error) {
    console.error('Error al cargar bitacoras del paciente', error)
    items.value = []
  } finally {
    isLoading.value = false
  }
}

const statusStyles: Record<string, string> = {
  'En tratamiento': 'bg-accent/10 text-accent border-accent/20',
  Finalizado: 'bg-emerald-500/10 text-emerald-600 border-emerald-400/30',
  Pendiente: 'bg-amber-500/10 text-amber-600 border-amber-400/30',
}

onMounted(() => {
  loadBitacoras(props.patientId)
})

watch(
  () => props.patientId,
  (value) => {
    loadBitacoras(value)
  },
)
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
    <div v-if="isLoading" class="col-span-full text-sm text-muted">Cargando bitacoras...</div>
    <div v-else-if="items.length === 0" class="col-span-full text-sm text-muted">
      No hay bitacoras registradas.
    </div>
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
