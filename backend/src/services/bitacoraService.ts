import {Bitacora, Cita, Consentimiento, Paciente, TipoCita, Usuario} from '../models/index'
import { AppError } from '../helpers/AppError'
import {Model, NUMBER, Op, WhereOptions} from 'sequelize';
import {obtenerCitaId} from './citaService'
import { totalmem } from 'node:os';

interface BitacoraDTO {
  id_cita?: number;
  descripcion?:string;
}

type usuarioContexto ={
    id:number;
    id_rol:number;
}

type BitacoraConRelaciones = Bitacora & {
  cita: Cita & {
    paciente: Paciente & {
      usuario: Usuario;
    };
  };
};
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

    const bitacora = await Bitacora.findOne({
        where:{
            id_cita:cita.id_cita,
            estado_bitacora:{
                [Op.ne]: 'Anulada'
            }
        }
    })

    if(bitacora){
        throw new Error('Ya existe una bitácora');
    }

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


export const eliminarBitacoraService = async(id_bitacora:number) =>{
    const bitacora = await Bitacora.findByPk(id_bitacora);

    if(!bitacora){
        throw new Error('La bitácora no existe');
    }

    if(bitacora.estado_bitacora === 'Anulada'){
        throw new Error('No se puede eliminar una bitácora que ya fue eliminada');
    }

    await bitacora.update({
        estado_bitacora: 'Anulada'
    });
}


export const listarBitacoraService = async(limit:number, offset:number, estado?:string) =>{
    const where: any = {};

    if (estado) {
        where.estado_bitacora = estado;
    }

    const {count, rows} = await Bitacora.findAndCountAll({ 
        where,
        limit,
        offset,
        include:[{
            model:Cita,
            as:'cita',
            attributes:['fecha_hora_inicio','id_paciente'],
            include:[{
                model:Paciente,
                as:'paciente',
                attributes:['id_paciente'],
                include:[{
                    model:Usuario,
                    as:'usuario',
                    attributes:['nombre', 'apellido_paterno', 'apellido_materno']
                }]
            }]
        },
        {
            model:Usuario,
            as:'autor',
            attributes:['nombre', 'apellido_paterno', 'id_rol'],
            required: false
        }]
    
    });   
    const listaBitacoras = rows.map( (b:any) =>({
        id_bitacora: b.id_bitacora,
        estado_bitacora: b.estado_bitacora,
        accion_realizada: b.accion_realizada,
        fecha_cita : b.cita?.fecha_hora_inicio,

        descripcion: b.descripcion,
        id_paciente: b.cita?.id_paciente, 
        // Armamos el nombre del paciente
        nombre_paciente : `${b.cita?.paciente?.usuario?.nombre || ''} ${b.cita?.paciente?.usuario?.apellido_paterno || ''}`.trim(),
        
        // Usamos b.autor en lugar de b.usuario para sacar los datos de quien escribió
        nombre_autor: b.autor ? `${b.autor.nombre} ${b.autor.apellido_paterno}` : 'Autor desconocido',
        rol_autor: b.autor?.id_rol === 4 ? 'Asistente' : 'Dentista'
    }));

    return {
        listaBitacoras,
        total:count,
        totalPaginas:count === 0 ? 1 :Math.ceil(count/limit),
        limitResponse:limit
    };
}


export const obtenerBitacoraService =async(id_bitacora:number) =>{
    const bitacora = await Bitacora.findByPk(id_bitacora,
        {
            include:[{
                model:Cita,
                as:'cita',
                attributes:['fecha_hora_inicio','id_paciente'],
                include:[{
                    model:Paciente,
                    as:'paciente',
                    attributes:['id_paciente'],
                    include:[{
                        model:Usuario,
                        as:'usuario',
                        attributes:['nombre','apellido_paterno', 'apellido_materno']
                    }]
                }]
            }]
        }
    ) as BitacoraConRelaciones;

    if(!bitacora){
        throw new AppError('Bitácora no encontrada',404);
    }
    return {
        id_bitacora: bitacora.id_bitacora,
        estado_bitacora: bitacora.estado_bitacora,
        accion_realizada: bitacora.accion_realizada,
        descripcion:bitacora.descripcion,
        fecha_cita : bitacora.cita?.fecha_hora_inicio,
        nombre_paciente : bitacora.cita.paciente.usuario.nombre
    }
}

export const revisarBitacoraService = async (id_bitacora: number) => {
    const bitacora = await Bitacora.findByPk(id_bitacora);
    if (!bitacora) throw new Error('La bitácora no existe');
    
    // Solo se revisan las que están pendientes
    if (bitacora.estado_bitacora !== 'Pendiente') {
        throw new Error('Solo se pueden revisar bitácoras en estado Pendiente');
    }

    await bitacora.update({ estado_bitacora: 'Revisado' });
    return bitacora;
};