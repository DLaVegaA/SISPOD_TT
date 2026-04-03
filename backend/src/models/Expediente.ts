import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class Expediente extends Model {
    declare id_expediente: number;
    declare id_paciente: number;
    declare id_dentista: number;
    declare fecha_creacion: Date;
    declare observaciones_generales: string;
}

Expediente.init(
    {
        id_expediente: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        id_paciente: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            references: {
                model: 'pacientes',
                key: 'id_paciente'
            },
            onDelete: 'CASCADE'
        },
        id_dentista: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'dentistas',
                key: 'id_dentista'
            },
            onDelete: 'CASCADE'
        },
        fecha_creacion: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        observaciones_generales: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    },
    {
        sequelize,
        modelName: 'Expediente',
        tableName: 'expedientes',
        timestamps: false
    }
);