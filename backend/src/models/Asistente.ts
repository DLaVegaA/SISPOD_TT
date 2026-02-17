import { DataTypes, Model} from 'sequelize';
import { sequelize } from '../config/database'; 


export class Asistente extends Model{
    declare id_asistente: number;
    declare id_usuario:number;
}

Asistente.init(
    {
        id_asistente:{
            type:DataTypes.INTEGER,
            primaryKey:true,
            autoIncrement:true
        },
        id_usuario:{
            type:DataTypes.INTEGER,
            allowNull:false,
            references:{
                model:'usuarios',
                key:'id_usuario'
            },
            onDelete:'CASCADE'
        }
    },
    {
        sequelize,
        modelName:'Asistente',
        tableName:'asistentes'
    }
)