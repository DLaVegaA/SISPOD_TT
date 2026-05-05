<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useSessionStore } from '@/entities/session'
import type { SessionUser } from '@/entities/session/model/types'
import { normalizeUserId, ROUTE_NAMES } from '@/shared/routes'
import { OdontogramChart } from '@/entities/odontogram'

const sessionStore = useSessionStore()
const route = useRoute()

const sessionUser = computed<SessionUser | null>(() => sessionStore.user)
const userId = computed(
  () => normalizeUserId(sessionUser.value?.id ?? sessionUser.value?.id_usuario) ?? '0',
)
const patientId = computed(() => route.params.patientId as string | undefined)
const routeParams = computed(() => ({ id: userId.value }))
const isReadOnly = computed(() => route.query.mode === 'view')
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
      <OdontogramChart :preview="isReadOnly" :patient-id="patientId" />
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
