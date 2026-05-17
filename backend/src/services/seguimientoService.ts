import {
    Seguimiento, Catalogo_Procedimientos, Cita, Paciente, Usuario,
    Respuesta_paciente, Cuestionario, CuestionarioPregunta
} from '../models/index';
import { AppError } from '../helpers/AppError';
import { obtenerCitaId } from './citaService';
import { obtenerProcedimientoService } from './catalogoProcedimientosService';
import { obtenerCuestionarioPorId } from './cuestionarioService';

// ─── Crear seguimiento (CU14) ─────────────────────────────────────────────────

export const crearSeguimientoService = async (
    id_cita: number,
    id_procedimiento: number,
    data: {
        plan_cuidados?: string;
        indicaciones_medicas?: string;
        id_cuestionario_24h?: number | null;
        id_cuestionario_72h?: number | null;
    }
) => {
    const cita = await obtenerCitaId(id_cita);
    if (!cita) throw new AppError('No se encontró la cita', 404);

    const existe = await Seguimiento.findOne({ where: { id_cita } });
    if (existe) throw new AppError('Esta cita ya tiene un seguimiento activo', 400);

    const procedimiento = await obtenerProcedimientoService(id_procedimiento);

    if (data.id_cuestionario_24h) {
        const c = await Cuestionario.findByPk(data.id_cuestionario_24h);
        if (!c) throw new AppError('El cuestionario de 24h no existe', 404);
        if (c.tipo_cuestionario !== '24h') throw new AppError('El cuestionario seleccionado no es de 24h', 400);
    }
    if (data.id_cuestionario_72h) {
        const c = await Cuestionario.findByPk(data.id_cuestionario_72h);
        if (!c) throw new AppError('El cuestionario de 72h no existe', 404);
        if (c.tipo_cuestionario !== '72h') throw new AppError('El cuestionario seleccionado no es de 72h', 400);
    }

    const fecha_inicio = new Date();
    const fecha_fin = new Date();
    fecha_fin.setDate(fecha_inicio.getDate() + procedimiento.dias_seguimiento);

    const seguimiento = await Seguimiento.create({
        id_cita: cita.id_cita,
        id_procedimiento: procedimiento.id_procedimiento,
        plan_cuidados: data.plan_cuidados ?? null,
        indicaciones_medicas: data.indicaciones_medicas ?? null,
        id_cuestionario_24h: data.id_cuestionario_24h ?? null,
        id_cuestionario_72h: data.id_cuestionario_72h ?? null,
        fecha_inicio,
        fecha_fin,
        fecha_envio_24h: null,
        fecha_envio_72h: null
    });

    return seguimiento;
};

// ─── Listar seguimientos ──────────────────────────────────────────────────────
// Si userData.id_rol === 3 (Paciente), filtra solo sus seguimientos

interface UserData { id: number; id_rol: number }

export const listarSeguimientosService = async (
    limit: number,
    offset: number,
    estado?: string,
    userData?: UserData
) => {
    const where: any = {};
    if (estado) where.estado_seguimiento = estado;

    // Incluir siempre la relación con Cita y Paciente
    const citaInclude: any = {
        model: Cita,
        as: 'cita',
        required: true,
        include: [{
            model: Paciente,
            as: 'paciente',
            attributes: ['id_paciente'],
            include: [{
                model: Usuario,
                as: 'usuario',
                attributes: ['id_usuario', 'nombre', 'apellido_paterno', 'apellido_materno']
            }]
        }]
    };

    // BUG FIX: filtrar por paciente autenticado (id_rol 3 = Paciente)
    if (userData?.id_rol === 3) {
        const paciente = await Paciente.findOne({ where: { id_usuario: userData.id } });
        if (!paciente) throw new AppError('Paciente no encontrado', 404);
        citaInclude.where = { id_paciente: paciente.id_paciente };
    }

    const { count, rows } = await Seguimiento.findAndCountAll({
        limit,
        offset,
        where,
        include: [
            citaInclude,
            {
                model: Catalogo_Procedimientos,
                as: 'tipo_procedimiento',
                attributes: ['nombre_procedimiento']
            }
        ]
    });

    const listaSeguimiento = rows.map((s: any) => ({
        id_seguimiento:    s.id_seguimiento,
        estado_seguimiento: s.estado_seguimiento,
        fecha_inicio:      s.fecha_inicio,
        fecha_fin:         s.fecha_fin,
        procedimiento:     s.tipo_procedimiento.nombre_procedimiento,
        id_paciente:       s.cita.paciente.id_paciente,
        nombre:            `${s.cita.paciente.usuario.nombre} ${s.cita.paciente.usuario.apellido_paterno} ${s.cita.paciente.usuario.apellido_materno ?? ''}`.trim(),
        tiene_cuestionario_24h: !!s.id_cuestionario_24h,
        tiene_cuestionario_72h: !!s.id_cuestionario_72h
    }));

    return {
        listaSeguimiento,
        total: count,
        totalPaginas: count === 0 ? 1 : Math.ceil(count / limit),
        limitResponse: limit
    };
};

// ─── Obtener seguimiento ──────────────────────────────────────────────────────

