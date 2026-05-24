import {
    Seguimiento, Catalogo_Procedimientos, Cita, Paciente, Usuario,
    Respuesta_paciente, Cuestionario, CuestionarioPregunta, PreguntaBase
} from '../models/index';
import { AppError } from '../helpers/AppError';
import { obtenerCitaId } from './citaService';
import { obtenerProcedimientoService } from './catalogoProcedimientosService';
import { obtenerCuestionarioPorId } from './cuestionarioService';

export interface RespuestaDetalleItem {
    id_pregunta_base: number;
    texto_pregunta:   string;
    tipo_control:     string;
    opciones:         string[] | null;
    valor_alerta:     Record<string, any> | null;
    valor_respuesta:  string;
    fecha_respuesta:  Date;
    disparo_alerta:   boolean;
}

export const obtenerRespuestasSeguimientoService = async (id_seguimiento: number) => {
    const seguimiento = await Seguimiento.findByPk(id_seguimiento, {
        attributes: [
            'id_seguimiento',
            'id_cuestionario_24h', 'id_cuestionario_72h',
            'enviado_24h', 'enviado_72h',
            'fecha_envio_24h', 'fecha_envio_72h',
        ]
    });
    if (!seguimiento) throw new AppError('No se encontró el seguimiento', 404);
 
    // Traer respuestas con la info de la pregunta en un solo JOIN
    // Alias `pregunta_base` confirmado en models/index.ts
    const filas = await Respuesta_paciente.findAll({
        where: { id_seguimiento },
        attributes: ['id_respuesta', 'id_pregunta_base', 'id_cuestionario', 'valor_respuesta', 'fecha_respuesta'],
        include: [{
            model: PreguntaBase,
            as: 'pregunta_base',
            attributes: ['id_pregunta_base', 'texto_pregunta', 'tipo_control', 'opciones', 'valor_alerta']
        }],
        order: [['id_cuestionario', 'ASC'], ['id_respuesta', 'ASC']]
    });
 
    // Evalúa si una respuesta individual cumple la condición de alerta de su pregunta
    const evaluarIndividual = (
        tipoControl: string,
        valorAlerta: any,
        valorRespuesta: string
    ): boolean => {
        if (!valorAlerta) return false;
        if (tipoControl === 'escala_1_10' && valorAlerta.min !== undefined)
            return Number(valorRespuesta) >= valorAlerta.min;
        if (tipoControl === 'booleano_si_no' && valorAlerta.valor !== undefined)
            return valorRespuesta === valorAlerta.valor;
        if (tipoControl === 'opcion_multiple' && valorAlerta.incluye !== undefined) {
            const sel = valorRespuesta.split(',').map((v: string) => v.trim());
            return sel.includes(valorAlerta.incluye);
        }
        return false;
    };
 
    const mapear = (f: any): RespuestaDetalleItem | null => {
        const p = f.pregunta_base;
        if (!p) return null;
        return {
            id_pregunta_base: p.id_pregunta_base,
            texto_pregunta:   p.texto_pregunta,
            tipo_control:     p.tipo_control,
            opciones:         p.opciones,
            valor_alerta:     p.valor_alerta,
            valor_respuesta:  f.valor_respuesta,
            fecha_respuesta:  f.fecha_respuesta,
            disparo_alerta:   evaluarIndividual(p.tipo_control, p.valor_alerta, f.valor_respuesta),
        };
    };
 
    // Agrupar por tipo de cuestionario usando los IDs asignados al seguimiento
    const respuestas24h = filas
        .filter((f: any) => f.id_cuestionario === seguimiento.id_cuestionario_24h)
        .map(mapear)
        .filter(Boolean) as RespuestaDetalleItem[];
 
    const respuestas72h = filas
        .filter((f: any) => f.id_cuestionario === seguimiento.id_cuestionario_72h)
        .map(mapear)
        .filter(Boolean) as RespuestaDetalleItem[];
 
    return {
        respuestas_24h:  respuestas24h,
        respuestas_72h:  respuestas72h,
        fecha_envio_24h: seguimiento.fecha_envio_24h ?? null,
        fecha_envio_72h: seguimiento.fecha_envio_72h ?? null,
    };
};

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

    // Marcar la cita como Atendida al activar el seguimiento (CU14)
    await Cita.update({ estado: 'Atendida' }, { where: { id_cita: cita.id_cita } });

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

    // Filtrar por paciente autenticado (id_rol 3 = Paciente)
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
        // IDs necesarios para el kanban y para pre-llenar el modal de editar
        id_seguimiento:      s.id_seguimiento,
        id_cita:             s.id_cita,
        id_procedimiento:    s.id_procedimiento,
        id_cuestionario_24h: s.id_cuestionario_24h,
        id_cuestionario_72h: s.id_cuestionario_72h,
        // Estado y fechas
        estado_seguimiento:  s.estado_seguimiento,
        fecha_inicio:        s.fecha_inicio,
        fecha_fin:           s.fecha_fin,
        // Flags de cuestionarios completados (para PatientFollowUp)
        enviado_24h:         s.enviado_24h,
        enviado_72h:         s.enviado_72h,
        // Info derivada para mostrar en cards
        procedimiento:       s.tipo_procedimiento.nombre_procedimiento,
        id_paciente:         s.cita.paciente.id_paciente,
        nombre:              `${s.cita.paciente.usuario.nombre} ${s.cita.paciente.usuario.apellido_paterno} ${s.cita.paciente.usuario.apellido_materno ?? ''}`.trim(),
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
// Permite editar en estado 'en curso' y 'alerta' (BUG FIX)
// Acepta cambios de cuestionarios (CU15)

