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

    app.get("/", (req, res) => {
      res.json({ mensaje: "Servidor funcionando" });
    });

    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error("Error al iniciar servidor:", error);
  }
}
app.use('/auth',authRoutes);
app.use('/usuarios',userRoutes);
app.use('/pacientes', pacienteRoutes);
app.use('/dentistas',dentistaRoutes);
app.use('/citas', citasRoutes);
startServer();