import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";

export class Padecimiento extends Model {
    declare id_padecimiento: number;
    declare nombre_padecimiento: string;
    declare categoria_padecimiento: string;
}

Padecimiento.init(
    {
        id_padecimiento: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        nombre_padecimiento: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        categoria_padecimiento: {
            type: DataTypes.STRING,
            allowNull: false
        }
    },
    {
        sequelize,
        modelName: 'Padecimiento',
        tableName: 'padecimientos',
        timestamps: false
    }
);