/**
 * @layer  features / assistant-dashboard / api
 * @file   assistantDashboardApi.ts
 *
 * Funciones de fetch PURAS para el dashboard del asistente.
 * Sin estado reactivo — solo peticiones HTTP tipadas.
 *
 * Endpoints:
 *   GET /citas?desde=&hasta=&limit=500   → citas del rango dado
 *   GET /pacientes/sin-expediente        → pacientes sin expediente (paginado)
 */

import { httpClient } from '@/shared/api/http'

// ── Types públicos ────────────────────────────────────────────────────────────

export type EstadoCita = 'Pendiente' | 'Confirmada' | 'Cancelada' | 'Atendida'

export interface CitaAPI {
  id_cita:           number
  fecha_hora_inicio: string
  fecha_hora_fin:    string
  estado:            EstadoCita
  paciente?: {
    usuario?: {
      nombre?:           string
      apellido_paterno?: string
    }
  }
  tipo?: {
    nombre_corto?: string
  }
}

export interface ListarCitasResponse {
  total:        number
  citas:        CitaAPI[]
  totalPaginas: number
  limit:        number
}

export interface SinExpedienteResponse {
  total:        number
  pagina:       number
  totalPaginas: number
  limit:        number
  pacientes:    unknown[]
}

// ── API ───────────────────────────────────────────────────────────────────────

export const assistantDashboardApi = {
  /**
   * Trae todas las citas en un rango de fechas.
   * Para "citas de hoy" pasa desde=inicio_del_dia & hasta=fin_del_dia.
   */
  getCitasByRange: (desde: string, hasta: string): Promise<ListarCitasResponse> => {
    return httpClient.get('/citas', {
      params: { desde, hasta, limit: 500 },
    }) as Promise<ListarCitasResponse>
  },

  /**
   * Obtiene la primera página de pacientes sin expediente.
   * Solo usamos el campo `total` para la métrica del dashboard.
   */
  getSinExpedienteCount: (): Promise<SinExpedienteResponse> => {
    return httpClient.get('/pacientes/sin-expediente', {
      params: { limit: 1, pagina: 1 },
    }) as Promise<SinExpedienteResponse>
  },

  /** Cancela una cita por su ID. */
  cancelarCita: (id: number): Promise<void> => {
    return httpClient.post(`/citas/${id}/cancelar`) as Promise<void>
  },
}