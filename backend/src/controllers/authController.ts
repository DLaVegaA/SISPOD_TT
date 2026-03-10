import { Request, Response } from 'express';
import { Usuario, Token, Paciente } from '../models/index';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const login = async (req:Request, res:Response) =>{
    try{
        const {correo, password} = req.body;
        if(!correo || !password){
            return res.status(400).json({message:'Datos incompletos'})
        }

        const usuario = await Usuario.findOne({where:{correo}});



        if(!usuario){
            return res.status(404).json({message:'Credenciales Inválidas'});
        }

        if(usuario.estado !== 'activo'){
            return res.status(403).json({message:'La cuenta no está activa'});
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
            sameSite:'lax', //Investigar
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

export const activarCuenta = async (req:Request, res:Response) =>{
    try{
        const {token,password} = req.body;

        const tokenBD = await Token.findOne({
            where:{
                token,
                tipo:'activacion'
            }
        });

        if(!tokenBD){
            return res.status(400).json({
                message:'Token invalido'
            });
            //Hcaer funcion para renviar el correo con un nuevo token
        }

        console.log('Fecha de expiracion del token ',tokenBD.expira_en, ' Fecha a comparar ', new Date());
        if(tokenBD.expira_en < new Date()){
            return res.status(400).json({
                message: 'Token expirado'
            });
            //Hacer funcion para reenviar codigo por que expiro
        }

        const usuario = await Usuario.findByPk(tokenBD.id_usuario);

        if(!usuario){
            return res.status(404).json({
                message:'Usuario no encontrado'
            });
        }


        //Actualizar estado, falta actualizar la tabla

        await usuario.update({
            contrasena: password,
            estado:'activo'
        })
        await tokenBD.destroy();

        return res.json({
            message:'Cuenta activa con exito'
        });

    }catch(error){
        console.log('Error al activar cuenta: ', error);
        return res.status(500).json({
            message:'Error del servidor'
        });
    }
}
