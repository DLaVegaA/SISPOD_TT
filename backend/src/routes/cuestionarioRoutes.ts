import { Router } from 'express';
import { verificarToken } from '../middleware/authMiddleware';
import { permitirRoles } from '../middleware/rolesMiddleware';
import {
    crearCuestionario,
    listarCuestionarios,
    asignarPreguntas,
    listarPreguntasDeCuestionario
} from '../controllers/cuestionarioController';

const router = Router();

// GET  /cuestionario                         → lista de cuestionarios del dentista
router.get('/', verificarToken, listarCuestionarios);

// POST /cuestionario                         → crear cuestionario (dentista)
router.post('/', verificarToken, permitirRoles(2), crearCuestionario);

// POST /cuestionario/:id_cuestionario/preguntas  → asignar/reemplazar preguntas
router.post('/:id_cuestionario/preguntas', verificarToken, permitirRoles(2), asignarPreguntas);

// GET  /cuestionario/:id_cuestionario/preguntas  → ver preguntas del cuestionario
router.get('/:id_cuestionario/preguntas', verificarToken, listarPreguntasDeCuestionario);

export default router;