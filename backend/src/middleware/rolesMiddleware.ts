import { Request, Response, NextFunction } from "express";
import { CustomRequest } from "./authMiddleware";


export const permitirRoles = (...rolesPermitidos: number[]) =>{
    return (req:CustomRequest, res:Response, next:NextFunction) =>{
        const rolUsuario = req.userData?.id_rol;
        if(!rolUsuario){
            return res.status(401).json({message:"No autenticado"});
        }

        if(!rolesPermitidos.includes(rolUsuario)){
            return res.status(401).json({message:"No tienes permisos"});
        }

        next();
    }
}