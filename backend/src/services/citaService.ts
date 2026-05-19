import { Cita, Dentista, Paciente, Usuario, TipoCita, Bitacora, Seguimiento } from '../models/index';
import { Model, NUMBER, Op, WhereOptions } from 'sequelize';
import { AppError } from '../helpers/AppError';
import { obtenerPacientePorUsuario } from './pacienteService';
import {
  notificarCancelacionCita,
  notificarEdicionCita,
  notificarNuevaCita,
} from '../services/emailService';
import { FiltrosCita } from '../controllers/citaController';
import { obtenerTipoCita } from '../controllers/tipoCitaController';

type CitaFormateada = {
  inicio: string;
  fin: string;
};

// type TiposCita = {
//   [key: number]: number
// }

// const tipos:TiposCita = {
//     1:60,
//     2:30
// }

type CitaCompleta = Cita & {
  paciente: Paciente & { usuario: Usuario };
  dentista: Dentista & { usuario: Usuario };
  tipo: TipoCita;
};

export const validarTipoCita = async (id_tipo_cita: number, user: any) => {
  let tipoCita;
  let duracion;
  let tipo;
  if (isNaN(Number(id_tipo_cita))) {
    throw new AppError('Tipo cita inválido', 400);
  }
  if (user.id_rol === 3) {
    id_tipo_cita = 1;
  }
  tipoCita = await obtenerTipoCita(id_tipo_cita);
  tipo = tipoCita?.id_tipocita;
  duracion = tipoCita?.duracion;
  if (!tipoCita || !tipoCita.duracion) {
    throw new AppError('Tipo cita inválido', 400);
  }

  return { tipo, duracion };
};

const generarSlots = (inicio: string, fin: string, intervalo: number, fecha: string) => {
  const slots = [];

  const [anio, mes, dia] = fecha.split('-').map(Number);
  const [horaInicio, minutoInicio] = inicio.split(':').map(Number);
  const [horaFin, minutoFin] = fin.split(':').map(Number);

  let hora = new Date(anio, mes - 1, dia, horaInicio, minutoInicio);
  let finDia = new Date(anio, mes - 1, dia, horaFin, minutoFin);

  while (hora < finDia) {
    slots.push(new Date(hora));
    hora = new Date(hora.getTime() + intervalo * 60000);
  }

  return slots;
};

const traerCitasDia = async (fecha: string, id_dentista: number) => {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const inicioDia = new Date(anio, mes - 1, dia, 0, 0, 0);
  const finDia = new Date(anio, mes - 1, dia + 1, 0, 0, 0);
  const citasDelDia = await Cita.findAll({
    where: {
      id_dentista,
      fecha_hora_inicio: {
        [Op.gte]: inicioDia,
        [Op.lt]: finDia,
      },
      estado: {
        [Op.ne]: 'Cancelada',
      },
    },
  });
  return citasDelDia;
};

const formatearCitas = (citas: Cita[]) => {
  const citasFormateadas = citas.map((cita) => ({
    inicio: cita.fecha_hora_inicio.toISOString(),
    fin: cita.fecha_hora_fin.toISOString(),
  }));
  return citasFormateadas;
};
const filtrarSlotsDisponibles = (slots: Date[], citas: CitaFormateada[], duracion: number) => {
  return slots.filter((slot) => {
    const inicio = slot;

    const fin = new Date(slot.getTime() + duracion * 60000);

    const hayConflicto = citas.some((cita) => {
      const citaInicio = new Date(cita.inicio);
      const citaFin = new Date(cita.fin);
      return inicio < citaFin && fin > citaInicio;
    });

    return !hayConflicto;
  });
};

export const obtenerDisponibilidad = async (
  fecha: string,
  id_dentista: number,
  tipo_cita: number,
) => {
  const citasBD = await traerCitasDia(fecha, id_dentista);
  const citasConFormato = formatearCitas(citasBD);
  const diaSemana = new Date(fecha).getUTCDay();
  let inicio = '09:00';
  let fin = '20:00';
  const tipoCita = await obtenerTipoCita(tipo_cita);
  const intervalo = 30;
  const duracion = tipoCita?.duracion; //ver que hacer con tipo cita (tabla en bd o objeto en codigo)
  if (!duracion) {
    throw new AppError('Tipo cita invalido', 400);
  }
  if (diaSemana === 0) {
    return [];
  }

  if (diaSemana === 6) {
    fin = '14:00';
  }
  const slots = generarSlots(inicio, fin, intervalo, fecha);

  const disponibles = filtrarSlotsDisponibles(slots, citasConFormato, duracion);

  return disponibles.map((slot) => slot.toISOString());
};

