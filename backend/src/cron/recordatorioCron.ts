import cron from 'node-cron';
import { Op } from 'sequelize';
import { Cita, Telegram, Paciente, Usuario} from '../models/index';
import { enviarRecordatorioTelegram } from '../services/telegramService';
import { recordatorioProximaCita} from '../services/emailService';

console.log('Cron de recordatorios cargado');
//Cron para confirmar cita (corre todos los dias a las 8 8am)
cron.schedule('0 8 * * *', async () => {
  try {
    
    const inicio = new Date();
    inicio.setDate(inicio.getDate() + 1);
    inicio.setHours(0, 0, 0, 0);

    const fin = new Date();
    fin.setDate(fin.getDate() + 1);
    fin.setHours(23, 59, 59, 999);

    const citas = await Cita.findAll({
      where: {
        fecha_hora_inicio: { [Op.between]: [inicio, fin] },
        estado: { [Op.ne]: 'Cancelada' },
        recordatorio_enviado: false,
      },
      include: [
        {
          model: Paciente,
          as: 'paciente',
          include: [
            { model: Telegram, as: 'telegram' },
            { model: Usuario,  as: 'usuario'  },
          ],
        },
      ],
    }) as any[];

    for (const cita of citas) {
      const usuario  = cita.paciente.usuario;
      const id_chat  = cita.paciente.telegram?.id_chat;

      // ── Formato de fecha para Telegram ───────────────────────────────────
      const fechaFormateada = cita.fecha_hora_inicio.toLocaleString('es-MX', {
        timeZone:  'America/Mexico_City',
        day:       '2-digit',
        month:     'long',
        year:      'numeric',
        hour:      '2-digit',
        minute:    '2-digit',
      });

      // ── Telegram ─────────────────────────────────────────────────────────
      if (id_chat) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const linkConfirmacion = `${frontendUrl}/confirmar-cita/${cita.id_cita}`;
        const mensajeTelegram =
          `Hola 👋\n\n` +
          `Te recordamos que tienes una cita mañana.\n\n` +
          `📅 ${fechaFormateada}\n\n` +
          `Confirma tu asistencia ${linkConfirmacion}`+
          `Te esperamos.`;

        await enviarRecordatorioTelegram(id_chat, mensajeTelegram);
      }

      // ── Email — se pasa id_cita para construir el link de confirmación ───
      await recordatorioProximaCita(cita, usuario, cita.id_cita);

      await cita.update({ recordatorio_enviado: true });
      console.log(`Recordatorio enviado para cita #${cita.id_cita}`);
    }
  } catch (error) {
    console.error('Error al enviar recordatorio:', error);
  }
});