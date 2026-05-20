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
import tipoCitasRoutes from './routes/tipoCitasRoutes';
import consentimientoRoutes from './routes/consentimientoRoutes';
import bitacoraRoutes from './routes/bitacoraRoute';
import expedienteRoutes from './routes/expedienteRoutes';
import padecimientosRoutes from './routes/padecimientosRoutes';
import catalogoProcedimientosRoutes from './routes/catalogoProcedimientosRoutes';
import seguimientoRoutes from './routes/seguimientoRoutes';
import cuestionarioRoutes from './routes/cuestionarioRoutes';
import odontogramaRoutes from './routes/odontogramaRoutes'
import preguntaBaseRoutes from './routes/preguntaBaseRoutes';   // ← nuevo
import { errorHandler } from './middleware/errorMiddleware';
import asistenteRoutes from './routes/asistenteRoutes';

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
app.use('/tipo-cita', tipoCitasRoutes);
app.use('/consentimiento', consentimientoRoutes);
app.use('/bitacora', bitacoraRoutes);
app.use('/expediente', expedienteRoutes);
app.use('/padecimiento', padecimientosRoutes);
app.use('/catalogo-procedimientos', catalogoProcedimientosRoutes);
app.use('/catalogo-procedimientos', errorHandler);
app.use('/seguimiento', seguimientoRoutes);
app.use('/cuestionario',cuestionarioRoutes)
app.use('/odontograma', odontogramaRoutes)
app.use('/odontograma', errorHandler)
app.use('/pregunta', errorHandler)
app.use('/cuestionario',errorHandler)
app.use('/seguimiento', errorHandler);
app.use('/cuestionario', errorHandler);
app.use('/preguntas-base', preguntaBaseRoutes);        // ← nuevo
app.use('/preguntas-base', errorHandler);              // ← nuevo
app.use('/padecimiento', errorHandler);
app.use('/expediente', errorHandler);
app.use('/bitacora', errorHandler);
app.use('/consentimiento', errorHandler);
app.use('/asistentes', asistenteRoutes);
startServer();