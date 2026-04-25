import { Usuario } from "../models/index";
import { AppError } from "../helpers/AppError";

export const obtenerUsuario=async(id:number)=>{
    const usuario = await Usuario.findByPk(id);
    if(!usuario){
        throw new AppError('Usuario no encontrado', 404);
    }
    return usuario;
}