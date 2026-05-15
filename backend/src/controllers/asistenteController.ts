import { Response } from 'express';
import { sequelize } from '../config/database';
import { Asistente, Usuario } from '../models/index';
import { CustomRequest } from '../middleware/authMiddleware';

export const obtenerPerfilAsistente = async (req: CustomRequest, res: Response) => {
  try {
    const id_usuario = req.userData?.id;
    if (!id_usuario) return res.status(401).json({ message: 'Sesión no válida' });

    const perfil = await Asistente.findOne({
      where: { id_usuario },
      include: [{ model: Usuario, as: 'usuario', attributes: { exclude: ['contrasena'] } }],
    });

    if (!perfil) return res.status(404).json({ message: 'Perfil no encontrado' });

    const usuarioData = (perfil.get('usuario') as any).toJSON();
    return res.status(200).json({ ...usuarioData, id_asistente: perfil.id_asistente });
  } catch (error) {
    console.error('Error al obtener perfil del asistente:', error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
};

export const actualizarAsistente = async (req: CustomRequest, res: Response) => {
  const { nombre, apellido_paterno, apellido_materno, telefono, correo } = req.body;

  // apellido_materno es OPCIONAL
  if (!nombre || !apellido_paterno || !telefono || !correo) {
    return res.status(400).json({ message: 'Faltan campos obligatorios' });
  }
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre))
    return res.status(400).json({ message: 'El nombre solo puede contener letras' });
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(apellido_paterno))
    return res.status(400).json({ message: 'El apellido paterno solo puede contener letras' });
  if (apellido_materno && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(apellido_materno))
    return res.status(400).json({ message: 'El apellido materno solo puede contener letras' });
  if (!/^\d{10}$/.test(String(telefono)))
    return res.status(400).json({ message: 'El teléfono debe tener 10 dígitos' });

  const t = await sequelize.transaction();
  try {
    const asistente = await Asistente.findOne({ where: { id_usuario: req.userData?.id }, transaction: t });
    if (!asistente) { await t.rollback(); return res.status(404).json({ message: 'Asistente no encontrado' }); }

    await Usuario.update(
      { nombre, apellido_paterno, apellido_materno: apellido_materno || null, telefono, correo },
      { where: { id_usuario: asistente.id_usuario }, transaction: t },
    );

    await t.commit();
    return res.status(200).json({ message: 'Perfil del asistente actualizado correctamente' });
  } catch (error: any) {
    await t.rollback();
    if (error.name === 'SequelizeUniqueConstraintError')
      return res.status(400).json({ message: 'El correo ya está en uso por otro usuario' });
    return res.status(500).json({ message: 'Error del servidor' });
  }
};