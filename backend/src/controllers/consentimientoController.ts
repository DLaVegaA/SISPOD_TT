import { Response, NextFunction, Request} from 'express';
import { Cita, Dentista } from '../models/index';
import { CustomRequest } from '../middleware/authMiddleware';
import { AppError } from '../helpers/AppError';
import {crearConsentimientoService, obtenerConsentimientoConSAS} from '../services/consentimientoService';

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

export const verConsentimiento = async(req:Request, res:Response, next:NextFunction)=>{
    const {id_cita} = req.params;
    if(!id_cita){
        throw new AppError('Datos incomplentos',400);
    }
    if(isNaN(Number(id_cita))){
        throw new AppError('Cita inválida',400);
    }
    try {
        const {consentimiento, url} = await obtenerConsentimientoConSAS(Number(id_cita));
    
        return res.json({
            message:'Solo se podrá visualizar durante 10 minutos',
            url
        });
    } catch (error) {
        next(error)
    }
}