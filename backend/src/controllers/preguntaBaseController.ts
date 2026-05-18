import { Request, Response, NextFunction } from 'express';
import { AppError } from '../helpers/AppError';
import {
    crearPreguntaBaseService,
    editarPreguntaBaseService,
    eliminarPreguntaBaseService,
    listarPreguntasBaseService
} from '../services/preguntaBaseService';

const TIPOS_CONTROL = ['escala_1_10', 'booleano_si_no', 'texto_libre', 'opcion_multiple'] as const;

export const listarPreguntasBase = async (req: Request, res: Response, next: NextFunction) => {
    const tipo = req.query.tipo as '24h' | '72h' | undefined;

    try {
        if (tipo && tipo !== '24h' && tipo !== '72h') {
            throw new AppError('El tipo debe ser 24h o 72h', 400);
        }

        const preguntas = await listarPreguntasBaseService(tipo);

        return res.json({
            message: 'Banco de preguntas',
            preguntas
        });
    } catch (error) {
        next(error);
    }
};

export const crearPreguntaBase = async (req: Request, res: Response, next: NextFunction) => {
    const { texto_pregunta, tipo_control, opciones, valor_alerta, aplica_24h, aplica_72h } = req.body;

    try {
        if (typeof texto_pregunta !== 'string' || !texto_pregunta.trim()) {
            throw new AppError('La pregunta es obligatoria', 400);
        }

        if (typeof tipo_control !== 'string' || !TIPOS_CONTROL.includes(tipo_control as any)) {
            throw new AppError('Tipo de control inválido', 400);
        }

        if (typeof aplica_24h !== 'boolean' || typeof aplica_72h !== 'boolean') {
            throw new AppError('Debes indicar si aplica a 24h y/o 72h', 400);
        }

        if (!aplica_24h && !aplica_72h) {
            throw new AppError('La pregunta debe aplicar al menos a un tipo de cuestionario', 400);
        }

        if (opciones && !Array.isArray(opciones)) {
            throw new AppError('Las opciones deben ser un arreglo', 400);
        }

        if (tipo_control === 'opcion_multiple') {
            if (!Array.isArray(opciones) || opciones.length < 2) {
                throw new AppError('Agrega mínimo dos opciones', 400);
            }
            const opcionesValidas = opciones.every(
                (o: any) => typeof o === 'string' && o.trim()
            );
            if (!opcionesValidas) {
                throw new AppError('Las opciones deben ser texto válido', 400);
            }
        }

        if (valor_alerta && typeof valor_alerta !== 'object') {
            throw new AppError('Valor alerta inválido', 400);
        }

        const pregunta = await crearPreguntaBaseService({
            texto_pregunta,
            tipo_control: tipo_control as any,
            opciones: opciones ?? null,
            valor_alerta: valor_alerta ?? null,
            aplica_24h,
            aplica_72h
        });

        return res.status(201).json({
            message: 'Pregunta creada en el banco',
            pregunta
        });
    } catch (error) {
        next(error);
    }
};

export const editarPreguntaBase = async (req: Request, res: Response, next: NextFunction) => {
    const id = Number(req.params.id);
    const { texto_pregunta, tipo_control, opciones, valor_alerta, aplica_24h, aplica_72h } = req.body;
 
    try {
        if (isNaN(id)) throw new AppError('ID inválido', 400);
 
        // Al menos un campo debe venir en el body
        if (
            texto_pregunta === undefined && tipo_control === undefined &&
            opciones       === undefined && valor_alerta === undefined &&
            aplica_24h     === undefined && aplica_72h   === undefined
        ) throw new AppError('Envía al menos un campo a actualizar', 400);
 
        if (tipo_control !== undefined && !TIPOS_CONTROL.includes(tipo_control as any)) {
            throw new AppError('Tipo de control inválido', 400);
        }
 
        if (aplica_24h !== undefined && typeof aplica_24h !== 'boolean') {
            throw new AppError('aplica_24h debe ser booleano', 400);
        }
        if (aplica_72h !== undefined && typeof aplica_72h !== 'boolean') {
            throw new AppError('aplica_72h debe ser booleano', 400);
        }
 
        const data: any = {};
        if (texto_pregunta !== undefined) data.texto_pregunta = texto_pregunta;
        if (tipo_control   !== undefined) data.tipo_control   = tipo_control;
        if (opciones       !== undefined) data.opciones       = opciones;
        if (valor_alerta   !== undefined) data.valor_alerta   = valor_alerta;
        if (aplica_24h     !== undefined) data.aplica_24h     = aplica_24h;
        if (aplica_72h     !== undefined) data.aplica_72h     = aplica_72h;
 
        const pregunta = await editarPreguntaBaseService(id, data);
        return res.json({ message: 'Pregunta actualizada', pregunta });
    } catch (error) {
        next(error);
    }
};
 
export const eliminarPreguntaBase = async (req: Request, res: Response, next: NextFunction) => {
    const id = Number(req.params.id);
    try {
        if (isNaN(id)) throw new AppError('ID inválido', 400);
        await eliminarPreguntaBaseService(id);
        return res.json({ message: 'Pregunta eliminada' });
    } catch (error) {
        next(error);
    }
};