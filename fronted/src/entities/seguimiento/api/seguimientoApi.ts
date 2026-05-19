import { httpClient } from '@/shared/api/http'

export type TipoControl =
    | 'escala_1_10'
    | 'booleano_si_no'
    | 'texto_libre'
    | 'opcion_multiple'

export type EstadoSeguimiento = 'en curso' | 'alerta' | 'finalizado' | 'cancelado'

export type TipoCuestionario = '24h' | '72h'

export interface ValorAlerta {
    min?: number
    valor?: string
    incluye?: string
}

export interface Pregunta {
    id_pregunta_base: number
    texto_pregunta: string
    tipo_control: TipoControl
    opciones: string[] | null
    valor_alerta: ValorAlerta | null
    aplica_24h: boolean
    aplica_72h: boolean
    orden: number
}

export interface Cuestionario {
    id_cuestionario: number
    nombre_cuestionario: string
    tipo_cuestionario: string
    descripcion: string | null
    preguntas: Pregunta[]
}

export interface SeguimientoListItem {
    id_seguimiento: number
    estado_seguimiento: EstadoSeguimiento
    fecha_inicio: string
    fecha_fin: string
    procedimiento: string
    id_paciente: number
    nombre: string
    // Indica qué cuestionarios asignó el dentista (RN11)
    tiene_cuestionario_24h: boolean
    tiene_cuestionario_72h: boolean
    // Indica si el paciente ya los envió (RN12)
    enviado_24h: boolean
    enviado_72h: boolean
}

export interface SeguimientoDetalle {
    id_seguimiento: number
    estado_seguimiento: EstadoSeguimiento
    plan_cuidados: string | null
    indicaciones_medicas: string | null
    fecha_inicio: string
    fecha_fin: string
    id_procedimiento: number
    enviado_24h: boolean
    enviado_72h: boolean
    tipo_procedimiento: { nombre_procedimiento: string }
    cita: {
        paciente: {
            id_paciente: number
            usuario: {
                nombre: string
                apellido_paterno: string
                apellido_materno: string | null
            }
        }
    }
}

export interface RespuestaPayload {
    id_pregunta_base: number
    valor_respuesta: string
}

export interface EnviarRespuestasPayload {
    id_cuestionario: number
    respuestas: RespuestaPayload[]
}

export const seguimientoApi = {

    listar(estado?: EstadoSeguimiento) {
        return httpClient.get('/seguimiento', {
            params: { estado, limit: 50 },
        }) as Promise<{ seguimientos: SeguimientoListItem[]; total: number }>
    },

    obtener(id_seguimiento: number) {
        return httpClient.get(`/seguimiento/${id_seguimiento}`) as Promise<{
            message: string
            seguimiento: SeguimientoDetalle
        }>
    },

    obtenerCuestionario(id_seguimiento: number, tipo: TipoCuestionario) {
        return httpClient.get(
            `/seguimiento/${id_seguimiento}/cuestionario/${tipo}`
        ) as Promise<{ message: string; cuestionario: Cuestionario }>
    },

    enviarRespuestas(id_seguimiento: number, payload: EnviarRespuestasPayload) {
        return httpClient.post(
            `/seguimiento/${id_seguimiento}/respuestas`,
            payload
        ) as Promise<{ message: string }>
    },
}