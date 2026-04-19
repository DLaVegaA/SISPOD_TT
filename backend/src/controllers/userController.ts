import { Request, Response } from 'express';
import { Asistente, Role, Usuario } from '../models/index';
import { sequelize } from '../config/database';
import { CustomRequest } from '../middleware/authMiddleware';

const VALID_ROLE_IDS = [1, 2, 3, 4];

function normalizeStatus(rawStatus: unknown): 'activo' | 'eliminado' {
  if (rawStatus === 'active' || rawStatus === 'activo') return 'activo';
  if (rawStatus === 'inactive' || rawStatus === 'eliminado') return 'eliminado';
  return 'activo';
}

function sanitizePhone(rawPhone: unknown): string {
  if (typeof rawPhone === 'string') {
    const numbers = rawPhone.replace(/\D/g, '').slice(0, 10);
    if (numbers.length === 10) return numbers;
  }

  return Date.now().toString().slice(-10).padStart(10, '0');
}

function buildDefaultCurp(rawCurp: unknown): string {
  if (typeof rawCurp === 'string' && rawCurp.trim()) {
    return rawCurp.trim().toUpperCase().slice(0, 18);
  }

  const stamp = Date.now().toString().slice(-10);
  const random = Math.floor(Math.random() * 99999)
    .toString()
    .padStart(5, '0');

  return `TMP${stamp}${random}`.slice(0, 18).padEnd(18, 'X').toUpperCase();
}

