import {Telegraf} from 'telegraf';
const token =process.env.TOKEN_TELEGRAM;
if(!token){
    throw new Error('Token Telegram no esta definido');
}
const bot = new Telegraf(token);

export default bot;