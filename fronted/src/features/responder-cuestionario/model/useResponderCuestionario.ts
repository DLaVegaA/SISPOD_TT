import { ref, computed } from 'vue'
import {
  seguimientoApi,
  type Cuestionario,
  type Pregunta,
  type ValorAlerta,
  type RespuestaPayload,
  type TipoCuestionario,
} from '@/entities/seguimiento'
 
// ─────────────────────────────────────────────────────────────────────────────
// Tipos internos
// ─────────────────────────────────────────────────────────────────────────────
 
export type ValorRespuesta = string | string[] | null
 
export interface EstadoPregunta {
  pregunta: Pregunta
  valor: ValorRespuesta
  tocada: boolean
}
 
// ─────────────────────────────────────────────────────────────────────────────
// RN13 — evaluación usando valor_alerta que viene del backend
// El backend ya define qué respuesta dispara la alerta por cada pregunta.
// No se hardcodean IDs: cualquier pregunta con valor_alerta configurado participa.
// ─────────────────────────────────────────────────────────────────────────────
 
function evaluarAlerta(pregunta: Pregunta, valor: ValorRespuesta): boolean {
  const va: ValorAlerta | null = pregunta.valor_alerta
  if (!va || valor === null) return false
 
  switch (pregunta.tipo_control) {
    case 'escala_1_10':
      // Alerta si el dolor reportado es mayor o igual al umbral mínimo
      return va.min !== undefined && Number(valor) >= va.min
 
    case 'booleano_si_no':
      // Alerta si la respuesta coincide con el valor crítico ('true' o 'false')
      return va.valor !== undefined && String(valor) === va.valor
 
    case 'opcion_multiple':
      // Alerta si alguna opción seleccionada coincide con el valor crítico
      return (
        va.incluye !== undefined &&
        Array.isArray(valor) &&
        valor.includes(va.incluye)
      )
 
    default:
      return false
  }
}
 
// ─────────────────────────────────────────────────────────────────────────────
// Serialización — todo va al backend como string (igual que Respuesta_paciente.valor_respuesta)
// ─────────────────────────────────────────────────────────────────────────────
 
function serializarValor(valor: ValorRespuesta): string {
  if (valor === null || valor === undefined) return ''
  if (Array.isArray(valor)) return valor.join(',')
  return String(valor)
}
 
// ─────────────────────────────────────────────────────────────────────────────
// Composable
// ─────────────────────────────────────────────────────────────────────────────
 
