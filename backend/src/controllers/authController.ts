import { Request, Response } from 'express';
import { Usuario } from '../models/index';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const login = async (req:Request, res:Response) =>{
    try{
        const {correo, password} = req.body;
        if(!correo || !password){
            return res.status(400).json({message:'Datos incompletos'})
        }

        const usuario = await Usuario.findOne({where:{correo:correo}});



        if(!usuario){
            return res.status(404).json({message:'Credenciales Inválidas'});
        }

        const contraValida = await usuario.validarPassword(password);

        if(!contraValida){
            return res.status(401).json({message:'Credenciales Inválidas'})
        }

        const token= jwt.sign(
            {
                id:usuario.id_usuario,
                id_rol:usuario.id_rol
            },
            process.env.JWT_SECRET as string,
            {expiresIn: '2h'},
        );

        res.cookie("token",token,{
            httpOnly:true,
            secure:false, //Investigar si al hostear se cambia a true
            sameSite:true,
            maxAge: 2 * 60 * 60 * 1000
        });

        return res.json({
            message: "Login exitoso"
        });
    }catch(error){
        console.log('Error login: ', error)
        res.status(500).json({message:'Error del Servidor'})
    }

}
