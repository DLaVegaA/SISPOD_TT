import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config()

const BD_NAME = process.env.BD_NAME as string;
const BD_USER = process.env.BD_USER as string;
const BD_PASS = process.env.BD_PASS as string;
const BD_HOST = process.env.BD_HOST as string;


export const sequelize = new Sequelize(BD_NAME,BD_USER, BD_PASS,{
  host: BD_HOST,
  dialect: 'postgres',
  logging: false,
  define:{
    timestamps:true,
    underscored:true,
  }
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