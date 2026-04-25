import { Paciente, Usuario } from "../models/index";
import { AppError } from "../helpers/AppError";

export const obtenerPacientePorUsuario= async(user:any) =>{
    const paciente = await Paciente.findOne({
        where:{id_usuario:user.id},
        attributes:['id_paciente']
    });

    if(!paciente){
        throw new AppError('Paciente no encontrado',404);
    }

    return paciente.id_paciente;
}


export const obtenerPaciente = async(id_paciente:number) =>{
    const paciente = await Paciente.findByPk(id_paciente);
    if(!paciente){
        throw new AppError('Paciente no encontrado',404);
    }

    return paciente;
}

export const obtenerUsuarioDesdePaciente = async(id_paciente:number) =>{
    const paciente = await Paciente.findByPk(id_paciente,{
        include:{
            model:Usuario,
            as:'usuario',
            attributes:['id_usuario','correo','nombre']
        }
    });

    if(!paciente){
        throw new AppError('Usuario no encontrado',404);
    }

    return paciente;
}