const validarCitaActivaPaciente = async (id_paciente: number): Promise<void> => {
  const ahora = new Date();
 
  const citaActiva = await Cita.findOne({
    where: {
      id_paciente,
      estado: { [Op.in]: ['Pendiente', 'Confirmada'] },
      fecha_hora_inicio: { [Op.gt]: ahora },
    },
  });
 
  if (citaActiva) {
    throw new AppError(
      'Ya tienes una cita activa. Cancela o completa tu cita actual antes de agendar una nueva.',
      400,
    );
  }
};

export const crearCita = async (data: any, user: any) => {
  const { fecha_hora_inicio, tipo_cita } = data;
 
  const inicio = validarFechas(fecha_hora_inicio);
  validarAnticipacion(inicio, 48, 'agendar');
 
  let { tipo, duracion } = await validarTipoCita(tipo_cita, user);
  if (!duracion) {
    throw new AppError('Tipo cita invalido', 400);
  }
 
  const id_dentista = await resolverDentista(user, data);
  const id_paciente = await resolverPaciente(user, data);
 
  // RN17: el paciente no puede tener más de 1 cita activa en el futuro
  if (user.id_rol === 3) {
    await validarCitaActivaPaciente(id_paciente);
  }
 
  const fin = new Date(inicio.getTime() + duracion * 60000);
  await Promise.all([
    validarTraslape(inicio, fin, id_dentista, 2),
    validarTraslape(inicio, fin, id_paciente, 3),
  ]);
 
  const cita = await Cita.create({
    fecha_hora_inicio: inicio,
    fecha_hora_fin: fin,
    id_dentista,
    id_paciente,
    id_tipocita: tipo,
    estado: 'Pendiente',
  });
 
  const citaCompleta = (await obtenerCitaCompleta(cita.id_cita)) as CitaCompleta;
  const usuario_paciente = citaCompleta.paciente.usuario;
  const usuario_dentista = citaCompleta.dentista.usuario;
 
  notificarNuevaCita(citaCompleta, usuario_paciente, 3).catch(console.error);
  notificarNuevaCita(citaCompleta, usuario_dentista, 2).catch(console.error);
 
  return cita;
};

export const editarCita = async (data: any, user: any, id_cita: number) => {
  const { fecha_hora_inicio } = data;

  const cita = await Cita.findByPk(id_cita, {
    include: [
      {
        model: TipoCita,
        as: 'tipo',
      },
    ],
  });
  if (!cita) {
    throw new AppError('Cita no encontrado', 404);
  }

  if (user.id_rol === 3) {
    const id_paciente = await obtenerPacientePorUsuario(user);
    if (cita.id_paciente !== id_paciente) {
      throw new AppError('No tienes autorización para editar esta cita', 403);
    }
  }

  validarAnticipacion(cita.fecha_hora_inicio, 36, 'editar');

  const inicio = new Date(fecha_hora_inicio);
  let duracion = (cita as any).tipo.duracion;
  const fin = new Date(inicio.getTime());
  fin.setMinutes(fin.getMinutes() + duracion);
  const ahora = new Date();
  if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
    throw new AppError('Fechas inválidas', 400);
  }
  if (inicio >= fin) {
    throw new AppError('Rango de fechas inválidas', 400);
  }

  if (inicio < ahora) {
    throw new AppError('No se puede agendar una cita en el pasado', 400);
  }
  await Promise.all([
    validarTraslape(inicio, fin, cita.id_dentista, 2, cita.id_cita),
    validarTraslape(inicio, fin, cita.id_paciente, 3, cita.id_cita),
  ]);
  const fechaInicioAnterior = new Date(cita.fecha_hora_inicio);
  await cita.update({
    fecha_hora_inicio: inicio,
    fecha_hora_fin: fin,
  });
  const citaCompleta = (await obtenerCitaCompleta(cita.id_cita)) as CitaCompleta;
  const usuario_paciente = citaCompleta.paciente.usuario;
  const usuario_dentista = citaCompleta.dentista.usuario;
  console.log('Correo enviado para editar');
  notificarEdicionCita(citaCompleta, fechaInicioAnterior, usuario_paciente, 3).catch(console.error);
  notificarEdicionCita(citaCompleta, fechaInicioAnterior, usuario_dentista, 2).catch(console.error);
  return cita;
};

const validarFechas = (fechaInicio: string) => {
  const inicio = new Date(fechaInicio);
  const ahora = new Date();
  if (isNaN(inicio.getTime())) {
    throw new AppError('Fecha inválida', 400);
  }

  if (inicio < ahora) {
    throw new AppError('No se puede agendar una cita en el pasado', 400);
  }

  return inicio;
};

