import { Response, Request} from 'express';
import { Cita, Paciente, Dentista } from '../models/index';


// export const crearCita = async (req:Request, res:Response) =>{
//     try{
//         const {fecha_hora_inicio, fecha_hora_fin, tipo_cita} = req.body;
//         let id_dentista = req.body.id_dentista;

//         if(req.userData?.id_rol === 2){
            
//         }
//     }catch(error){
//         console.log('Error al crear cita: ', error);
//         return res.status(500).json({
//             message:'Error del servidor'
//         });
//     }
// }