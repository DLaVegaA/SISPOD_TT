import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class Pregunta extends Model {
    declare id_pregunta: number;
    declare id_cuestionario: number;
    declare texto_pregunta: string;
    declare tipo_control: string;
    declare opciones?: string[];
    declare valor_alerta?: any;
}

Pregunta.init(
    {
        id_pregunta: {
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
        texto_pregunta: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        tipo_control: {
            type: DataTypes.ENUM(
                'escala_1_10', 
                'booleano_si_no', 
                'texto_libre', 
                'opcion_multiple'
            ),
            allowNull: false,
            defaultValue: 'escala_1_10'
        },
        opciones:{
            type:DataTypes.JSONB,
            allowNull:true
        },
        valor_alerta:{
            type:DataTypes.JSONB,
            allowNull:true
        }
    },
    {
        sequelize,
        modelName: 'Pregunta',
        tableName: 'preguntas',
        timestamps: false
    }
);