import { NextFunction, Request, Response } from 'express';
import { CustomRequest } from '../middleware/authMiddleware';
import { AppError } from '../helpers/AppError';
import {
  Bitacora,
  Cita,
  Consentimiento,
  Dentista,
  Direccion,
  Expediente,
  Expediente_Padecimientos,
  Odontograma,
  Paciente,
  Padecimiento,
  Usuario,
} from '../models/index';
import {
  crearExpedienteService,
  agregarPadecimientoService,
  actualizarExpedienteService,
  sincronizarPadecimientosService,
  obtenerExpedienteService,
  eliminarPadecimientoService,
  listarExpedientesService,
} from '../services/expedienteService';
import { generarExpedientePDF } from '../utils/generarPdf';

export const crearExpediente = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.body.id_paciente) {
      throw new AppError('El paciente es obligatorio', 400);
    }
    if (isNaN(req.body.id_paciente)) {
      throw new AppError('El paciente es obligatorio', 400);
    }

    if (req.body.observaciones_generales && typeof req.body.observaciones_generales !== 'string') {
      throw new AppError('El paciente es obligatorio', 400);
    }

    const expediente = await crearExpedienteService(req.body, req.userData);
    return res.json({
      message: 'Expediente creado',
      expediente,
    });
  } catch (error) {
    next(error);
  }
};

export const agregarPadecimiento = async (req: Request, res: Response, next: NextFunction) => {
  const id_expediente = Number(req.params.id_expediente);
  const items = Array.isArray(req.body?.padecimientos) ? req.body.padecimientos : [];

  try {
    if (!id_expediente) {
      throw new AppError('El expediente es obligatorio', 400);
    }
    if (isNaN(id_expediente)) {
      throw new AppError('El expediente es obligatorio', 400);
    }

    if (items.length === 0) {
      throw new AppError('Los padecimientos son obligatorios', 400);
    }

    const data = items.map((item: any) => {
      const id_padecimiento = Number(item.id_padecimiento);
      const { tipo_antecedente, nota } = item;

      if (!id_padecimiento || isNaN(id_padecimiento)) {
        throw new AppError('El padecimiento es obligatorio', 400);
      }

      if (tipo_antecedente && typeof tipo_antecedente !== 'string') {
        throw new AppError('El tipo de antecendete debe ser texto', 400);
      }
      if (nota && typeof nota !== 'string') {
        throw new AppError('La nota debe ser texto', 400);
      }

      return {
        id_padecimiento,
        tipo_antecedente: tipo_antecedente ?? null,
        nota: nota ?? null,
      };
    });

    const result = await agregarPadecimientoService(id_expediente, data);
    return res.status(201).json({
      message: 'Padecimientos agregados correctamente',
      result,
    });
  } catch (error) {
    next(error);
  }
};

export const actualizarExpediente = async (req: Request, res: Response, next: NextFunction) => {
  const id_expediente = Number(req.params.id_expediente);
  const hasPadecimientos = Object.prototype.hasOwnProperty.call(req.body || {}, 'padecimientos');

  try {
    if (!id_expediente) {
      throw new AppError('El expediente es obligatorio', 400);
    }
    if (Number.isNaN(id_expediente)) {
      throw new AppError('El expediente es obligatorio', 400);
    }

    if (hasPadecimientos && !Array.isArray(req.body?.padecimientos)) {
      throw new AppError('Los padecimientos deben ser un arreglo', 400);
    }

    const expediente = await actualizarExpedienteService(id_expediente, req.body);

    let padecimientosResult = null;
    if (hasPadecimientos) {
      const items = Array.isArray(req.body?.padecimientos) ? req.body.padecimientos : [];
      const data = items.map((item: any) => {
        const id_padecimiento = Number(item.id_padecimiento);
        const { tipo_antecedente, nota } = item;

        if (!id_padecimiento || Number.isNaN(id_padecimiento)) {
          throw new AppError('El padecimiento es obligatorio', 400);
        }

        if (tipo_antecedente && typeof tipo_antecedente !== 'string') {
          throw new AppError('El tipo de antecendete debe ser texto', 400);
        }
        if (nota && typeof nota !== 'string') {
          throw new AppError('La nota debe ser texto', 400);
        }

        return {
          id_padecimiento,
          tipo_antecedente: tipo_antecedente ?? null,
          nota: nota ?? null,
        };
      });

      padecimientosResult = await sincronizarPadecimientosService(id_expediente, data);
    }

    return res.json({
      message: 'Expediente actualizado',
      expediente,
      padecimientos: padecimientosResult,
    });
  } catch (error) {
    next(error);
  }
};

export const obtenerExpediente = async (req: Request, res: Response, next: NextFunction) => {
  const id_expediente = Number(req.params.id_expediente);
  try {
    if (Number.isNaN(id_expediente)) {
      throw new AppError('Expediente inválido', 400);
    }

    const expediente = await obtenerExpedienteService(id_expediente);

    if (!expediente) {
      throw new AppError('Expediente no encontrado', 404);
    }

    return res.json({
      message: 'Expediente',
      expediente,
    });
  } catch (error) {
    next(error);
  }
};

export const eliminarPadecimiento = async (req: Request, res: Response, next: NextFunction) => {
  const id_expediente = Number(req.params.id_expediente);
  const id_padecimiento = Number(req.params.id_padecimiento);

  try {
    if (!id_expediente) {
      throw new AppError('El expediente es obligatorio', 400);
    }
    if (Number.isNaN(id_expediente)) {
      throw new AppError('El expediente es obligatorio', 400);
    }

    if (!id_padecimiento) {
      throw new AppError('El padecimiento es obligatorio', 400);
    }
    if (Number.isNaN(id_padecimiento)) {
      throw new AppError('El padecimiento es obligatorio', 400);
    }

    await eliminarPadecimientoService(id_expediente, id_padecimiento);

    return res.json({
      message: 'Se elimino el padecimiento',
    });
  } catch (error) {
    next(error);
  }
};

export const listarExpedientes = async (req: Request, res: Response, next: NextFunction) => {
  const pagina = Number(req.query.pagina) || 1;
  const limitQuery = Number(req.query.limit) || 10;
  const limit = Math.max(1, Math.min(limitQuery, 500));
  const offset = (pagina - 1) * limit;

  try {
    const result = await listarExpedientesService(limit, offset);

    return res.json({
      message: 'Expedientes disponibles',
      expedientes: result.listaExpedientes,
      total: result.total,
      totalPaginas: result.totalPaginas,
      limit: result.limitResponse,
    });
  } catch (error) {
    next(error);
  }
};

export const generarPDF = async (req: Request, res: Response, next: NextFunction) => {
  const id_expediente = Number(req.params.id_expediente);

  try {
    if (!id_expediente || Number.isNaN(id_expediente)) {
      throw new AppError('Expediente invalido', 400);
    }

    await generarExpedientePDF(id_expediente, res, {
      Expediente,
      Paciente,
      Usuario,
      Dentista,
      Direccion,
      ExpedientePadecimiento: Expediente_Padecimientos,
      Padecimiento,
      Odontograma,
      Bitacora,
      Cita,
      Consentimiento,
    });
  } catch (error) {
    next(error);
  }
};