export const registrarUsuario = async (req: Request, res: Response) => {
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
    contrasena,
    estado,
  } = req.body;

  if (!nombre || !id_rol || !correo || !contrasena) {
    return res.status(400).json({ message: 'Faltan datos obligatorios' });
  }

  const idRolNumber = Number(id_rol);
  if (!VALID_ROLE_IDS.includes(idRolNumber)) {
    return res.status(400).json({ message: 'Rol no válido' });
  }

  const nombreSanitizado = String(nombre).trim();
  const correoSanitizado = String(correo).trim().toLowerCase();
  const curpSanitizada = buildDefaultCurp(curp);
  const fechaNacimientoSanitizada =
    typeof fecha_nacimiento === 'string' && fecha_nacimiento.trim()
      ? fecha_nacimiento
      : '2000-01-01';

  const payloadUsuario = {
    id_rol: idRolNumber,
    nombre: nombreSanitizado,
    apellido_paterno:
      typeof apellido_paterno === 'string' && apellido_paterno.trim()
        ? apellido_paterno.trim()
        : 'Pendiente',
    apellido_materno:
      typeof apellido_materno === 'string' && apellido_materno.trim()
        ? apellido_materno.trim()
        : 'Pendiente',
    correo: correoSanitizado,
    contrasena: String(contrasena),
    telefono: sanitizePhone(telefono),
    fecha_nacimiento: fechaNacimientoSanitizada,
    curp: curpSanitizada,
    genero: typeof genero === 'string' && genero.trim() ? genero.trim() : 'No especificado',
    estado: normalizeStatus(estado),
  };

  const t = await sequelize.transaction();
  let committed = false;

  try {
    const rolExiste = await Role.findByPk(idRolNumber, { transaction: t });
    if (!rolExiste) {
      await t.rollback();
      return res.status(400).json({
        message: `El rol con id ${idRolNumber} no existe. Verifica la tabla roles o ejecuta el seeder.`,
      });
    }

    const correoExiste = await Usuario.findOne({
      where: { correo: correoSanitizado },
      transaction: t,
    });

    if (correoExiste) {
      await t.rollback();
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    const curpExiste = await Usuario.findOne({
      where: { curp: curpSanitizada },
      transaction: t,
    });

    if (curpExiste) {
      await t.rollback();
      return res.status(400).json({ message: 'La CURP ya está registrada' });
    }

    const usuarioNuevo = await Usuario.create(payloadUsuario, { transaction: t });

    if (idRolNumber === 4) {
      await Asistente.create(
        {
          id_usuario: usuarioNuevo.id_usuario,
        },
        { transaction: t },
      );
    }

    await t.commit();
    committed = true;

    return res.status(201).json({
      message: 'Usuario creado correctamente',
      usuario: {
        id: usuarioNuevo.id_usuario,
        nombre: usuarioNuevo.nombre,
        correo: usuarioNuevo.correo,
        id_rol: usuarioNuevo.id_rol,
        estado: usuarioNuevo.estado,
      },
    });
  } catch (error) {
    if (!committed) {
      await t.rollback();
    }

    console.log('Error al registrar usuario: ', error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
};

export const listarUsuarios = async (req: Request, res: Response) => {
  const pagina = Number(req.query.pagina) || 1;
  const limitQuery = Number(req.query.limit) || 10;
  const limit = Math.max(1, Math.min(limitQuery, 500));
  const estadoFiltro = req.query.estado as string;
  const estadosValidos = ['activo', 'eliminado', 'todos'];
  const rawRol = req.query.id_rol;

  if (estadoFiltro && !estadosValidos.includes(estadoFiltro)) {
    return res.status(400).json({ message: 'Estado no válido' });
  }

  const rolFiltro = rawRol ? Number(rawRol) : null;
  if (rawRol && isNaN(rolFiltro as number)) {
    return res.status(400).json({ message: 'ID de rol inválido' });
  }

  try {
    const offset = pagina * limit - limit;
    const whereFiltro: Record<string, unknown> = {};

    if (estadoFiltro && estadoFiltro !== 'todos') {
      whereFiltro.estado = estadoFiltro;
    } else if (!estadoFiltro) {
      whereFiltro.estado = 'activo';
    }

    if (rolFiltro) {
      whereFiltro.id_rol = rolFiltro;
    }

    const { count: total, rows: usuarios } = await Usuario.findAndCountAll({
      limit,
      offset,
      distinct: true,
      where: whereFiltro,
      attributes: {
        exclude: ['contrasena'],
      },
      include: [{ model: Role, as: 'role' }],
    });

    res.set('Cache-Control', 'no-store');

    return res.json({
      total,
      pagina,
      totalPaginas: Math.ceil(total / limit),
      usuarios,
      limit,
    });
  } catch (error) {
    console.log('Error al listar usuarios: ', error);
    return res.status(500).json({ message: 'Error del Servidor' });
  }
};

export const obtenerUsuario = async (req: Request, res: Response) => {
  try {
    const id_usuario = Number(req.params.id);

    if (isNaN(id_usuario)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const usuario = await Usuario.findByPk(id_usuario, {
      attributes: { exclude: ['contrasena'] },
      include: [{ model: Role, as: 'role' }],
    });

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    return res.status(200).json({
      message: 'Usuario encontrado',
      usuario,
    });
  } catch (error) {
    console.log('Error al obtener usuario: ', error);
    return res.status(500).json({ message: 'Error del Servidor' });
  }
};

export const actualizarUsuario = async (req: Request, res: Response) => {
  const id_usuario = Number(req.params.id);
  if (isNaN(id_usuario)) {
    return res.status(400).json({ message: 'ID inválido' });
  }

  const { nombre, apellido_materno, apellido_paterno, telefono, correo, id_rol, estado } = req.body;
  const payload: Record<string, unknown> = {};

  if (typeof nombre === 'string' && nombre.trim()) payload.nombre = nombre.trim();
  if (typeof apellido_paterno === 'string' && apellido_paterno.trim()) {
    payload.apellido_paterno = apellido_paterno.trim();
  }
  if (typeof apellido_materno === 'string' && apellido_materno.trim()) {
    payload.apellido_materno = apellido_materno.trim();
  }
  if (typeof telefono === 'string' && telefono.trim()) payload.telefono = sanitizePhone(telefono);
  if (typeof correo === 'string' && correo.trim()) payload.correo = correo.trim().toLowerCase();

  if (typeof id_rol !== 'undefined') {
    const idRolNumber = Number(id_rol);
    if (!VALID_ROLE_IDS.includes(idRolNumber)) {
      return res.status(400).json({ message: 'Rol no válido' });
    }
    payload.id_rol = idRolNumber;
  }

  if (typeof estado === 'string') {
    payload.estado = normalizeStatus(estado);
  }

  if (Object.keys(payload).length === 0) {
    return res.status(400).json({ message: 'No se enviaron campos para actualizar' });
  }

  const t = await sequelize.transaction();
  let committed = false;

  try {
    const usuario = await Usuario.findByPk(id_usuario, { transaction: t });
    if (!usuario) {
      await t.rollback();
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (typeof payload.id_rol === 'number') {
      const rolExiste = await Role.findByPk(payload.id_rol, { transaction: t });
      if (!rolExiste) {
        await t.rollback();
        return res.status(400).json({
          message: `El rol con id ${payload.id_rol} no existe.`,
        });
      }
    }

    if (typeof payload.correo === 'string') {
      const correoDuplicado = await Usuario.findOne({
        where: { correo: payload.correo },
        transaction: t,
      });

      if (correoDuplicado && correoDuplicado.id_usuario !== id_usuario) {
        await t.rollback();
        return res.status(400).json({ message: 'El correo ya está registrado' });
      }
    }

    await usuario.update(payload, { transaction: t });

    const usuarioActualizado = await Usuario.findByPk(id_usuario, {
      attributes: { exclude: ['contrasena'] },
      include: [{ model: Role, as: 'role' }],
      transaction: t,
    });

    await t.commit();
    committed = true;

    return res.status(200).json({
      message: 'Perfil del usuario actualizado',
      usuario: usuarioActualizado,
    });
  } catch (error: any) {
    if (!committed) {
      await t.rollback();
    }

    console.log('Error al editar usuario: ', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'El correo electrónico ya está registrado' });
    }

    return res.status(500).json({ message: 'Error del servidor' });
  }
};

export const eliminarUsuario = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ message: 'ID inválido' });
  }

  try {
    const usuario = await Usuario.findByPk(id, {
      attributes: { exclude: ['contrasena'] },
    });

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    await usuario.update({ estado: 'eliminado' });

    return res.status(200).json({
      message: 'Usuario eliminado',
      usuario,
    });
  } catch (error) {
    console.log('Error al eliminar Usuario: ', error);
    return res.status(500).json({ message: 'Error del Servidor' });
  }
};

export const activarUsuario = async (req: Request, res: Response) => {
  const id_usuario = Number(req.params.id);

  if (isNaN(id_usuario)) {
    return res.status(400).json({ message: 'ID inválido' });
  }

  try {
    const usuario = await Usuario.findOne({
      where: {
        id_usuario,
        estado: 'eliminado',
      },
    });

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado o ya se encuentra activo' });
    }

    await usuario.update({ estado: 'activo' });

    return res.status(200).json({ message: 'Usuario activado' });
  } catch (error) {
    console.log('Error al activar usuario: ', error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
};

export const obtenerPerfilUsuario = async (req: CustomRequest, res: Response) => {
  try {
    const id_usuario = req.userData?.id;
    if (!id_usuario) {
      return res.status(401).json({ message: 'Sesión no válida' });
    }

    const perfil = await Usuario.findOne({
      where: { id_usuario },
      attributes: { exclude: ['contrasena'] },
    });

    if (!perfil) {
      return res.status(404).json({ message: 'Perfil no encontrado' });
    }

    return res.json(perfil);
  } catch (error) {
    console.log('Error al obtener perfil del usuario: ', error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
};
