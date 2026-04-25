import { Response, Request} from 'express';
import {Op, WhereOptions} from 'sequelize'
import { Cita, Paciente, Dentista } from '../models/index';
import {CustomRequest} from '../middleware/authMiddleware'
import {obtenerDisponibilidad, validarTipoCita, crearCita as CrearCitaService, cancelarCita as CancelarCitaService, listarCitas as ListarCitasService} from '../services/citaService';
import { AppError } from '../helpers/AppError';
import {obtenerUsuario} from '../services/userService'


const ESTADOS_VALIDOS = ['Pendiente', 'Confirmada', 'Cancelada'];
export type FiltrosCita ={
    estado?:string;
    desde?:Date;
    hasta?:Date;
    user?:any, 
    nombre?:string
}

export const listarDisponibilidad = async(req:CustomRequest, res:Response) =>{
    try {
        const {fecha, tipo_cita} = req.query;
        let id_dentista;
        if(req.userData?.id_rol === 2){
            const dentista = await Dentista.findOne({
                where:{id_usuario:req.userData?.id},
                attributes:['id_dentista']
            });
            if(!dentista){
                return res.status(404).json({
                    message:'Dentista no encontrado'
                });
            }

            id_dentista= dentista.id_dentista;
        }else{
            id_dentista = Number(req.query.id_dentista);
        }

        
        if(!fecha || !id_dentista || !tipo_cita){
            return res.status(400).json({
                message:'Faltan datos '
            });
        }
        //tipo de cita 1 es como defualt 
        const tipo = req.userData?.id_rol=== 3 ? 1 : Number(tipo_cita);
        if(isNaN(tipo)){
            return res.status(400).json({
                message:'Tipo de cita invalido'
            });
        }
        const fechaDate = new Date(fecha as string);
        if(isNaN(fechaDate.getTime())){
            return res.status(400).json({
                message:'Fecha inválida'
            });
        }
        const disponibles = await obtenerDisponibilidad(
            fecha as string,
            id_dentista,
            tipo
        );

        

        return res.json({
            disponibles,
            message:disponibles.length === 0 ? 'no hay citas disponibles' : undefined
        });
    } catch (error:any) {
        if(error instanceof AppError){
            return res.status(error.status).json({
                message: error.message
            })
        }
        return res.status(500).json({message:'Error del servidor'})
    }
}

export const crearCita = async (req:CustomRequest, res:Response) =>{
    try{
        
        if (!req.userData) {
            return res.status(401).json({ message: 'No autenticado' });
        }

        if(!req.body.fecha_hora_inicio || !req.body.fecha_hora_fin || !req.body.tipo_cita){
            return res.status(400).json({
                message: 'Datos incompletos'
            });
        }
        
       const nuevaCita = await CrearCitaService(req.body, req.userData);
        return res.status(201).json({
            message:'Cita creada correctamente',
            cita:nuevaCita
        })
    }catch(error){
        console.log('Error al crear cita: ', error);
        if(error instanceof AppError){
            return res.status(error.status).json({
                message: error.message
            })
        }
        return res.status(500).json({
            message:'Error del servidor'
        });
    }
}

