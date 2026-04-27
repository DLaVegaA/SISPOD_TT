import { Router } from 'express';
import {
  registrarUsuario,
  listarUsuarios,
  obtenerUsuario,
  eliminarUsuario,
  actualizarUsuario,
  activarUsuario,
  obtenerPerfilUsuario,
} from '../controllers/userController';
import { verificarToken } from '../middleware/authMiddleware';

const router = Router();

router.post('/', registrarUsuario);
router.get('/', listarUsuarios);
router.get('/me', verificarToken, obtenerPerfilUsuario);
router.get('/:id', obtenerUsuario);
router.put('/:id', actualizarUsuario);
router.delete('/:id', eliminarUsuario);
router.put('/activar-usuario/:id', activarUsuario);
export default router;
