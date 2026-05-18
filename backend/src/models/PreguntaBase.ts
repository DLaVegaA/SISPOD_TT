import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class PreguntaBase extends Model {
    declare id_pregunta_base: number;
    declare texto_pregunta: string;
    declare tipo_control: 'escala_1_10' | 'booleano_si_no' | 'texto_libre' | 'opcion_multiple';
    declare opciones: string[] | null;
    declare valor_alerta: Record<string, any> | null;
    declare aplica_24h: boolean;
    declare aplica_72h: boolean;
    declare activa: boolean;
}

PreguntaBase.init(
    {
        id_pregunta_base: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
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
            allowNull: false
        },
        opciones: {
            type: DataTypes.JSONB,
            allowNull: true
        },
        valor_alerta: {
            type: DataTypes.JSONB,
            allowNull: true
        },
        aplica_24h: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        aplica_72h: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        activa: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        }
    },
    {
        sequelize,
        modelName: 'PreguntaBase',
        tableName: 'preguntas_base',
        timestamps: false
    }
);