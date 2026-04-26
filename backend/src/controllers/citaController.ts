import { Response, Request} from 'express';
import {Op, WhereOptions} from 'sequelize'
import { Cita, Paciente, Dentista } from '../models/index';
import {CustomRequest} from '../middleware/authMiddleware'
import {obtenerDisponibilidad, validarTipoCita} from '../services/citaService';

const ESTADOS_VALIDOS = ['Pendiente', 'Confirmada', 'Cancelada'];

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
        console.log('Error al mostrar disponibilidad: ',error);
        if(error.message ==='Tipo_cita_invalido'){
            return res.status(400).json({message:'Tipo de cita inválido'})
        }
        return res.status(500).json({message:'Error del servidor'})
    }
}

export const crearCita = async (req:CustomRequest, res:Response) =>{
    try{
        // const {fecha_hora_inicio, fecha_hora_fin, tipo_cita} = req.body;
        const {fecha_hora_inicio, tipo_cita} = req.body;
        let id_dentista = req.body.id_dentista;
        let id_paciente = req.body.id_paciente

        // if(!fecha_hora_inicio || !fecha_hora_fin || !tipo_cita){
        if(!fecha_hora_inicio || !tipo_cita){
            return res.status(400).json({
                message: 'Datos incompletos'
            });
        }

        
        const inicio = new Date(fecha_hora_inicio);
        //const fin = new Date(fecha_hora_fin);     

        let {tipo, duracion} = validarTipoCita(tipo_cita);
        //tipo = req.userData?.id_rol=== 3 ? 1 : tipo;

        if(req.userData?.id_rol === 3){
            tipo = 1; //Si el usuario es un paciente, se asigna el tipo de cita 1 (consulta general)
            duracion = 60; //Duración predeterminada para consultas generales
        }

        if(isNaN(inicio.getTime())){
            return res.status(400).json({
                message:'Fecha inválida'
            });
        }

        /* if(isNaN(inicio.getTime())|| isNaN(fin.getTime())){
            return res.status(400).json({
                message:'Fechas inválidas'
            });
        } */

        const fin = new Date(inicio.getTime());
        fin.setMinutes(fin.getMinutes() + duracion);

        const ahora = new Date();
        //const dif = (fecha_hora_inicio.getTime()-ahora.getTime())/(1000*60*60);
        const dif = (inicio.getTime() - ahora.getTime()) / (1000 * 60 * 60);

        if(dif<48){
            return res.status(400).json({
                message:'No se puede agendar con menos de 48 horas de anticipación'
            })
        }
        if(inicio >= fin){
            return res.status(400).json({
                message:'La fecha de fin debe ser mayor a la de inicio'
            });
        }
        if(inicio < ahora){
            return res.status(400).json({message:'No se puede agendar una cita en el pasado'})
        }

        let dentistaExiste = null;
        let pacienteExiste = null;

        const rolUsuario = Number(req.userData?.id_rol);

        //switch(req.userData?.id_rol){
        switch(rolUsuario){
            case 2:
                dentistaExiste = await Dentista.findOne({
                    where:{
                        id_usuario:req.userData?.id
                    }
                });

                if(!dentistaExiste){
                    return res.status(404).json({
                        message:'Dentista no encontrado'
                    });
                }

                id_dentista= dentistaExiste.id_dentista
                break;
            case 3:
                pacienteExiste = await Paciente.findOne({
                    where:{
                        id_usuario:req.userData?.id
                    },
                });
                if(!pacienteExiste){
                    return res.status(404).json({
                        message:'Paciente no encontrado'
                    });
                }
                id_paciente = pacienteExiste.id_paciente
                break;
        }

        
        if(!id_paciente || !id_dentista){
            return res.status(400).json({
                message: 'Faltan datos de paciente o dentista'
            });
        }
        
        if(!dentistaExiste){
            dentistaExiste = await Dentista.findByPk(id_dentista);
            if(!dentistaExiste){
                return res.status(404).json({
                    message:'Dentista no encontrado'
                });
            }
        }

        if(!pacienteExiste){
            pacienteExiste = await Paciente.findByPk(id_paciente);
            if(!pacienteExiste){
                return res.status(404).json({
                    message:'Paciente no encontrado'
                })
            }
        }
        

        const condicionTraslape = {
            [Op.or]:[
                {
                    fecha_hora_inicio:{ //Detecta que la cita existente empieza dentro del rango de la nueva
                        [Op.between]:[inicio,fin]
                    }
                },
                {
                    fecha_hora_fin:{//Detecta que la cita existente termina dentro del rango de la nueva 
                        [Op.between]:[inicio, fin]
                    }
                },
                {
                    [Op.and]:[ //detecta que la cita existente envuelve completamente a la nueva
                        {fecha_hora_inicio: {[Op.lte]:inicio}},
                        {fecha_hora_fin:{[Op.gte]:fin}}
                    ]
                }
            ]
        }
        const citaDentista = await Cita.findOne({
            where:{
                id_dentista,
                estado:{
                    [Op.in]:['Pendiente','Confirmada']
                },
                ...condicionTraslape
            }
        });

        const citaPaciente = await Cita.findOne({
            where:{
                id_paciente,
                estado:{
                    [Op.in]:['Pendiente','Confirmada']
                },
                ...condicionTraslape//mete las condiciones que estan dentro de condicionTraslape
            }
        })

        if(citaDentista){
            return res.status(400).json({
                message:"El dentista ya tiene una cita en ese horario"
            });
        }

        if(citaPaciente){
            return res.status(400).json({
                message:'El paciente ya tiene una cita en ese horario'
            });
        }

        const nuevaCita = await Cita.create({
            id_paciente,
            id_dentista,
            fecha_hora_inicio:inicio,
            fecha_hora_fin:fin,
            tipo_cita:tipo,
            estado:'Pendiente'
        });

        return res.status(201).json({
            message:'Cita creada correctamente',
            cita:nuevaCita
        })
    }catch(error:any){
        console.log('Error al crear cita: ', error);
        if(error.message ==='Tipo_cita_invalido'){
            return res.status(400).json({message:'Tipo de cita inválido'})
        }
        return res.status(500).json({
            message:'Error del servidor'
        });
    }
}

