import { Cuestionario, Pregunta } from "../models/index"
import { AppError } from '../helpers/AppError'
import {obtenerProcedimientoService} from '../services/catalogoProcedimientosService'

export const crearCuestionarioService = async(id_procedimiento:number,data:any) =>{
    const procedimiento = await obtenerProcedimientoService(id_procedimiento);

    if(data.tipo_cuestionario === '72h' && procedimiento.dias_seguimiento <3){
        throw new AppError('Este procedimiento no requiere cuestionario de 72 hrs',400);
    }
    
    const existe = await Cuestionario.findOne({
        where:{
            id_procedimiento,
            tipo_cuestionario:data.tipo_cuestionario
        }
    });

    if(existe){
        throw new AppError('Ya existe un cuestionario para este procedimiento y tipo de cuestionario',400);
    }

    const cuestionario = await Cuestionario.create({
        id_procedimiento,
        ...data
    });
    return cuestionario
}

export const obtenerCuestionario = async(id_procedimiento:number, tipo_cuestionario:string) =>{
    const cuestionario = await Cuestionario.findOne({
        where:{
            id_procedimiento,
            tipo_cuestionario
        },
        include:[
            {
                model:Pregunta,
                as:'preguntas'
            }
        ]
    });

    if(!cuestionario){
        throw new AppError('Este procedimiento no tiene cuestionario',404);
    }

    return cuestionario

}