// ✅ PRIMER import — garantiza que .env esté cargado
// antes de que cualquier otro módulo lo necesite
import 'dotenv/config'

import { connectBD, sequelize } from './config/database'
import './cron/recordatorioCron'
import app from './app'

const PORT = process.env.PORT || 3000

async function startServer() {
  try {
    await connectBD()
    await sequelize.sync({ alter: true })
    console.log('Base de datos sincronizada')

    app.listen(PORT, () => {
      console.log(`Servidor en http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error(' Error al iniciar el servidor:', error)
    process.exit(1)
  }
}

startServer()
