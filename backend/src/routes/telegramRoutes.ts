import { Router } from "express";
import {generarTokenVinculacion, estadoTelegram, desvincularTelegram} from '../controllers/telegramController';
import {verificarToken} from '../middleware/authMiddleware';
import {permitirRoles} from '../middleware/rolesMiddleware';

const router = Router();

router.get('/vincular',verificarToken, permitirRoles(3), generarTokenVinculacion);
router.get('/estado',verificarToken,permitirRoles(3),estadoTelegram);
router.delete('/',verificarToken, permitirRoles(3),desvincularTelegram);

export default router