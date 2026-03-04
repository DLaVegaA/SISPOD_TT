import { Request, Response } from 'express';
import { Usuario } from '../models/index';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { error } from 'node:console';
import {generarContra} from '../helpers/generarContra';


export const registrarUsuario = async (req:Request, res:Response) =>{
    try {
        
        const {nombre, id_rol,apellido_paterno,apellido_materno,correo,telefono, fecha_nacimiento, curp, genero} = req.body;

        const correoExiste = await Usuario.findOne({where:{correo}});
        let {contrasena} = req.body;

        if(correoExiste){
            return res.status(400).json({message:"El correo ya está registrado"})
        }
        const curpExiste = await Usuario.findOne({where:{curp}});
        
        if(curpExiste){
            return res.status(400).json({message:"La CURP ya está registrada"})
        }

        if(id_rol==3){
            contrasena = generarContra();
            console.log("Contraseña para el paciente: ", contrasena);
        }

        const usuarioNuevo = await Usuario.create({
            id_rol,
            nombre,
            apellido_paterno,
            apellido_materno,
            correo,
            contrasena,
            telefono,
            fecha_nacimiento,
            curp,
            genero
        })

        return res.status(201).json({
            message:"Usuario creado correctamente",
            usuario:{
                id: usuarioNuevo.id_usuario,
                nombre:usuarioNuevo.nombre,
                correo:usuarioNuevo.correo,
                id_rol:usuarioNuevo.id_rol
            }
        });



    } catch(error){
        console.log("Error al registrar usuario: ", error)
        res.status(500).json({message:"Error del servidor"});
    }
    
        
    
}