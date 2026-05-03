import { Response, NextFunction, Request} from 'express';
import { Cita, Dentista, Expediente, Usuario, Paciente, TipoCita, Consentimiento } from '../models/index';
import { CustomRequest } from '../middleware/authMiddleware';
import { AppError } from '../helpers/AppError';
import {crearConsentimientoService, eliminarConsentimientoService, obtenerConsentimientoConSAS} from '../services/consentimientoService';

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

export const eliminarConsentimiento = async(req:Request, res:Response, next:NextFunction) =>{
    const {id_cita} = req.params;

    if(isNaN(Number(id_cita))){
        throw new AppError('Cita inválida',400);
    }

    try{
        await eliminarConsentimientoService(Number(id_cita));
        return res.json({
            message:'Consentimiento eliminado'
        })
    }catch(error){
        next(error)
    }
}

export const obtenerTodosConsentimientos = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const consentimientos = await Consentimiento.findAll({
            include: [
                {
                    model: Cita,
                    as: 'cita', // Basado en Consentimiento.belongsTo(Cita, { as: 'cita' })
                    include: [
                        {
                            model: Paciente,
                            as: 'paciente', // Basado en Cita.belongsTo(Paciente, { as: 'paciente' })
                            include: [
                                {
                                    model: Usuario,
                                    as: 'usuario',
                                    // attributes: ['nombre', 'apellidos'] // Opcional: para no traer todo el usuario
                                },
                                {
                                    model: Expediente,
                                    as: 'expediente',
                                    // attributes: ['id_expediente'] // Opcional: Ajusta al nombre de tu columna
                                }
                            ]
                        },
                        {
                            model: TipoCita,
                            as: 'tipo', // Basado en Cita.belongsTo(TipoCita, { as: 'tipo' })
                            // attributes: ['nombre'] // Ajusta al nombre de tu columna en TipoCita
                        }
                    ]
                }
            ]
        });

        // Retornamos el JSON con toda la estructura anidada
        return res.json(consentimientos);
    } catch (error) {
        next(error);
    }
}