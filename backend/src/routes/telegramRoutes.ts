import { Router } from "express";
import {generarTokenVinculacion, estadoTelegram} from '../controllers/telegramController';
import {verificarToken} from '../middleware/authMiddleware';
import {permitirRoles} from '../middleware/rolesMiddleware';

const router = Router();

router.get('/vincular',verificarToken, permitirRoles(3), generarTokenVinculacion);
router.get('/estado',verificarToken,permitirRoles(3),estadoTelegram);

export default router