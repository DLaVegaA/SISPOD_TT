import bot from '../config/telegram';
import {Usuario, Paciente, Telegram} from '../models/index';
import { message } from 'telegraf/filters';
import { Markup } from 'telegraf';
import {proximaCita} from './citaService'

export const obtenerEstadoTelegram = async(id_usuario:number) =>{
    const paciente = await Paciente.findOne({
        where: { id_usuario },
        attributes: ['id_paciente']
    });
    if(!paciente){
        throw new Error('PACIENTRE_NO_ENCONTRADO');
    }
    const registroTelegram = await Telegram.findOne({
        where:{id_paciente:paciente.id_paciente},
        attributes:['id_chat']
    });

    return {
        vinculado: !!registroTelegram?.id_chat // !!Convierte a booleano
    }
}

export const estaVinculadoTelegram = async(id_chat:number) =>{
    const id_chatString = id_chat.toString();
    const registroTelegram = await Telegram.findOne({
        where:{id_chat:id_chatString},
        attributes:['id_chat']
    });

    return !!registroTelegram?.id_chat;
}

export const validarVinculacion =async(ctx:any) =>{
    const vinculado = await estaVinculadoTelegram(ctx.chat.id);

    if(!vinculado){
        await ctx.reply('Debes vincular tu cuenta con /vincular seguido del token');
        return false
    }
    return true;
}

const procesarVinculacion = async(ctx:any, token:string) =>{
    try {

        const registroTelegram = await Telegram.findOne({
            where:{token},
            include:[
                {
                    model:Paciente,
                    as:'paciente',
                    include:[
                        {
                            model:Usuario,
                            as:'usuario',
                            attributes:{exclude:['contrasena']}
                        }
                    ]
                }
            ]

        });

        if(!registroTelegram){
            return ctx.reply('El token no existe o ya fue usado');
        }

        if(!registroTelegram.token){
            return ctx.reply('Este token ya fue utilizado');
        }

        if(registroTelegram.id_chat){
            return ctx.reply('Esta cuenta ya esta vinculada');
        }
        const yaExiste = await Telegram.findOne({
            where:{id_chat:ctx.chat.id.toString()}
        });
        if(yaExiste){
            return ctx.reply('Esta Telegram ya esta vinculada a otra cuenta');
        }

        const nombrePaciente = (registroTelegram as any).paciente.usuario.nombre;

        registroTelegram.id_chat = ctx.chat.id;
        registroTelegram.token = null;
        await registroTelegram.save();

        return ctx.reply(`Perfecto ${nombrePaciente}, tu cuenta ha sido vinculada`);

    } catch (error) {
        console.log('Error al vincular Telegram: ', error);
       
        return ctx.reply('Ocurrió un error, intentalo más tarde');
    }

}
const limpiarVinculacion = async(registro:Telegram) =>{
    registro.id_chat = null;
    registro.token = null;

   await registro.save();
}

export const desvincularTelegramPaciente = async(id_paciente:number)=>{
   const registroPaciente = await Telegram.findOne({where:{id_paciente}});
   if(!registroPaciente){
        throw new Error('TELEGRAM_NO_ENCONTRADO');
   }
   
   await limpiarVinculacion(registroPaciente);
}

export const desvincularTelegramChat = async(id_chat:number)=>{
    const id_chatString = id_chat.toString();
    const registroTelegram = await Telegram.findOne({where:{id_chat:id_chatString}});
    if(!registroTelegram){
        throw new Error('TELEGRAM_NO_ENCONTRADO');
    }
    await limpiarVinculacion(registroTelegram);
}
export const obtenerIdPacientePorTelegram = async(id_chat:number) =>{
    const id_chatString = id_chat.toString();
    const registroTelegram = await Telegram.findOne({where:{id_chat:id_chatString}});
    if(!registroTelegram){
        throw new Error('TELEGRAM_NO_ENCONTRADO');
    }

    return registroTelegram.id_paciente;
}

