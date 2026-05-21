import dotenv from 'dotenv'
import { connectBD, sequelize } from './config/database'
import './cron/recordatorioCron'
import app from './app'

dotenv.config()
const PORT = process.env.PORT || 3000

async function startServer() {
  try {
    await connectBD()
    await sequelize.sync({ alter: true })
    console.log('Base de datos sincronizada')

    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('Error al iniciar el servidor:', error)
    process.exit(1)
  }
}

startServer()
