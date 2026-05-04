import { Request, Response } from 'express';
import { Usuario, Token, Paciente, Direccion } from '../models/index';
import { generarToken } from '../helpers/generarToken';
import transporter from '../config/mailer';
import jwt from 'jsonwebtoken';
import { verificarTokenReset } from '../services/authService';
import { sequelize } from '../config/database';
import { Op } from 'sequelize';
//import { message } from 'telegraf/filters';

export const login = async (req: Request, res: Response) => {
  try {
    const { correo, password } = req.body;
    if (!correo || !password) {
      return res.status(400).json({ message: 'Datos incompletos' });
    }

    const usuario = await Usuario.findOne({ where: { correo } });

    if (!usuario) {
      return res.status(404).json({ message: 'Credenciales Inválidas' });
    }

    if (usuario.estado !== 'activo') {
      return res.status(403).json({ message: 'La cuenta no está activa' });
    }

    const contraValida = await usuario.validarPassword(password);

    if (!contraValida) {
      return res.status(401).json({ message: 'Credenciales Inválidas' });
    }
    console.log(req.body);
    console.log(contraValida);
    const token = jwt.sign(
      {
        id: usuario.id_usuario,
        id_rol: usuario.id_rol,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: '2h' },
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: false, //Investigar si al hostear se cambia a true
      sameSite: 'lax', //Investigar
      maxAge: 2 * 60 * 60 * 1000,
    });

    return res.json({
      message: 'Login exitoso',
    });
  } catch (error) {
    console.log('Error login: ', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const cerrarSesion = async (req: Request, res: Response) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
    });

    return res.json({
      message: 'Sesión cerrada correctamente',
    });
  } catch (error) {
    console.log('Error al cerrar sesión:', error);
    return res.status(500).json({
      message: 'Error al cerrar sesión',
    });
  }
};

/**
 * POST  /auth/activar-cuenta/:token
 * Cambia el estado del pacienta a activo, mediante el token enviado por correo despues de crearse un paciente
 */
/* export const activarCuenta = async (req: Request, res: Response) => {
  try {
    const token = req.params.token;
    const { password } = req.body;

    const tokenBD = await Token.findOne({
      where: {
        token,
        tipo: 'activacion',
      },
    });

    if (!tokenBD) {
      return res.status(400).json({
        message: 'Token invalido',
      });
      //Hcaer funcion para renviar el correo con un nuevo token
    }

    console.log(
      'Fecha de expiracion del token ',
      tokenBD.expira_en,
      ' Fecha a comparar ',
      new Date(),
    );
    if (tokenBD.expira_en < new Date()) {
      return res.status(400).json({
        message: 'Token expirado',
      });
      //Hacer funcion para reenviar codigo por que expiro
    }

    const usuario = await Usuario.findByPk(tokenBD.id_usuario);

    if (!usuario) {
      return res.status(404).json({
        message: 'Usuario no encontrado',
      });
    }

    await usuario.update({
      contrasena: password,
      estado: 'activo',
    });
    await tokenBD.destroy();

    return res.json({
      message: 'Cuenta activa con exito',
    });
  } catch (error) {
    console.log('Error al activar cuenta: ', error);
    return res.status(500).json({
      message: 'Error del servidor',
    });
  }
}; */

export const activarCuenta = async (req: Request, res: Response) => {
  const { token } = req.params; // El token viene en la URL: ?token=...
  const {
    contrasena,
    telefono,
    genero,
    calle,
    num_ext,
    num_int,
    colonia,
    municipio,
    estado,
    codigo_postal,
  } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'Token de activación no proporcionado' });
  }

  // RN7: Validar que envíe todos los datos faltantes
  if (!contrasena || !telefono || !genero || !calle || !num_ext || !colonia || !municipio || !estado || !codigo_postal) {
    return res.status(400).json({ message: 'Faltan datos obligatorios para completar el perfil' });
  }

  // RN4: Validación estricta del teléfono
  const telefonoRegex = /^[0-9]{10}$/;
  if (!telefonoRegex.test(telefono)) {
    return res.status(400).json({ message: 'El teléfono debe contener exactamente 10 números' });
  }

  // RN16: Validación estricta de la nueva contraseña
  // Mínimo 12 caracteres, al menos una mayúscula, una minúscula, un número y un carácter especial
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-={}[\]|;:,.<>?]).{12,}$/;
  if (!passwordRegex.test(contrasena)) {
    return res.status(400).json({ 
      message: 'La contraseña debe tener al menos 12 caracteres, incluyendo mayúsculas, minúsculas, números y símbolos especiales.' 
    });
  }

  const t = await sequelize.transaction();
  let committed = false;

  try {
    // 1. Verificar que el token existe, es de activación y no ha expirado
    const tokenRegistro = await Token.findOne({
      where: {
        token: token as string,
        tipo: 'activacion'
        // Puedes agregar la validación de expiración si la configuraste en tu DB:
        // expira_en: { [Op.gt]: new Date() } 
      },
      transaction: t
    });

    if (!tokenRegistro) {
      await t.rollback();
      return res.status(400).json({ message: 'Token inválido o expirado' });
    }

    // 2. Buscar al usuario asociado al token
    const usuario = await Usuario.findByPk(tokenRegistro.id_usuario, { transaction: t });
    if (!usuario) {
      await t.rollback();
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (usuario.estado === 'activo') {
      await t.rollback();
      return res.status(400).json({ message: 'Esta cuenta ya ha sido activada previamente' });
    }

    // 3. Buscar el paciente para actualizar su dirección
    const paciente = await Paciente.findOne({
      where: { id_usuario: usuario.id_usuario },
      transaction: t
    });

    if (!paciente) {
      await t.rollback();
      return res.status(404).json({ message: 'Perfil de paciente no encontrado' });
    }

    // 4. Actualizar Usuario (Estado, teléfono, género y CONTRASEÑA)
    // Nota: Al usar usuario.update(), Sequelize ejecutará el hook "beforeUpdate" 
    // definido en tu Usuario.ts, el cual encriptará la nueva contraseña automáticamente.
    await usuario.update({
      telefono,
      genero,
      contrasena, // Aquí entra en texto plano y el modelo lo hashea
      estado: 'activo'
    }, { transaction: t });

    // 5. Actualizar Dirección del paciente
    await Direccion.update({
      calle,
      num_ext,
      num_int: num_int || null,
      colonia,
      municipio,
      estado,
      codigo_postal
    }, {
      where: { id_paciente: paciente.id_paciente },
      transaction: t
    });

    // 6. Eliminar el token para que no se pueda volver a usar
    await tokenRegistro.destroy({ transaction: t });

    await t.commit();
    committed = true;

    return res.status(200).json({
      message: 'Cuenta activada y perfil completado con éxito. Ya puedes iniciar sesión.'
    });

  } catch (error) {
    if (!committed) await t.rollback();
    console.log('Error al activar la cuenta: ', error);
    return res.status(500).json({ message: 'Error del servidor al activar la cuenta' });
  }
};

