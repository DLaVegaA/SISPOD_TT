import { Op } from 'sequelize';
import { PreguntaBase } from '../models/index';
import { AppError } from '../helpers/AppError';

const TIPOS_CONTROL = ['escala_1_10', 'booleano_si_no', 'texto_libre', 'opcion_multiple'] as const;
type TipoControl = typeof TIPOS_CONTROL[number];

export interface CrearPreguntaBaseData {
    texto_pregunta: string;
    tipo_control: TipoControl;
    opciones?: string[] | null;
    valor_alerta?: Record<string, any> | null;
    aplica_24h: boolean;
    aplica_72h: boolean;
}

export const crearPreguntaBaseService = async (data: CrearPreguntaBaseData) => {
    const pregunta = await PreguntaBase.create({
        texto_pregunta: data.texto_pregunta.trim(),
        tipo_control: data.tipo_control,
        opciones: data.opciones ?? null,
        valor_alerta: data.valor_alerta ?? null,
        aplica_24h: data.aplica_24h,
        aplica_72h: data.aplica_72h,
        activa: true
    });

    return pregunta;
};

export const listarPreguntasBaseService = async (tipo?: '24h' | '72h') => {
    const where: any = { activa: true };

    if (tipo === '24h') where.aplica_24h = true;
    if (tipo === '72h') where.aplica_72h = true;

    const preguntas = await PreguntaBase.findAll({
        where,
        order: [['id_pregunta_base', 'ASC']]
    });

    return preguntas;
};

export const obtenerPreguntaBaseService = async (id_pregunta_base: number) => {
    const pregunta = await PreguntaBase.findByPk(id_pregunta_base);

    if (!pregunta) {
        throw new AppError('La pregunta no existe', 404);
    }

    return pregunta;
};