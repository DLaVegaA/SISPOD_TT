import { Usuario } from "./Usuario";
import { Role } from "./Role";
import { Dentista } from "./Dentista";
import { Asistente } from "./Asistente";
import { Paciente } from "./Paciente";
import { Token } from "./Token";
import {Direccion} from "./Direccion";
import {Cita} from './Cita';
import { Telegram } from "./Telegram";
import { Bitacora } from "./Bitacora";
import { Expediente } from "./Expediente";
import { Expediente_Padecimientos } from "./Expediente_Padecimientos";
import { Padecimiento } from "./Padecimientos";
import { Odontograma } from "./Odontograma";
import { Consentimiento } from "./Consentimiento";
import { Seguimiento } from "./Seguimiento";
import { Catalogo_Procedimientos } from "./Catalogo_Procedimientos";
import { Respuesta_paciente } from "./Respuesta_paciente";
import { Pregunta } from "./Pregunta";
import { Cuestionario } from "./Cuestionario";
import { TipoCita } from "./Tipo_Citas";

Usuario.belongsTo(Role, {
  foreignKey: 'id_rol',
  as: 'role',
});

Role.hasMany(Usuario, {
  foreignKey: 'id_rol',
  as: 'usuarios',
});

Dentista.belongsTo(Usuario,{
  foreignKey:'id_usuario',
  as:'usuario'
});

Usuario.hasOne(Dentista,{
  foreignKey:'id_usuario',
  as:'dentista'
});

Asistente.belongsTo(Usuario,{
  foreignKey:'id_usuario',
  as: 'usuario'
});

Usuario.hasOne(Asistente,{
  foreignKey:'id_usuario',
  as:'asistente'
});

Paciente.belongsTo(Usuario,{
  foreignKey:'id_usuario',
  as:'usuario'
});

Usuario.hasOne(Paciente,{
  foreignKey:'id_usuario',
  as:'paciente'
});

Usuario.hasMany(Token,{
  foreignKey:'id_usuario',
  as: 'token'
});

Token.belongsTo(Usuario,{
  foreignKey:'id_usuario',
  as:'usuario'
});

Direccion.belongsTo(Paciente,{
  foreignKey:'id_paciente',
  as:'paciente'
})

Paciente.hasOne(Direccion,{
  foreignKey:'id_paciente',
  as:'direccion'
})


Paciente.hasMany(Cita,{
  foreignKey:'id_paciente',
  as:'citas'
});

Cita.belongsTo(Paciente,{
  foreignKey:'id_paciente',
  as:'paciente'
});


Dentista.hasMany(Cita,{
  foreignKey:'id_dentista',
  as:'citas'
});

Cita.belongsTo(Dentista,{
  foreignKey:'id_dentista',
  as:'dentista'
});

Cita.belongsTo(TipoCita, {
  foreignKey:'id_tipocita',
  as:'tipo'
});
TipoCita.hasMany(Cita,{
  foreignKey:'id_tipocita',
  as:'citas'
});

Paciente.hasOne(Telegram,{
  foreignKey:'id_paciente',
  as:'telegram'
});

Telegram.belongsTo(Paciente,{
  foreignKey:'id_paciente',
  as:'paciente'
});

Bitacora.belongsTo(Usuario,{
  foreignKey:'id_usuario',
  as:'autor'
});

Bitacora.belongsTo(Cita,{
  foreignKey:'id_cita',
  as:'cita'
});

Paciente.hasOne(Expediente,{
  foreignKey:'id_paciente',
  as:'expediente'
});

Expediente.belongsTo(Paciente,{
  foreignKey:'id_paciente',
  as:'paciente'
});

Dentista.hasMany(Expediente,{
  foreignKey:'id_dentista',
  as:'expedientes'
});

Expediente.belongsTo(Dentista,{
  foreignKey:'id_dentista',
  as:'dentista'
});

Expediente.hasMany(Expediente_Padecimientos,{
  foreignKey:'id_expediente',
  as:'padecimientos'
});

Expediente_Padecimientos.belongsTo(Expediente,{
  foreignKey:'id_expediente',
  as:'expediente'
});

Padecimiento.hasMany(Expediente_Padecimientos,{
  foreignKey:'id_padecimiento',
  as:'expedientes_padecimientos'
});

Expediente_Padecimientos.belongsTo(Padecimiento,{
  foreignKey:'id_padecimiento',
  as:'padecimiento'
});

Expediente.hasMany(Odontograma,{
  foreignKey:'id_expediente',
  as:'odontogramas'
});

Odontograma.belongsTo(Expediente,{
  foreignKey:'id_expediente',
  as:'expediente'
});

Cita.hasMany(Consentimiento,{
  foreignKey:'id_cita',
  as:'consentimientos'
});

Consentimiento.belongsTo(Cita,{
  foreignKey:'id_cita',
  as:'cita'
});

Cita.hasOne(Seguimiento,{
  foreignKey:'id_cita',
  as:'seguimiento_post_operatorio'
});

Seguimiento.belongsTo(Cita,{
  foreignKey:'id_cita',
  as:'cita'
});

Catalogo_Procedimientos.hasMany(Seguimiento,{
  foreignKey:'id_procedimiento',
  as:'seguimientos'
});

Seguimiento.belongsTo(Catalogo_Procedimientos,{
  foreignKey:'id_procedimiento',
  as:'tipo_procedimiento'
});

Pregunta.hasMany(Respuesta_paciente,{
  foreignKey:'id_pregunta',
  as:'respuestas_paciente'
});

Respuesta_paciente.belongsTo(Pregunta,{
  foreignKey:'id_pregunta',
  as:'pregunta'
});

Seguimiento.hasMany(Respuesta_paciente,{
  foreignKey:'id_seguimiento',
  as:'respuestas_paciente'
});

Respuesta_paciente.belongsTo(Seguimiento,{
  foreignKey:'id_seguimiento',
  as:'seguimiento'
});

Cuestionario.hasMany(Pregunta,{
  foreignKey:'id_cuestionario',
  as:'preguntas'
});

Pregunta.belongsTo(Cuestionario,{
  foreignKey:'id_cuestionario',
  as:'cuestionario'
});

Catalogo_Procedimientos.hasMany(Cuestionario,{
  foreignKey:'id_procedimiento',
  as:'cuestionarios'
});

Cuestionario.belongsTo(Catalogo_Procedimientos,{
  foreignKey:'id_procedimiento',
  as:'procedimiento_asociado'
});

Cuestionario.hasMany(Respuesta_paciente,{
  foreignKey:'id_cuestionario',
  as:'respuestas_paciente'
});

Respuesta_paciente.belongsTo(Cuestionario,{
  foreignKey:'id_cuestionario',
  as:'cuestionario'
});

export {
  Usuario, 
  Dentista,
  Paciente,
  Role,
  Asistente,
  Token, 
  Direccion, 
  Cita,
  Telegram,
  Bitacora,
  Expediente,
  Expediente_Padecimientos,
  Padecimiento,
  Odontograma,
  Consentimiento,
  Seguimiento,
  Catalogo_Procedimientos,
  Pregunta,
  Cuestionario,
  Respuesta_paciente,
  TipoCita
}