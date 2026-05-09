import { Request, Response, NextFunction } from "express";
import { AppError } from "../helpers/AppError";
import {
    listarCatalogoProcedimientosService,
    obtenerProcedimientoService
} from '../services/catalogoProcedimientosService';

export const listarCatalogoProcedimientos = async(req:Request, res:Response, next:NextFunction) =>{
    
    try {
        const listaCatalogo = await listarCatalogoProcedimientosService();
    
        return res.json({
            message:'Catálogo de procedimientos',
            listaCatalogo
        })
        
    } catch (error) {
        next(error)
    }
}


export const obtenerProcedimiento = async(req:Request, res:Response, next:NextFunction) =>{

    const id_procedimiento = Number(req.params.id_procedimiento);


    try{
        if(!id_procedimiento){
            throw new AppError('El procedimiento es obligatorio',400);
        }

        if(Number.isNaN(id_procedimiento)){
            throw new AppError('El procedimiento es inválido',400);
        }

        const procedimiento = await obtenerProcedimientoService(id_procedimiento);

        return res.json({
            message:'Procedimiento',
            procedimiento
        })
    }catch(error){
        next(error)
    }
}