import {Router} from 'express';
import {registrarUsuario, listarUsuarios, obtenerUsuario, eliminarUsuario} from '../controllers/userController';
import {verificarToken} from '../middleware/authMiddleware'
import {permitirRoles} from '../middleware/rolesMiddleware'

const router = Router();

router.post('/', registrarUsuario);
router.get('/', listarUsuarios);
router.get('/:id', obtenerUsuario);
router.delete('/id', eliminarUsuario);
export default router;
