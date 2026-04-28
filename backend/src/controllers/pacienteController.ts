import { Request, Response } from 'express';
import { Paciente, Direccion, Usuario, Token } from '../models/index';
import { sequelize } from '../config/database';
import { generarContra } from '../helpers/generarContra';
import { generarToken } from '../helpers/generarToken';
import transporter from '../config/mailer';
import { CustomRequest } from '../middleware/authMiddleware';

export const registrarPaciente = async (req: Request, res: Response) => {
  const {
    nombre,
    id_rol,
    apellido_paterno,
    apellido_materno,
    correo,
    telefono,
    fecha_nacimiento,
    curp,
    genero,
    calle,
    num_ext,
    num_int,
    colonia,
    municipio,
    estado,
    codigo_postal,
  } = req.body;

  if (
    !nombre ||
    !id_rol ||
    !apellido_materno ||
    !apellido_paterno ||
    !correo ||
    !telefono ||
    !fecha_nacimiento ||
    !curp ||
    !genero
  ) {
    return res.status(400).json({
      message: 'Faltan datos obligatorios',
    });
  }

  if (!calle || !num_ext || !colonia || !municipio || !estado || !codigo_postal) {
    return res.status(400).json({
      message: 'Faltan datos en dirección',
    });
  }
  if (codigo_postal.length !== 5) {
    return res.status(400).json({
      message: 'Codigo postal inválido',
    });
  }

  if (id_rol !== 3) {
    return res.status(400).json({
      message: 'No se puede registar al usuario',
    });
  }
  const t = await sequelize.transaction();
  let committed = false;
  try {
    const correoExiste = await Usuario.findOne({ where: { correo }, transaction: t });
    if (correoExiste) {
      await t.rollback();
      return res.status(400).json({
        message: 'El correo electrónico ya está registrado',
      });
    }

    const curpExiste = await Usuario.findOne({ where: { curp }, transaction: t });
    if (curpExiste) {
      await t.rollback();
      return res.status(400).json({
        message: 'La CURP ya está registrada',
      });
    }

    const estadoCuenta = 'pendiente';

    const usuarioNuevo = await Usuario.create(
      {
        id_rol,
        nombre,
        apellido_paterno,
        apellido_materno,
        correo,
        contrasena: generarContra(),
        telefono,
        fecha_nacimiento,
        curp,
        genero,
        estado: estadoCuenta,
      },
      { transaction: t },
    );

    const pacienteNuevo = await Paciente.create(
      {
        id_usuario: usuarioNuevo.id_usuario,
      },
      { transaction: t },
    );

    const token = generarToken();
    const expira = new Date();
    expira.setHours(expira.getHours() + 24);
    const tokenPaciente = await Token.create(
      {
        id_usuario: usuarioNuevo.id_usuario,
        token,
        tipo: 'activacion',
        expira_en: expira,
      },
      { transaction: t },
    );

    const direccionPaciente = await Direccion.create(
      {
        id_paciente: pacienteNuevo.id_paciente,
        calle,
        num_ext,
        num_int,
        colonia,
        municipio,
        estado,
        codigo_postal,
      },
      { transaction: t },
    );

    await transporter.sendMail({
      to: usuarioNuevo.correo,
      subject: 'Activar Cuenta',
      template: 'activarCuentaPaciente',
      context: {
        nombre: usuarioNuevo.nombre,
        link: `http://localhost:3000/auth/activar-cuenta?token=${token}`,
        year: new Date().getFullYear(),
      },
    } as any);
    await t.commit();
    committed = true;
    return res.status(200).json({
      message: 'Usuario creado correctamente',
      usuario: {
        id: usuarioNuevo.id_usuario,
        nombre: usuarioNuevo.nombre,
        correo: usuarioNuevo.correo,
        id_rol: usuarioNuevo.id_rol,
      },
    });
  } catch (error) {
    if (!committed) {
      await t.rollback();
    }
    console.log('Error al registrar Paciente: ', error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
};

export const listarPacientes = async (req: Request, res: Response) => {
  const pagina = Number(req.query.pagina) || 1;

  try {
    const limit = 10;
    const offset = pagina * limit - limit;

    const { count: total, rows: pacientes } = await Paciente.findAndCountAll({
      limit,
      offset,
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: {
            exclude: ['contrasena'],
          },
          where: {
            estado: 'activo',
          },
        },
      ],
    });

    const totalPaginas = Math.ceil(total / limit);

    return res.status(200).json({
      message: 'Pacientes',
      total,
      pagina,
      totalPaginas,
      limit,
      pacientes,
    });
  } catch (error) {
    console.log('Error al listar pacientes: ', error);
    return res.status(500).json({
      message: 'Error del Servidor',
    });
  }
};

