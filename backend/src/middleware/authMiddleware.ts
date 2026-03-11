import { Request, Response, NextFunction } from "express";
import jwt, {JwtPayload} from 'jsonwebtoken';

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