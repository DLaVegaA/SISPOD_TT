import { Router } from 'express';
import { verificarToken } from '../middleware/authMiddleware';
import { permitirRoles } from '../middleware/rolesMiddleware';
import { listarPreguntasBase, crearPreguntaBase } from '../controllers/preguntaBaseController';

const router = Router();

// GET /preguntas-base?tipo=24h   → banco completo (filtrando por tipo si se envía)
router.get('/', verificarToken, listarPreguntasBase);

// POST /preguntas-base            → crear pregunta en el banco (dentista)
router.post('/', verificarToken, permitirRoles(2), crearPreguntaBase);

export default router;