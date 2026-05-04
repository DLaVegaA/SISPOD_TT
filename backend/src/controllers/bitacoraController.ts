import {Request, Response, NextFunction} from 'express';
import {CustomRequest} from '../middleware/authMiddleware'
import{
    crearBitacoraService,
    editarBitacoraService
} from '../services/bitacoraService'
import { AppError } from '../helpers/AppError';
import { NUMBER } from 'sequelize';
import { message } from 'telegraf/filters';

export const crearBitacora = async(req:CustomRequest, res:Response, next:NextFunction) =>{
    if(!req.userData ){
        throw new AppError('No autenticado',401);
    }
    if(!req.body.id_cita){
        throw new AppError('Datos incomplentos',400);
    }

    if(isNaN(req.body.id_cita)){
        throw new AppError('Cita inválida',400)
    }
    
    if(!req.body.descripcion){
        throw new AppError('Descripción obligatoria',400);
    }

    if (req.body.descripcion && typeof req.body.descripcion !== 'string'){
        throw new AppError('Descripción obligatoria',400);
    }

    try {
        const nuevaBitacora = await crearBitacoraService(req.body, req.userData);
        return res.json({
            message: 'Bitácora creada con éxito',
            nuevaBitacora
        });
    } catch (error) {
        next(error);
    }
}


export const editarBitacora = async(req:Request, res:Response, next:NextFunction)=>{
    const id_bitacora = Number(req.params.id);

    if(!id_bitacora){
        throw new AppError('Datos obligatorios',400);
    }
    if(isNaN(id_bitacora)){
        throw new AppError('Bitácora inválida',400)
    }

    if(!req.body.descripcion){
        throw new AppError('Descripción obligatoria',400);
    }

    if (req.body.descripcion && typeof req.body.descripcion !== 'string'){
        throw new AppError('Descripción obligatoria',400);
    }

    try{
        const bitacoraEditada = await editarBitacoraService(req.body,id_bitacora);

        return res.json({
            message:'Bitácora editada con éxito',
            bitacoraEditada
        })
    }catch(error){
        next(error)
    }
}