import {Router} from 'express';
import {registrarUsuario, listarUsuarios} from '../controllers/userController';
import {verificarToken} from '../middleware/authMiddleware'
import {permitirRoles} from '../middleware/rolesMiddleware'

const router = Router();

router.post('/', registrarUsuario);
router.get('/', listarUsuarios)
export default router;
