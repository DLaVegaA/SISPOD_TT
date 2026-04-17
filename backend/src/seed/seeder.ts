import { exit } from 'node:process'
import {sequelize} from '../config/database';
import roles from './roles';
import usuarios from './usuarios';
import { Usuario, Role } from '../models';
import { seedDentista, seedPacientes } from "./Dentista_pacientes";

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

const importarDatos_pa_dent = async () => {
    try {
        await seedDentista();
        await seedPacientes();
        
        console.log('Todos los datos fueron importados correctamente');
        process.exit(0);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
};

const comando = process.argv[2];

if(comando === "-i"){
    importarDatos();
    importarDatos_pa_dent();
}
if(comando === "-e"){
    eliminarDatos();
}
