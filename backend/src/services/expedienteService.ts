import {
  Expediente,
  Dentista,
  Expediente_Padecimientos,
  Padecimiento,
  Paciente,
  Usuario,
  Direccion,
  Bitacora,
  Cita,
  TipoCita,
  Seguimiento,
  Catalogo_Procedimientos,
} from '../models/index';
import { AppError } from '../helpers/AppError';
import { Op } from 'sequelize';

const buildNombreCompleto = (usuario: any) => {
  if (!usuario) return '';
  return [usuario.nombre, usuario.apellido_paterno, usuario.apellido_materno]
    .filter(Boolean)
    .join(' ')
    .trim();
};

const calcularEdad = (fechaNacimiento?: string | Date) => {
  if (!fechaNacimiento) return null;
  const nacimiento = new Date(fechaNacimiento);
  if (Number.isNaN(nacimiento.getTime())) return null;

  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();

  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad -= 1;
  }

  return edad;
};

const formatearLocalidad = (direccion: any) => {
  if (!direccion) return '';
  const partes = [direccion.municipio, direccion.estado].filter(Boolean);
  return partes.join(', ');
};

const formatearFechaCorta = (fecha?: string | Date) => {
  if (!fecha) return null;
  const fechaObj = new Date(fecha);
  if (Number.isNaN(fechaObj.getTime())) return null;
  const opciones: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  };
  const formateada = fechaObj.toLocaleDateString('es-MX', opciones);
  return formateada.replace(/\s+/g, ' / ');
};

// const buildAvatarUrl = (nombre: string) => {
//   const nombreSeguro = nombre || 'Paciente';
//   return `https://ui-avatars.com/api/?name=${encodeURIComponent(nombreSeguro)}`;
// };

const obtenerPadecimientoReciente = (padecimientos: any[]) => {
  if (!Array.isArray(padecimientos) || padecimientos.length === 0) return null;
  return [...padecimientos].sort((a, b) => {
    const fechaA = new Date(a.fecha_registro || 0).getTime();
    const fechaB = new Date(b.fecha_registro || 0).getTime();
    return fechaB - fechaA;
  })[0];
};

export const crearExpedienteService = async (data: any, user: any) => {
  const dentista = await Dentista.findOne({ where: { id_usuario: user.id } });
  if (!dentista) {
    throw new AppError('Dentista no encontrado', 404);
  }

  const tipoSangre = data.tipo_sangre;
  const ocupacion = data.ocupacion;
  const estatura = data.estatura;
  const peso = data.peso;

  if (!tipoSangre || typeof tipoSangre !== 'string') {
    throw new AppError('El tipo de sangre es obligatorio', 400);
  }
  if (!ocupacion || typeof ocupacion !== 'string') {
    throw new AppError('La ocupacion es obligatoria', 400);
  }
  if (estatura === undefined || estatura === null || Number.isNaN(Number(estatura))) {
    throw new AppError('La estatura es obligatoria', 400);
  }
  if (peso === undefined || peso === null || Number.isNaN(Number(peso))) {
    throw new AppError('El peso es obligatorio', 400);
  }

  const existeExpediente = await Expediente.findOne({ where: { id_paciente: data.id_paciente } });

  if (existeExpediente) {
    throw new AppError('El paciente ya tiene un expediente', 400);
  }

  const expediente = await Expediente.create({
    id_paciente: data.id_paciente,
    id_dentista: dentista.id_dentista,
    fecha_creacion: new Date(),
    observaciones_generales: data.observaciones_generales,
    tipo_sangre: tipoSangre,
    estatura: Number(estatura),
    peso: Number(peso),
    ocupacion,
  });

  return expediente;
};

export const agregarPadecimientoService = async (id_expediente: number, data: any[]) => {
  const expediente = await Expediente.findByPk(id_expediente);

  if (!expediente) {
    throw new AppError('Expediente no encontrado', 404);
  }

  const ids = data.map((item) => item.id_padecimiento);
  const uniqueIds = new Set(ids);
  if (uniqueIds.size !== ids.length) {
    throw new AppError('Hay padecimientos repetidos en la solicitud', 400);
  }

  const existentes = await Expediente_Padecimientos.findAll({
    where: {
      id_expediente: expediente.id_expediente,
      id_padecimiento: {
        [Op.in]: ids,
      },
    },
  });

  if (existentes.length > 0) {
    throw new AppError('Algunos padecimientos ya están registrados', 400);
  }

  const registros = data.map((item) => ({
    id_expediente: expediente.id_expediente,
    id_padecimiento: item.id_padecimiento,
    tipo_antecedente: item.tipo_antecedente || null,
    nota: item.nota || null,
  }));

  return await Expediente_Padecimientos.bulkCreate(registros);
};

