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

  const existeExpediente = await Expediente.findOne({ where: { id_paciente: data.id_paciente } });

  if (existeExpediente) {
    throw new AppError('El paciente ya tiene un expediente', 400);
  }

  const expediente = await Expediente.create({
    id_paciente: data.id_paciente,
    id_dentista: dentista.id_dentista,
    fecha_creacion: new Date(),
    observaciones_generales: data.observaciones_generales,
  });

  return expediente;
};

export const agregarPadecimientoService = async (id_expediente: number, data: any) => {
  const expediente = await Expediente.findByPk(id_expediente);

  if (!expediente) {
    throw new AppError('Expediente no encontrado', 404);
  }

  const existe = await Expediente_Padecimientos.findOne({
    where: {
      id_expediente: expediente.id_expediente,
      id_padecimiento: data.id_padecimiento,
    },
  });

  if (existe) {
    throw new AppError('Este padecimiento ya está registrado', 400);
  }

  return await Expediente_Padecimientos.create({
    id_expediente: expediente.id_expediente,
    id_padecimiento: data.id_padecimiento,
    tipo_antecedente: data.tipo_antecedente || null,
    nota: data.nota || null,
  });
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
    observaciones_generales: expediente.observaciones_generales,
    padecimientos: expediente.padecimientos.map((p: any) => ({
      id: p.id_padecimiento,
      nombre: p.nombre_padecimiento,
      categoria: p.padecimiento.categoria_padecimiento,
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
