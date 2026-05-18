import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class Seguimiento extends Model {
  declare id_seguimiento: number;
  declare id_cita: number;
  declare id_procedimiento: number;
  declare id_cuestionario_24h: number | null; // ← asignado por el dentista (CU14)
  declare id_cuestionario_72h: number | null; // ← asignado por el dentista (CU14)
  declare estado_seguimiento: string;
  declare plan_cuidados: string;
  declare indicaciones_medicas: string;
  declare fecha_inicio: Date;
  declare fecha_fin: Date;
  declare enviado_24h: boolean;
  declare enviado_72h: boolean;
  declare fecha_envio_24h: Date;
  declare fecha_envio_72h: Date;
}

Seguimiento.init(
  {
    id_seguimiento: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    id_cita: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: { model: 'citas', key: 'id_cita' },
      onDelete: 'CASCADE',
    },
    id_procedimiento: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'catalogo_procedimientos', key: 'id_procedimiento' },
      onDelete: 'CASCADE',
    },
    // El dentista elige explícitamente qué cuestionario asignar (RN11 / CU14)
    id_cuestionario_24h: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'cuestionarios', key: 'id_cuestionario' },
      onDelete: 'SET NULL',
    },
    id_cuestionario_72h: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'cuestionarios', key: 'id_cuestionario' },
      onDelete: 'SET NULL',
    },
    estado_seguimiento: {
      type: DataTypes.ENUM('En Tratamiento', 'Urgencia', 'Finalizado'),
      allowNull: false,
      defaultValue: 'En Tratamiento',
    },
    plan_cuidados: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    indicaciones_medicas: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    fecha_inicio: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    fecha_fin: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    enviado_24h: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    enviado_72h: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    fecha_envio_24h: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    fecha_envio_72h: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Seguimiento',
    tableName: 'seguimientos',
    timestamps: false,
  },
);