export const obtenerSeguimientoService = async (id_seguimiento: number) => {
    const seguimiento = await Seguimiento.findByPk(id_seguimiento, {
        include: [
            {
                model: Cita,
                as: 'cita',
                include: [{
                    model: Paciente,
                    as: 'paciente',
                    attributes: ['id_paciente'],
                    include: [{
                        model: Usuario,
                        as: 'usuario',
                        attributes: ['id_usuario', 'nombre', 'apellido_paterno', 'apellido_materno']
                    }]
                }]
            },
            {
                model: Catalogo_Procedimientos,
                as: 'tipo_procedimiento',
                attributes: ['nombre_procedimiento']
            }
        ]
    });

    if (!seguimiento) throw new AppError('No se encontró el seguimiento', 404);
    return seguimiento;
};

// ─── Editar seguimiento ───────────────────────────────────────────────────────

export const editarSeguimientoService = async (id_seguimiento: number, data: any) => {
    const seguimiento = await Seguimiento.findByPk(id_seguimiento);
    if (!seguimiento) throw new AppError('No se encontró el seguimiento', 404);
    if (seguimiento.estado_seguimiento !== 'en curso') {
        throw new AppError('Solo se pueden editar seguimientos en curso', 400);
    }
    await seguimiento.update(data);
    return seguimiento;
};

// ─── Cancelar seguimiento ─────────────────────────────────────────────────────

export const cancelarSeguimientoService = async (id_seguimiento: number) => {
    const seguimiento = await Seguimiento.findByPk(id_seguimiento);
    if (!seguimiento) throw new AppError('No se encontró el seguimiento', 404);
    if (seguimiento.estado_seguimiento !== 'en curso') {
        throw new AppError('Solo se pueden cancelar seguimientos en curso', 400);
    }
    await seguimiento.update({ estado_seguimiento: 'cancelado' });
    return seguimiento;
};

// ─── Finalizar seguimiento (CU16) ─────────────────────────────────────────────
// Solo el dentista puede marcar como finalizado (en curso o alerta → finalizado)

export const finalizarSeguimientoService = async (id_seguimiento: number) => {
    const seguimiento = await Seguimiento.findByPk(id_seguimiento);
    if (!seguimiento) throw new AppError('No se encontró el seguimiento', 404);

    if (seguimiento.estado_seguimiento === 'cancelado') {
        throw new AppError('Un seguimiento cancelado no puede finalizarse', 400);
    }
    if (seguimiento.estado_seguimiento === 'finalizado') {
        throw new AppError('El seguimiento ya está finalizado', 400);
    }

    await seguimiento.update({
        estado_seguimiento: 'finalizado',
        fecha_fin: new Date()
    });

    return seguimiento;
};

// ─── Obtener cuestionario del seguimiento (CU22) ──────────────────────────────

export const obtenerCuestionarioSeguimientoService = async (
    id_seguimiento: number,
    tipo_cuestionario: '24h' | '72h'
) => {
    const seguimiento = await Seguimiento.findByPk(id_seguimiento);
    if (!seguimiento) throw new AppError('No se encontró el seguimiento', 404);

    const idCuestionario = tipo_cuestionario === '24h'
        ? seguimiento.id_cuestionario_24h
        : seguimiento.id_cuestionario_72h;

    if (!idCuestionario) {
        throw new AppError(
            `Este seguimiento no tiene cuestionario de ${tipo_cuestionario} asignado`,
            404
        );
    }

    return obtenerCuestionarioPorId(idCuestionario);
};

// ─── Guardar respuestas del paciente (CU22) ───────────────────────────────────

export interface RespuestaInput {
    id_pregunta_base: number;
    valor_respuesta: string;
}

export const guardarRespuestasService = async (
    id_seguimiento: number,
    id_cuestionario: number,
    respuestas: RespuestaInput[]
) => {
    const seguimiento = await Seguimiento.findByPk(id_seguimiento);
    if (!seguimiento) throw new AppError('No se encontró el seguimiento', 404);

    if (seguimiento.estado_seguimiento === 'cancelado' || seguimiento.estado_seguimiento === 'finalizado') {
        throw new AppError('No se pueden registrar respuestas en un seguimiento cerrado', 400);
    }

    const cuestionario = await Cuestionario.findByPk(id_cuestionario);
    if (!cuestionario) throw new AppError('El cuestionario no existe', 404);

    // Verificar que las preguntas pertenecen al cuestionario
    const pivotIds = await CuestionarioPregunta.findAll({
        where: { id_cuestionario },
        attributes: ['id_pregunta_base']
    });
    const idsValidos = new Set(pivotIds.map((p: any) => p.id_pregunta_base));

    for (const r of respuestas) {
        if (!idsValidos.has(r.id_pregunta_base)) {
            throw new AppError(`La pregunta ${r.id_pregunta_base} no pertenece a este cuestionario`, 400);
        }
        if (typeof r.valor_respuesta !== 'string' || !r.valor_respuesta.trim()) {
            throw new AppError('Todas las respuestas son obligatorias', 400);
        }
    }

    await Respuesta_paciente.bulkCreate(
        respuestas.map(r => ({
            id_pregunta_base: r.id_pregunta_base,
            id_seguimiento,
            id_cuestionario,
            valor_respuesta: r.valor_respuesta,
            fecha_respuesta: new Date()
        }))
    );

    // Marcar como enviado (RN12)
    if (cuestionario.tipo_cuestionario === '24h') {
        await seguimiento.update({ enviado_24h: true, fecha_envio_24h: new Date() });
    } else if (cuestionario.tipo_cuestionario === '72h') {
        await seguimiento.update({ enviado_72h: true, fecha_envio_72h: new Date() });
    }

    return { guardadas: respuestas.length };
};