export const configurarBot = () =>{
    //ctx (contexto) es un objeto que envuelve toda la informacion del que escribe 
    bot.start(async(ctx) =>{
        const [, token] = ctx.message.text.split(' ');
        // console.log('TEXT:', ctx.message.text);
        // console.log('PAYLOAD:', ctx.startPayload);

        
        if(!token){
            return ctx.reply('¡Bienvenido a SISPOD! \nUsa /vincular seguido de tu token para activar recordatorios\nUsa /menu para ver opciones');
        }

        await procesarVinculacion(ctx, token);
    });

    bot.command('vincular', async(ctx) =>{
        const [, token] = ctx.message.text.split(' ')

        if(!token){
            return ctx.reply('Por favor, envía tu código de vinculación. Ejemplo: /vincular AB123');
        }
    
        await procesarVinculacion(ctx, token);
    
    });
    bot.command('desvincular',async(ctx)=>{
        try {
            await desvincularTelegramChat(ctx.chat.id);
            
            await ctx.reply('Tu cuenta ha sido desvinculada')
        } catch (error:any) {
            console.log('Error al desvincular Telegram: ',error);
            if (error.message === 'TELEGRAM_NO_ENCONTRADO') {
                return ctx.reply('No tienes ninguna cuenta vinculada');
            }   
            return ctx.reply('Ocurrió un error, intentalo más tarde');
        }

    });

    bot.command('menu', async(ctx)=>{
        
        if(!(await validarVinculacion(ctx))) return;

        await ctx.reply(
            'Menú principal:\n\nSelecciona una opción \n\n(Si no ves los botones revisa el icono en la barra inferior)',
            Markup.keyboard([
                ['Próxima cita'],
                ['Vincular cuenta'],
                ['Ayuda'],
                ['Desvincular cuenta']
            ])
                .resize()
        );
    });

    bot.hears('Próxima cita', async(ctx)=>{
        if(!(await validarVinculacion(ctx)))return
        await ctx.reply('Tu próxima cita:\n');
        //Falta hacer funcion para traer las citas
        try {
            const id_paciente = await obtenerIdPacientePorTelegram(ctx.chat.id)
            const cita = await proximaCita(id_paciente);
            if(!cita){
                throw new Error('No_Citas');
            }
            const fecha = cita.fecha_hora_inicio;
            const fechaFormateada = fecha.toLocaleString('es-MX', {
                timeZone: 'America/Mexico_City',
                dateStyle: 'full',
                timeStyle: 'short'
            });

            return ctx.reply(`Tu próxima cita es: ${fechaFormateada}`);

        } catch (error:any) {
            console.log('Error al listar próxima cita: ',error);
            if (error.message === 'No_Citas') {
                return ctx.reply('No tienes ninguna cita');
            }   
            return ctx.reply('Ocurrió un error, intentalo más tarde');
        }
    });

    bot.hears('Vincular cuenta',async(ctx) =>{
        await ctx.reply('Usa /vincular seguido de tu token');
    });

    bot.hears('Ayuda', async(ctx)=>{
        await ctx.reply(
            'Puedo ayudarte con:\n\n'+
            'Ver tu próxima cita\n'+
            'Recordatorios\n'+
            'Vincular tu cuenta\n'+
            'Desvincular (Usa el botón del menú o escribe /desvincular)\n'+
            'Usa /menu para ver opciones'
        );
    });
    
    bot.hears('Desvincular cuenta', async(ctx)=>{
        await ctx.reply(
            '¿Estás seguro de que deseas desvincular tu cuenta?',
            Markup.inlineKeyboard([
                [
                    Markup.button.callback('Sí', 'CONFIRMAR_DESVINCULAR'),
                    Markup.button.callback('No', 'CANCELAR_DESVINCULAR')
                ]
            ])
        )
    });
    bot.action('CONFIRMAR_DESVINCULAR',async(ctx)=>{
        await ctx.answerCbQuery();
        try {
            if(!ctx.chat) return
            await desvincularTelegramChat(ctx.chat.id);
            
            await ctx.editMessageText('Tu cuenta ha sido desvinculada')
        } catch (error:any) {
            console.log('Error al desvincular Telegram: ',error);
            if (error.message === 'TELEGRAM_NO_ENCONTRADO') {
                return ctx.editMessageText('No tienes ninguna cuenta vinculada');
            }   
            return ctx.editMessageText('Ocurrió un error, intentalo más tarde');
        }
    });

    bot.action('CANCELAR_DESVINCULAR', async(ctx)=>{
        await ctx.answerCbQuery();

        await ctx.editMessageText('Operación cancelada');
    });

    bot.command(/.*/,async(ctx)=>{
        const comando = ctx.message.text.split(' ')[0];
        const validos = ['/start','/menu', '/vincular'];
        if(!validos.includes(comando)){
            return ctx.reply('Comando no reconocido\nUsa /menu para ver opciones');
        }
    });
    
    bot.on(message('text'),async(ctx)=>{
        const text = ctx.message.text;
        if(text.startsWith('/')) return;

        if(!(await validarVinculacion(ctx))) return;

        await ctx.reply('No entendí eso\nUsa /menu para ver opciones');
    });
   
}