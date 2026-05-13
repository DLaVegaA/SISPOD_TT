import {Seguimiento, Catalogo_Procedimientos, Cita, Paciente, Usuario} from '../models/index';
import { AppError } from '../helpers/AppError';
import { obtenerCitaId } from './citaService';
import {obtenerProcedimientoService} from './catalogoProcedimientosService'
export const crearSeguimientoService = async(id_cita:number, id_procedimiento:number, data:any) =>{
    const cita = await obtenerCitaId(id_cita);
    if(!cita){
        throw new AppError('No se encontró la cita',404);
    }
    const existe = await Seguimiento.findOne({
        where:{
            id_cita
        }
    });
    if(existe){
        throw new AppError('La cita ya tiene un seguimiento', 400);
    }
    const procedimiento = await obtenerProcedimientoService(id_procedimiento);
    const fecha_inicio = new Date()
    const fecha_fin = new Date()
    fecha_fin.setDate(fecha_inicio.getDate() + procedimiento.dias_seguimiento)
    const seguimiento = await Seguimiento.create({
        id_cita:cita.id_cita,
        id_procedimiento:procedimiento.id_procedimiento,
        ...data,
        fecha_inicio,
        fecha_fin,
        fecha_envio_24h:null,
        fecha_envio_72h:null
    });

    return seguimiento;
}

export const listarSeguimientosService = async(limit:number, offset:number, estado?:string) =>{
    const where:any={}
    if(estado){
        where.estado_seguimiento = estado
    }
    
    const {count,rows} = await Seguimiento.findAndCountAll({
        limit,
        offset,
        where,
        include:[
            {
                model:Cita,
                as:'cita',
                include:[
                    {
                        model:Paciente,
                        as:'paciente',
                        attributes:['id_paciente'],
                        include:[
                            {
                                model:Usuario,
                                as:'usuario',
                                attributes:['id_usuario','nombre', 'apellido_paterno', 'apellido_materno']
                            }
                        ]
                    }
                ]
            },
            {
                model:Catalogo_Procedimientos,
                as:'tipo_procedimiento',
                attributes:['nombre_procedimiento']
            }
        ]
    });

    const listaSeguimiento =rows.map((s:any)=>({
        id_seguimiento:s.id_seguimiento,
        estado_seguimiento: s.estado_seguimiento,
        fecha_inicio: s.fecha_inicio,
        fecha_fin: s.fecha_fin,
        procedimiento: s.tipo_procedimiento.nombre_procedimiento,
        id_paciente:s.cita.paciente.id_paciente,
        nombre:`${s.cita.paciente.usuario.nombre} ${s.cita.paciente.usuario.apellido_paterno} ${s.cita.paciente.usuario.apellido_materno ? s.cita.paciente.usuario.apellido_materno: ''}`
    }));

    return {
        listaSeguimiento,
        total:count,
        totalPaginas:count === 0 ? 1 :Math.ceil(count/limit),
        limitResponse:limit
    }
}

export const obtenerSeguimientoService =async(id_seguimiento:number)=>{

    const seguimiento= await Seguimiento.findByPk(id_seguimiento,{
        include:[
            {
                model:Cita,
                as:'cita',
                include:[
                    {
                        model:Paciente,
                        as:'paciente',
                        attributes:['id_paciente'],
                        include:[
                            {
                                model:Usuario,
                                as:'usuario',
                                attributes:['id_usuario','nombre', 'apellido_paterno', 'apellido_materno']
                            }
                        ]
                    }
                ]
            },
            {
                model:Catalogo_Procedimientos,
                as:'tipo_procedimiento',
                attributes:['nombre_procedimiento']
            }
        ]
    })

    if(!seguimiento){
        throw new AppError('No se encontró el seguimiento', 404)
    }

    return seguimiento;
}

export const editarSeguimientoService = async(id_seguimiento:number,data:any) =>{
    const seguimiento = await Seguimiento.findByPk(id_seguimiento)

    if(!seguimiento){
        throw new AppError('No se encontró el seguimiento',404);
    }

    if(seguimiento.estado_seguimiento !== 'en curso'){
        throw new AppError('Solo se pueden editar seguimientos en curso',400);
    }

    await seguimiento.update(data)

    return seguimiento

}