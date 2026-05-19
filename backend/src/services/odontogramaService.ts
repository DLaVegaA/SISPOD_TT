import { AppError } from "../helpers/AppError";
import { Odontograma } from "../models/index";


export const crearOdontogramaService = async(id_expediente:number, datos_odontograma:object[]) =>{

    const odontogramaExiste = await Odontograma.findOne({
        where:{
            id_expediente
        }
    });

    if(odontogramaExiste){
        throw new AppError('El expediente ya tiene un odontograma',400);
    }


    return await Odontograma.create({
        id_expediente,
        datos_odontograma
    })
}


export const obtenerOdontogramaPorExpedienteService = async(id_expediente:number) =>{
    const odontograma = await Odontograma.findOne({
        where:{
            id_expediente
        }
    });

    if(!odontograma){
        throw new AppError('Odontograma no encontrado',404);
    }

    return odontograma;
}

export const actualizarOdontogramaService = async(id_odontograma:number, datos_odontograma:object[]) =>{
    const odontograma = await Odontograma.findByPk(id_odontograma);

    if(!odontograma){
        throw new AppError('Odontograma no encontrado',404);
    }

    await odontograma.update({
        datos_odontograma,
        fecha_actualizacion: new Date()
    });

    return odontograma;

}