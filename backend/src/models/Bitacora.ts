import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class Bitacora extends Model {
    declare id_bitacora: number;
    declare id_usuario: number;
    declare id_cita: number;
    declare fecha_creacion: Date;
    declare descripcion: string;
    declare accion_realizada: string;
    declare estado_bitacora: string;
}

Bitacora.init(
    {
        id_bitacora: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        id_usuario: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'usuarios',
                key: 'id_usuario'
            },
            onDelete: 'CASCADE'
        },
        id_cita: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'citas',
                key: 'id_cita'
            },
            onDelete: 'CASCADE'
        },
        fecha_creacion: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        descripcion: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        accion_realizada: {
            type: DataTypes.STRING,
            allowNull: false
        },
        estado_bitacora: {
            type: DataTypes.ENUM(
                'pendiente',
                'revisado',
                'rechazado', //?????
                'completado' //?????
            ),
            allowNull: false,
            defaultValue: 'pendiente'
        }
    },
    {
        sequelize,
        modelName: 'Bitacora',
        tableName: 'bitacoras',
        timestamps: false //?????
    }
);