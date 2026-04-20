import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config()

const BD_NAME = process.env.BD_NAME as string;
const BD_USER = process.env.BD_USER as string;
const BD_PASS = process.env.BD_PASS as string;
const BD_HOST = process.env.BD_HOST as string;

const isAzure = BD_HOST?.includes('azure') || process.env.NODE_ENV === 'production';

export const sequelize = new Sequelize(BD_NAME,BD_USER, BD_PASS,{
  host: BD_HOST,
  dialect: 'postgres',
  logging: false,
  timezone:'+00:00',
  define:{
    timestamps:true,
    underscored:true,
  },
  // --- INICIO DE AJUSTE PARA AZURE ---
  dialectOptions: isAzure ? {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  } : {}
});

const connectBD = async() =>{
  try{
    await sequelize.authenticate();
    console.log('Conexion a base de datos existosa')
  }catch(error){
    console.log(error);
  }
}

export {connectBD}