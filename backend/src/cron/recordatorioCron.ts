import cron from 'node-cron';
import { Op } from 'sequelize';
import { Cita, Telegram, Paciente, Usuario } from '../models/index';
import {enviarRecordatorioTelegram} from '../services/telegramService'
import {recordatorioProximaCita} from '../services/emailService'
console.log('Cron de recordatorios cargado');
cron.schedule('0 8 * * *',async ()=>{
    try {
        const inicio = new Date();
        inicio.setDate(inicio.getDate()+1);
        inicio.setHours(0,0,0,0);
    
        const fin = new Date();
        fin.setDate(fin.getDate()+1);
        fin.setHours(23,59,59,999);

        const citas = await Cita.findAll({
            where:{
                fecha_hora_inicio:{
                    [Op.between]:[inicio,fin]
                },
                estado:{[Op.ne]:'Cancelada'}, 
                recordatorio_enviado:false
            },
            include:[
                {
                    model:Paciente,
                    as:'paciente',
                    include:[
                        {
                            model:Telegram,
                            as:'telegram'
                        },
                        {
                            model:Usuario,
                            as:'usuario'
                        }
                    ]
                }
            ]
        }) as any;

        for(const cita of citas){
            const id_chat = cita.paciente.telegram?.id_chat
            const fecha = cita.fecha_hora_inicio.toLocaleString('es-MX',{
                timeZone:'America/Mexico_City',
                day:'2-digit',
                month:'long',
                year:'numeric',
                hour:'2-digit',
                minute:'2-digit'
            });
            const mensaje = 
            `Hola 👋

            Te recordamos que tienes una cita mañana.

            📅 ${fecha}

            Te esperamos.`;
            if(id_chat){
                await enviarRecordatorioTelegram(id_chat, mensaje);
            }
            recordatorioProximaCita(cita,cita.paciente.usuario);
            await cita.update({
                recordatorio_enviado:true
            })
            console.log('Se enviarón ambos recordatorios');
        }
    } catch (error) {
       console.log('Error al enviar recordatorio:',error);
    }

})