export const obtenerExpedienteService = async (id_expediente: number) => {
  const expediente = (await Expediente.findByPk(id_expediente, {
    include: [
      {
        model: Expediente_Padecimientos,
        as: 'padecimientos',
        include: [
          {
            model: Padecimiento,
            as: 'padecimiento',
          },
        ],
      },
    ],
  })) as any;

  if (!expediente) {
    throw new AppError('Expediente no encontrado', 404);
  }

  const expedienteLimpio = {
    id_expediente: expediente.id_expediente,
    id_paciente: expediente.id_paciente,
    observaciones_generales: expediente.observaciones_generales,
    tipo_sangre: expediente.tipo_sangre,
    estatura: expediente.estatura,
    peso: expediente.peso,
    ocupacion: expediente.ocupacion,
    padecimientos: expediente.padecimientos.map((p: any) => ({
      id: p.id_padecimiento,
      nombre: p.padecimiento?.nombre_padecimiento ?? null,
      categoria: p.padecimiento?.categoria_padecimiento ?? null,
      tipo_antecedente: p.tipo_antecedente,
      nota: p.nota,
    })),
  };

  return expedienteLimpio;
};

export const eliminarPadecimientoService = async (
  id_expediente: number,
  id_padecimiento: number,
) => {
  const registro = await Expediente_Padecimientos.findOne({
    where: {
      id_expediente,
      id_padecimiento,
    },
  });

  if (!registro) {
    throw new AppError('El padecimiento no está en el expediente', 404);
  }

  registro.destroy();
};

export const listarExpedientesService = async (limit: number, offset: number) => {
  const { count, rows } = (await Expediente.findAndCountAll({
    limit,
    offset,
    include: [
      {
        model: Paciente,
        as: 'paciente',
        include: [
          {
            model: Usuario,
            as: 'usuario',
            attributes: [
              'nombre',
              'apellido_paterno',
              'apellido_materno',
              'fecha_nacimiento',
              'genero',
            ],
          },
          {
            model: Direccion,
            as: 'direccion',
            attributes: ['municipio', 'estado'],
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
            attributes: ['nombre', 'apellido_paterno', 'apellido_materno'],
          },
        ],
      },
    ],
  })) as any;

  const pacienteIds = rows.map((r: any) => r.id_paciente).filter(Boolean);

  const bitacoras =
    pacienteIds.length === 0
      ? []
      : ((await Bitacora.findAll({
          where: {
            estado_bitacora: {
              [Op.ne]: 'Anulada',
            },
          },
          include: [
            {
              model: Cita,
              as: 'cita',
              required: true,
              where: {
                id_paciente: {
                  [Op.in]: pacienteIds,
                },
              },
              include: [
                {
                  model: TipoCita,
                  as: 'tipo',
                },
                {
                  model: Seguimiento,
                  as: 'seguimiento_post_operatorio',
                  include: [
                    {
                      model: Catalogo_Procedimientos,
                      as: 'tipo_procedimiento',
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
                      attributes: ['nombre', 'apellido_paterno', 'apellido_materno'],
                    },
                  ],
                },
              ],
            },
          ],
          order: [['fecha_creacion', 'DESC']],
        })) as any[]);

  const bitacoraPorPaciente = new Map<number, any>();
  for (const bitacora of bitacoras) {
    const idPaciente = bitacora.cita?.id_paciente;
    if (idPaciente && !bitacoraPorPaciente.has(idPaciente)) {
      bitacoraPorPaciente.set(idPaciente, bitacora);
    }
  }

  const listaExpedientes = rows.map((r: any) => {
    const paciente = r.paciente;
    const usuario = paciente?.usuario;
    const direccion = paciente?.direccion;
    const dentistaUsuario = r.dentista?.usuario;
    const bitacora = bitacoraPorPaciente.get(r.id_paciente);
    const cita = bitacora?.cita;
    const seguimiento = cita?.seguimiento_post_operatorio;
    const dentistaCita = cita?.dentista?.usuario || dentistaUsuario;
    const nombrePaciente = buildNombreCompleto(usuario);
    const nombreDentista = buildNombreCompleto(dentistaCita) || 'Dentista';
    const diagnostico = bitacora?.descripcion || 'Sin diagnostico';
    const tratamiento =
      seguimiento?.tipo_procedimiento?.nombre_procedimiento ||
      cita?.tipo?.nombre_corto ||
      'Sin tratamiento';
    const servicio = cita?.tipo?.nombre || 'Ninguno';
    const estadoSeguimiento = seguimiento?.estado_seguimiento || 'Sin Seguimiento';

    return {
      id: r.id_paciente,
      id_paciente: r.id_paciente,
      id_expediente: r.id_expediente,
      expediente: String(r.id_expediente),
      avatar: nombrePaciente, //Actualizar a link del blob storage cuando este listo para almacenar foto de perfil
      nombre: nombrePaciente,
      sexo: usuario?.genero || 'No especificado',
      edad: calcularEdad(usuario?.fecha_nacimiento),
      localidad: formatearLocalidad(direccion),
      ultimaAtencion: formatearFechaCorta(bitacora?.fecha_creacion) || 'Sin cita previa',
      servicio,
      diagnostico,
      tratamiento,
      odontologo: nombreDentista,
      fechaCreacion: formatearFechaCorta(r.fecha_creacion),
      estado: estadoSeguimiento,
      observaciones_generales: r.observaciones_generales,
    };
  });

  return {
    listaExpedientes,
    total: count,
    totalPaginas: count === 0 ? 1 : Math.ceil(count / limit),
    limitResponse: limit,
  };
};