const validarAnticipacion = (inicio: Date, anticipacion: number, accion: string) => {
  const ahora = new Date();
  const difHoras = (inicio.getTime() - ahora.getTime()) / (1000 * 60 * 60);
  if (difHoras < anticipacion) {
    throw new AppError(
      `No se puede ${accion} con menos de ${anticipacion} horas de anticipación`,
      400,
    );
  }
};

const resolverDentista = async (user: any, data: any) => {
  if (user.id_rol === 2) {
    const dentistaExiste = await Dentista.findOne({
      where: {
        id_usuario: user.id,
      },
      attributes: ['id_dentista'],
    });
    if (!dentistaExiste) {
      throw new AppError('Dentista no encontrado', 404);
    }
    return dentistaExiste.id_dentista;
  }

  // if (!data.id_dentista || isNaN(Number(data.id_dentista))) {
  //     throw new AppError('id dentista inválido', 400);
  // }
  const id_dentista = 1;
  const dentista = await Dentista.findByPk(id_dentista);
  if (!dentista) {
    throw new AppError('Dentista no encontrado', 404);
  }

  return dentista.id_dentista;
};

const resolverPaciente = async (user: any, data: any) => {
  if (user.id_rol === 3) {
    const pacienteExiste = await Paciente.findOne({
      where: {
        id_usuario: user.id,
      },
      attributes: ['id_paciente'],
    });
    if (!pacienteExiste) {
      throw new AppError('Paciente no encontrado', 404);
    }
    return pacienteExiste.id_paciente;
  }
  if (!data.id_paciente || isNaN(Number(data.id_paciente))) {
    throw new AppError('id paciente inválido', 400);
  }
  const id_paciente = Number(data.id_paciente);
  const paciente = await Paciente.findByPk(id_paciente);

  if (!paciente) {
    throw new AppError('Paciente no encontrado', 404);
  }
  return paciente.id_paciente;
};

const validarTraslape = async (
  inicio: Date,
  fin: Date,
  id: number,
  rol: number,
  id_cita_excluir?: number,
) => {
  const condicionTraslape = {
    [Op.or]: [
      {
        fecha_hora_inicio: {
          [Op.between]: [inicio, fin],
        },
      },
      {
        fecha_hora_fin: {
          [Op.between]: [inicio, fin],
        },
      },
      {
        [Op.and]: [
          { fecha_hora_inicio: { [Op.lte]: inicio } },
          { fecha_hora_fin: { [Op.gte]: fin } },
        ],
      },
    ],
  };
  const whereFiltro: Record<string, unknown> = {
    estado: {
      [Op.in]: ['Pendiente', 'Confirmada'],
    },
    ...condicionTraslape,
  };

  if (id_cita_excluir) {
    whereFiltro.id_cita = { [Op.ne]: id_cita_excluir };
  }
  if (rol === 2) {
    whereFiltro.id_dentista = id;
  }
  if (rol === 3) {
    whereFiltro.id_paciente = id;
  }
  const CitaExiste = await Cita.findOne({
    where: whereFiltro,
  });
  if (CitaExiste) {
    const usuario = rol === 2 ? 'Dentista' : 'Paciente';
    throw new AppError(`El ${usuario} ya tiene una cita en ese horario`, 400);
  }
};

export const cancelarCita = async (id: number, user: any) => {
  const cita = await Cita.findByPk(id);

  if (!cita) {
    throw new AppError('Cita no encontrada', 404);
  }

  if (cita.estado === 'Cancelada') {
    throw new AppError('La cita ya está cancelada', 400);
  }
  if (user.id_rol === 3) {
    const id_paciente = await obtenerPacientePorUsuario(user);
    if (cita.id_paciente !== id_paciente) {
      throw new AppError('No tienes Permiso para cancelar esta cita', 403);
    }
  }

  validarAnticipacion(cita.fecha_hora_inicio, 36, 'cancelar');
  await cita.update({
    estado: 'Cancelada',
  });
  const citaCompleta = (await obtenerCitaCompleta(cita.id_cita)) as CitaCompleta;
  const usuario_paciente = citaCompleta.paciente.usuario;
  const usuario_dentista = citaCompleta.dentista.usuario;

  notificarCancelacionCita(citaCompleta, usuario_paciente, 3).catch(console.error);
  notificarCancelacionCita(citaCompleta, usuario_dentista, 2).catch(console.error);
  return cita;
};

