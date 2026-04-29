import { Request, Response } from 'express';
import {TipoCita} from '../models/index';


export const listarTipoCitas = async(req:Request, res:Response) =>{
    try{
        const tipos = await TipoCita.findAll();
        const tiposFormateados = tipos.map(tipo =>({
            id_tipocita:tipo.id_tipocita,
            nombre: `${tipo.nombre_corto} (${tipo.duracion} min)`
        }));
        return res.json(tiposFormateados)
    }catch(error){
        console.log('Error al listar tipos de citas');
        return res.status(500).json({message:'Error del servidor'})
    }
}

export const obtenerDetalleTipo = async(req:Request, res:Response) =>{
    try {
        const { id } = req.params;
        
        const tipo = await obtenerTipoCita(Number(id)); 

        if (!tipo) {
            return res.status(404).json({ message: 'Tipo de cita no encontrado' });
        }

        return res.json(tipo);
    } catch (error) {
        return res.status(500).json({ message: 'Error al obtener el tipo de cita' });
    }
}

export const obtenerTipoCita = async(id_tipocita:number) =>{
    const tipo = await TipoCita.findByPk(id_tipocita);
    return tipo;
}