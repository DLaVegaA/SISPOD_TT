import { Response, NextFunction } from 'express';
import { CustomRequest } from '../middleware/authMiddleware';
import { AppError } from '../helpers/AppError';
import {
    crearSeguimientoService,
    listarSeguimientosService,
    obtenerSeguimientoService,
    editarSeguimientoService,
    cancelarSeguimientoService,
    finalizarSeguimientoService,
    obtenerCuestionarioSeguimientoService,
    guardarRespuestasService
} from '../services/seguimientoService';

const ESTADOS_VALIDOS = ['en curso', 'alerta', 'finalizado', 'cancelado'];

// ─── Crear seguimiento (CU14) ─────────────────────────────────────────────────

export const crearSeguimiento = async (req: CustomRequest, res: Response, next: NextFunction) => {
    const id_cita          = Number(req.body.id_cita);
    const id_procedimiento = Number(req.body.id_procedimiento);
    const { plan_cuidados, indicaciones_medicas } = req.body;

    const id_cuestionario_24h = req.body.id_cuestionario_24h
        ? Number(req.body.id_cuestionario_24h) : null;
    const id_cuestionario_72h = req.body.id_cuestionario_72h
        ? Number(req.body.id_cuestionario_72h) : null;

    try {
        if (Number.isNaN(id_cita))          throw new AppError('Cita inválida', 400);
        if (Number.isNaN(id_procedimiento)) throw new AppError('Procedimiento inválido', 400);
        if (plan_cuidados && typeof plan_cuidados !== 'string')
            throw new AppError('El plan de cuidados debe ser texto', 400);
        if (indicaciones_medicas && typeof indicaciones_medicas !== 'string')
            throw new AppError('Las indicaciones médicas deben ser texto', 400);
        if (id_cuestionario_24h !== null && Number.isNaN(id_cuestionario_24h))
            throw new AppError('Cuestionario 24h inválido', 400);
        if (id_cuestionario_72h !== null && Number.isNaN(id_cuestionario_72h))
            throw new AppError('Cuestionario 72h inválido', 400);

        const seguimiento = await crearSeguimientoService(id_cita, id_procedimiento, {
            plan_cuidados,
            indicaciones_medicas,
            id_cuestionario_24h,
            id_cuestionario_72h
        });

        return res.status(201).json({ message: 'Seguimiento creado', seguimiento });
    } catch (error) {
        next(error);
    }
};

// ─── Listar seguimientos ──────────────────────────────────────────────────────
// BUG FIX: pasa userData para que el servicio filtre por paciente

export const listarSeguimientos = async (req: CustomRequest, res: Response, next: NextFunction) => {
    const pagina     = Number(req.query.pagina) || 1;
    const limitQuery = Number(req.query.limit) || 10;
    const limit      = Math.max(1, Math.min(limitQuery, 500));
    const offset     = (pagina - 1) * limit;
    const estadoRaw  = req.query.estado;

    try {
        if (estadoRaw && typeof estadoRaw !== 'string') throw new AppError('Estado inválido', 400);
        const estado = estadoRaw as string | undefined;
        if (estado && !ESTADOS_VALIDOS.includes(estado)) throw new AppError('Estado inválido', 400);

        const result = await listarSeguimientosService(limit, offset, estado, req.userData);

        return res.json({
            message: 'Seguimientos disponibles',
            seguimientos: result.listaSeguimiento,
            total: result.total,
            totalPaginas: result.totalPaginas,
            limit: result.limitResponse
        });
    } catch (error) {
        next(error);
    }
};

// ─── Obtener seguimiento ──────────────────────────────────────────────────────

export const obtenerSeguimiento = async (req: CustomRequest, res: Response, next: NextFunction) => {
    const id_seguimiento = Number(req.params.id_seguimiento);
    try {
        if (!id_seguimiento || Number.isNaN(id_seguimiento)) throw new AppError('Seguimiento inválido', 400);
        const seguimiento = await obtenerSeguimientoService(id_seguimiento);
        return res.json({ message: 'Seguimiento encontrado', seguimiento });
    } catch (error) {
        next(error);
    }
};

