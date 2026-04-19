import { Request, Response, NextFunction } from "express";
import jwt, {JwtPayload} from 'jsonwebtoken';
import {verificarTokenReset} from '../services/authService';
interface TokenPayload {
    id: number;
    id_rol:number;
}

export interface CustomRequest extends Request{
    userData?:TokenPayload,
}

export const verificarToken = (req: CustomRequest, res:Response, next:NextFunction) =>{
    const token = req.cookies.token;
    
    if(!token){
        return res.status(401).json({message:"No autorizado"});
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET as string
        ) as TokenPayload;

        req.userData = decoded;
        console.log(decoded)
        next();
        
    } catch (error) {
        console.log('Error al verificar JWT: ', error);
        return res.status(401).json({
            messaage:'Token inválido o expirado'
        });
    }
}

export const validarTokenResetMiddleware =async (req:Request, res:Response, next:NextFunction) =>{
    const token = req.params.token as string;
    if(!token){
        return res.status(400).json({message:'Token requerido'});
    }

    try {
        const registro=await verificarTokenReset(token);
        (req as any).tokenData =registro;
        next();
    } catch (error:any) {
        console.log('Error al validar token middleware: ', error);
        if(error.message === 'Token_No_existe'){
            console.log('Error token no existe: ', error);
            return res.status(400).json({
                valido:false,
                message:'El token no existe'
            });
        }
        return res.status(500).json({message:'Error del servidor'});
    }
}