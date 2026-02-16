import { Dentista } from "./Dentista";
import { Role } from "./Role";
import { Usuario } from "./Usuario";

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
})