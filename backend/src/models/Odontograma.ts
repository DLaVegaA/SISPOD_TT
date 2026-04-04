import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";

export class Odontograma extends Model {
    declare id_odontograma: number;
    declare id_expediente: number;
    declare datos_odontograma: object;
    declare fecha_actualizacion: Date;
}

Odontograma.init(
    {
        id_odontograma: {
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
        datos_odontograma: {
            type: DataTypes.JSONB,
            allowNull: false
        },
        fecha_actualizacion: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    },
    {
        sequelize,
        modelName: 'Odontograma',
        tableName: 'odontogramas',
        timestamps: false
    }
);