export const editarCita = async(req:CustomRequest, res:Response) =>{
    //const {fecha_hora_inicio, fecha_hora_fin} = req.body;
    const {fecha_hora_inicio} = req.body;
    const id = Number(req.params.id);
    
    if(isNaN(id)){
        return res.status(400).json({message:'ID inválido'});
    }
    if(!id || !fecha_hora_inicio){
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
        /* const fin = new Date(fecha_hora_fin); */
        let duracion = Number(cita.tipo_cita) === 1 ? 60 : 30;
        const fin = new Date(inicio.getTime());
        fin.setMinutes(fin.getMinutes() + duracion);
        

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
        const cita = await Cita.findByPk(id);

        if(!cita){
            return res.status(404).json({message:'Cita no encontrada'});
        }
        if(cita.estado === 'Cancelada'){
            return res.status(400).json({message:'La cita ya está cancelada'})
        }

        if(req.userData?.id_rol === 3){
            const paciente = await Paciente.findOne({
                where:{
                    id_usuario: req.userData?.id
                },
                attributes:['id_paciente']
            });
            
            if(!paciente){
                return res.status(404).json({message:'Paciente no encontrado'})
            }
            if(cita.id_paciente !== paciente.id_paciente){
                return res.status(403).json({message:'No tienes permiso para esta cita cancelar'})
            }
        }

        const ahora = new Date();
        const diffHoras = (cita.fecha_hora_inicio.getTime()-ahora.getTime())/(1000*60*60);

        if(diffHoras<24){
            return res.status(400).json({message:'No se puede cancelar con menos de 24 horas de anticipación'})
        }

        await cita.update({
            estado: 'Cancelada'
        });

        return res.status(200).json({message:'Cita cancelada correctamente'})


    } catch (error) {
        console.log('Error al cancelar cita:',error);
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
        const {estado,desde,hasta} = req.query;

        const where: WhereOptions<Cita> = {};
        if(typeof estado === 'string' ){
            if( !ESTADOS_VALIDOS.includes(estado)){
                return res.status(400).json({message:'Estado inválido'})
            }
            where.estado = estado;
        }

        if(desde && hasta && typeof desde === 'string' && typeof hasta === 'string' ){
            const fechaInicio = new Date(desde);
            const fechaFin = new Date(hasta);
            if(!isNaN(fechaInicio.getTime()) && !isNaN(fechaFin.getTime())){
                where.fecha_hora_inicio = {
                    [Op.between]: [fechaInicio, fechaFin]
                }
            }

        }

        if(req.userData?.id_rol ===  3){
            const paciente = await Paciente.findOne({
                where: {id_usuario:req.userData.id},
                attributes:['id_paciente']
            });

            if(!paciente){
                return res.status(404).json({message:'Paciente no encontrado'})
            }
            where.id_paciente=paciente.id_paciente;
        }

        const {count, rows} = await Cita.findAndCountAll({
            where,
            order:[['fecha_hora_inicio', 'ASC']]
        });

        return res.json({
            total:count,
            citas:rows
        });



    } catch (error) {
        console.log('Error al listar citas:',error);
        return res.status(500).json({
            message:'Error del servidor'
        })
    }
}