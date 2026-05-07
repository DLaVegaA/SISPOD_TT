import {Request, Response, NextFunction } from 'express';
import { AppError } from '../helpers/AppError';
import {
    crearSeguimientoService,
    listarSeguimientosService
} from '../services/seguimientoService'
import { Seguimiento } from '../models';
const ESTADOS_VALIDOS = ['en curso', 'alerta', 'finalizado']

export const crearSeguimiento = async(req:Request, res:Response, next:NextFunction) =>{
    const id_cita = Number(req.body.id_cita);
    const id_procedimiento = Number(req.body.id_procedimiento);
    const {plan_cuidados,indicaciones_medicas} = req.body

    try {
        if(Number.isNaN(id_cita)){
            throw new AppError('Cita inválida',400)
        }

        if(Number.isNaN(id_procedimiento)){
            throw new AppError('Procedimiento inválido',400)
        }
        if(plan_cuidados && typeof plan_cuidados !== 'string'){
            throw new AppError('El plan de cuidados debe ser texto',400)
        }
        if(indicaciones_medicas && typeof indicaciones_medicas !== 'string'){
            throw new AppError('Las indicaciones médicas deben ser texto',400)
        }

        const data = {
            plan_cuidados,
            indicaciones_medicas
        }

        const seguimiento = await crearSeguimientoService(id_cita, id_procedimiento, data);

        return res.json({
            message:'Seguimiento listo',
            seguimiento
        });
    } catch (error) {
        next(error)
    }
}

export const listarSeguimientos = async(req:Request, res:Response, next:NextFunction) =>{
    const pagina = Number(req.query.pagina) || 1;
    const limitQuery = Number(req.query.limit) || 10;
    const limit = Math.max(1, Math.min(limitQuery, 500));
    const offset = (pagina - 1) * limit;
    const estadoRaw = req.query.estado;

    try {
        if(estadoRaw && typeof estadoRaw !== 'string'){
            throw new AppError('Estado inválido', 400);
        }

        const estado = estadoRaw as string | undefined;
            
        if (estado && !ESTADOS_VALIDOS.includes(estado)) {
            throw new AppError('Estado de la bitácora inválido', 400);
        }

        const result = await listarSeguimientosService(limit, offset, estado);
        return res.json({
            message:'Seguimientos disponibles',
            seguimientos:result.listaSeguimiento,
            total:result.total,
            totalPaginas:result.totalPaginas,
            limit:result.limitResponse
        });
    } catch (error) {
        next(error)
    }

}