export const editarCita = async(req:CustomRequest, res:Response) =>{
    const {fecha_hora_inicio, fecha_hora_fin} = req.body;
    const id = Number(req.params.id);
    
    if(isNaN(id)){
        return res.status(400).json({message:'ID inválido'});
    }
    if(!id || !fecha_hora_fin || !fecha_hora_inicio){
        return res.status(400).json({message:'Datos incompletos'});
    }


    try {
        const cita = await Cita.findByPk(id);
        if(!cita){
            return res.status(404).json({
                message:'Cita no encontrada'
            })
        }

        const ahora = new Date();
        const dif = (cita.fecha_hora_inicio.getTime()-ahora.getTime())/(1000*60*60);

        if(dif<24){
            return res.status(400).json({
                message:'No se puede editar con menos de 24 horas'
            })
        }

        const inicio = new Date(fecha_hora_inicio);
        const fin = new Date(fecha_hora_fin);

        if(isNaN(inicio.getTime())|| isNaN(fin.getTime())){
            return res.status(400).json({
                message:'Fechas inválidas'
            });
        }
        if(inicio>= fin){
            return res.status(400).json({
                message:'Rango de fechas inválidas'
            });
        }

        if(inicio < ahora){
            return res.status(400).json({message:'No se puede agendar una cita en el pasado'})
        }

        const conflicto = await Cita.findOne({
            where:{
               id_dentista: cita.id_dentista,
               id_cita: {[Op.ne]:cita.id_cita},
               estado:{
                [Op.in]:['Pendiente','Confirmada']
               },
               fecha_hora_inicio:{[Op.lt]:fin},
               fecha_hora_fin:{[Op.gt]:inicio}
            }
        });

        if(conflicto){
            return res.status(400).json({
                message:'El horario para la cita ya esat ocupado'
            });
        }

        await cita.update({
            fecha_hora_inicio:inicio,
            fecha_hora_fin:fin,
        });

        return res.json({
            message:'Cita actualizada correctamente',
            cita
        })
        
    } catch (error) {
        console.log('Error al editar cita: ',error);
        return res.status(500).json({message:'Error del servidor'});
    }
}


export const cancelarCita = async (req:CustomRequest, res:Response) =>{
    const id = Number(req.params.id);

    if(isNaN(id)){
        return res.status(400).json({message:'ID inválido'});
    }

    try {
        const canceladaCita = await CancelarCitaService(id,req.userData);
        
        return res.json({
            message: 'Cita cancelada correctamente',
            canceladaCita
        });

    } catch (error) {
        console.log('Error al cancelar cita:',error);
        if(error instanceof AppError){
            return res.status(error.status).json({
                message: error.message
            })
        }
        return res.status(500).json({
            message:'Error del servidor'
        })
    }
}
//Terminar esto 
export const confirmarCita = async(req:CustomRequest, res:Response)=>{
    const id_cita = Number(req.params.id);
    if(isNaN(id_cita)){
        return res.status(400).json({message:'ID inválido'});
    }

    try {
        const cita = await Cita.findByPk(id_cita);
        if(!cita){
            return res.status(404).json({message:'Cita no encontrada'});
        }

    } catch (error) {
        
    }
}
//Falta agregar pagincion
export const listarCitas = async(req:CustomRequest, res:Response) =>
{
    try {
        const {estado,desde,hasta, nombre} = req.query;
        const pagina = Number(req.query.pagina) || 1;
        const limitQuery = Number(req.query.limit) || 10;
        const limit = Math.max(1,Math.min(limitQuery,500));

        const offset = pagina * limit -limit;
        const filtros: FiltrosCita = {};
        if(typeof estado === 'string' ){
            if( !ESTADOS_VALIDOS.includes(estado)){
                return res.status(400).json({message:'Estado inválido'})
            }
            filtros.estado = estado;
        }

        if(desde && hasta && typeof desde === 'string' && typeof hasta === 'string' ){
            const fechaInicio = new Date(desde);
            const fechaFin = new Date(hasta);
            if(isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())){
                return res.status(400).json({message:'Fechas inválidas'})
            }
            filtros.desde=fechaInicio;
            filtros.hasta=fechaFin;
        }
        if(nombre && typeof nombre ==='string'){
            filtros.nombre = nombre;
        }

        filtros.user=req.userData;


        const {total, citas,totalPaginas,limitResponse} = await ListarCitasService(filtros,limit,offset);
        // return res.json({
        //     total:count,
        //     citas:rows
        // });
        return res.json({
            total,
            citas,
            totalPaginas,
            limit:limitResponse
        })


    } catch (error) {
        console.log('Error al listar citas:',error);
        if(error instanceof AppError){
            return res.status(error.status).json({
                message: error.message
            })
        }
        return res.status(500).json({
            message:'Error del servidor'
        })
    }
}