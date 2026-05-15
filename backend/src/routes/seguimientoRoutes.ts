import {permitirRoles} from '../middleware/rolesMiddleware'
import {verificarToken} from '../middleware/authMiddleware'
import { Router } from 'express'
import {
    crearSeguimiento,
    listarSeguimientos,
    obtenerSeguimiento, 
    editarSeguimiento,
    cancelarSeguimiento
}from '../controllers/seguimientoController';

const router = Router();

router.post('/', verificarToken, crearSeguimiento);
router.get('/', verificarToken,listarSeguimientos);
router.get('/:id_seguimiento', verificarToken, obtenerSeguimiento);
router.put('/:id_seguimiento', verificarToken, editarSeguimiento);
router.patch('/:id_seguimiento/cancelar',verificarToken,cancelarSeguimiento);

export default router;