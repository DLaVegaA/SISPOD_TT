import { Request, Response, NextFunction } from "express";
import { AppError } from "../helpers/AppError";
import {crearCuestionarioService} from '../services/cuestionarioService';
import { message } from "telegraf/filters";

const TIPO_CUESTIONARIO = ['24h','72h']
export const crearCuestionario = async(req:Request, res:Response, next:NextFunction) =>{
    const {nombre_cuestionario, tipo_cuestionario,  descripcion} = req.body;
    const id_procedimiento = Number(req.body.id_procedimiento);

    try {
        if(!nombre_cuestionario){
            throw new AppError('El nombre del cuestionario es obligatorio',400);
        }

        if(!tipo_cuestionario){
            throw new AppError('El tipo de cuestionario es obligatorio',400);
        }

        if(!id_procedimiento){
            throw new AppError('El procedimiento es obligatorio',400);
        }

        if(Number.isNaN(id_procedimiento)){
            throw new AppError('Procedimiento inválido',400);
        }

        //falta validar los string
        if(typeof tipo_cuestionario !== 'string' || !TIPO_CUESTIONARIO.includes(tipo_cuestionario)){
            throw new AppError('Tipo de cuestionario inválido',400)
        }

        if(typeof nombre_cuestionario !== 'string' || !nombre_cuestionario.trim()){
            throw new AppError('El nombre debe ser texto',400)
        }
        
        if(descripcion && typeof descripcion !== 'string'){
            throw new AppError('La descripcion deccbe ser texto',400)
        }

        const data = {
            nombre_cuestionario,
            tipo_cuestionario,
            descripcion: descripcion || null
        }

        const cuestionario = await crearCuestionarioService(id_procedimiento, data);

        return res.json({
            message: 'Cuestionario creado',
            cuestionario
        });
    } catch (error) {
        next(error)
    }
}