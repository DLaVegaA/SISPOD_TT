import { Request, Response } from 'express';
import { Usuario,Role } from '../models/index';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { error } from 'node:console';
import {generarContra} from '../helpers/generarContra';
import { sequelize } from '../config/database';
import { Paciente } from '../models/Paciente';


export const registrarUsuario = async (req:Request, res:Response) =>{
    const t = await sequelize.transaction();
    
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
            },{transaction:t}
        )

        let pacienteNuevo;
        if(id_rol === 3){
            //Crear el paciente 
            pacienteNuevo = await Paciente.create(
                {id_usuario: usuarioNuevo.id_usuario},
                {transaction:t}
            );
        }

        await t.commit()

        return res.status(201).json({
            message:"Usuario creado correctamente",
            usuario:{
                id: usuarioNuevo.id_usuario,
                nombre:usuarioNuevo.nombre,
                correo:usuarioNuevo.correo,
                id_rol:usuarioNuevo.id_rol
            },
            id_paciente: pacienteNuevo?.id_paciente //Pensar si esto es util
        });



    } catch(error){
        await t.rollback();
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