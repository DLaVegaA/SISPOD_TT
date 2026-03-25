import {Request, Response} from 'express';
import {Paciente, Direccion, Usuario,Token} from '../models/index';
import { sequelize } from '../config/database';
import {generarContra} from '../helpers/generarContra';
import {generarToken} from '../helpers/generarToken';
import transporter from '../helpers/mailer';

export const registrarPaciente = async(req:Request, res:Response)=>{
    const{nombre,id_rol,apellido_paterno, apellido_materno, correo,telefono, fecha_nacimiento,curp, genero
        ,calle,num_ext, num_int, colonia, municipio, estado, codigo_postal
    } = req.body;

    if(!nombre || !id_rol || !apellido_materno || !apellido_paterno || !correo || !telefono || !fecha_nacimiento || !curp || !genero){
        return res.status(400).json({
            message:'Faltan datos obligatorios'
        });
    }

    if(!calle|| !num_ext || !num_int || !colonia || !municipio || !estado || !codigo_postal){
        return res.status(400).json({
            message:'Faltan datos en dirección'
        });
    }
    if(codigo_postal.length !== 5){
        return res.status(400).json({
            message: 'Codigo postal inválido'
        });
    }


    if(id_rol !== 3){
        return res.status(400).json({
            message:'No se puede registar al usuario'
        });
    }
    const t = await sequelize.transaction();
    let committed = false;
    try {
        const correoExiste = await Usuario.findOne({where:{correo},transaction:t});
        if(correoExiste){
            await t.rollback();
            return res.status(400).json({
                message:'El correo electrónico ya está registrado'
            });
        }

        const curpExiste = await Usuario.findOne({where:{curp},transaction:t});
        if(curpExiste){
            await t.rollback();
            return res.status(400).json({
                message: 'La CURP ya está registrada'
            });
        }

        const estadoCuenta = 'pendiente';

        const usuarioNuevo = await Usuario.create({
            id_rol,
            nombre,
            apellido_paterno,
            apellido_materno,
            correo, 
            contrasena: generarContra(),
            telefono,
            fecha_nacimiento,
            curp,
            genero,
            estado:estadoCuenta
        },{transaction:t});

        const pacienteNuevo = await Paciente.create({
            id_usuario:usuarioNuevo.id_usuario
        },{transaction:t});

        const token = generarToken();
        const expira = new Date();
        expira.setHours(expira.getHours()+24);
        const tokenPaciente = await Token.create({
            id_usuario:usuarioNuevo.id_usuario,
            token,
            tipo:'activacion',
            expira_en:expira
        },{transaction:t});

        const direccionPaciente = await Direccion.create({
            id_paciente:pacienteNuevo.id_paciente,
            calle,
            num_ext,
            num_int,
            colonia,
            municipio,
            estado,
            codigo_postal
        },{transaction:t});

        await transporter.sendMail({
            to:usuarioNuevo.correo,
            subject:'Activar Cuenta',
            template: "activarCuentaPaciente",
            context: {
                    nombre: usuarioNuevo.nombre,
                    link: `http://localhost:3000/auth/activar-cuenta?token=${token}`,
                    year: new Date().getFullYear()
            }
        } as any);
        await t.commit();
        committed = true;
        return res.status(200).json({
            message:"Usuario creado correctamente",
            usuario:{
                id: usuarioNuevo.id_usuario,
                nombre:usuarioNuevo.nombre,
                correo:usuarioNuevo.correo,
                id_rol:usuarioNuevo.id_rol
            },
        });
    } catch (error) {
        if(!committed){
            await t.rollback()
        }
        console.log('Error al registrar Paciente: ', error);
        return res.status(500).json({message:'Error del servidor'});
    }
}


