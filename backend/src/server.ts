import express from 'express';
import cors from 'cors';
import cookieParser from "cookie-parser";
import dotenv from 'dotenv';
import {connectBD, sequelize} from './config/database';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import pacienteRoutes from './routes/pacienteRoutes';
import citasRoutes from './routes/citasRoutes';
import dentistaRoutes from './routes/dentistaRoutes';
import telegramRoutes from './routes/telegramRoutes';
import bot  from './config/telegram';
import { configurarBot } from './services/telegramService';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors({
  origin:process.env.FRONTEND_URL,
  credentials:true
})); 

app.use(cookieParser());
app.use(express.json());

async function startServer() {
  try {
    await connectBD();

    await sequelize.sync({ alter: true });
    console.log('Base de datos sincronizada');

    app.get("/", (req, res) => {
      res.json({ mensaje: "Servidor funcionando" });
    });
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
    
    // await bot.launch();
    // console.log('Bot de Telegram activo');

    bot.launch();
    await bot.telegram.getMe();
    console.log('Bot de Telegram activo y conectado');
  } catch (error) {
    console.error("Error al iniciar servidor: ", error);
  }
}
app.use('/auth',authRoutes);
app.use('/usuarios',userRoutes);
app.use('/pacientes', pacienteRoutes);
app.use('/dentistas',dentistaRoutes);
app.use('/citas', citasRoutes);
app.use('/telegram', telegramRoutes);
configurarBot();
startServer();
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));