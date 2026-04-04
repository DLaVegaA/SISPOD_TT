import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class Expediente_Padecimientos extends Model {
    declare id_expediente_padecimiento: number;
    declare id_expediente: number;
    declare id_padecimiento: number;
    declare tipo_antecedente: string;
    declare nota: string;
    declare fecha_registro: Date;
}

Expediente_Padecimientos.init(
    {
        id_expediente_padecimiento: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        id_expediente: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'expedientes',
                key: 'id_expediente'
            },
            onDelete: 'CASCADE'
        },
        id_padecimiento: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'padecimientos',
                key: 'id_padecimiento'
            },
            onDelete: 'CASCADE'
        },
        tipo_antecedente: {
            type: DataTypes.ENUM(
                'heredofamiliar',
                'patologico_personal',
                'no_patologico',
                'gineco_obstetrico'
            ),
            allowNull: false
        },
        nota: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        fecha_registro: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    },
    {
        sequelize,
        modelName: 'Expediente_Padecimientos',
        tableName: 'expedientes_padecimientos',
        timestamps: false
    }
);