import { Request, Response } from "express";
import { Paciente, Telegram } from "../models/index";
import { CustomRequest } from "../middleware/authMiddleware";
import { generarToken } from "../helpers/generarToken";

export const generarTokenVinculacion =async(req:CustomRequest, res:Response) =>{
    try{
        const id_usuario = req.userData?.id;

        const paciente = await Paciente.findOne({
            where:{id_usuario},
            attributes:{exclude:['contrasena']}
        });
        if(!paciente){
            return res.status(404).json({message:'Paciente no encontrado'});
        }
        const id_paciente = paciente.id_paciente;
        const token= generarToken();

        await Telegram.upsert({
            id_paciente,
            token, 
            chat_id:null
        });

        return res.status(200).json({
            token,
            link:`https://t.me/ConsultorioGonzalez_bot?start=${token}`
        });


    }catch(error){
        console.log('Error al generar token para vincular: ', error);
        return res.status(500).json({
            message:'Error del sservidor'
        });
    }

}