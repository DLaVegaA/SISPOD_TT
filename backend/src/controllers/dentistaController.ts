import {Request, Response} from 'express';
import {Usuario,Role,Dentista} from '../models/index';
import { sequelize } from '../config/database';



export const registrarDentista =async(req:Request, res:Response)=>{
    const{nombre, id_rol,apellido_paterno,apellido_materno,correo,contrasena,telefono, fecha_nacimiento, curp, genero, no_cedula} = req.body;
    if(!nombre || !id_rol || !apellido_paterno || !apellido_materno || !correo || !contrasena || !telefono || !fecha_nacimiento || !curp || !genero || !no_cedula){
        return res.status(400).json({
            message: 'Faltan datos obligatorios'
        });
    }
    
    if(id_rol !==2){
        return res.status(400).json({
            message: 'No se puede registrrar al usuario'
        });
    }
    const t = await sequelize.transaction();
    let committed = false;
    try{
        const correoExiste = await Usuario.findOne({where:{correo}, transaction:t});
        if(correoExiste){
            await t.rollback();
            return res.status(400).json({
                message:'El correo electrónico ya está registrado'
            });
        }

        const curpExiste = await Usuario.findOne({where:{curp}, transaction:t});
        if(curpExiste){
            await t.rollback();
            return res.status(400).json({
                message:'La CURP ya está registrada'
            });
        }

        //Poner validacion para contraseña
        const estado = 'activo';

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
        },{transaction:t});

        await Dentista.create({
            id_usuario:usuarioNuevo.id_usuario,
            no_cedula
        },{transaction:t});

        await t.commit();
        committed=true;
        return res.status(201).json({
            message:'Dentista creado correctamente',
            usuario:{
                id_usuario:usuarioNuevo.id_usuario,
                nombre: usuarioNuevo.nombre,
                correo: usuarioNuevo.correo
            }
        });
    }catch(error){
        if(!committed){
            await t.rollback();
        }
        console.log('Error al registrar Dentista: ',error);
        return res.status(500).json({
            message:'Error del servidor'
        })
    }
    
}

export const listarDentistas = async(req:Request, res:Response) =>{
    const pagina = Number(req.query.pagina) || 1;
    console.log(pagina);

    try {
        const limit =10;
        const offset =((pagina*limit)-limit);
        const{count:total, rows:dentistas} = await Dentista.findAndCountAll({
            limit:limit,
            offset:offset,
            include:[
                {
                    model:Usuario,
                    as:'usuario',
                    attributes:{
                        exclude:['contrasena']
                    },
                    where:{
                        estado:'activo'
                    }
                }
            ]
        });

        const totalPaginas = Math.ceil(total/limit);

        return res.status(200).json({
            message:'Dentistas',
            total,
            totalPaginas,
            limit,
            dentistas
        })

    } catch (error) {
        console.log('Error al listar usuarios: ', error);
        return res.status(500).json({
            message:'Error del servidor'
        });
    }
}

export const obtenerDentista= async(req:Request, res:Response) =>{
    const id_dentista = Number(req.params.id);

    if(isNaN(id_dentista)){
        return res.status(400).json({
            message:'ID invalido'
        });
    }

    try{
        const dentista = await Dentista.findByPk(id_dentista,{
            include:[
                {
                    model:Usuario,
                    as:'usuario',
                    attributes:{
                        exclude:['contrasena']
                    },
                    where:{
                        estado:'activo'
                    }
                }
            ]
        });

        if(!dentista){
            return res.status(404).json({
                message:'Dentista no encontrado'
            });
        }

        return res.status(200).json({
            message:'Dentista encontrado',
            dentista
        });

    }catch(error){
        console.log('Error al obtener Dentista: ', error);
        return res.status(500).json({
            message:'Error del Servidor'
        })
    }
}
