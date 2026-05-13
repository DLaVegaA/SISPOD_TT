import {permitirRoles} from '../middleware/rolesMiddleware'
import {verificarToken} from '../middleware/authMiddleware'
import { Router } from 'express'
import {
    crearSeguimiento,
    listarSeguimientos,
    obtenerSeguimiento, 
    editarSeguimiento
}from '../controllers/seguimientoController';

const router = Router();

router.post('/', verificarToken, crearSeguimiento);
router.get('/', verificarToken,listarSeguimientos);
router.get('/:id_seguimiento', verificarToken, obtenerSeguimiento)
router.put('/:id_seguimiento', verificarToken, editarSeguimiento)

export default router;