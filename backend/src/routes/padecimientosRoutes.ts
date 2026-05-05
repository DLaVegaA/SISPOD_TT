import { Router } from "express";
import {verificarToken} from '../middleware/authMiddleware';
import {permitirRoles} from '../middleware/rolesMiddleware';
import {obtenerPadecimientos} from '../controllers/padecimientoController'
const router = Router();

router.get('/', verificarToken, obtenerPadecimientos );

export default router;