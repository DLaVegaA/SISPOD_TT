import { DataTypes, Model} from 'sequelize';
import { sequelize } from '../config/database'; 

export class Role extends Model{
    declare id_rol: number;
    declare nombre_rol: string;
}

Role.init(
    {
        id_rol:{
            type: DataTypes.INTEGER,
            autoIncrement:false,
            primaryKey: true,
        },
        nombre_rol:{
            type: DataTypes.STRING(100),
            allowNull:false,
            unique:true 
        }
    },
    {
      sequelize,
      modelName: 'Role',
      tableName: 'roles' 
    }
);