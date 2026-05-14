import { Router } from 'express';
import { verificarToken } from '../middleware/authMiddleware';
import { permitirRoles } from '../middleware/rolesMiddleware';
import {
  crearBitacora,
  editarBitacora,
  eliminarBitacora,
  listarBitacora,
  listarBitacorasPorPaciente,
  obtenerBitacora,
  revisarBitacora,
} from '../controllers/bitacoraController';

const router = Router();

router.post('/', verificarToken, crearBitacora);
router.put('/:id', verificarToken, editarBitacora);
router.delete('/:id/eliminar', verificarToken, eliminarBitacora);
router.get('/', verificarToken, listarBitacora);
router.get('/paciente/:id_paciente', verificarToken, listarBitacorasPorPaciente);
router.get('/:id', verificarToken, obtenerBitacora);
router.put('/:id/revisar', verificarToken, permitirRoles(2), revisarBitacora);

export default router;
