import {Seguimiento, Catalogo_Procedimientos} from '../models/index';
import { AppError } from '../helpers/AppError';
import { obtenerCitaId } from './citaService';
import {obtenerProcedimientoService} from './catalogoProcedimientosService'
export const crearSeguimientoService = async(id_cita:number, id_procedimiento:number, data:any) =>{
    const cita = await obtenerCitaId(id_cita);
    if(!cita){
        throw new AppError('No se encontró la cita',404);
    }
    const procedimiento = await obtenerProcedimientoService(id_procedimiento);

    const seguimiento = await Seguimiento.create({
        id_cita:cita.id_cita,
        id_procedimiento:procedimiento.id_procedimiento,
        
    })
}