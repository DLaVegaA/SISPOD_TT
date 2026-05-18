import { Router } from 'express';
import { verificarToken } from '../middleware/authMiddleware';
import { permitirRoles } from '../middleware/rolesMiddleware';
import {
  crearExpediente,
  agregarPadecimiento,
  actualizarExpediente,
  obtenerExpediente,
  eliminarPadecimiento,
  listarExpedientes,
} from '../controllers/expedienteController';

const router = Router();

router.post('/', verificarToken, crearExpediente);
router.post('/:id_expediente/padecimiento', verificarToken, agregarPadecimiento);
router.put('/:id_expediente', verificarToken, actualizarExpediente);
router.get('/', verificarToken, listarExpedientes);
router.get('/:id_expediente', verificarToken, obtenerExpediente);
router.delete('/:id_expediente/padecimientos/:id_padecimiento', eliminarPadecimiento);
export default router;
