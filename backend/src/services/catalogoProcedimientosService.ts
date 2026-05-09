import {
    Catalogo_Procedimientos
} from '../models/Catalogo_Procedimientos'
import { AppError } from '../helpers/AppError'

export const listarCatalogoProcedimientosService = async()=>{
    const catalogoProcedimientos = await Catalogo_Procedimientos.findAll({
        attributes:['id_procedimiento','nombre_procedimiento', 'descripcion', 'dias_seguimiento']
    });

    return catalogoProcedimientos;
}

export const obtenerProcedimientoService = async(id_procedimiento:number) =>{
    const procedimiento = await Catalogo_Procedimientos.findByPk(id_procedimiento);

    if(!procedimiento){
        throw new AppError('No se encontró el procedimiento', 404);
    }

    return procedimiento;
}