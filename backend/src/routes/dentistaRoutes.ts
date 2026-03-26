import {Router} from 'express';
import {registrarDentista,listarDentistas, obtenerDentista} from '../controllers/dentistaController';
import {verificarToken} from '../middleware/authMiddleware';
import {permitirRoles} from '../middleware/rolesMiddleware';


const router = Router();

router.post('/',registrarDentista);
router.get('/',listarDentistas);
router.get('/:id',obtenerDentista);

export default router;