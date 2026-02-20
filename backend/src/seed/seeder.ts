import {sequelize} from '../config/database';
import roles from './roles';
import usuarios from './usuarios';

import { Usuario, Role } from '../models';

const importarDatos = async() =>{
    try{
       await sequelize.authenticate()

       await sequelize.sync()

       await Role.bulkCreate(roles)
    //    await 
    }catch(error){
        console.log(error)
    }
}