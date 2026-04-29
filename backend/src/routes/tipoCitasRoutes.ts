import {Router} from 'express';
import {listarTipoCitas, obtenerDetalleTipo} from '../controllers/tipoCitaController';
import {verificarToken} from '../middleware/authMiddleware';
import {permitirRoles} from '../middleware/rolesMiddleware';

const router = Router();

router.get('/', listarTipoCitas);
router.get('/:id',obtenerDetalleTipo);


export default router;