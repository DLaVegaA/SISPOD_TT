import transporter from '../config/mailer';

export const enviarCorreoCita = async (cita: any, usuario:any,subject:string, template:string) => {
  await transporter.sendMail({
    to: usuario.correo,
    subject,
    template,
    context: {
      fecha: cita.fecha_hora_inicio,
       nombre: usuario.nombre,
        year: new Date().getFullYear()
    }
  } as any);
};