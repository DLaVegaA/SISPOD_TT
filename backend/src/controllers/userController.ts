import { Request, Response } from 'express';
import { Usuario,Role,Paciente, Token } from '../models/index';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { error } from 'node:console';
import {generarContra} from '../helpers/generarContra';
import { sequelize } from '../config/database';
import {generarToken} from '../helpers/generarToken';
import transporter from '../helpers/mailer'

export const registrarUsuario = async (req:Request, res:Response) =>{
    const t = await sequelize.transaction();
    
    let committed = false;
    try {
        
        const {nombre, id_rol,apellido_paterno,apellido_materno,correo,telefono, fecha_nacimiento, curp, genero} = req.body;

        const correoExiste = await Usuario.findOne({where:{correo}, transaction:t});
        let {contrasena} = req.body;

        if(correoExiste){
            await t.rollback();
            return res.status(400).json({message:"El correo ya está registrado"})
        }
        const curpExiste = await Usuario.findOne({where:{curp},transaction:t});
        
        if(curpExiste){
            await t.rollback();
            return res.status(400).json({message:"La CURP ya está registrada"})
        }
        const  estado = id_rol === 3 ? 'pendiente' : 'activo';
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
                genero,
                estado
            },{transaction:t}
        )

        let pacienteNuevo;
        let token;
        if(id_rol === 3){
            //Crear el paciente 
            pacienteNuevo = await Paciente.create(
                {id_usuario: usuarioNuevo.id_usuario},
                {transaction:t}
            );
            token = generarToken();
            const expira = new Date();
            expira.setHours(expira.getHours()+24);
            const tokenPaciente = await Token.create({
                id_usuario: usuarioNuevo.id_usuario,
                token:token,
                tipo:"activacion",
                expira_en:expira
            },{
                transaction:t
            });
            console.log("El token de paciente es: ", token, " y expira en: ", expira);


        }

        await t.commit();
        committed = true;
        if(id_rol === 3){
            await transporter.sendMail({
                to: usuarioNuevo.correo,
                subject: "Activar cuenta",
                template: "activarCuentaPaciente",
                context: {
                    nombre: usuarioNuevo.nombre,
                    link: `http://localhost:3000/auth/activar-cuenta?token=${token}`,
                    year: new Date().getFullYear()
                }
            } as any);
        }

        return res.status(201).json({
            message:"Usuario creado correctamente",
            usuario:{
                id: usuarioNuevo.id_usuario,
                nombre:usuarioNuevo.nombre,
                correo:usuarioNuevo.correo,
                id_rol:usuarioNuevo.id_rol
            },
        });



    } catch(error){
        if(!committed){
            await t.rollback();
        }
        console.log("Error al registrar usuario: ", error)
        res.status(500).json({message:"Error del servidor"});
    } 
}

export const listarUsuarios = async (req:Request, res:Response) =>{
    console.log(req.query.pagina);
    const pagina = Number(req.query.pagina) || 1;
    console.log(pagina);

    try {
        const limit = 10;
        const offset =((pagina*limit)-limit);

        const{count:total, rows:usuarios} = await Usuario.findAndCountAll({
            limit:limit,
            offset:offset,
            attributes:{
                exclude:["contrasena"]
            },
            include:[
                {model:Role, as:'role'}
            ]
        });

        return res.json({
            total,
            pagina,
            totalPaginas: Math.ceil(total/limit),
            usuarios
        });
    } catch (error) {
        console.log("Error al listar usuarios: ", error);
        return res.status(500).json({
            message:"Error del Servidor"
        });
    }
}