export const olvidoContrasena = async (req: Request, res: Response) => {
  try {
    const { correo } = req.body;

    if (!correo) {
      return res.status(400).json({ message: 'Ingresa un correo' });
    }

    const usuarioExiste = await Usuario.findOne({ where: { correo } });

    if (!usuarioExiste) {
      return res.status(400).json({ message: 'Usuario no encontrado' });
    }

    const tokenFinal = generarToken();
    const expira = new Date();
    expira.setHours(expira.getHours() + 1);

    const tokenActivo = await Token.findOne({
      where: {
        id_usuario: usuarioExiste.id_usuario,
        tipo: 'recuperacion',
      },
    });

    if (tokenActivo) {
      await tokenActivo.update({
        token: tokenFinal,
        expira_en: expira,
      });
    } else {
      await Token.create({
        id_usuario: usuarioExiste.id_usuario,
        token: tokenFinal,
        tipo: 'recuperacion',
        expira_en: expira,
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    await transporter.sendMail({
      to: usuarioExiste.correo,
      subject: 'Olvidaste tu contraseña',
      template: 'recuperarPassword',
      context: {
        nombre: usuarioExiste.nombre,
        link: `${frontendUrl}/restablecer-contrasena/${tokenFinal}`,
        year: new Date().getFullYear(),
      },
    } as any);

    return res.status(200).json({ message: 'Se envio un correo con las instrucciones' });
  } catch (error) {
    console.log('Error en olvido contraseña: ', error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
};

export const validarTokenReset = async (req: Request, res: Response) => {
  const token = req.params.token as string;
  if (!token) {
    return res.status(400).json({
      message: 'Token requerido',
    });
  }

  try {
    const registro = await verificarTokenReset(token);
    return res.status(200).json({
      valido: true,
    });
  } catch (error: any) {
    console.log('Error al validar token de contraseña: ', error);
    if (error.message === 'Token_No_existe') {
      console.log('Error token no existe: ', error);
      return res.status(400).json({
        valido: false,
        message: 'El token no existe',
      });
    }
    return res.status(500).json({ message: 'Error del servidor' });
  }
};
//Hcaer funcion que valide el token antes de que llegar al formulario
export const resetPassword = async (req: Request, res: Response) => {
  const tokenBD = (req as any).tokenData;
  const { contrasena } = req.body;

  try {
    if (!contrasena) {
      return res.status(400).json({ message: 'La contraseña es obligatoria' });
    }

    /* // RN16: Validación estricta de la nueva contraseña en la recuperación
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-={}[\]|;:,.<>?]).{12,}$/;
    if (!passwordRegex.test(contrasena)) {
      return res.status(400).json({ 
        message: 'La contraseña debe tener al menos 12 caracteres, incluyendo mayúsculas, minúsculas, números y símbolos especiales.' 
      });
    } */

    const usuario = await Usuario.findByPk(tokenBD.id_usuario);

    if (!usuario) {
      return res.status(404).json({
        message: 'Usuario no encontrado',
      });
    }

    await usuario.update({
      contrasena,
    });

    await tokenBD.destroy();

    return res.json({
      message: 'Contraseña actualizada correctamente',
    });
  } catch (error) {
    console.log('Error al resetear contraseña: ', error);
    return res.status(500).json({
      message: 'Error del servidor',
    });
  }
};
