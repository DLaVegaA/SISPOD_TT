import cron from 'node-cron';
import { Op } from 'sequelize';
import { Cita, Telegram, Paciente, Usuario, Seguimiento } from '../models/index';
import { enviarRecordatorioTelegram } from '../services/telegramService';
import {enviarCuestionario24h,enviarCuestionario72h } from '../services/emailService';

//Cron para el envio de contestar cuestionario 
cron.schedule('0 7-22 * * *', async ()=>{
  try{
    const ahora = new Date()

    const hace24 = new Date(
      ahora.getTime() - (24 * 60 * 60 * 1000)
    )

    const seguimientos24h = await Seguimiento.findAll({
      where:{
        fecha_inicio:{
          [Op.lte]: hace24
        },
        enviado_24h:false
      },
      include:[
        {
          model:Cita,
          as:'cita',
          include:[
            {
              model:Paciente,
              as:'paciente',
              include:[
                {
                  model:Usuario,
                  as:'usuario'
                },
                {
                  model:Telegram,
                  as:'telegram'
                }
              ]
            }
          ]
        }
      ]
    }) as any;

    for(const seg of seguimientos24h){
      const paciente = seg.cita.paciente;

      await enviarCuestionario24h(paciente.usuario);

      const id_chat = paciente.telegram?.id_chat;

      if(id_chat){
        await enviarRecordatorioTelegram(id_chat, 
            'Hola 👋\n\nYa puedes responder tu cuetionario de seguimiento de 24 horas');
      }

    }

    const hace72h = new Date(
      ahora.getTime()-(72 * 60 * 60 * 1000)
    );

    const seguimientos72h = await Seguimiento.findAll({
      where:{
        fecha_inicio:{
          [Op.lte]:hace72h
        },
        enviado_72h:false
      },
      include:[
        {
          model:Cita,
          as:'cita',
          include:[
            {
              model:Paciente,
              as:'paciente',
              include:[
                {
                  model:Usuario,
                  as:'usuario'
                },
                {
                  model:Telegram,
                  as:'telegram'
                }
              ]
            }
          ]
        }
      ]
    }) as any;


    for(const seguimiento of seguimientos72h){
      const paciente = seguimiento.cita.paciente

      await enviarCuestionario72h(
        paciente.usuario
      );

      const id_chat = paciente.telegram?.id_chat;

      if(id_chat){
         await enviarRecordatorioTelegram(
          id_chat,
          'Ya puedes responder tu cuestionario de seguimiento de 72 horas'
        );
      }

    }
  }catch(error){
    console.log('Error cron seguimientos')
  }
})