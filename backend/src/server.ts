import express from 'express';
import cors, { CorsOptions } from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectBD, sequelize } from './config/database';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import pacienteRoutes from './routes/pacienteRoutes';
import citasRoutes from './routes/citasRoutes';
import dentistaRoutes from './routes/dentistaRoutes';
import telegramRoutes from './routes/telegramRoutes';
import rolesRoutes from './routes/rolesRoutes';
import bot from './config/telegram';
import { configurarBot } from './services/telegramService';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

const envOrigins = (process.env.FRONTEND_URL ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = Array.from(
  new Set([...envOrigins, 'http://localhost:5173', 'http://127.0.0.1:5173']),
);

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origen no permitido por CORS: ${origin}`));
  },
  credentials: true,
};

app.use(cors(corsOptions));

app.use(cookieParser());
app.use(express.json());

async function startServer() {
  try {
    await connectBD();

    await sequelize.sync({ alter: true });
    console.log('Base de datos sincronizada');

    app.get('/', (req, res) => {
      res.json({ mensaje: 'Servidor funcionando' });
    });
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });

    // await bot.launch();
    // console.log('Bot de Telegram activo');

    /* bot.launch();
    await bot.telegram.getMe();
    console.log('Bot de Telegram activo y conectado'); */
    try {
      if(!(global as any).__botStarted){
        (global as any).__botStarted = true;
        bot.launch();
        await bot.telegram.getMe();
        console.log('Bot de Telegram activo y conectado');
      }else{
        console.log("Bot ya iniciado")
      }
    } catch (error) {
      console.error('Advertencia: El bot de Telegram no pudo iniciar, pero la API sigue viva.', error);
    }
  } catch (error) {
    console.error('Error al iniciar servidor: ', error);
  }
}
app.use('/auth', authRoutes);
app.use('/usuarios', userRoutes);
app.use('/pacientes', pacienteRoutes);
app.use('/dentistas', dentistaRoutes);
app.use('/citas', citasRoutes);
app.use('/telegram', telegramRoutes);
app.use('/roles', rolesRoutes);
configurarBot();
startServer();
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
