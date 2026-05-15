import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { LogEntry } from './types'
import { getBitacoras, 
  anularBitacoraRequest, 
  createBitacoraRequest, 
  revisarBitacoraRequest,
  editarBitacoraRequest
 } from '../api/bitacoraApi'
import { httpClient } from '@/shared/api/http'

export const useBitacoraStore = defineStore('bitacora', () => {
  const logs = ref<LogEntry[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const allLogs = computed(() => logs.value)

  async function fetchBitacoras(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      logs.value = await getBitacoras()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar bitácoras'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function anularBitacora(id: string): Promise<void> {
    await anularBitacoraRequest(id)
    // Actualizamos el estado local sin recargar todo
    const index = logs.value.findIndex(l => l.id === id)
    if (index !== -1) {
      logs.value[index]!.status = 'Anulada' // El signo de exclamación quita el error
    }
  }

  async function createBitacora(payload: { id_cita: number; descripcion: string }): Promise<void> {
    await createBitacoraRequest(payload)
    // Recargamos la lista para ver la nueva bitácora inmediatamente
    await fetchBitacoras()
  }

  async function revisarBitacora(id: string): Promise<void> {
    await revisarBitacoraRequest(id)
    const index = logs.value.findIndex(l => l.id === id);
    if (index !== -1 && logs.value[index]) {
      logs.value[index].status = 'Revisado';
    }
  }


  async function updateBitacora(id: string, descripcion: string): Promise<void> {
    await editarBitacoraRequest(id, descripcion)
    const index = logs.value.findIndex(l => l.id === id);
    if (index !== -1 && logs.value[index]) {
      logs.value[index].description = descripcion;
    }
  }

  return {
    logs: allLogs,
    isLoading,
    error,
    fetchBitacoras,
    anularBitacora,
    createBitacora,
    revisarBitacora,
    updateBitacora
  }
})