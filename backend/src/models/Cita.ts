import { DataTypes, Model } from 'sequelize'
import {sequelize} from '../config/database'

export class Cita extends Model{
    declare id_cita: number;
    declare id_paciente:number;
    declare id_dentista:number;
    declare fecha_hora_inicio:Date;
    declare fecha_hora_fin:Date;
    declare id_tipocita:number;
    declare estado:string;
}

Cita.init(
    {
        id_cita:{
            type:DataTypes.INTEGER,
            primaryKey:true,
            autoIncrement:true
        },
        id_paciente:{
            type: DataTypes.INTEGER,
            allowNull:false,
            references:{
                model:'pacientes',
                key:'id_paciente'
            }
        },
        id_dentista:{
            type:DataTypes.INTEGER,
            allowNull:false,
            references:{
                model:'dentistas',
                key:'id_dentista'
            }
        },
        fecha_hora_inicio:{
            type:DataTypes.DATE,
            allowNull:false
        },
        fecha_hora_fin:{
            type:DataTypes.DATE,
            allowNull:false,
            validate:{
                isAfterInicio(value:Date){
                    if(value <= (this as any).fecha_hora_inicio){
                        throw new Error('La fecha de findbe ser mayor que la de inicio');
                    }
                }
            }
        },
        id_tipocita:{
            type:DataTypes.INTEGER,
            allowNull:false,
            references:{
                model:'tipocitas',
                key:'id_tipocita'
            }
        }, 
        estado:{
            type:DataTypes.STRING,
            allowNull:false,//hacer un validate con los tipos
            defaultValue: "Pendiente"
        },
        recordatorio_enviado:{
            type:DataTypes.BOOLEAN,
            defaultValue:false
        }
    },{
        sequelize,
        modelName:'Cita',
        tableName:'citas'
    }
);