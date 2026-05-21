import { Response } from 'express';
import { Cita, Dentista } from '../models/index';
import { CustomRequest } from '../middleware/authMiddleware';
import {
  obtenerDisponibilidad,
  crearCita as CrearCitaService,
  cancelarCita as CancelarCitaService,
  listarCitas as ListarCitasService,
  editarCita as EditarCitaService,
} from '../services/citaService';
import { AppError } from '../helpers/AppError';
 
// 'Atendida' agregado para que el filtro del modal de seguimiento funcione
const ESTADOS_VALIDOS = ['Pendiente', 'Confirmada', 'Cancelada', 'Atendida'];
 
export type FiltrosCita = {
  estado?:         string;
  desde?:          Date;
  hasta?:          Date;
  user?:           any;
  nombre?:         string;
  sinBitacora?:    boolean;
  sinSeguimiento?: boolean;  // ← excluye citas que ya tienen seguimiento activo
  pasadas?:         boolean;  // ← solo citas cuya fecha_hora_fin ya pasó
};
 
export const listarDisponibilidad = async (req: CustomRequest, res: Response) => {
  try {
    const { fecha, tipo_cita } = req.query;
    let id_dentista;
 
    if (req.userData?.id_rol === 2) {
      const dentista = await Dentista.findOne({
        where: { id_usuario: req.userData?.id },
        attributes: ['id_dentista'],
      });
      if (!dentista) return res.status(404).json({ message: 'Dentista no encontrado' });
      id_dentista = dentista.id_dentista;
    } else {
      id_dentista = req.query.id_dentista;
    }
 
    if (!fecha || !id_dentista || !tipo_cita) {
      return res.status(400).json({ message: 'Faltan datos' });
    }
 
    const tipo = req.userData?.id_rol === 3 ? 1 : Number(tipo_cita);
    const disponibles = await obtenerDisponibilidad(fecha as string, Number(id_dentista), tipo);
 
    return res.json({
      disponibles,
      message: disponibles.length === 0 ? 'No hay citas disponibles' : undefined,
    });
  } catch (error: any) {
    if (error instanceof AppError) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: 'Error del servidor' });
  }
};
 
export const crearCita = async (req: CustomRequest, res: Response) => {
  try {
    if (!req.userData) return res.status(401).json({ message: 'No autenticado' });
    if (!req.body.fecha_hora_inicio || !req.body.tipo_cita) {
      return res.status(400).json({ message: 'Datos incompletos' });
    }
    const nuevaCita = await CrearCitaService(req.body, req.userData);
    return res.status(201).json({ message: 'Cita creada correctamente', cita: nuevaCita });
  } catch (error: any) {
    if (error instanceof AppError) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: 'Error del servidor' });
  }
};
 
export const editarCita = async (req: CustomRequest, res: Response) => {
  const { fecha_hora_inicio } = req.body;
  const id = Number(req.params.id);
  if (isNaN(id) || !fecha_hora_inicio) {
    return res.status(400).json({ message: 'Datos inválidos o incompletos' });
  }
  try {
    const cita = await EditarCitaService(req.body, req.userData, id);
    return res.json({ message:'Cita actualizada correctamente', cita});
  } catch (error: any) {
    if (error instanceof AppError) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: 'Error del servidor' });
  }
};
 
export const cancelarCita = async (req: CustomRequest, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: 'ID inválido' });
  try {
    const canceladaCita = await CancelarCitaService(id, req.userData);
    return res.json({ message: 'Cita cancelada correctamente', canceladaCita });
  } catch (error: any) {
    if (error instanceof AppError) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: 'Error del servidor' });
  }
};
 
export const listarCitas = async (req: CustomRequest, res: Response) => {
  try {
    const { estado, desde, hasta, nombre } = req.query;
    const pagina     = Number(req.query.pagina) || 1;
    const limitQuery = Number(req.query.limit) || 10;
    const limit      = Math.max(1, Math.min(limitQuery, 500));
    const offset     = (pagina - 1) * limit;
 
    const filtros: FiltrosCita = {};
 
    if (typeof estado === 'string' && ESTADOS_VALIDOS.includes(estado)) {
      filtros.estado = estado;
    }
    if (desde && hasta) {
      filtros.desde = new Date(desde as string);
      filtros.hasta = new Date(hasta as string);
    }
    if (nombre) filtros.nombre = nombre as string;
 
    filtros.user = req.userData;
 
    if (req.query.sin_bitacora === 'true')   filtros.sinBitacora    = true;
    if (req.query.sinSeguimiento === 'true') filtros.sinSeguimiento = true;
    if (req.query.pasadas === 'true')         filtros.pasadas          = true;
 
    const result = await ListarCitasService(filtros, limit, offset);
 
    return res.json({
      total:        result.total,
      citas:        result.citas,
      totalPaginas: result.totalPaginas,
      limit:        result.limitResponse,
    });
  } catch (error: any) {
    if (error instanceof AppError) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: 'Error del servidor' });
  }
};
 
export const confirmarCita = async (req: CustomRequest, res: Response) => {
  const id_cita = Number(req.params.id);
  if (isNaN(id_cita)) return res.status(400).json({ message: 'ID inválido' });
  try {
    const cita = await Cita.findByPk(id_cita);
    if (!cita) return res.status(404).json({ message: 'Cita no encontrada' });
    if(cita.estado === 'Cancelada') return res.status(400).json({ message: 'La cita está cancelada'});
    if(cita.estado ==='Confirmada') return res.status(400).json({ message: 'La cita ya está confirmada'});
    if(!cita.recordatorio_enviado) return res.status(400).json({ message: 'La confirmación aún no esta disponible'});
    const ahora = new Date();
    if(cita.fecha_hora_inicio < ahora){
      return res.status(400).json({
        message:'La cita ya pasó'
      });
    }
    await cita.update({ estado: 'Confirmada' });
    return res.json({ message: 'Cita confirmada' });
  } catch (error) {
    return res.status(500).json({ message: 'Error del servidor' });
  }
};