import { DataType, DataTypes, Model } from "sequelize";
import { sequelize} from '../config/database';

export class Direccion extends Model{
    declare id_direccion: number
    declare id_paciente: number
    declare calle:string
    declare num_ext:string
    declare num_int?:string
    declare colonia:string
    declare municipio:string //Tal vez en front poner que si seleccionas CDMX como estado, el label diga alcaldia
    declare estado:string
    declare codigo_postal:string
}


Direccion.init(
    {
        id_direccion:{
            type:DataTypes.INTEGER,
            primaryKey:true,
            autoIncrement:true
        },
        id_paciente:{
            type:DataTypes.INTEGER,
            allowNull:false,
            references:{
                model:'pacientes',
                key:'id_paciente'
            },
            onDelete:'CASCADE'
        },
        calle:{
            type:DataTypes.STRING,
            allowNull:false
        },
        num_ext:{
            type:DataTypes.STRING,
            allowNull:false
        },
        num_int:{
            type:DataTypes.STRING,
            allowNull:true
        },
        colonia:{
            type:DataTypes.STRING,
            allowNull:false
        },
        municipio:{
            type:DataTypes.STRING,
            allowNull:false
        },
        estado:{
            type:DataTypes.STRING,
            allowNull:false
        },
        codigo_postal:{
            type:DataTypes.STRING(5),
            allowNull:false
        }
    },
    {
        sequelize,
        modelName:'Direccion',
        tableName:'direcciones'
    }
)