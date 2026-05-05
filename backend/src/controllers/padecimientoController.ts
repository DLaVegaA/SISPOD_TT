import { Request, Response,NextFunction} from 'express';
import {obtenerPadecimientosService} from '../services/padecimientoService'
import { AppError } from '../helpers/AppError';

export const obtenerPadecimientos = async(req:Request, res:Response, next:NextFunction) =>{
    const {categoria} = req.query
    if(!categoria){
        throw new AppError('Selecciona una categoría', 400)
    }
    try {
        const padecimientos = await obtenerPadecimientosService(categoria);
        res.json({
            message:'Lista de padecimientos',
            padecimientos
        })
    } catch (error) {
        next(error)
    }
}
