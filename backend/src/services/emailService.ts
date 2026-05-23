import transporter from '../config/mailer';

const enviarCorreoBase = async (usuario: any, subject: string, template: string, context: any) => {
  await transporter.sendMail({
    to: usuario.correo,
    subject: subject,
    template: template,
    context: {
      ...context,
      year: new Date().getFullYear() 
    }
  } as any);
};

const formatearFechaHBS = (fecha: Date | string, compacta: boolean = false) => {
  const fechaObj = new Date(fecha);
  
  const opciones: Intl.DateTimeFormatOptions = {
    weekday: compacta ? undefined : 'long',
    day: 'numeric',
    month: compacta ? 'short' : 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Mexico_City'
  };

  const f = fechaObj.toLocaleString('es-MX', opciones);
  return f.charAt(0).toUpperCase() + f.slice(1);
};

export const recordatorioProximaCita = async (
  cita: any,
  usuario: any,
  id_cita: number,           // ← NUEVO parámetro
) => {
  const fechaBonita = formatearFechaHBS(cita.fecha_hora_inicio);
 
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const linkConfirmacion = `${frontendUrl}/confirmar-cita/${id_cita}`;
 
  await enviarCorreoBase(usuario, 'Recordatorio de tu cita', 'recordatorioCita', {
    nombre:            usuario.nombre,
    fecha:             fechaBonita,
    linkConfirmacion,  // ← NUEVO: se pasa al template
  });
};

export const enviarCuestionario24h = async(usuario:any) => {
  await enviarCorreoBase(usuario, 'Cuestionario de seguimiento 24 horas', 'cuestionario24h',{
    nombre:`${usuario.nombre}`
  });
}
export const enviarCuestionario72h = async(usuario:any) => {
  await enviarCorreoBase(usuario, 'Cuestionario de seguimiento 72 horas', 'cuestionario72h',{
    nombre:`${usuario.nombre}`
  });
}

export const notificarNuevaCita = async (cita: any, usuario: any, rol: number) => {
  const titulo = rol === 2 ? 'Dr. ' : '';
  const nombreServicio = cita.tipo?.nombre_corto || 'Consulta General';
  const fechaBonita = formatearFechaHBS(cita.fecha_hora_inicio);

  await enviarCorreoBase(usuario, 'Confirmación de Cita', 'citaNueva', {
    nombre: `${titulo}${usuario.nombre}`,
    servicio: nombreServicio,
    fecha: fechaBonita,
    esPaciente: rol === 3
  });
};


export const notificarEdicionCita = async (cita: any, fechaAnterior: string | Date, usuario: any, rol: number) => {
  const titulo = rol === 2 ? 'Dr. ' : '';
  const nombreServicio = cita.tipo?.nombre_corto || 'Consulta General';

 
  const fechaVieja = formatearFechaHBS(fechaAnterior, true);
  const fechaNueva = formatearFechaHBS(cita.fecha_hora_inicio, true);

  await enviarCorreoBase(usuario, 'Actualización de tu cita', 'citaEditada', {
    nombre: `${titulo}${usuario.nombre}`,
    servicio: nombreServicio,
    fechaVieja,
    fechaNueva,
    esPaciente: rol === 3
  });
};


export const notificarCancelacionCita = async (cita: any, usuario: any, rol: number) => {
  const titulo = rol === 2 ? 'Dr. ' : '';
  const nombreServicio = cita.tipo?.nombre_corto || 'Consulta General';
  const fechaBonita = formatearFechaHBS(cita.fecha_hora_inicio);

  await enviarCorreoBase(usuario, 'Cita Cancelada', 'citaCancelada', {
    nombre: `${titulo}${usuario.nombre}`,
    servicio: nombreServicio,
    fecha: fechaBonita,
    esPaciente: rol === 3
  });
};