import { ref, computed } from 'vue'
import {
    seguimientoApi,
    type Cuestionario,
    type Pregunta,
    type ValorAlerta,
    type RespuestaPayload,
    type TipoCuestionario,
} from '@/entities/seguimiento'

// ─── Tipos internos ───────────────────────────────────────────────────────────

export type ValorRespuesta = string | string[] | null

export interface EstadoPregunta {
    pregunta: Pregunta
    valor: ValorRespuesta
    tocada: boolean
}

// ─── RN13 — evaluación usando valor_alerta del backend ───────────────────────

function evaluarAlerta(pregunta: Pregunta, valor: ValorRespuesta): boolean {
    const va: ValorAlerta | null = pregunta.valor_alerta
    if (!va || valor === null) return false

    switch (pregunta.tipo_control) {
        case 'escala_1_10':
            return va.min !== undefined && Number(valor) >= va.min

        case 'booleano_si_no':
            return va.valor !== undefined && String(valor) === va.valor

        case 'opcion_multiple':
            return (
                va.incluye !== undefined &&
                Array.isArray(valor) &&
                valor.includes(va.incluye)
            )

        default:
            return false
    }
}

// ─── Serialización ────────────────────────────────────────────────────────────

function serializarValor(valor: ValorRespuesta): string {
    if (valor === null || valor === undefined) return ''
    if (Array.isArray(valor)) return valor.join(',')
    return String(valor)
}

// ─── Composable ───────────────────────────────────────────────────────────────

export function useResponderCuestionario() {
    const cuestionario  = ref<Cuestionario | null>(null)
    const estados       = ref<EstadoPregunta[]>([])
    const cargandoCuestionario = ref(false)
    const errorCarga    = ref<string | null>(null)

    const enviando      = ref(false)
    const enviado       = ref(false)
    const errorEnvio    = ref<string | null>(null)

    const mostrarAlerta = ref(false)
    const mostrarSalir  = ref(false)
    const intentoEnvio  = ref(false)

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

    // Usa id_pregunta_base como identificador único ───────────────────────────
    function actualizarRespuesta(id_pregunta_base: number, valor: ValorRespuesta) {
        const e = estados.value.find((e) => e.pregunta.id_pregunta_base === id_pregunta_base)
        if (!e) return
        e.valor  = valor
        e.tocada = true
    }

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

    async function enviar(id_seguimiento: number): Promise<boolean> {
        if (!cuestionario.value) return false

        intentoEnvio.value = true
        marcarTodasTocadas()

        if (!formularioCompleto.value) return false   // trayectoria B

        const hayAlerta = estados.value.some((e) =>
            evaluarAlerta(e.pregunta, e.valor),
        )

        enviando.value   = true
        errorEnvio.value = null

        try {
            const respuestas: RespuestaPayload[] = estados.value.map((e) => ({
                id_pregunta_base: e.pregunta.id_pregunta_base,   // ← id_pregunta_base
                valor_respuesta:  serializarValor(e.valor),
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
        cuestionario, estados, cargandoCuestionario, errorCarga,
        enviando, enviado, errorEnvio,
        mostrarAlerta, mostrarSalir, intentoEnvio,
        formularioCompleto, preguntasSinResponder,
        totalPreguntas, preguntasRespondidas, progresoPercent,
        cargarCuestionario, actualizarRespuesta, enviar,
        intentarSalir, confirmarSalir, cancelarSalir, resetear,
    }
}