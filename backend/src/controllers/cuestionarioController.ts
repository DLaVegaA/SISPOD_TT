import { Request, Response, NextFunction } from 'express';
import { AppError } from '../helpers/AppError';
import {
    crearCuestionarioService,
    listarCuestionariosService,
    asignarPreguntasService,
    listarPreguntasDeCuestionarioService
} from '../services/cuestionarioService';

const TIPO_CUESTIONARIO = ['24h', '72h'] as const;

// ─── Crear cuestionario ───────────────────────────────────────────────────────

export const crearCuestionario = async (req: Request, res: Response, next: NextFunction) => {
    const { nombre_cuestionario, tipo_cuestionario, descripcion } = req.body;
    const id_procedimiento = Number(req.body.id_procedimiento);

    try {
        if (!nombre_cuestionario) throw new AppError('El nombre del cuestionario es obligatorio', 400);
        if (!tipo_cuestionario) throw new AppError('El tipo de cuestionario es obligatorio', 400);
        if (!id_procedimiento) throw new AppError('El procedimiento es obligatorio', 400);
        if (Number.isNaN(id_procedimiento)) throw new AppError('Procedimiento inválido', 400);

        if (typeof tipo_cuestionario !== 'string' || !TIPO_CUESTIONARIO.includes(tipo_cuestionario as any)) {
            throw new AppError('Tipo de cuestionario inválido', 400);
        }
        if (typeof nombre_cuestionario !== 'string' || !nombre_cuestionario.trim()) {
            throw new AppError('El nombre debe ser texto', 400);
        }
        if (descripcion && typeof descripcion !== 'string') {
            throw new AppError('La descripción debe ser texto', 400);
        }

        const data = {
            nombre_cuestionario: nombre_cuestionario.trim(),
            tipo_cuestionario,
            descripcion: descripcion?.trim() || null
        };

        const cuestionario = await crearCuestionarioService(id_procedimiento, data);

        return res.status(201).json({
            message: 'Cuestionario creado',
            cuestionario
        });
    } catch (error) {
        next(error);
    }
};

// ─── Listar cuestionarios ─────────────────────────────────────────────────────

export const listarCuestionarios = async (req: Request, res: Response, next: NextFunction) => {
    const id_procedimiento = req.query.id_procedimiento
        ? Number(req.query.id_procedimiento)
        : undefined;
    const tipo = req.query.tipo as string | undefined;

    try {
        if (id_procedimiento !== undefined && Number.isNaN(id_procedimiento)) {
            throw new AppError('Procedimiento inválido', 400);
        }
        if (tipo && !TIPO_CUESTIONARIO.includes(tipo as any)) {
            throw new AppError('Tipo de cuestionario inválido', 400);
        }

        const cuestionarios = await listarCuestionariosService(id_procedimiento, tipo);

        return res.json({
            message: 'Cuestionarios disponibles',
            cuestionarios
        });
    } catch (error) {
        next(error);
    }
};

// ─── Asignar preguntas a un cuestionario ──────────────────────────────────────

export const asignarPreguntas = async (req: Request, res: Response, next: NextFunction) => {
    const id_cuestionario = Number(req.params.id_cuestionario);
    const { preguntas } = req.body;

    try {
        if (Number.isNaN(id_cuestionario)) {
            throw new AppError('Cuestionario inválido', 400);
        }
        if (!Array.isArray(preguntas) || preguntas.length === 0) {
            throw new AppError('Debes enviar al menos una pregunta', 400);
        }

        for (const p of preguntas) {
            if (typeof p.id_pregunta_base !== 'number' || typeof p.orden !== 'number') {
                throw new AppError('Cada pregunta debe tener id_pregunta_base y orden numéricos', 400);
            }
        }

        const resultado = await asignarPreguntasService(id_cuestionario, preguntas);

        return res.json({
            message: 'Preguntas asignadas correctamente',
            ...resultado
        });
    } catch (error) {
        next(error);
    }
};

// ─── Listar preguntas de un cuestionario ──────────────────────────────────────

export const listarPreguntasDeCuestionario = async (req: Request, res: Response, next: NextFunction) => {
    const id_cuestionario = Number(req.params.id_cuestionario);

    try {
        if (Number.isNaN(id_cuestionario)) {
            throw new AppError('Cuestionario inválido', 400);
        }

        const preguntas = await listarPreguntasDeCuestionarioService(id_cuestionario);

        return res.json({
            message: 'Preguntas del cuestionario',
            preguntas
        });
    } catch (error) {
        next(error);
    }
};