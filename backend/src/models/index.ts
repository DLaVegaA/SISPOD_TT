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

Paciente.hasOne(Telegram,{
  foreignKey:'id_paciente',
  as:'telegram'
});

Telegram.belongsTo(Paciente,{
  foreignKey:'id_paciente',
  as:'paciente'
});
/* Bitacora.belongsTo(Usuario,{
  foreignKey:'id_usuario',
  as:'autor'
});

Bitacora.belongsTo(Cita,{
  foreignKey:'id_cita',
  as:'cita'
}); */

/* Paciente.hasOne(Expediente,{
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
});*/

/* Expediente.hasMany(Expediente_Padecimientos,{
  foreignKey:'id_expediente',
  as:'padecimientos'
});

Expediente_Padecimientos.belongsTo(Expediente,{
  foreignKey:'id_expediente',
  as:'expediente'
}); */

/* Padecimiento.hasMany(Expediente_Padecimientos,{
  foreignKey:'id_padecimiento',
  as:'expedientes_padecimientos'
});

Expediente_Padecimientos.belongsTo(Padecimiento,{
  foreignKey:'id_padecimiento',
  as:'padecimiento'
}); */

/* Expediente.hasMany(Odontograma,{
  foreignKey:'id_expediente',
  as:'odontogramas'
});

Odontograma.belongsTo(Expediente,{
  foreignKey:'id_expediente',
  as:'expediente'
});*/

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
  Padecimiento,
  Odontograma
}