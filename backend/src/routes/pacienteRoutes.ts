import { Router } from 'express';
import {
  registrarPaciente,
  listarPacientes,
  obtenerPaciente,
  actualizarPaciente,
  obtenerPerfilPaciente,
  obtenerPerfilPacienteCompleto,
  listarPacientesSinExpediente,
} from '../controllers/pacienteController';
import { verificarToken } from '../middleware/authMiddleware';
import { permitirRoles } from '../middleware/rolesMiddleware';

const router = Router();

router.post('/', verificarToken, permitirRoles(1, 2, 4), registrarPaciente);
router.get('/', listarPacientes);
router.get('/sin-expediente', listarPacientesSinExpediente);
router.get('/me', verificarToken, permitirRoles(3), obtenerPerfilPaciente); //Primero las rutas fijas
router.get(
  '/:id/perfil-completo',
  verificarToken,
  permitirRoles(1, 2),
  obtenerPerfilPacienteCompleto,
); //Dentista/Admin ve perfil completo
router.get('/:id', obtenerPaciente); //despues rutas con parametros
router.put('/:id', verificarToken, actualizarPaciente);

export default router;
