import { Request, Response } from 'express';
import { Usuario,Role, Asistente} from '../models/index';
import { sequelize } from '../config/database';
import { CustomRequest } from '../middleware/authMiddleware';


/**
 * POST /usuarios/
 * Registra al usario con los datos necesarios y en caso de ser paciente envia correo con token
 * body{
 *  correo string
 *  nombre string",
 *  id_rol number,
 *  apellido_paterno string,
 *  apellido_materno string,
 *  telefono string(10 caracteres),
 *  fecha_nacimiento date,
 *  curp  string (18 caracteres),
 *  genero string,
 *  contrasena string (si es paciente no se manda)
 * }
 * res 201
 * {
 *  message : Usuario creado correctamente,
 *  usuario{
 *  id,
 *  nombre,
 *  correo,
 *  id_rol,
 *  cedula en caso de que id_rol sea 2
 * }
 * 
 * errores
 *  400 - El correo ya está registrado
 *  400 - La CURP ya está registrada
 *  400 - La contraseña es obligatoria
 *  500 - Error del servidor
 */
export const registrarUsuario = async (req:Request, res:Response) =>{
    const {nombre, id_rol,apellido_paterno,apellido_materno,correo,telefono, fecha_nacimiento, curp, genero, contrasena} = req.body;
        if(!nombre || !id_rol || !apellido_paterno || !apellido_materno || !correo || !contrasena || !telefono || !fecha_nacimiento || !curp || !genero){
        return res.status(400).json({
            message: 'Faltan datos obligatorios'
        });
    }

    if(id_rol !==1 && id_rol !== 4 ){
        return res.status(400).json({
            message: 'No se puede registrar al usuario'
        });
    }
    const t = await sequelize.transaction();
    let committed = false;
    try {
        
        const correoExiste = await Usuario.findOne({where:{correo}, transaction:t});
        
        if(correoExiste){
            await t.rollback();
            return res.status(400).json({message:"El correo ya está registrado"})
        }
        const curpExiste = await Usuario.findOne({where:{curp},transaction:t});
        
        if(curpExiste){
            await t.rollback();
            return res.status(400).json({message:"La CURP ya está registrada"})
        }
        const  estado = 'activo';

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
        );

        if(id_rol ===4){
            await Asistente.create({
                id_usuario: usuarioNuevo.id_usuario
            },{transaction:t})
        }

        await t.commit();
        committed = true;

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

/**
 * GET /usuarios/
 * Lista todos los usuarios registrados en el sistema
 * (Solo lo debe usar el admin)
 * query{
 *  pagina (pagina?=)
 * }
 * res{
 *  total,
 *  pagina,
 *  totalPaginas,
 *  usuarios (arreglo)
 * }
 */

export const listarUsuarios = async (req:Request, res:Response) =>{
    const pagina = Number(req.query.pagina) || 1;
    const estadoFiltro = req.query.estado as string;
    const estadosValidos = ['activo','eliminado', 'todos'];
    const rawRol = req.query.id_rol; //revisa si el usuario mando algo en la url
    if(estadoFiltro &&!estadosValidos.includes(estadoFiltro)){
        return res.status(400).json({
            message:'Estado no válido'
        });
    }
    const rolFiltro = rawRol ? Number(rawRol) :null; //Si el usuario mando algo en la url validamos que sea un numero real 
    if (rawRol && isNaN(rolFiltro as number)) {
        return res.status(400).json({ message: 'ID de rol inválido' });
    }
    try {
        const limit = 10;
        const offset =((pagina*limit)-limit);
        const whereFiltro: any={};

        if (estadoFiltro && estadoFiltro !== 'todos') {
            whereFiltro.estado = estadoFiltro;
        } else if (!estadoFiltro) {
            whereFiltro.estado = 'activo'; 
        }

        if (rolFiltro) {
            whereFiltro.id_rol = rolFiltro;
        }
        const{count:total, rows:usuarios} = await Usuario.findAndCountAll({
            limit:limit,
            offset:offset,
            distinct:true,//Cuenta solo id's unicos
            where:whereFiltro,
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
            usuarios,
            limit
        });
    } catch (error) {
        console.log("Error al listar usuarios: ", error);
        return res.status(500).json({
            message:"Error del Servidor"
        });
    }
}

/**
 * GET /usuarios/:id
 *  Lista un usuario en especifico mediante su id
 * params
 * {
 *  id
 * }
 * res 200
 * {
 * id_usuario,
 *   nombre,
 *   apellido_paterno,
 *   apellido_materno,
 *   correo,
 *   telefono,
 *   fecha_nacimiento,
 *   curp,
 *   genero,
 *   estado,
 *   id_rol,
 *   paciente: { (opcional)
 *      id_paciente,
 *      id_usuario,
 *      direccion: {
 *          id_direccion,
 *          calle,
 *          numero,
 *          colonia,
 *          ciudad,
 *          estado,
 *          codigo_postal
 *      }
 *   }
 * }
 * 
 * errores
 * 400 - ID inválido
 * 404 - Usuario no encontrado
 * 500 - Error del servidor
 */
export const obtenerUsuario = async(req:Request, res:Response) =>{
    try {
        const id_usuario = Number(req.params.id);
        
        if(isNaN(id_usuario)){
            return res.status(400).json({
                message: 'ID inválido'
            });
        }
    
        const usuario = await Usuario.findByPk(id_usuario,{
            attributes:{exclude:['contrasena']},
        });
    
    
        if(!usuario){
            return res.status(404).json({
                message:'Usuario no encontrado'
            });
        }
    
        return res.status(200).json({
            message:'Usuario encontrado',    
            usuario
        });

    } catch (error) {
        console.log('Error al obtener usuario: ', error);
        return res.status(500).json({
            message: 'Error del Servidor'
        });
    }
}


export const actualizarUsuario = async(req:Request, res:Response) => {
    const id_usuario = Number(req.params.id);
    if(isNaN(id_usuario)){
        return res.status(400).json({
            message:'ID inválido'
        });
    }
    const {nombre, apellido_materno, apellido_paterno, telefono, correo} = req.body;
    if(!nombre||!apellido_paterno||!apellido_materno||!telefono||!correo){
        return res.status(400).json({
            message:'Faltan datos obligatorios'
        });
    }

    const t =await sequelize.transaction();
    try {
        const usuario = await Usuario.findByPk(id_usuario,{transaction:t})
        if(!usuario){
            await t.rollback();
            return res.status(400).json({
                message:'Usuario no encontrado'
            });
        }

        await usuario.update({
            nombre,
            apellido_paterno,
            apellido_materno,
            telefono, 
            correo
        },{transaction:t});
        
        await t.commit();
        return res.status(200).json({
            message:'Perfil del usuario actualizado'
        });

    } catch (error:any) {
        if(t) await t.rollback();
         console.log('Error al editar usuario: ', error);
        if(error.name === 'SequelizeUniqueConstraintError'){
            return res.status(400).json({
                message:'El correo electrónico están registrados'
            });
        }
        return res.status(500).json({
            message:'Error del servidor'
        });
    }
}

/**
 * DELETE /usuarios/:id
 * Elimina un usuario del sistema de forma lógica
 * 
 * params
 * {
 *  id
 * }
 * 
 * res 200
 * {
 *  message Usuario eliminado
 * }
 * errores
 *  400 - ID inválido
 *  404 - Usuario no encontrado
 *  500 - Error del servidor
 */
export const eliminarUsuario = async(req:Request, res:Response) => {
    const id = Number(req.params.id);
    if(isNaN(id)){
        return res.status(400).json({
            message: 'ID inválido'
        });
    }
    try {

        const usuario= await Usuario.findByPk(id,{
            attributes:{exclude:['contrasena']}
        });

        if(!usuario){
            return res.status(404).json({
                message:'Usuario no encontrado'
            });
        }

        await usuario.update({
            estado:'eliminado'
        });

        return res.status(200).json({
            message:'Usuario eliminado'
        });

        
    } catch (error) {
        console.log('Error al eliminar Usuario: ', error);
        return res.status(500).json({
            message:'Error del Servidor'
        });
    }
}

export const activarUsuario = async(req:Request, res:Response)=>{
    const id_usuario =Number(req.params.id);

    if(isNaN(id_usuario)){
        return res.status(400).json({
            message:'ID inválido'
        });
    }
    try{
        const usuario = await Usuario.findOne({
            where:{
                id_usuario,
                estado: 'eliminado'
            }
        });

        if(!usuario){
            return res.status(404).json({
                message:'Usuario no encontrado o ya se encuentra activo'
            });
        }

        await usuario.update({
            estado:'activo'
        });

        return res.status(200).json({
            message:'Usuario activado'
        });
    }catch(error){
        console.log('Error al activar usuario: ', error);
        return res.status(500).json({
            message:'Error del servidor'
        });
    }
}

export const obtenerPerfilUsuario = async(req:CustomRequest, res:Response) =>{
    try {
        const id_usuario = req.userData?.id;
        if (!id_usuario) {
            return res.status(401).json({ message: "Sesión no válida" });
        }   

        const perfil = await Usuario.findOne({
            where:{id_usuario},
            attributes:{exclude:['contrasena']}
        });

        if(!perfil){
            return res.status(404).json({
                message:'Perfil no encontrado'
            });
        }
        return res.json(perfil);
    } catch (error) {
        console.log('Error al obtener perfil del usuario: ',error);
        return res.status(500).json({
            message:'Error del servidor'
        });
    }
}