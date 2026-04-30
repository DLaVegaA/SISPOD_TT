import { Response, NextFunction} from 'express';
import { Cita, Dentista } from '../models/index';
import { CustomRequest } from '../middleware/authMiddleware';
import { AppError } from '../helpers/AppError';
import {crearConsentimientoService} from '../services/consentimientoService';

export const crearConsentimiento = async(req:CustomRequest, res:Response, next:NextFunction) =>{
    const file = req.file;
    const {id_cita} = req.body;

    if(!file){
        throw new AppError('Archivo requerido', 400);
    }

    if(!id_cita){
        throw new AppError('Datos incomplentos',400);
    }
    if(isNaN(id_cita)){
        throw new AppError('Cita inválida',400);
    }
    
    try {
        const  resultado = await crearConsentimientoService(file,id_cita);
        return res.status(201).json({
            message:'El consentimiento se subió con éxito',
            archivo:resultado
        });
    } catch (error) {
        next(error)      
    }
}