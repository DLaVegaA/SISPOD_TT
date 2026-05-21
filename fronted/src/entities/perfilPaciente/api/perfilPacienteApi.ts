import { httpClient } from '@/shared/api/http'

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface TelegramEstado {
  vinculado: boolean
}

export interface TelegramTokenResponse {
  token: string
  link: string
}

// ── API ───────────────────────────────────────────────────────────────────────

export const pacienteApi = {
  actualizarPerfil: (id_paciente: number, data: unknown) =>
    httpClient.put(`/pacientes/${id_paciente}`, data),

  obtenerMiPerfil: () => httpClient.get('/pacientes/me'),

  // ── Telegram ────────────────────────────────────────────────────────────────

  /** Consulta si el paciente ya tiene una cuenta de Telegram vinculada. */
  telegramEstado: () =>
    httpClient.get<TelegramEstado>('/telegram/estado'),

  /**
   * Genera un token de un solo uso y devuelve el deep-link al bot.
   * El backend hace upsert en la tabla Telegram, por lo que llamar esto
   * múltiples veces invalida el token anterior de forma segura.
   */
  telegramGenerarToken: () =>
    httpClient.get<TelegramTokenResponse>('/telegram/vincular'),

  /** Elimina el id_chat almacenado, desvinculando la cuenta. */
  telegramDesvincular: () =>
    httpClient.delete<{ message: string }>('/telegram/'),
}