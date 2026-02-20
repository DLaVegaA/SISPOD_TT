import { Usuario } from "./Usuario";
import { Role } from "./Role";
import { Dentista } from "./Dentista";
import { Asistente } from "./Asistente";

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


export {
  Usuario, 
  Dentista,
  Role,
  Asistente
}