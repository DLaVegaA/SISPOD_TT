import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class Catalogo_Procedimientos extends Model {
    declare id_procedimiento: number;
    declare nombre_procedimiento: string
    declare descripcion: string;
    declare dias_seguimiento: number;
    declare frecuencia_alertas: number;
}

Catalogo_Procedimientos.init(
    {
        id_procedimiento: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        nombre_procedimiento: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        descripcion: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        dias_seguimiento: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 7
        },
        frecuencia_alertas: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1
        }
    },
    {
        sequelize,
        modelName: 'Catalogo_Procedimientos',
        tableName: 'catalogo_procedimientos',
        timestamps: false
    }
);