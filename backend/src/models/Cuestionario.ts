import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class Cuestionario extends Model {
    declare id_cuestionario: number;
    declare nombre_cuestionario: string;
    declare tipo_cuestionario: string;
    declare descripcion: string;
    declare activo: boolean;
}

Cuestionario.init(
    {
        id_cuestionario: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        nombre_cuestionario: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        tipo_cuestionario: {
            type: DataTypes.ENUM('24h', '72h'),
            allowNull: false
        },
        descripcion: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        id_procedimiento: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'catalogo_procedimientos',
                key: 'id_procedimiento'
            },
            onDelete: 'CASCADE'
        },
        activo: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        }
    },
    {
        sequelize,
        modelName: 'Cuestionario',
        tableName: 'cuestionarios',
        timestamps: false
    }
);