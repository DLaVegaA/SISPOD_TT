import { exit } from 'node:process'
import {sequelize} from '../config/database';
import roles from './roles';
import usuarios from './usuarios';

import { Usuario, Role } from '../models';

const importarDatos = async() =>{
    try{
       await sequelize.authenticate();

       await sequelize.sync();

       await Role.bulkCreate(roles,{
            ignoreDuplicates:true
       });
    //    await 
       await Usuario.bulkCreate(usuarios,{
            ignoreDuplicates:true
       });

       console.log('Datos importados correctamente');
    }catch(error){
        console.log(error)
        exit(1);
    }
}

const eliminarDatos = async() =>{
    try{
        await sequelize.sync({force:true})
        console.log('Datos Eliminados Correctamente')
    }catch(error){
        console.log(error)
        exit(1)
    }
}

const comando = process.argv[2];

if(comando === "-i"){
    importarDatos();
}
if(comando === "-e"){
    eliminarDatos();
}