// ─── Editar seguimiento ───────────────────────────────────────────────────────

export const editarSeguimiento = async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { indicaciones_medicas, plan_cuidados } = req.body;
    const id_seguimiento = Number(req.params.id_seguimiento);
    try {
        if (!id_seguimiento || Number.isNaN(id_seguimiento)) throw new AppError('Seguimiento inválido', 400);
        if (plan_cuidados === undefined && indicaciones_medicas === undefined)
            throw new AppError('Envía al menos un campo a actualizar', 400);

        const seguimiento = await editarSeguimientoService(id_seguimiento, { plan_cuidados, indicaciones_medicas });
        return res.json({ message: 'Seguimiento actualizado correctamente', seguimiento });
    } catch (error) {
        next(error);
    }
};

// ─── Cancelar seguimiento ─────────────────────────────────────────────────────

export const cancelarSeguimiento = async (req: CustomRequest, res: Response, next: NextFunction) => {
    const id_seguimiento = Number(req.params.id_seguimiento);
    try {
        if (!id_seguimiento || Number.isNaN(id_seguimiento)) throw new AppError('Seguimiento inválido', 400);
        await cancelarSeguimientoService(id_seguimiento);
        return res.json({ message: 'Seguimiento cancelado' });
    } catch (error) {
        next(error);
    }
};

// ─── Finalizar seguimiento (CU16) ─────────────────────────────────────────────
// BUG FIX: endpoint correcto para marcar como finalizado (no cancelado)

export const finalizarSeguimiento = async (req: CustomRequest, res: Response, next: NextFunction) => {
    const id_seguimiento = Number(req.params.id_seguimiento);
    try {
        if (!id_seguimiento || Number.isNaN(id_seguimiento)) throw new AppError('Seguimiento inválido', 400);
        const seguimiento = await finalizarSeguimientoService(id_seguimiento);
        return res.json({ message: 'Seguimiento finalizado correctamente', seguimiento });
    } catch (error) {
        next(error);
    }
};

// ─── Obtener cuestionario del seguimiento (CU22) ──────────────────────────────

export const obtenerCuestionarioSeguimiento = async (req: CustomRequest, res: Response, next: NextFunction) => {
    const id_seguimiento  = Number(req.params.id_seguimiento);
    const { tipo_cuestionario } = req.params;
    try {
        if (Number.isNaN(id_seguimiento)) throw new AppError('Seguimiento inválido', 400);
        if (tipo_cuestionario !== '72h' && tipo_cuestionario !== '24h') throw new AppError('Tipo inválido', 400);

        const cuestionario = await obtenerCuestionarioSeguimientoService(id_seguimiento, tipo_cuestionario);
        return res.json({ message: 'Cuestionario', cuestionario });
    } catch (error) {
        next(error);
    }
};

// ─── Guardar respuestas del paciente (CU22) ───────────────────────────────────

export const guardarRespuestas = async (req: CustomRequest, res: Response, next: NextFunction) => {
    const id_seguimiento = Number(req.params.id_seguimiento);
    const { id_cuestionario, respuestas } = req.body;
    try {
        if (Number.isNaN(id_seguimiento))  throw new AppError('Seguimiento inválido', 400);
        if (!id_cuestionario || Number.isNaN(Number(id_cuestionario)))
            throw new AppError('Cuestionario inválido', 400);
        if (!Array.isArray(respuestas) || respuestas.length === 0)
            throw new AppError('Debes enviar al menos una respuesta', 400);

        const resultado = await guardarRespuestasService(
            id_seguimiento,
            Number(id_cuestionario),
            respuestas
        );
        return res.status(201).json({ message: 'Respuestas guardadas correctamente', ...resultado });
    } catch (error) {
        next(error);
    }
};