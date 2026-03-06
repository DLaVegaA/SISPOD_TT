import { DataTypes, Model} from 'sequelize';
import { sequelize } from '../config/database'; 

export class Paciente extends Model{
    declare id_paciente:number;
    declare id_usuario:number;
}

Paciente.init(
    {
        id_paciente:{
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
        }
    },
    {
        sequelize,
        modelName:'Paciente',
        tableName:'pacientes'
    }
)