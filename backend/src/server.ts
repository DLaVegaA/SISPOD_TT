import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import {connectBD} from './config/database'

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

connectBD();
app.get("/",(req,res) =>{
    res.json({mensaje:"Servidor funcionando"})
});


app.listen(PORT, async() =>{
    console.log(`Servidor corriendo en http://localhost:${PORT}`)
});