export interface EditarSeguimientoData {
    plan_cuidados?:        string | null;
    indicaciones_medicas?: string | null;
    id_cuestionario_24h?:  number | null;
    id_cuestionario_72h?:  number | null;
}

export const editarSeguimientoService = async (
    id_seguimiento: number,
    data: EditarSeguimientoData
) => {
    const seguimiento = await Seguimiento.findByPk(id_seguimiento);
    if (!seguimiento) throw new AppError('No se encontró el seguimiento', 404);

    if (!['en curso', 'alerta'].includes(seguimiento.estado_seguimiento)) {
        throw new AppError('Solo se pueden editar seguimientos activos', 400);
    }

    // Validar cuestionario 24h si se está cambiando
    if (data.id_cuestionario_24h !== undefined && data.id_cuestionario_24h !== null) {
        const c = await Cuestionario.findByPk(data.id_cuestionario_24h);
        if (!c) throw new AppError('El cuestionario de 24h no existe', 404);
        if (c.tipo_cuestionario !== '24h')
            throw new AppError('El cuestionario seleccionado no es de tipo 24h', 400);
    }

    // Validar cuestionario 72h si se está cambiando
    if (data.id_cuestionario_72h !== undefined && data.id_cuestionario_72h !== null) {
        const c = await Cuestionario.findByPk(data.id_cuestionario_72h);
        if (!c) throw new AppError('El cuestionario de 72h no existe', 404);
        if (c.tipo_cuestionario !== '72h')
            throw new AppError('El cuestionario seleccionado no es de tipo 72h', 400);
    }

    await seguimiento.update(data);
    return seguimiento;
};

// ─── Cancelar seguimiento ─────────────────────────────────────────────────────
// Permite cancelar en estado 'en curso' y 'alerta' (BUG FIX — RN11)

export const cancelarSeguimientoService = async (id_seguimiento: number) => {
    const seguimiento = await Seguimiento.findByPk(id_seguimiento);
    if (!seguimiento) throw new AppError('No se encontró el seguimiento', 404);

    if (!['en curso', 'alerta'].includes(seguimiento.estado_seguimiento)) {
        throw new AppError('Solo se pueden cancelar seguimientos activos', 400);
    }

    await seguimiento.update({ estado_seguimiento: 'cancelado' });
    return seguimiento;
};

