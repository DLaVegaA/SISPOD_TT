import { DataTypes, Model} from 'sequelize';
import { sequelize } from '../config/database'; 

export class Dentista extends Model{
    declare id_dentista:number;
    declare id_usuario:number;
    declare no_cedula:string;
}

Dentista.init(
    {
        id_dentista:{
            type:DataTypes.INTEGER,
            autoIncrement:true,
            primaryKey:true
        },
        id_usuario:{
            type:DataTypes.INTEGER,
            allowNull:false,
            references:{
                model:'usuarios',
                key:'id_usuario'
            },
            onDelete:'CASCADE'
        },
        no_cedula:{
            type:DataTypes.STRING,
            allowNull:false,
            unique:true
        }
    },
    {
        sequelize,
        modelName:'Dentista',
        tableName:'dentistas'
    }
);