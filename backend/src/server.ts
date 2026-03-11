import express from 'express';
import cors from 'cors';
import cookieParser from "cookie-parser";
import dotenv from 'dotenv';
import {connectBD, sequelize} from './config/database';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import pacienteRoutes from './routes/pacienteRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin:true,
  credentials:true
})); //Aun no se en donde esta corriendo el frontend

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
startServer();