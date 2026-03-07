import {DataTypes, Model} from 'sequelize';
import {sequelize} from '../config/database';

export class Token extends Model{
    declare id_token: number;
    declare id_usuario: number;
    declare token: string;
    declare tipo: string;
    declare expira_en: Date;
}

Token.init(
    {
        id_token:{
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
        token:{
            type:DataTypes.STRING,
            allowNull:false
        },
        tipo:{
            type:DataTypes.STRING,
            allowNull:false
        },
        expira_en:{
            type:DataTypes.DATE,
            allowNull:false
        }
    },
    {
        sequelize,
        modelName:'Token',
        tableName:'tokens',
        indexes:[
            {
                unique:true,
                fields:['id_usuario','tipo']
            }
        ]
    }
)

