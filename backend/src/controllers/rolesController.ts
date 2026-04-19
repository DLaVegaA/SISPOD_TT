import { Request, Response } from "express";
import {Role} from '../models/index';

export const obtenerRoles = async(req:Request,res:Response) =>{
    try {
        const roles = await Role.findAll({
            attributes:['id_rol', 'nombre_rol']
        });
        return res.json(roles);
    } catch (error) {
        console.log('Error al obtener roles: ', error);
        return res.status(500).json({message:'Error del servidor'});
    }
}