export function useResponderCuestionario() {
  // ── Estado del cuestionario activo ────────────────────────────────────────
  const cuestionario  = ref<Cuestionario | null>(null)
  const estados       = ref<EstadoPregunta[]>([])
  const cargandoCuestionario = ref(false)
  const errorCarga    = ref<string | null>(null)
 
  // ── Estado del envío ──────────────────────────────────────────────────────
  const enviando      = ref(false)
  const enviado       = ref(false)
  const errorEnvio    = ref<string | null>(null)
 
  // ── Flags de UX ──────────────────────────────────────────────────────────
  const mostrarAlerta = ref(false)   // RN13 — trayectoria D
  const mostrarSalir  = ref(false)   // trayectoria A — confirmar abandono
  const intentoEnvio  = ref(false)   // activa mensajes de validación
 
  // ── Cargar cuestionario desde el backend ──────────────────────────────────
 
  async function cargarCuestionario(
    id_seguimiento: number,
    tipo: TipoCuestionario,
  ): Promise<boolean> {
    cargandoCuestionario.value = true
    errorCarga.value = null
    cuestionario.value = null
    estados.value = []
    enviado.value = false
    intentoEnvio.value = false
 
    try {
      const res = await seguimientoApi.obtenerCuestionario(id_seguimiento, tipo)
      cuestionario.value = res.cuestionario
      estados.value = res.cuestionario.preguntas.map((p) => ({
        pregunta: p,
        valor: null,
        tocada: false,
      }))
      return true
    } catch {
      errorCarga.value = 'No se pudo cargar el cuestionario. Intenta de nuevo.'
      return false
    } finally {
      cargandoCuestionario.value = false
    }
  }
 
  // ── Actualizar respuesta ──────────────────────────────────────────────────
 
  function actualizarRespuesta(id_pregunta: number, valor: ValorRespuesta) {
    const e = estados.value.find((e) => e.pregunta.id_pregunta === id_pregunta)
    if (!e) return
    e.valor  = valor
    e.tocada = true
  }
 
  // ── Validación (trayectoria B) ────────────────────────────────────────────
 
  const preguntasSinResponder = computed(() =>
    estados.value.filter((e) => {
      if (e.valor === null) return true
      if (Array.isArray(e.valor)) return e.valor.length === 0
      if (typeof e.valor === 'string') return e.valor.trim() === ''
      return false
    }),
  )
 
  const formularioCompleto = computed(() => preguntasSinResponder.value.length === 0)
 
  function marcarTodasTocadas() {
    estados.value.forEach((e) => { e.tocada = true })
  }
 
  // ── Envío (CU22) ──────────────────────────────────────────────────────────
 
  async function enviar(id_seguimiento: number): Promise<boolean> {
    if (!cuestionario.value) return false
 
    intentoEnvio.value = true
    marcarTodasTocadas()
 
    if (!formularioCompleto.value) return false   // trayectoria B
 
    // Evaluar RN13 con los valor_alerta que vienen de cada pregunta
    const hayAlerta = estados.value.some((e) =>
      evaluarAlerta(e.pregunta, e.valor),
    )
 
    enviando.value  = true
    errorEnvio.value = null
 
    try {
      const respuestas: RespuestaPayload[] = estados.value.map((e) => ({
        id_pregunta:     e.pregunta.id_pregunta,
        valor_respuesta: serializarValor(e.valor),
      }))
 
      await seguimientoApi.enviarRespuestas(id_seguimiento, {
        id_cuestionario: cuestionario.value.id_cuestionario,
        respuestas,
      })
 
      enviado.value = true
      if (hayAlerta) mostrarAlerta.value = true  // trayectoria D
 
      return true
    } catch {
      errorEnvio.value = 'Conexión fallida. Por favor intenta de nuevo.'  // trayectoria C
      return false
    } finally {
      enviando.value = false
    }
  }
 
  // ── Abandono (trayectoria A) ──────────────────────────────────────────────
 
  function intentarSalir() {
    const sucio = estados.value.some((e) => e.tocada) && !enviado.value
    if (sucio) {
      mostrarSalir.value = true
    } else {
      resetear()
    }
  }
 
  function confirmarSalir() {
    mostrarSalir.value = false
    resetear()
  }
 
  function cancelarSalir() {
    mostrarSalir.value = false
  }
 
  function resetear() {
    cuestionario.value  = null
    estados.value       = []
    enviado.value       = false
    intentoEnvio.value  = false
    errorEnvio.value    = null
    mostrarAlerta.value = false
    mostrarSalir.value  = false
  }
 
  // ── Progreso ──────────────────────────────────────────────────────────────
 
  const totalPreguntas = computed(() => estados.value.length)
 
  const preguntasRespondidas = computed(
    () => estados.value.filter((e) => {
      if (e.valor === null) return false
      if (Array.isArray(e.valor)) return e.valor.length > 0
      return String(e.valor).trim() !== ''
    }).length,
  )
 
  const progresoPercent = computed(() =>
    totalPreguntas.value === 0
      ? 0
      : Math.round((preguntasRespondidas.value / totalPreguntas.value) * 100),
  )
 
  return {
    // estado
    cuestionario,
    estados,
    cargandoCuestionario,
    errorCarga,
    enviando,
    enviado,
    errorEnvio,
    mostrarAlerta,
    mostrarSalir,
    intentoEnvio,
    // computed
    formularioCompleto,
    preguntasSinResponder,
    totalPreguntas,
    preguntasRespondidas,
    progresoPercent,
    // métodos
    cargarCuestionario,
    actualizarRespuesta,
    enviar,
    intentarSalir,
    confirmarSalir,
    cancelarSalir,
    resetear,
  }
}
 