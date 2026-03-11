import { Usuario } from "./Usuario";
import { Role } from "./Role";
import { Dentista } from "./Dentista";
import { Asistente } from "./Asistente";
import { Paciente } from "./Paciente";
import { Token } from "./Token";
import {Direccion} from "./Direccion";

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

export {
  Usuario, 
  Dentista,
  Paciente,
  Role,
  Asistente,
  Token, 
  Direccion
}