import { Router } from "express";
import {generarTokenVinculacion} from '../controllers/telegramController';
import {verificarToken} from '../middleware/authMiddleware';
import {permitirRoles} from '../middleware/rolesMiddleware';

const router = Router();

router.get('/vincular',verificarToken, permitirRoles(3), generarTokenVinculacion);

export default router