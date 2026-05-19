import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class CuestionarioPregunta extends Model {
    declare id_cuestionario_pregunta: number;
    declare id_cuestionario: number;
    declare id_pregunta_base: number;
    declare orden: number;
}

CuestionarioPregunta.init(
    {
        id_cuestionario_pregunta: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        id_cuestionario: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'cuestionarios',
                key: 'id_cuestionario'
            },
            onDelete: 'CASCADE'
        },
        id_pregunta_base: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'preguntas_base',
                key: 'id_pregunta_base'
            },
            onDelete: 'RESTRICT'   // No borrar preguntas del banco si están asignadas
        },
        orden: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        }
    },
    {
        sequelize,
        modelName: 'CuestionarioPregunta',
        tableName: 'cuestionario_preguntas',
        timestamps: false,
        indexes: [
            {
                unique: true,
                fields: ['id_cuestionario', 'id_pregunta_base']
            }
        ]
    }
);