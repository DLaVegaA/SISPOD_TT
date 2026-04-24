import { Router } from 'express';
import { crearCita, listarCitas, listarDisponibilidad } from '../controllers/citaController';
import { verificarToken } from '../middleware/authMiddleware';
import { permitirRoles } from '../middleware/rolesMiddleware';

const router = Router();

router.post('/', verificarToken, permitirRoles(1, 2, 3, 4), crearCita);
router.get('/', verificarToken, permitirRoles(1, 2, 3, 4), listarCitas);
router.get('/disponibilidad', verificarToken, permitirRoles(1, 2, 3, 4), listarDisponibilidad);

export default router;
