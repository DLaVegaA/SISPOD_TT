import { exit } from 'node:process'
import {sequelize} from '../config/database';
import roles from './roles';
import usuarios from './usuarios';
import tipo_citas from './tipo_cita';
import { Usuario, Role, Padecimiento } from '../models';
//import { seedDentista, seedPacientes } from "./Dentista_pacientes";
import { seedDentista } from "./Dentista_pacientes";
import { TipoCita } from '../models/Tipo_Citas';
import procedimientos_postoperatorios from './catalogo_procedimientos'
import {Catalogo_Procedimientos} from '../models/Catalogo_Procedimientos'
import padecimientos from './padecimientos'
import { seedCuestionarios } from './cuestionarios';

const importarDatos = async() =>{
    try{
       await sequelize.authenticate();

       await sequelize.sync();

       await Role.bulkCreate(roles,{
            ignoreDuplicates:true
       });

       await TipoCita.bulkCreate(tipo_citas,{
        ignoreDuplicates:true
       });
    //    await 
       await Usuario.bulkCreate(usuarios,{
            ignoreDuplicates:true
       });

       await Padecimiento.bulkCreate(padecimientos,{
            ignoreDuplicates:true
       });

       await Catalogo_Procedimientos.bulkCreate(procedimientos_postoperatorios,{
            ignoreDuplicates:true
       });

       await seedCuestionarios();

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
        // await seedPacientes();
        
        console.log('Todos los datos fueron importados correctamente');
        process.exit(0);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
};

const comando = process.argv[2];

/* if(comando === "-i"){
    importarDatos();
    importarDatos_pa_dent();
}
if(comando === "-e"){
    eliminarDatos();
} */

const runSeeder = async () => {
    if(comando === "-i"){
        await importarDatos(); // 1. Primero crea tablas, roles y usuarios
        await importarDatos_pa_dent(); // 2. Hasta que acabe lo anterior, inserta pacientes y dentistas
    }
    if(comando === "-e"){
        await eliminarDatos();
    }
};

runSeeder();
