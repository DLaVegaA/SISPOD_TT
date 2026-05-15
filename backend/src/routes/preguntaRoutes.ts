import { Router } from "express";
import {verificarToken} from '../middleware/authMiddleware'
import {permitirRoles} from '../middleware/rolesMiddleware'
import {crearPregunta} from '../controllers/preguntaController'

const router = Router();

router.post('/', verificarToken, crearPregunta);

export default router;