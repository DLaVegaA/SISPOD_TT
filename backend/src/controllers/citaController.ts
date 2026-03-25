import { Response, Request} from 'express';
import {Op} from 'sequelize'
import { Cita, Paciente, Dentista } from '../models/index';
import {CustomRequest} from '../middleware/authMiddleware'


export const crearCita = async (req:CustomRequest, res:Response) =>{
    try{
        const {fecha_hora_inicio, fecha_hora_fin, tipo_cita} = req.body;
        let id_dentista = req.body.id_dentista;
        let id_paciente = req.body.id_paciente


        if(!fecha_hora_inicio || !fecha_hora_fin || !tipo_cita){
            return res.status(400).json({
                message: 'Datos incompletos'
            });
        }

        
        const inicio = new Date(fecha_hora_inicio);
        const fin = new Date(fecha_hora_fin);

        if(isNaN(inicio.getTime())|| isNaN(fin.getTime())){
            return res.status(400).json({
                message:'Fechas inválidas'
            });
        }
        if(inicio >= fin){
            return res.status(400).json({
                message:'La fecha de fin debe ser mayor a la de inicio'
            });
        }

        let dentistaExiste = null;
        let pacienteExiste = null;
        switch(req.userData?.id_rol){
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
                estado:['Pendiente','Confirmada'],
                ...condicionTraslape
            }
        });

        const citaPaciente = await Cita.findOne({
            where:{
                id_paciente,
                estado:['Pendiente','Confirmada'],
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
            tipo_cita,
            estado:'Pendiente'
        });

        return res.status(201).json({
            message:'Cita creada correctamente',
            cita:nuevaCita
        })
    }catch(error){
        console.log('Error al crear cita: ', error);
        return res.status(500).json({
            message:'Error del servidor'
        });
    }
}