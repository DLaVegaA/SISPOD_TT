import {Bitacora, Cita, TipoCita} from '../models/index'
import { AppError } from '../helpers/AppError'
import {Model, NUMBER, Op, WhereOptions} from 'sequelize';
import {obtenerCitaId} from './citaService'

interface BitacoraDTO {
  id_cita?: number;
  descripcion?:string;
}

type usuarioContexto ={
    id:number;
    id_rol:number;
}
export const crearBitacoraService = async(data:BitacoraDTO, user:usuarioContexto) =>
{
    const cita = await Cita.findByPk(data.id_cita,{
        include:[{
            model:TipoCita,
            as:'tipo'
        }]
    }) as any;
    if(!cita){
        throw new Error('La cita no existe');
    }

    // const bitacora = await Bitacora.findOne({
    //     where:{
    //         id_cita:cita.id_cita,
    //         estado_bitacora:{
    //             [Op.ne]: 'Anulada'
    //         }
    //     }
    // })

    // if(bitacora){
    //     throw new Error('Ya existe una bitácora');
    // }

    const nuevaBitacora = await Bitacora.create({
        id_usuario:user.id,
        ...data,
        accion_realizada:cita.tipo.nombre_corto,
        fecha_creacion:new Date()
    })

    return nuevaBitacora;

}

export const editarBitacoraService = async(data:BitacoraDTO, id_bitacora:number) =>{
    const bitacora = await Bitacora.findByPk(id_bitacora);

    if(!bitacora){
        throw new Error('La bitácora no existe');
    }

    if(bitacora.estado_bitacora !== 'Pendiente'){
        throw new Error('Solo se puede editar una bitácora pendiente');
    }

    await bitacora.update({
        descripcion: data.descripcion
    });
}