export const obtenerPaciente = async (req: Request, res: Response) => {
  const id_paciente = Number(req.params.id);
  if (isNaN(id_paciente)) {
    return res.status(400).json({
      message: 'ID inválido',
    });
  }

  try {
    const paciente = await Paciente.findByPk(id_paciente, {
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: {
            exclude: ['contrasena'],
          },
          where: {
            estado: 'activo',
          },
        },
      ],
    });

    if (!paciente) {
      return res.status(400).json({
        message: 'Paciente no encontrado',
      });
    }

    return res.status(200).json({
      message: 'Paciente encontrado',
      paciente,
    });
  } catch (error) {
    console.log('Error al obtener Paciente: ', error);
    return res.status(500).json({
      message: 'Error del Servidor',
    });
  }
};

export const actualizarPaciente = async (req: CustomRequest, res: Response) => {
  const id_param = Number(req.params.id);
  const {
    nombre,
    apellido_paterno,
    apellido_materno,
    fecha_nacimiento,
    //correo,
    telefono,
    calle,
    num_ext,
    num_int,
    colonia,
    municipio,
    estado,
    codigo_postal,
  } = req.body;
  if (isNaN(id_param)) {
    return res.status(400).json({ message: 'ID inválido' });
  }
  //if (!nombre || !apellido_materno || !apellido_paterno || !correo || !telefono) {
  if (!nombre || !apellido_materno || !apellido_paterno || !fecha_nacimiento || !telefono) {
    return res.status(400).json({
      message: 'Faltan datos obligatorios',
    });
  }

  //if (!calle || !num_ext || !num_int || !colonia || !municipio || !estado || !codigo_postal) {
  if (!calle || !num_ext || !colonia || !municipio || !estado || !codigo_postal) {
    return res.status(400).json({
      message: 'Faltan datos en dirección',
    });
  }
  if (codigo_postal.length !== 5) {
    return res.status(400).json({
      message: 'Codigo postal inválido',
    });
  }

  const t = await sequelize.transaction();
  try {
    let paciente;

    // 🔴 LA MAGIA DE SEGURIDAD E IDs ESTÁ AQUÍ 🔴
    if (req.userData?.id_rol === 3) {
      // Si es un paciente, ignoramos la URL y buscamos SU paciente usando su token
      paciente = await Paciente.findOne({ 
        where: { id_usuario: req.userData.id }, 
        transaction: t 
      });
    } else {
      // Si es el dentista/admin, sí le hacemos caso al ID de la URL
      paciente = await Paciente.findByPk(id_param, { transaction: t });
    }

    if (!paciente) {
      await t.rollback();
      return res.status(404).json({ message: 'Paciente no encontrado' });
    }

    await Usuario.update(
      //{ nombre, apellido_paterno, apellido_materno, correo, telefono },
      { nombre, apellido_paterno, apellido_materno, fecha_nacimiento, telefono },
      { where: { id_usuario: paciente.id_usuario }, transaction: t },
    );

    await Direccion.update(
      { calle, num_ext, num_int, colonia, municipio, estado, codigo_postal },
      { where: { id_paciente: paciente.id_paciente }, transaction: t },
    );

    await t.commit();
    return res.status(200).json({
      message: 'Perfil del paciente actualiazado correctamente',
    });
  } catch (error: any) {
    if (t) await t.rollback();
    console.log('Error al editar paciente: ', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      //return res.status(400).json({ message: 'El correo electrónico ya esta registrado' });
      return res.status(400).json({ message: 'Algún dato de contacto (como el teléfono) ya está en uso por otro paciente.' });
    }
    return res.status(500).json({ message: 'Error del servidor' });
  }
};

export const obtenerPerfilPaciente = async (req: CustomRequest, res: Response) => {
  try {
    const id_usuario = req.userData?.id;
    if (!id_usuario) {
      return res.status(401).json({ message: 'Sesión no válida' });
    }

    const perfil = await Paciente.findOne({
      where: { id_usuario },
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: { exclude: ['contrasena'] },
        },
        {
          model: Direccion,
          as: 'direccion',
        },
      ],
    });

    if (!perfil) {
      return res.status(404).json({ message: 'Perfil no encontrado' });
    }

    // 🔴 LA MAGIA: Aplanamos la respuesta para el frontend
    const usuarioData = perfil.get('usuario') as any;
    const direccionData = perfil.get('direccion') as any;

    const perfilAplanado = {
      ...usuarioData.toJSON(), // Saca nombre, apellidos, correo a la raíz del JSON
      id_paciente: perfil.id_paciente,
      direccion: direccionData ? direccionData.toJSON() : null
    };

    return res.json(perfilAplanado);
  } catch (error) {
    console.log('Error al obtener perfil del paciente: ', error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
};
