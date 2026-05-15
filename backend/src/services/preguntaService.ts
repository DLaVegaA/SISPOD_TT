import { AppError } from "../helpers/AppError";
import { Cuestionario, Pregunta } from "../models/index";


export const crearPreguntaService = async(id_cuestionario:number, data:any) =>{
    const cuestionario = await Cuestionario.findByPk(id_cuestionario);

    if(!cuestionario){
        throw new AppError('El cuestionario no existe',404);
    }

    const pregunta = await Pregunta.create({
        id_cuestionario,
        ...data,
        opciones: data.opciones||null
    });


    return pregunta
}   