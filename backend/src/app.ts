import express from 'express'
import cors, { CorsOptions } from 'cors'
import cookieParser from 'cookie-parser'
import authRoutes from './routes/authRoutes'
import userRoutes from './routes/userRoutes'
import pacienteRoutes from './routes/pacienteRoutes'
import citasRoutes from './routes/citasRoutes'
import dentistaRoutes from './routes/dentistaRoutes'
import telegramRoutes from './routes/telegramRoutes'
import rolesRoutes from './routes/rolesRoutes'
import tipoCitasRoutes from './routes/tipoCitasRoutes'
import consentimientoRoutes from './routes/consentimientoRoutes'
import bitacoraRoutes from './routes/bitacoraRoute'
import expedienteRoutes from './routes/expedienteRoutes'
import padecimientosRoutes from './routes/padecimientosRoutes'
import catalogoProcedimientosRoutes from './routes/catalogoProcedimientosRoutes'
import seguimientoRoutes from './routes/seguimientoRoutes'
import cuestionarioRoutes from './routes/cuestionarioRoutes'
import odontogramaRoutes from './routes/odontogramaRoutes'
import preguntaBaseRoutes from './routes/preguntaBaseRoutes'
import asistenteRoutes from './routes/asistenteRoutes'
import { errorHandler } from './middleware/errorMiddleware'

const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173']

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error(`Origen no permitido por CORS: ${origin}`))
  },
  credentials: true,
}

const app = express()
app.use(cors(corsOptions))
app.use(cookieParser())
app.use(express.json())

app.get('/', (_, res) => res.json({ mensaje: 'Servidor funcionando' }))

app.use('/api/auth',                  authRoutes)
app.use('/api/usuarios',              userRoutes)
app.use('/api/pacientes',             pacienteRoutes)
app.use('/api/citas',                 citasRoutes)
app.use('/api/dentistas',             dentistaRoutes)
app.use('/api/telegram',              telegramRoutes)
app.use('/api/roles',                 rolesRoutes)
app.use('/api/tipo-citas',            tipoCitasRoutes)
app.use('/api/consentimiento',        consentimientoRoutes)
app.use('/api/bitacoras',             bitacoraRoutes)
app.use('/api/expedientes',           expedienteRoutes)
app.use('/api/padecimientos',         padecimientosRoutes)
app.use('/api/catalogo-procedimientos', catalogoProcedimientosRoutes)
app.use('/api/seguimiento',           seguimientoRoutes)
app.use('/api/cuestionario',          cuestionarioRoutes)
app.use('/api/odontograma',           odontogramaRoutes)
app.use('/api/preguntas-base',        preguntaBaseRoutes)
app.use('/api/asistente',             asistenteRoutes)

app.use(errorHandler)

export default app