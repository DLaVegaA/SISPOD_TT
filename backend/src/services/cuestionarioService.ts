import { Catalogo_Procedimientos, Cuestionario, CuestionarioPregunta, PreguntaBase } from '../models/index';
import { AppError } from '../helpers/AppError';
import { obtenerProcedimientoService } from './catalogoProcedimientosService';
import { obtenerPreguntaBaseService } from './preguntaBaseService';

// ─── Crear cuestionario ───────────────────────────────────────────────────────

export const crearCuestionarioService = async (id_procedimiento: number, data: any) => {
    const procedimiento = await obtenerProcedimientoService(id_procedimiento);

    if (data.tipo_cuestionario === '72h' && procedimiento.dias_seguimiento < 3) {
        throw new AppError('Este procedimiento no requiere cuestionario de 72 hrs', 400);
    }

    const cuestionario = await Cuestionario.create({ id_procedimiento, ...data });
    return cuestionario;
};

// ─── Listar cuestionarios ─────────────────────────────────────────────────────

export const listarCuestionariosService = async (
    id_procedimiento?: number,
    tipo?: string,
    incluirInactivos = false
) => {
    const where: any = {};
    if (id_procedimiento) where.id_procedimiento = id_procedimiento;
    if (tipo) where.tipo_cuestionario = tipo;
 
    // Por defecto solo muestra activos (para el selector de seguimiento).
    // La biblioteca del dentista pasa incluirInactivos = true.
    if (!incluirInactivos) where.activo = true;
 
    const cuestionarios = await Cuestionario.findAll({
        where,
        include: [{
            model: Catalogo_Procedimientos,
            as: 'procedimiento_asociado',  // ← alias real del modelo
            attributes: ['nombre_procedimiento']
        }],
        order: [['id_cuestionario', 'DESC']]
    });
 
    return cuestionarios;
};

// ─── Helpers internos de aplanado ─────────────────────────────────────────────

function aplanarPreguntas(raw: any): any {
    const data = raw.toJSON ? raw.toJSON() : { ...raw };
    data.preguntas = (data.cuestionario_preguntas ?? [])
        .sort((a: any, b: any) => a.orden - b.orden)
        .map((cp: any) => ({ ...cp.pregunta_base, orden: cp.orden }));
    delete data.cuestionario_preguntas;
    return data;
}

const INCLUDE_PREGUNTAS = [
    {
        model: CuestionarioPregunta,
        as: 'cuestionario_preguntas',
        include: [{ model: PreguntaBase, as: 'pregunta_base' }]
    }
];

// ─── Obtener cuestionario por ID (usado por seguimientoService) ───────────────

export const obtenerCuestionarioPorId = async (id_cuestionario: number) => {
    const cuestionario = await Cuestionario.findByPk(id_cuestionario, {
        include: INCLUDE_PREGUNTAS
    });

    if (!cuestionario) {
        throw new AppError('Cuestionario no encontrado', 404);
    }

    return aplanarPreguntas(cuestionario);
};

// ─── Obtener cuestionario por procedimiento+tipo (fallback legacy) ────────────

export const obtenerCuestionario = async (id_procedimiento: number, tipo_cuestionario: string) => {
    const cuestionario = await Cuestionario.findOne({
        where: { id_procedimiento, tipo_cuestionario },
        include: INCLUDE_PREGUNTAS
    });

    if (!cuestionario) {
        throw new AppError('Este procedimiento no tiene cuestionario asignado', 404);
    }

    return aplanarPreguntas(cuestionario);
};

// ─── Asignar preguntas a un cuestionario ──────────────────────────────────────

export interface PreguntaOrdenada {
    id_pregunta_base: number;
    orden: number;
}

export const asignarPreguntasService = async (
    id_cuestionario: number,
    preguntas: PreguntaOrdenada[]
) => {
    const cuestionario = await Cuestionario.findByPk(id_cuestionario);
    if (!cuestionario) throw new AppError('El cuestionario no existe', 404);

    if (!Array.isArray(preguntas) || preguntas.length === 0) {
        throw new AppError('Debes enviar al menos una pregunta', 400);
    }

    for (const p of preguntas) {
        await obtenerPreguntaBaseService(p.id_pregunta_base);
    }

    await CuestionarioPregunta.destroy({ where: { id_cuestionario } });

    await CuestionarioPregunta.bulkCreate(
        preguntas.map(p => ({
            id_cuestionario,
            id_pregunta_base: p.id_pregunta_base,
            orden: p.orden
        }))
    );

    return { asignadas: preguntas.length };
};

// ─── Listar preguntas de un cuestionario ──────────────────────────────────────

export const listarPreguntasDeCuestionarioService = async (id_cuestionario: number) => {
    const cuestionario = await Cuestionario.findByPk(id_cuestionario, {
        include: INCLUDE_PREGUNTAS
    });

    if (!cuestionario) throw new AppError('El cuestionario no existe', 404);

    return aplanarPreguntas(cuestionario).preguntas;
};

export const desactivarCuestionarioService = async (id_cuestionario: number) => {
    const cuestionario = await Cuestionario.findByPk(id_cuestionario);
    if (!cuestionario) throw new AppError('El cuestionario no existe', 404);
    if (cuestionario.activo === false) throw new AppError('El cuestionario ya está inactivo', 400);
 
    await cuestionario.update({ activo: false });
    return cuestionario;
};