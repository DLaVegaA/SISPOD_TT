import {Router} from 'express';
import {registrarDentista} from '../controllers/dentistaController';
import {verificarToken} from '../middleware/authMiddleware';
import {permitirRoles} from '../middleware/rolesMiddleware';


const router = Router();

router.post('/',registrarDentista);

export default router;