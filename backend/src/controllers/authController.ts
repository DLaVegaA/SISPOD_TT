import { Request, Response } from 'express';
import { Usuario, Token, Paciente } from '../models/index';
import {generarToken} from '../helpers/generarToken';
import transporter from '../helpers/mailer';
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


export const cerrarSesion = async(req:Request, res:Response) => {
    try {

        res.clearCookie('token',{
            httpOnly:true,
            sameSite:'lax',
            secure:false
        });

        return res.json({
            message:'Sesión cerrada correctamente'
        });
    } catch (error) {
        console.log('Error al cerrar sesión:',error);
        return res.status(500).json({
            message:'Error al cerrar sesión'
        });
    }
}

/**
 * POST  /auth/activar-cuenta/:token
 * Cambia el estado del pacienta a activo, mediante el token enviado por correo despues de crearse un paciente 
 */
export const activarCuenta = async (req:Request, res:Response) =>{
    try{
        const token = req.params.token;
        const {password} = req.body;

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

export const olvidoContrasena =async (req:Request, res:Response) =>{
    try {
        const {correo} = req.body;
    
        if(!correo){
            return res.status(400).json({message:'Ingresa un correo'});
        }

        const usuarioExiste = await Usuario.findOne({where:{correo}});

        if(!usuarioExiste){
            return res.status(400).json({message:'Usuario no encontrado'});
        }

        const tokenFinal = generarToken();
        const expira = new Date();
        expira.setHours(expira.getHours()+1);
        
        const tokenActivo = await Token.findOne({
            where:{
                id_usuario:usuarioExiste.id_usuario,
                tipo: 'recuperacion'
            }
        });
    
        if(tokenActivo){
            await tokenActivo.update({
                token:tokenFinal,
                expira_en:expira
            })
        }else{
            await Token.create({
                id_usuario:usuarioExiste.id_usuario,
                token:tokenFinal,
                tipo:'recuperacion',
                expira_en:expira
            });
        }


        await transporter.sendMail({
            to:usuarioExiste.correo,
            subject: 'Olvidaste tu contraseña',
            template: 'recuperarPassword',
            context:{
                nombre:usuarioExiste.nombre,
                link:`http://localhost:3000/auth/reset-password?token=${tokenFinal}`,
                year: new Date().getFullYear()
            }
        } as any);

        return res.status(200).json({message:'Se envio un correo con las instrucciones'});
        
        
    } catch (error) {
        console.log('Error en olvido contraseña: ',error);
        return res.status(500).json({message: 'Error del servidor'});
    }
}


export const validarToken = async(req:Request, res:Response) =>{

}
//Hcaer funcion que valide el token antes de que llegar al formulario 
export const resetPassword = async(req:Request, res:Response) =>{
    const token = req.params.token;
    const {contrasena} = req.body

    try {
        if(!token){
            return res.status(200).json({
                message: 'Token requerido'
            });
        }

        if(!contrasena){
            return res.status(400).json({message:'La contraseña es obligatoria'});
        }
        
        const tokenBD = await Token.findOne({
            where:{
                token,
                tipo:'recuperacion'
            }
        });

        if(!tokenBD){
            return res.status(400).json({
                message: 'Token inválido'
            });
        }

        if(tokenBD.expira_en< new Date()){
            return res.status(400).json({
                message:'Token expirado, solicta uno nuevo'
            });
        }

        const usuario= await Usuario.findByPk(tokenBD.id_usuario);

        if(!usuario){
            return res.status(404).json({
                message:'Usuario no encontrado'
            });
        }

        await usuario.update({
            contrasena
        });

        await tokenBD.destroy();

        return res.json({
            message:'Contraseña actualizada correctamente'
        })

    } catch (error) {
        console.log('Error al resetear contraseña: ', error);
        return res.status(500).json({
            message:'Error del servidor'
        });
    }
}