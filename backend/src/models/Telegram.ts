import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";

export class Telegram extends Model {
    declare id_telegram: number;
    declare id_paciente: number;
    declare token: string | null;
    declare id_chat: string| null;
}

Telegram.init(
    {
        id_telegram:{
            type:DataTypes.INTEGER,
            primaryKey:true,
            autoIncrement:true
        },
        id_paciente:{
            type:DataTypes.INTEGER,
            allowNull:false,
            unique:true
        },
        token:{
            type:DataTypes.STRING,
            allowNull:true
        },
        id_chat:{
            type:DataTypes.STRING,
            allowNull:true,
            unique:true
        }
    },
    {
        sequelize,
        modelName:'Telegram',
        tableName:'telegram'
    }
)