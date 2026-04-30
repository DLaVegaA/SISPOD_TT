import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";

export class Consentimiento extends Model {
    declare id_consentimiento: number;
    declare id_cita: number;
    declare fecha_consentimiento: Date;
    declare archivo_url: string;
}

Consentimiento.init(
    {
        id_consentimiento: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        id_cita: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique:true,
            references: {
                model: 'citas',
                key: 'id_cita'
            },
            onDelete: 'CASCADE'
        },
        fecha_consentimiento: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        nombre_archivo: {
            type: DataTypes.STRING,
            allowNull: false
        }
    },
    {
        sequelize,
        modelName: 'Consentimiento',
        tableName: 'consentimientos',
        timestamps: false
    }
);