// ─── Finalizar seguimiento (CU16) ─────────────────────────────────────────────
// El dentista puede finalizar desde 'en curso' o 'alerta'

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
    valor_respuesta:  string;
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

    // Verificar que todas las preguntas pertenecen al cuestionario
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
            valor_respuesta:  r.valor_respuesta,
            fecha_respuesta:  new Date()
        }))
    );

    // Marcar cuestionario como completado (RN12)
    if (cuestionario.tipo_cuestionario === '24h') {
        await seguimiento.update({ enviado_24h: true, fecha_envio_24h: new Date() });
    } else if (cuestionario.tipo_cuestionario === '72h') {
        await seguimiento.update({ enviado_72h: true, fecha_envio_72h: new Date() });
    }

    // ─── RN13: evaluar alertas y actualizar estado en el backend ─────────────
    // Si alguna respuesta cumple las condiciones de alerta y el seguimiento está
    // en curso, lo transiciona a 'alerta' para que el dentista lo vea en su kanban.
    const hayAlerta = await evaluarAlertasRN13(respuestas);
    if (hayAlerta && seguimiento.estado_seguimiento === 'en curso') {
        await seguimiento.update({ estado_seguimiento: 'alerta' });
    }

    return { guardadas: respuestas.length, alerta: hayAlerta };
};

// ─── Helper RN13: evalúa si alguna respuesta activa una alerta ────────────────
// Espeja la lógica de evaluarAlerta del frontend (useResponderCuestionario.ts)
// para garantizar que el estado se actualice en la fuente de verdad (BD).

async function evaluarAlertasRN13(respuestas: RespuestaInput[]): Promise<boolean> {
    const ids = respuestas.map(r => r.id_pregunta_base);

    const preguntas = await PreguntaBase.findAll({
        where: { id_pregunta_base: ids },
        attributes: ['id_pregunta_base', 'tipo_control', 'valor_alerta']
    });

    // Map id → { tipo_control, valor_alerta } para lookup O(1)
    const infoMap = new Map(
        preguntas
            .filter((p: any) => p.valor_alerta !== null)
            .map((p: any) => [p.id_pregunta_base as number, {
                tipo_control: p.tipo_control as string,
                valor_alerta: p.valor_alerta as any
            }])
    );

    for (const r of respuestas) {
        const info = infoMap.get(r.id_pregunta_base);
        if (!info) continue;

        const { tipo_control, valor_alerta: va } = info;

        // Escala numérica: alerta si el valor supera el umbral mínimo
        if (tipo_control === 'escala_1_10' && va.min !== undefined) {
            if (Number(r.valor_respuesta) >= va.min) return true;
        }

        // Booleano Sí/No: alerta si la respuesta coincide con el valor de alerta
        if (tipo_control === 'booleano_si_no' && va.valor !== undefined) {
            if (r.valor_respuesta === va.valor) return true;
        }

        // Opción múltiple (checkbox): alerta si incluye la opción peligrosa
        if (tipo_control === 'opcion_multiple' && va.incluye !== undefined) {
            const seleccionados = r.valor_respuesta.split(',').map((v: string) => v.trim());
            if (seleccionados.includes(va.incluye)) return true;
        }
    }

    return false;
}

export const resolverAlertaService = async (id_seguimiento: number) => {
  const seguimiento = await Seguimiento.findByPk(id_seguimiento);
  if (!seguimiento) throw new AppError('No se encontró el seguimiento', 404);
  if (seguimiento.estado_seguimiento !== 'alerta') {
    throw new AppError('El seguimiento no tiene una alerta activa', 409);
  }
  await seguimiento.update({ estado_seguimiento: 'en curso' });
  return seguimiento;
};