const obtenerCitaCompleta = async (id_cita: number) => {
  const cita = await Cita.findByPk(id_cita, {
    include: [
      {
        model: Paciente,
        as: 'paciente',
        include: [
          {
            model: Usuario,
            as: 'usuario',
            attributes: ['id_usuario', 'correo', 'nombre', 'telefono'],
          },
        ],
      },
      {
        model: Dentista,
        as: 'dentista',
        include: [
          {
            model: Usuario,
            as: 'usuario',
            attributes: ['id_usuario', 'correo', 'nombre', 'telefono'],
          },
        ],
      },
      {
        model: TipoCita,
        as: 'tipo',
      },
    ],
  });

  if (!cita) {
    throw new AppError('Cita no encontrada', 404);
  }
  return cita;
};

export const listarCitas = async (filtros: FiltrosCita, limit: number, offset: number) => {
  const where: WhereOptions<Cita> = {};
  const whereUsuario = filtros.nombre
    ? {
        [Op.and]: filtros.nombre
          .trim()
          .split(' ')
          .filter(Boolean) //Elimina elementos vacios del array
          .map((palabra) => ({
            [Op.or]: [
              { nombre: { [Op.iLike]: `%${palabra}%` } },
              { apellido_paterno: { [Op.iLike]: `%${palabra}%` } },
              { apellido_materno: { [Op.iLike]: `%${palabra}%` } },
            ],
          })),
      }
    : undefined;
  if (filtros.estado) {
    where.estado = filtros.estado;
  }

  if (filtros.desde && filtros.hasta) {
    where.fecha_hora_inicio = {
      [Op.between]: [filtros.desde, filtros.hasta],
    };
  }

  if (filtros.user?.id_rol === 3) {
    const paciente = await obtenerPacientePorUsuario(filtros.user);
    where.id_paciente = paciente;
  }

  if (filtros.sinBitacora) {
    const citasConBitacora = await Bitacora.findAll({
      attributes: ['id_cita'],
      where: { estado_bitacora: { [Op.ne]: 'Anulada' } },
    });
    const idsOcupados = citasConBitacora.map((b: any) => b.id_cita);
    // Si no hay ninguna bitácora, Op.notIn con array vacío daría error en algunos drivers,
    // por eso usamos [0] como fallback (ningún id_cita es 0 en la BD).
    where.id_cita = { [Op.notIn]: idsOcupados.length > 0 ? idsOcupados : [0] };
  }

  if (filtros.sinSeguimiento) {
    const citasConSeguimiento = await Seguimiento.findAll({
      attributes: ['id_cita'],
      where: { estado_seguimiento: { [Op.notIn]: ['cancelado', 'finalizado'] } },
    });
    const ids = citasConSeguimiento.map((s: any) => s.id_cita);
    const excluir = ids.length > 0 ? ids : [0];
    if (where.id_cita) {
      where.id_cita = { [Op.and]: [where.id_cita, { [Op.notIn]: excluir }] };
    } else {
      where.id_cita = { [Op.notIn]: excluir };
    }
  }

  // Mostrar solo citas cuya fecha_hora_fin ya pasó (la cita ya ocurrió)
  if (filtros.pasadas) {
    where.fecha_hora_fin = { [Op.lt]: new Date() };
  }

  const { count, rows } = await Cita.findAndCountAll({
    where,
    limit,
    offset,
    distinct: true,
    col: 'id_cita',
    attributes: ['id_cita', 'fecha_hora_inicio', 'fecha_hora_fin', 'estado'],
    include: [
      {
        model: Paciente,
        as: 'paciente',
        attributes: ['id_paciente'],
        include: [
          {
            model: Usuario,
            as: 'usuario',
            attributes: [
              'id_usuario',
              'nombre',
              'apellido_paterno',
              'apellido_materno',
              'correo',
              'telefono',
            ],
            where: whereUsuario,
          },
        ],
      },
      {
        model: Dentista,
        as: 'dentista',
        attributes: ['id_dentista'],
        include: [
          {
            model: Usuario,
            as: 'usuario',
            attributes: ['id_usuario', 'nombre', 'apellido_paterno', 'apellido_materno'],
          },
        ],
      },
      {
        model: TipoCita,
        as: 'tipo',
        attributes: ['id_tipocita', 'nombre_corto', 'duracion'],
      },
    ],
    order: [['fecha_hora_inicio', 'ASC']],
  });

  return {
    total: count,
    citas: rows,
    totalPaginas: count === 0 ? 1 : Math.ceil(count / limit),
    limitResponse: limit,
  };
};

export const obtenerCitaId = async (id_cita: number) => {
  return await Cita.findByPk(id_cita);
};