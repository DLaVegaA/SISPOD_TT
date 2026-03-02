import { DataTypes, Model} from 'sequelize';
import { sequelize } from '../config/database'; 
import bcrypt from "bcryptjs";
import usuarios from '../seed/usuarios';

export class Usuario extends Model {
    declare id_usuario: number;
    declare id_rol:number;
    declare nombre:string;
    declare apellido_paterno:string;
    declare apellido_materno:string;
    declare correo:string;
    declare contrasena:string;
    declare telefono:string;
    declare fecha_nacimiento: string;
    declare curp:string;
    declare genero:string;

    public async validarPassword(password:string): Promise<boolean>{
        return await bcrypt.compare(password, this.contrasena);
    }
}

Usuario.init(
    {
        id_usuario:{
            type:DataTypes.INTEGER,
            autoIncrement:true,
            primaryKey:true
        },
        id_rol:{
            type:DataTypes.INTEGER,
            allowNull:false,
            references:{
                model: 'roles',
                key: 'id_rol'
            }
        },
        nombre:{
            type:DataTypes.STRING(100),
            allowNull:false
        },
        apellido_paterno:{
            type:DataTypes.STRING(100),
            allowNull:false
        }, 
        apellido_materno:{
            type:DataTypes.STRING(100),
            allowNull:true
        },
        correo:{
            type:DataTypes.STRING(100),
            allowNull:false,
            unique:true,
            validate:{
                isEmail:true
            },
        },
        contrasena:{
            type:DataTypes.STRING,
            allowNull:false
        },
        telefono:{
            type:DataTypes.STRING(10),
            allowNull: false
        },
        fecha_nacimiento:{
            type:DataTypes.DATEONLY,
            allowNull:false
        },
        curp:{
            type:DataTypes.STRING(18),
            allowNull:false,
            unique:true
        },
        genero:{
            type:DataTypes.STRING(20),
            allowNull:false
        }

    },
    {
        sequelize,
        modelName:'Usuario',
        tableName: 'usuarios'
    }
);

Usuario.beforeCreate(async (usuario:Usuario)=>{
    const salt = await bcrypt.genSalt(10);
    usuario.contrasena = await bcrypt.hash(usuario.contrasena,salt);
});

Usuario.beforeUpdate(async (usuario:Usuario)=>{
    if(usuario.changed("contrasena")){
        const salt = await bcrypt.genSalt(10);
        usuario.contrasena = await bcrypt.hash(usuario.contrasena,salt);
    }
});