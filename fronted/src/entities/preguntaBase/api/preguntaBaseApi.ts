import { httpClient } from '@/shared/api/http'

export type TipoControl = 'escala_1_10' | 'booleano_si_no' | 'texto_libre' | 'opcion_multiple'

export interface ValorAlerta {
    min?:     number
    valor?:   string
    incluye?: string
}

export interface PreguntaBase {
    id_pregunta_base: number
    texto_pregunta:   string
    tipo_control:     TipoControl
    opciones:         string[] | null
    valor_alerta:     ValorAlerta | null
    aplica_24h:       boolean
    aplica_72h:       boolean
    activa:           boolean
}

export interface CrearPreguntaBasePayload {
    texto_pregunta:  string
    tipo_control:    TipoControl
    opciones?:       string[] | null
    valor_alerta?:   ValorAlerta | null
    aplica_24h:      boolean
    aplica_72h:      boolean
}

export const preguntaBaseApi = {

    listar(tipo?: '24h' | '72h') {
        return httpClient.get<{ message: string; preguntas: PreguntaBase[] }>(
            '/preguntas-base',
            { params: tipo ? { tipo } : {} }
        )
    },

    crear(payload: CrearPreguntaBasePayload) {
        return httpClient.post<{ message: string; pregunta: PreguntaBase }>(
            '/preguntas-base',
            payload
        )
    },

    editar(id: number, payload: Partial<CrearPreguntaBasePayload>) {
        return httpClient.put<{ message: string; pregunta: PreguntaBase }>(
            `/preguntas-base/${id}`,
            payload
        )
    },

    eliminar(id: number) {
        return httpClient.delete<{ message: string }>(
            `/preguntas-base/${id}`
        )
    },
}