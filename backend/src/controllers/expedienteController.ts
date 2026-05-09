import { NextFunction, Request, Response } from "express";
import { CustomRequest } from "../middleware/authMiddleware";
import { AppError } from "../helpers/AppError";
import {
    crearExpedienteService,
    agregarPadecimientoService,
    obtenerExpedienteService,
    eliminarPadecimientoService,
    listarExpedientesService
} from '../services/expedienteService';
import { NUMBER } from "sequelize";

export const crearExpediente = async(req:CustomRequest, res:Response, next: NextFunction) =>{
    try {
        if(!req.body.id_paciente){
            throw new AppError('El paciente es obligatorio',400);
        }
        if(isNaN(req.body.id_paciente)){
            throw new AppError('El paciente es obligatorio',400);
        }

        if(req.body.observaciones_generales && typeof req.body.observaciones_generales !== 'string'){
            throw new AppError('El paciente es obligatorio',400);
        }

        const expediente = await crearExpedienteService(req.body, req.userData);
        return res.json({
            message:'Expediente creado',
            expediente
        })
    } catch (error) {
        next(error);
    }
}


export const agregarPadecimiento = async(req:Request, res:Response, next: NextFunction) =>{
    const id_expediente = Number(req.params.id_expediente);
    const id_padecimiento =Number(req.body.id_padecimiento);
    const {tipo_antecedente,nota} = req.body;
    try {
        if(!id_expediente){
            throw new AppError('El expediente es obligatorio',400);
        }
        if(isNaN(id_expediente)){
            throw new AppError('El expediente es obligatorio',400);
        }

        if(!id_padecimiento){
            throw new AppError('El padecimiento es obligatorio',400)
        }
        if(isNaN(id_padecimiento)){
            throw new AppError('El padecimiento es obligatorio',400);
        }

        if(tipo_antecedente && typeof tipo_antecedente !== 'string'){
            throw new AppError('El tipo de antecendete debe ser texto',400);
        }
        if(nota && typeof nota !== 'string'){
            throw new AppError('La nota debe ser texto',400);
        }
        const data = {
            id_padecimiento,
            tipo_antecedente: tipo_antecedente ?? null,
            nota: nota ?? null
        };

        const result = await agregarPadecimientoService(id_expediente, data);
        return res.status(201).json({
            message: 'Padecimiento agregado correctamente',
            result
        });
        
    } catch (error) {
        next(error)
    }
}


export const obtenerExpediente = async(req:Request, res:Response, next:NextFunction) =>{
    const id_expediente = Number(req.params.id_expediente);
    try{
        if (Number.isNaN(id_expediente)) {
            throw new AppError('Expediente inválido', 400);
        }

        const expediente = await obtenerExpedienteService(id_expediente);

        if (!expediente) {
            throw new AppError('Expediente no encontrado', 404);
        }

        return res.json({
            message:'Expediente',
            expediente
        })
    }catch(error){
        next(error)
    }
}


export const eliminarPadecimiento =async(req:Request, res:Response, next:NextFunction) =>{
    const id_expediente = Number(req.params.id_expediente);
    const id_padecimiento = Number(req.params.id_padecimiento);

    try {
        if(!id_expediente){
            throw new AppError('El expediente es obligatorio',400);
        }
        if(Number.isNaN(id_expediente)){
            throw new AppError('El expediente es obligatorio',400);
        }

        if(!id_padecimiento){
            throw new AppError('El padecimiento es obligatorio',400)
        }
        if(Number.isNaN(id_padecimiento)){
            throw new AppError('El padecimiento es obligatorio',400);
        }

        await eliminarPadecimientoService(id_expediente, id_padecimiento);

        return res.json({
            message:'Se elimino el padecimiento'
        });
    } catch (error) {
        next(error);
    }
}

export const listarExpedientes=async(req:Request, res:Response, next:NextFunction) =>{
    const pagina = Number(req.query.pagina) || 1;
    const limitQuery = Number(req.query.limit) || 10;
    const limit = Math.max(1, Math.min(limitQuery, 500));
    const offset = (pagina - 1) * limit;

    try {
        const result = await listarExpedientesService(limit,offset);

        return res.json({
            message: 'Expedientes disponibles',
            expedientes:result.listaExpedientes,
            total: result.total,
            totalPaginas: result.totalPaginas,
            limit: result.limitResponse,
        })
    } catch (error) {
        next(error)
    }
}