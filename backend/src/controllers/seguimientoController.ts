import {Request, Response, NextFunction } from 'express';
import { AppError } from '../helpers/AppError';
import {crearSeguimientoService} from '../services/seguimientoService'
import { message } from 'telegraf/filters';


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