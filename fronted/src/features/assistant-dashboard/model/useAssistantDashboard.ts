/**
 * @layer  features / assistant-dashboard / model
 * @file   useAssistantDashboard.ts
 */

import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from '@/entities/session'
import { normalizeUserId, ROUTE_NAMES } from '@/shared/routes'
import {
  assistantDashboardApi,
  type CitaAPI,
  type EstadoCita,
} from '../api/assistantDashboardApi'

// ── Types exportados para la vista ───────────────────────────────────────────

export interface CitaDisplay {
  id:       number
  paciente: string
  hora:     string
  tipo:     string
  estado:   EstadoCita
}

// ── Helpers internos ──────────────────────────────────────────────────────────

function getTodayRange(): { desde: string; hasta: string } {
  const now   = new Date()
  const desde = new Date(now.getFullYear(), now.getMonth(), now.getDate(),  0,  0,  0)
  const hasta = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  return { desde: desde.toISOString(), hasta: hasta.toISOString() }
}

function formatHora(iso: string): string {
  const d   = new Date(iso)
  const h   = d.getHours()
  const min = d.getMinutes().toString().padStart(2, '0')
  const suf = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${min} ${suf}`
}

function buildNombre(cita: CitaAPI): string {
  const u = cita.paciente?.usuario
  if (!u) return 'Paciente'
  return `${u.nombre ?? ''} ${u.apellido_paterno ?? ''}`.trim() || 'Paciente'
}

// ── Composable ────────────────────────────────────────────────────────────────

export function useAssistantDashboard() {
  const router       = useRouter()
  const sessionStore = useSessionStore()

  // ── Estado ─────────────────────────────────────────────────────────────────
  const citasHoy           = ref<CitaAPI[]>([])
  const totalSinExpediente = ref(0)
  const isLoading          = ref(false)
  const error              = ref<string | null>(null)

  // ── Datos del usuario ───────────────────────────────────────────────────────
  const nombreAsistente = computed(() => {
    const u = sessionStore.user as any
    if (!u) return 'Asistente'
    if (u.nombre && u.apellido_paterno) return `${u.nombre} ${u.apellido_paterno}`
    return u.nombre ?? u.name ?? 'Asistente'
  })

  const userId = computed(() =>
    String(
      normalizeUserId(
        (sessionStore.user as any)?.id ?? (sessionStore.user as any)?.id_usuario,
      ) ?? '',
    ),
  )

  // ── Fetch ───────────────────────────────────────────────────────────────────
  async function fetchData(): Promise<void> {
    isLoading.value = true
    error.value     = null

    const { desde, hasta } = getTodayRange()

    const [citasResult, sinExpResult] = await Promise.allSettled([
      assistantDashboardApi.getCitasByRange(desde, hasta),
      assistantDashboardApi.getSinExpedienteCount(),
    ])

    if (citasResult.status === 'fulfilled') {
      const raw  = citasResult.value as any
      const data = raw?.data ?? raw
      citasHoy.value = Array.isArray(data?.citas) ? (data.citas as CitaAPI[]) : []
    } else {
      console.error('[useAssistantDashboard] getCitasByRange:', citasResult.reason)
      error.value = 'No se pudieron cargar las citas del día.'
    }

    if (sinExpResult.status === 'fulfilled') {
      const raw  = sinExpResult.value as any
      const data = raw?.data ?? raw
      totalSinExpediente.value = Number(data?.total ?? 0)
    } else {
      console.error('[useAssistantDashboard] getSinExpedienteCount:', sinExpResult.reason)
    }

    isLoading.value = false
  }

  // ── Métricas derivadas ──────────────────────────────────────────────────────

  const totalCitasHoy = computed(
    () => citasHoy.value.filter(c => c.estado !== 'Cancelada').length,
  )

  const citasPorConfirmar = computed(
    () => citasHoy.value.filter(c => c.estado === 'Pendiente').length,
  )

  const citasCanceladas = computed(
    () => citasHoy.value.filter(c => c.estado === 'Cancelada').length,
  )

  // ── Agenda (tabla) ──────────────────────────────────────────────────────────
  const agendaHoy = computed<CitaDisplay[]>(() =>
    citasHoy.value
      .filter(c => c.estado !== 'Cancelada')
      .sort(
        (a, b) =>
          new Date(a.fecha_hora_inicio).getTime() -
          new Date(b.fecha_hora_inicio).getTime(),
      )
      .map(c => ({
        id:       c.id_cita,
        paciente: buildNombre(c),
        hora:     formatHora(c.fecha_hora_inicio),
        tipo:     c.tipo?.nombre_corto ?? 'Consulta',
        estado:   c.estado,
      })),
  )

  // ── Acciones de navegación ──────────────────────────────────────────────────
  const navParams = computed(() => ({ id: userId.value }))

  function irACalendario(): void { router.push({ name: ROUTE_NAMES.ASSISTANT_CALENDAR, params: navParams.value }) }
  function irAPacientes():  void { router.push({ name: ROUTE_NAMES.ASSISTANT_PATIENTS, params: navParams.value }) }
  function irABitacora():   void { router.push({ name: ROUTE_NAMES.ASSISTANT_BINNACLE, params: navParams.value }) }

  // ── Acción: cancelar cita ───────────────────────────────────────────────────
  async function cancelarCita(id: number): Promise<void> {
    await assistantDashboardApi.cancelarCita(id)
    const target = citasHoy.value.find(c => c.id_cita === id)
    if (target) target.estado = 'Cancelada'
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────────
  onMounted(fetchData)

  return {
    isLoading,
    error,
    nombreAsistente,
    totalCitasHoy,
    citasPorConfirmar,
    citasCanceladas,
    totalSinExpediente,
    agendaHoy,
    irACalendario,
    irAPacientes,
    irABitacora,
    cancelarCita,
    refetch: fetchData,
  }
}