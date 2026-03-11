import {Request, Response} from 'express';
import {Paciente, Direccion} from '../models/index';


export const crearDireccionPaciente = async(req:Request, res:Response) =>{
    try {
        const id = Number(req.params.id);
        if(isNaN(id)){
            return res.status(400).json({
                message: 'ID de paciente inválido'
            });
        }
        const {calle, num_ext,num_int,colonia, municipio, estado, codigo_postal}= req.body;
        if(!calle || !num_ext || !colonia || !municipio || !estado || !codigo_postal){
            return res.status(400).json({
                message: 'Datos de dirección incompletos'
            });
        }

        if(codigo_postal.length !== 5){
            return res.status(400).json({
                message: 'Codigo postal inválido'
            });
        }

        const paciente =await Paciente.findByPk(id);

        if(!paciente){
            return res.status(400).json({
                message:'Paciente no encontrado'
            });
        }

        const direccionExitse = await Direccion.findOne({
            where:{id_paciente:id}
        });

        if(direccionExitse){
            return res.status(400).json({
                message:'El Paciente ya tiene una dirección registrada'
            });
        }
        const direccionPaciente = await Direccion.create({
            id_paciente:id,
            calle,
            num_ext,
            num_int,
            colonia,
            municipio,
            estado,
            codigo_postal
        });

        return res.status(201).json({
            message:'Dirección creada correctamente',
            direccionPaciente
        });
    } catch (error) {
        console.log('Error al crear Direccion del paciente: ',error);
        return res.status(500).json({
            message:'Error al crear la direccion'
        });
    }
}