import bot from '../config/telegram';
import {Usuario, Paciente, Telegram} from '../models/index';

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
        return ctx.reply('Error técnico');
    }

}
export const configurarBot = () =>{
    //ctx (contexto) es un objeto que envuelve toda la informacion del que escribe 
    bot.start(async(ctx) =>{
        const [, token] = ctx.message.text.split(' ');
        // console.log('TEXT:', ctx.message.text);
        // console.log('PAYLOAD:', ctx.startPayload);

        
        if(!token){
            return ctx.reply('¡Bienvenido a SISPOD! \nUsa /vincular seguido de tu token para activar recordatorios.');
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
}