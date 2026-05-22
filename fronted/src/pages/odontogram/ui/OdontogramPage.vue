<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useSessionStore } from '@/entities/session'
import type { SessionUser } from '@/entities/session/model/types'
import { normalizeUserId, ROUTE_NAMES } from '@/shared/routes'
import { OdontogramChart } from '@/entities/odontogram'
import { httpClient } from '@/shared/api/http'
import { showToast } from '@/shared/ui/UiToast/toast'

const sessionStore = useSessionStore()
const route = useRoute()

const sessionUser = computed<SessionUser | null>(() => sessionStore.user)
const userId = computed(
  () => normalizeUserId(sessionUser.value?.id ?? sessionUser.value?.id_usuario) ?? '0',
)
const patientId = computed(() => route.params.patientId as string | undefined)
const routeParams = computed(() => ({ id: userId.value }))
const isReadOnly = computed(() => route.query.mode === 'view')
const expedienteId = computed(() => {
  const raw = route.query.expedienteId
  const id = Number(raw)
  return Number.isFinite(id) && id > 0 ? id : null
})

type OdontogramaItem = {
  num: number
  surfaces: Record<'top' | 'bottom' | 'left' | 'right' | 'center', string | null>
  condition: string | null
}

type OdontogramaPayload = OdontogramaItem[]

const odontogramaId = ref<number | null>(null)
const odontogramaData = ref<OdontogramaPayload | null>(null)
const isSaving = ref(false)

const loadOdontograma = async (id?: number | null) => {
  if (!id) {
    odontogramaId.value = null
    odontogramaData.value = null
    return
  }
  try {
    const data: any = await httpClient.get(`/odontograma/expediente/${id}`)
    const odontograma = data?.odontograma ?? data
    odontogramaId.value = odontograma?.id_odontograma ?? null
    odontogramaData.value = Array.isArray(odontograma?.datos_odontograma)
      ? odontograma.datos_odontograma
      : null
  } catch (error) {
    console.error('Error al cargar odontograma', error)
    odontogramaId.value = null
    odontogramaData.value = null
  }
}

const handleSave = async (payload: OdontogramaPayload) => {
  if (isReadOnly.value || isSaving.value) return
  if (!expedienteId.value) {
    showToast('No se encontro el expediente para guardar el odontograma', 'error')
    return
  }

  isSaving.value = true
  try {
    if (odontogramaId.value) {
      await httpClient.put(`/odontograma/${odontogramaId.value}`, {
        datos_odontograma: payload,
      })
    } else {
      const response: any = await httpClient.post('/odontograma', {
        id_expediente: expedienteId.value,
        datos_odontograma: payload,
      })
      odontogramaId.value = response?.odontograma?.id_odontograma ?? null
    }
    showToast('Odontograma guardado correctamente', 'success')
  } catch (error) {
    console.error('Error al guardar odontograma', error)
    showToast('No se pudo guardar el odontograma', 'error')
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  loadOdontograma(expedienteId.value)
})

watch(expedienteId, (value) => {
  loadOdontograma(value)
})
</script>

<template>
  <div class="fade-in max-w-7xl">
    <div class="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div class="flex items-center gap-2 text-xs text-muted mb-2">
          <span>🏠</span>
          <span>/</span>
          <RouterLink
            :to="{ name: ROUTE_NAMES.DENTIST_CLINICAL_HISTORY, params: routeParams }"
            class="text-muted hover:text-black"
          >
            Historial Clinico
          </RouterLink>
          <span>/</span>
          <span class="font-medium text-muted">Odontograma</span>
        </div>
        <h1 class="font-display text-3xl sm:text-4xl font-bold text-black">Odontograma</h1>
        <p class="text-sm text-muted mt-1">Marca el estado de cada pieza dental del paciente.</p>
      </div>
    </div>

    <section class="bg-card border border-border rounded-2xl p-5 shadow-sm">
      <OdontogramChart
        :preview="isReadOnly"
        :patient-id="patientId"
        :initial-data="odontogramaData"
        @save="handleSave"
      />
    </section>
  </div>
</template>

<style scoped>
.fade-in {
  animation: fadeIn 0.25s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
