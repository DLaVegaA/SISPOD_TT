import {Response, NextFunction } from "express";
import { CustomRequest } from '../middleware/authMiddleware';
import {AppError} from '../helpers/AppError'

export const errorHandler = (err:any, req:CustomRequest, res:Response, next:NextFunction) =>{
    console.error('Error: ', err);
    if(err instanceof AppError){
      return res.status(err.status).json({ message: err.message });
    }

    if (err.name === 'MulterError') {
      return res.status(400).json({
        message: err.message
      });
    }
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        ok: false,
        message: 'La cita ya tiene un consentimiento'
      });
    }
    return res.status(500).json({
        message: 'Error interno del servidor'
    });
}
  
