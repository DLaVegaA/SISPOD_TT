import dotenv from 'dotenv';
dotenv.config()


import bot from './config/telegram';
import { configurarBot } from './services/telegramService';


bot.catch((err) => {
    console.error('Error en bot:', err);
});

process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});
const startBot = async()=>{
    try{
        configurarBot()
        await bot.telegram.getMe();
        
        console.log('Bot de Telegram activo y conectado'); 
        console.log('Bot de Telegram activo');
        await bot.launch();
    }catch(error){
        console.error('Error al iniciar bot:', error);
    }
}

startBot()
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
