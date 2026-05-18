import { Router } from 'express';
import { verificarToken } from '../middleware/authMiddleware';
import { permitirRoles } from '../middleware/rolesMiddleware';
import { listarPreguntasBase, crearPreguntaBase, eliminarPreguntaBase, editarPreguntaBase } from '../controllers/preguntaBaseController';

const router = Router();

// GET /preguntas-base?tipo=24h   → banco completo (filtrando por tipo si se envía)
router.get('/', verificarToken, listarPreguntasBase);
// POST /preguntas-base            → crear pregunta en el banco (dentista)
router.post('/', verificarToken, permitirRoles(2), crearPreguntaBase);
// PUT /preguntas-base/:id          → editar pregunta en el banco (dentista)
router.put('/:id', verificarToken, permitirRoles(2), editarPreguntaBase);
// DELETE /preguntas-base/:id       → eliminar pregunta del banco (dentista)
router.delete('/:id', verificarToken, permitirRoles(2), eliminarPreguntaBase);


export default router;