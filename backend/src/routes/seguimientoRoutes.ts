import {permitirRoles} from '../middleware/rolesMiddleware'
import {verificarToken} from '../middleware/authMiddleware'
import { Router } from 'express'
import {
    crearSeguimiento,
    listarSeguimientos
}from '../controllers/seguimientoController';

const router = Router();

router.post('/', verificarToken, crearSeguimiento);
router.get('/', verificarToken,listarSeguimientos)

export default router;