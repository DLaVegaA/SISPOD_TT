import { Request, Response, NextFunction } from 'express';
import { CustomRequest } from '../middleware/authMiddleware';
import {
  crearBitacoraService,
  editarBitacoraService,
  eliminarBitacoraService,
  listarBitacoraService,
  listarBitacorasPorPacienteService,
  obtenerBitacoraService,
  revisarBitacoraService,
} from '../services/bitacoraService';
import { AppError } from '../helpers/AppError';
import { NUMBER } from 'sequelize';
import { message } from 'telegraf/filters';

const ESTADOS_VALIDOS = ['Pendiente', 'Revisado'];
export const crearBitacora = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userData) {
      throw new AppError('No autenticado', 401);
    }
    if (!req.body.id_cita) {
      throw new AppError('Datos incomplentos', 400);
    }

    if (isNaN(req.body.id_cita)) {
      throw new AppError('Cita inválida', 400);
    }

    if (!req.body.descripcion) {
      throw new AppError('Descripción obligatoria', 400);
    }

    if (req.body.descripcion && typeof req.body.descripcion !== 'string') {
      throw new AppError('Descripción obligatoria', 400);
    }
    const nuevaBitacora = await crearBitacoraService(req.body, req.userData);
    return res.json({
      message: 'Bitácora creada con éxito',
      nuevaBitacora,
    });
  } catch (error) {
    next(error);
  }
};

export const editarBitacora = async (req: Request, res: Response, next: NextFunction) => {
  const id_bitacora = Number(req.params.id);

  try {
    if (!id_bitacora) {
      throw new AppError('Datos obligatorios', 400);
    }
    if (isNaN(id_bitacora)) {
      throw new AppError('Bitácora inválida', 400);
    }

    if (!req.body.descripcion) {
      throw new AppError('Descripción obligatoria', 400);
    }

    if (req.body.descripcion && typeof req.body.descripcion !== 'string') {
      throw new AppError('Descripción obligatoria', 400);
    }
    const bitacoraEditada = await editarBitacoraService(req.body, id_bitacora);

    return res.json({
      message: 'Bitácora editada con éxito',
      bitacoraEditada,
    });
  } catch (error) {
    next(error);
  }
};

export const eliminarBitacora = async (req: Request, res: Response, next: NextFunction) => {
  const id_bitacora = Number(req.params.id);

  try {
    if (!id_bitacora) {
      throw new AppError('Datos obligatorios', 400);
    }
    if (isNaN(id_bitacora)) {
      throw new AppError('Bitácora inválida', 400);
    }
    await eliminarBitacoraService(id_bitacora);

    return res.json({
      message: 'Bitácora eliminada',
    });
  } catch (error) {
    next(error);
  }
};

export const listarBitacora = async (req: Request, res: Response, next: NextFunction) => {
  const pagina = Number(req.query.pagina) || 1;
  const limitQuery = Number(req.query.limit) || 10;
  const limit = Math.max(1, Math.min(limitQuery, 500));
  const offset = (pagina - 1) * limit;
  const estadoRaw = req.query.estado;

  try {
    if (estadoRaw && typeof estadoRaw !== 'string') {
      throw new AppError('Estado inválido', 400);
    }

    const estado = estadoRaw as string | undefined;

    if (estado && !ESTADOS_VALIDOS.includes(estado)) {
      throw new AppError('Estado de la bitácora inválido', 400);
    }

    const result = await listarBitacoraService(limit, offset, estado);

    return res.json({
      message: 'Bitácoras disponibles',
      bitacoras: result.listaBitacoras,
      total: result.total,
      totalPaginas: result.totalPaginas,
      limit: result.limitResponse,
    });
  } catch (error) {
    next(error);
  }
};

export const listarBitacorasPorPaciente = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const id_paciente = Number(req.params.id_paciente);
  const pagina = Number(req.query.pagina) || 1;
  const limitQuery = Number(req.query.limit) || 10;
  const limit = Math.max(1, Math.min(limitQuery, 500));
  const offset = (pagina - 1) * limit;
  const estadoRaw = req.query.estado;

  try {
    if (!id_paciente) {
      throw new AppError('Paciente obligatorio', 400);
    }
    if (Number.isNaN(id_paciente)) {
      throw new AppError('Paciente inválido', 400);
    }

    if (estadoRaw && typeof estadoRaw !== 'string') {
      throw new AppError('Estado inválido', 400);
    }

    const estado = estadoRaw as string | undefined;

    if (estado && !ESTADOS_VALIDOS.includes(estado)) {
      throw new AppError('Estado de la bitácora inválido', 400);
    }

    const result = await listarBitacorasPorPacienteService(id_paciente, limit, offset, estado);

    return res.json({
      message: 'Bitácoras del paciente',
      bitacoras: result.listaBitacoras,
      total: result.total,
      totalPaginas: result.totalPaginas,
      limit: result.limitResponse,
    });
  } catch (error) {
    next(error);
  }
};

export const obtenerBitacora = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id_bitacora = Number(req.params.id);
    if (!id_bitacora) {
      throw new AppError('Datos obligatorios', 400);
    }
    if (isNaN(id_bitacora)) {
      throw new AppError('Bitácora inválida', 400);
    }
    const bitacora = await obtenerBitacoraService(id_bitacora);

    res.json({
      message: 'Bitácora encontrada',
      bitacora,
    });
  } catch (error) {
    next(error);
  }
};

export const revisarBitacora = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    await revisarBitacoraService(id);
    return res.json({ message: 'Bitácora marcada como revisada' });
  } catch (error) {
    next(error);
  }
};
