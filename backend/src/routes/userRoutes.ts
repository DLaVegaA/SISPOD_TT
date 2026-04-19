import { Router } from 'express';
import {
  registrarUsuario,
  listarUsuarios,
  obtenerUsuario,
  eliminarUsuario,
  actualizarUsuario,
  activarUsuario,
} from '../controllers/userController';

const router = Router();

router.post('/', registrarUsuario);
router.get('/', listarUsuarios);
router.get('/:id', obtenerUsuario);
router.put('/:id', actualizarUsuario);
router.delete('/:id', eliminarUsuario);
router.put('/activar-usuario/:id', activarUsuario);
export default router;
