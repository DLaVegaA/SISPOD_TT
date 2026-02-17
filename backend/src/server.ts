import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import {connectBD, sequelize} from './config/database'

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
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

startServer();