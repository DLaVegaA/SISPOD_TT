import { Router } from 'express';
import { obtenerPerfilAsistente, actualizarAsistente } from '../controllers/asistenteController';
import { verificarToken } from '../middleware/authMiddleware';
import { permitirRoles } from '../middleware/rolesMiddleware';

const router = Router();

router.get('/me', verificarToken, permitirRoles(4), obtenerPerfilAsistente);
router.put('/me', verificarToken, permitirRoles(4), actualizarAsistente);

export default router;