import dotenv from 'dotenv';
import bot from './config/telegram';
import { configurarBot } from './services/telegramService';

dotenv.config()

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
        await bot.launch();
        console.log('Bot de Telegram activo');

        await bot.telegram.getMe();
        console.log('Bot de Telegram activo y conectado'); 
    }catch(error){
        console.error('Error al iniciar bot:', error);
    }
}

startBot()
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
