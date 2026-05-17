import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class Respuesta_paciente extends Model {
    declare id_respuesta: number;
    declare id_pregunta_base: number;   // ← migrado desde id_pregunta
    declare id_seguimiento: number;
    declare id_cuestionario: number;
    declare valor_respuesta: string;
    declare fecha_respuesta: Date;
}

Respuesta_paciente.init(
    {
        id_respuesta: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        id_pregunta_base: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'preguntas_base',
                key: 'id_pregunta_base'
            },
            onDelete: 'RESTRICT'
        },
        id_seguimiento: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'seguimientos',
                key: 'id_seguimiento'
            },
            onDelete: 'CASCADE'
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
        valor_respuesta: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        fecha_respuesta: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    },
    {
        sequelize,
        modelName: 'Respuesta_paciente',
        tableName: 'respuestas_paciente',
        timestamps: false
    }
);