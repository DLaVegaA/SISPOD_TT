import { Request, Response, NextFunction } from "express";
import { AppError } from "../helpers/AppError";
import {
    crearOdontogramaService,
    actualizarOdontogramaService,
    obtenerOdontogramaPorExpedienteService
} from '../services/odontogramaService'
import { message } from "telegraf/filters";

export const crearOdontograma = async(req:Request, res:Response, next:NextFunction) =>{
    const {datos_odontograma} = req.body
    const id_expediente = Number(req.body.id_expediente);


    try {
        if(!id_expediente){
            throw new AppError('El número de expediente es necesario',400);
        }

        if(Number.isNaN(id_expediente)){
            throw new AppError('El número de expediente es inválido',400);
        }

        if(!Array.isArray(datos_odontograma)){
            throw new AppError('Los datos del odontograma son inválidos',400);
        }

        const odontograma = await crearOdontogramaService(id_expediente,datos_odontograma);
        return res.json({
            message:'Odontograma creado',
            odontograma
        })
    } catch (error) {
        next(error)
    }
}

export const actualizarOdontograma = async(req:Request, res:Response, next:NextFunction) =>{
    const id_odontograma = Number(req.params.id_odontograma);
    const {datos_odontograma} = req.body

    try{
        if(Number.isNaN(id_odontograma)){
            throw new AppError('El número de expediente es inválido',400);
        }

        if(!Array.isArray(datos_odontograma)){
            throw new AppError('Los datos del odontograma son inválidos',400);
        }

        const odontograma = await actualizarOdontogramaService(id_odontograma, datos_odontograma);
        return res.json({
            message:'Odontograma actualizado',
            odontograma
        });
    }catch(error){
        next(error);
    }
}

export const obtenerOdontogramaPorExpediente = async(req:Request, res:Response, next:NextFunction) =>{
    const id_expediente = Number(req.params.id_expediente);

    try{
        if(Number.isNaN(id_expediente)){
            throw new AppError('El número de expediente es inválido',400);
        }

        const odontograma = await obtenerOdontogramaPorExpedienteService(id_expediente);

        return res.json({
            message:'Odontograma encontrado',
            odontograma
        })

    }catch(error){
        next(error)
    }
}