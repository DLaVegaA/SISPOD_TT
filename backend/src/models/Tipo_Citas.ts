import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";

export class TipoCita extends Model{
    declare id_tipocita:number;
    declare nombre_corto:string;
    declare nombre:string
    declare duracion:number;
}

TipoCita.init(
    {
        id_tipocita:{
            type:DataTypes.INTEGER,
            autoIncrement:true,
            primaryKey:true
        },
        nombre:{
            type:DataTypes.STRING(100),
            allowNull:false
        },
        nombre_corto:{
            type:DataTypes.STRING(100),
            allowNull:false
        },
        duracion:{
            type:DataTypes.INTEGER,
            allowNull:false
        }
    },{
        sequelize,
        modelName:'TipoCita',
        tableName:'tipocitas'
    }
)